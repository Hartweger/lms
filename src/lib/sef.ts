// src/lib/sef.ts - Sistem elektronskih faktura (SEF), javni API Ministarstva finansija.
// Jedina tačka u kodu koja razgovara sa SEF-om, po uzoru na `fiscomm.ts`.
//
// Ključ ide u zaglavlju koje se zove `ApiKey` - NE `Authorization: Bearer`.
// Base URL se menja env varijablom: demo je https://demoefaktura.mfin.gov.rs,
// produkcija https://efaktura.mfin.gov.rs.
//
// PAŽNJA - pretplata na obaveštenja traje SAMO JEDAN DAN. `/subscribe` doslovno
// znači „pretplati me za sutra". Zato postoji dnevni cron; ako se preskoči dan,
// tog dana ne stižu obaveštenja o promeni statusa i status ostaje star.
import "server-only";
import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/lib/supabase/database.types";

const SEF = {
  apiUrl: process.env.SEF_API_URL ?? "https://efaktura.mfin.gov.rs",
  apiKey: process.env.SEF_API_KEY ?? "",
};

/** Statusi koje SEF vraća za izlaznu fakturu. */
export type SefStatus =
  | "New" | "Draft" | "Sent" | "Paid" | "Mistake" | "OverDue" | "Archived"
  | "Sending" | "Deleted" | "Approved" | "Rejected" | "Cancelled" | "Storno" | "Unknown";

/** Status na kome se ništa više ne dešava samo od sebe. */
export function jeZavrsenStatus(s: string | null): boolean {
  return s === "Approved" || s === "Rejected" || s === "Cancelled" || s === "Storno" || s === "Paid";
}

/** Status koji traži da neko pogleda. */
export function trazipaznju(s: string | null): boolean {
  return s === "Rejected" || s === "Mistake" || s === "OverDue";
}

export function sefPodesen(): boolean {
  return SEF.apiKey.length > 0;
}

/**
 * Da li pričamo sa demo okruženjem. Admin to MORA da vidi: bez oznake „SEF: poslata"
 * na demou izgleda isto kao na produkciji, pa se lako pomisli da je faktura
 * prijavljena državi, a nije.
 */
export function sefJeDemo(): boolean {
  return SEF.apiUrl.includes("demo");
}

type Odgovor<T> =
  | { ok: true; data: T }
  | { ok: false; greska: string; status: number };

async function sefFetch<T>(
  put: string,
  opcije: { metod?: "GET" | "POST"; telo?: string; contentType?: string } = {},
): Promise<Odgovor<T>> {
  if (!SEF.apiKey) {
    return { ok: false, greska: "SEF_API_KEY nije postavljen.", status: 0 };
  }
  let res: Response;
  try {
    res = await fetch(`${SEF.apiUrl}${put}`, {
      method: opcije.metod ?? "GET",
      headers: {
        ApiKey: SEF.apiKey,
        Accept: "application/json",
        ...(opcije.telo ? { "Content-Type": opcije.contentType ?? "application/json" } : {}),
      },
      body: opcije.telo,
    });
  } catch (e) {
    const greska = e instanceof Error ? e.message : "mrežna greška";
    Sentry.captureException(e);
    return { ok: false, greska: `SEF nedostupan: ${greska}`, status: 0 };
  }

  const tekst = await res.text();
  if (!res.ok) {
    // SEF na grešku vraća čas JSON čas običan tekst - poruka se prosleđuje kakva jeste,
    // jer je to jedino što kaže ZAŠTO je faktura odbijena.
    const msg = `SEF ${res.status} na ${put}: ${tekst.slice(0, 500)}`;
    console.error(`[sef] ${msg}`);
    Sentry.captureException(new Error(msg));
    return { ok: false, greska: tekst.slice(0, 500) || `HTTP ${res.status}`, status: res.status };
  }

  try {
    return { ok: true, data: JSON.parse(tekst) as T };
  } catch {
    return { ok: true, data: tekst as unknown as T };
  }
}

interface MiniInvoiceDto {
  invoiceId?: number;
  salesInvoiceId?: number;
  purchaseInvoiceId?: number;
}

/**
 * Vadi id fakture iz odgovora na slanje.
 *
 * Spec kaže MiniInvoiceDto, ali SEF isti endpoint objavljuje i kao `text/plain`,
 * pa odgovor ume da bude goli broj (`12345`) umesto objekta. Uz to se imena polja
 * razlikuju po velikom slovu. Zato se gleda sve što liči na id, a ne samo jedno
 * polje - inače faktura postoji na SEF-u, a mi mislimo da nije prošla.
 */
