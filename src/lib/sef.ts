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
  return sefFetch<MiniInvoiceDto>(`/api/publicApi/sales-invoice/ubl?${q}`, {
    metod: "POST",
    telo: ubl,
    contentType: "application/xml",
  });
}

interface SimpleSalesInvoiceDto {
  invoiceId?: number;
  status?: SefStatus;
  comment?: string | null;
  cirInvoiceId?: string | null;
  lastModifiedUtc?: string | null;
}

/** Pita SEF za pravi status fakture. Telo webhooka se NE koristi kao izvor istine. */
export async function procitajStatus(
  sefInvoiceId: string,
): Promise<Odgovor<SimpleSalesInvoiceDto>> {
  return sefFetch<SimpleSalesInvoiceDto>(
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
 * Obnavlja pretplatu na obaveštenja o promeni statusa. Važi za SLEDEĆI dan, pa
 * mora da se poziva svakog dana - vidi cron. Bez ovoga statusi tiho zastare.
 */
export async function obnoviPretplatu(): Promise<Odgovor<unknown>> {
  return sefFetch<unknown>("/api/publicApi/subscribe", { metod: "POST" });
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