export function izvuciSefId(data: unknown): string | null {
  if (typeof data === "number" && Number.isFinite(data)) return String(data);
  if (typeof data === "string") {
    const t = data.trim().replace(/^"|"$/g, "");
    return /^\d+$/.test(t) ? t : null;
  }
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const uzmi = (test: RegExp): string | null => {
      for (const k of Object.keys(o)) {
        if (!test.test(k)) continue;
        const v = o[k];
        if (typeof v === "number" && Number.isFinite(v)) return String(v);
        if (typeof v === "string" && /^\d+$/.test(v.trim())) return v.trim();
      }
      return null;
    };
    // REDOSLED JE BITAN. SEF na jedno slanje vrati TRI broja:
    //   {"InvoiceId":5619601,"SalesInvoiceId":5747642,"PurchaseInvoiceId":5619601}
    // `InvoiceId` je tu jednak PurchaseInvoiceId - to je broj sa strane PRIMAOCA.
    // Nama treba SalesInvoiceId: po njemu webhook javlja promene statusa i po njemu
    // se pita za status. Ako uzmemo pogrešan, status zauvek ostane „šalje se".
    return uzmi(/^salesinvoiceid$/i) ?? uzmi(/^invoiceid$/i);
  }
  return null;
}

/**
 * Šalje UBL XML na SEF. `requestId` je ključ protiv duplog slanja - isti ključ
 * znači isti zahtev, pa ponovni pokušaj posle prekinute veze ne pravi drugu fakturu.
 *
 * `sendToCir` je za Centralni registar faktura, koji se tiče budžetskih korisnika.
 * Naši kupci su privredna društva, pa ide `false`.
 */
export async function posaljiUbl(
  ubl: string,
  requestId: string,
): Promise<Odgovor<MiniInvoiceDto>> {
  const q = new URLSearchParams({ requestId, sendToCir: "false" });
  const res = await sefFetch<MiniInvoiceDto>(`/api/publicApi/sales-invoice/ubl?${q}`, {
    metod: "POST",
    telo: ubl,
    contentType: "application/xml",
  });
  // Ako je prošlo a id se ne prepoznaje, zapiši ceo odgovor - faktura je tada
  // najverovatnije NA SEF-u, pa je važno videti u kom obliku stiže id.
  if (res.ok && !izvuciSefId(res.data)) {
    const msg = `[sef] odgovor bez prepoznatljivog id-a: ${JSON.stringify(res.data).slice(0, 500)}`;
    console.error(msg);
    Sentry.captureException(new Error(msg));
  }
  return res;
}

/**
 * Odgovor SEF-a na upit o fakturi. SEF polja piše VELIKIM početnim slovom
 * (`Status`, `InvoiceId`, `LastModifiedUtc`), iako specifikacija navodi mala.
 * Zato se ništa ne čita direktno po imenu nego kroz `poljeIz`.
 */
export type SefOdgovor = Record<string, unknown>;

/**
 * Čita polje iz SEF odgovora bez obzira na veliko/malo slovo.
 *
 * Postoji zato što je ista greška napravljena dvaput: prvo `salesInvoiceId` (SEF
 * vraća `SalesInvoiceId`), pa `status` (SEF vraća `Status`). Druga je faktura
 * 2026-419 držala na „šalje se" pet dana, iako je bila PRIHVAĆENA od 31.08.
 */
export function poljeIz(data: unknown, ime: string): unknown {
  if (!data || typeof data !== "object") return undefined;
  const o = data as Record<string, unknown>;
  const trazeno = ime.toLowerCase();
  for (const k of Object.keys(o)) {
    if (k.toLowerCase() === trazeno) return o[k];
  }
  return undefined;
}

/** Status fakture iz SEF odgovora, ili null ako ga nema. */
export function izvuciStatus(data: unknown): string | null {
  const v = poljeIz(data, "status");
  return typeof v === "string" && v ? v : null;
}

/** Pita SEF za pravi status fakture. Telo webhooka se NE koristi kao izvor istine. */
export async function procitajStatus(sefInvoiceId: string): Promise<Odgovor<SefOdgovor>> {
  return sefFetch<SefOdgovor>(
    `/api/publicApi/sales-invoice?invoiceId=${encodeURIComponent(sefInvoiceId)}`,
  );
}

/**
 * Da li je firma uopšte na eFakturi. Vraća `null` ako provera nije uspela - u tom
 * slučaju se NE tvrdi da firme nema, nego se slanje pušta pa neka SEF odluči.
 */
export async function firmaJeNaSefu(pib: string): Promise<boolean | null> {
  const res = await sefFetch<{ companyStatus?: string; status?: string }>(
    "/api/publicApi/Company/CheckIfCompanyRegisteredOnEfaktura",
    { metod: "POST", telo: JSON.stringify({ vatNumber: pib }) },
  );
  if (!res.ok) return null;
  const s = res.data?.companyStatus ?? res.data?.status;
  return typeof s === "string" ? s === "Active" : null;
}

/**
 * Verzija SEF-a. Čita se samo da bi se proverilo da ključ radi - ništa ne menja
 * i ništa ne šalje, pa je bezbedna za proveru veze na produkciji.
 */
export async function sefVerzija(): Promise<Odgovor<unknown>> {
  return sefFetch<unknown>("/api/publicApi/getEfakturaVersion");
}

/**
 * Obnavlja pretplatu na obaveštenja o promeni statusa. Važi za SLEDEĆI dan, pa
 * mora da se poziva svakog dana - vidi cron. Bez ovoga statusi tiho zastare.
 */
export async function obnoviPretplatu(): Promise<Odgovor<unknown>> {
  return sefFetch<unknown>("/api/publicApi/subscribe", { metod: "POST" });
}

/** Jedan red iz pregleda ulaznih faktura. */
export interface UlaznaFakturaSef {
  invoiceId?: number;
  cirInvoiceId?: string | null;
  documentNumber?: string | null;
  supplierName?: string | null;
  supplierVatRegistrationNumber?: string | null;
  amount?: number | null;
  sumWithoutVat?: number | null;
  vatAmount?: number | null;
  currency?: string | null;
  dueDate?: string | null;
  sentDate?: string | null;
  deliveryDate?: string | null;
  status?: string | null;
}

/**
 * Pregled ulaznih faktura u zadatom razdoblju.
 *
 * Namerno se koristi `overview`, a ne `purchase-invoice`: taj drugi vraća samo id
 * i status, bez dobavljača i iznosa. `overview` u jednom pozivu daje sve što nam
 * treba, pa nema preuzimanja i parsiranja XML-a po fakturi.
 *
 * Datumi idu kao YYYY-MM-DD.
 */
export async function pregledUlaznihFaktura(
  dateFrom: string,
  dateTo: string,
): Promise<Odgovor<UlaznaFakturaSef[]>> {
  const q = new URLSearchParams({ dateFrom, dateTo });
  const res = await sefFetch<UlaznaFakturaSef[]>(`/api/publicApi/purchase-invoice/overview?${q}`);
  if (res.ok && !Array.isArray(res.data)) {
    return { ok: false, greska: "Neočekivan oblik odgovora za ulazne fakture.", status: 0 };
  }
  return res;
}

/**
 * Prihvata ili odbija ulaznu fakturu na SEF-u.
 *
 * Ovo je pravni čin - njime se dobavljačeva faktura zvanično prihvata. Zato se
 * poziva ISKLJUČIVO na Natašin klik, nikad iz crona.
 */
export async function prihvatiOdbijUlaznu(
  sefInvoiceId: string,
  prihvacena: boolean,
  komentar?: string,
): Promise<Odgovor<SefOdgovor>> {
  return sefFetch<SefOdgovor>("/api/publicApi/purchase-invoice/acceptRejectPurchaseInvoice", {
    metod: "POST",
    telo: JSON.stringify({
      invoiceId: Number(sefInvoiceId),
      accepted: prihvacena,
      comment: komentar ?? "",
    }),
  });
}

/** PDF ulazne fakture, onakav kakav SEF prikazuje u portalu. */
export async function ulaznaFakturaPdf(sefInvoiceId: string): Promise<Buffer | null> {
  if (!SEF.apiKey) return null;
  try {
    const res = await fetch(
      `${SEF.apiUrl}/api/publicApi/purchase-invoice/pdf?invoiceId=${encodeURIComponent(sefInvoiceId)}`,
      { headers: { ApiKey: SEF.apiKey, Accept: "application/pdf" } },
    );
    if (!res.ok) {
      console.error(`[sef] PDF ulazne fakture ${sefInvoiceId}: HTTP ${res.status}`);
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.error(`[sef] PDF ulazne fakture ${sefInvoiceId} pao:`, e);
    return null;
  }
}

/** Upisuje ishod slanja na sve narudžbine grupe. */
export async function upisiSefOdgovor(
  admin: SupabaseClient,
  groupId: string,
  polja: {
    sef_invoice_id?: string | null;
    sef_status?: string | null;
    sef_sent_at?: string | null;
    sef_response?: Json | null;
  },
): Promise<void> {
  const { error } = await admin.from("orders").update(polja).eq("company_order_group", groupId);
  if (error) {
    console.error(`[sef] upis odgovora pao za grupu ${groupId}:`, error);
    Sentry.captureException(new Error(`[sef] upis odgovora pao: ${error.message}`));
  }
}
