// src/lib/fiscomm.ts - Fiscomm PURS fiskalizacija (Virtual PFR)
//
// Podržava DVA Fiscomm API-ja, biranje ide preko FISCOMM_API_URL:
//  - v0.1.0 (stari, Google Cloud Functions) - podrazumevani dok traje migracija
//  - 2.0 (https://api.fiscomm.rs) - pali se čim env pokaže na api.fiscomm.rs
// Prelazak = zamena FISCOMM_API_URL + FISCOMM_API_KEY na Vercelu, bez izmene koda.
// Kad stari API bude ugašen, v0.1.0 grane se brišu.
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site-url";
import type { Json } from "@/lib/supabase/database.types";

function cfg() {
  const apiUrl = process.env.FISCOMM_API_URL ?? "https://us-central1-fiscal-38558.cloudfunctions.net/api";
  return {
    apiUrl,
    apiKey: process.env.FISCOMM_API_KEY ?? "",
    // Fiscomm 2.0 (nova platforma) vs v0.1.0 (stari cloudfunctions API)
    v2: apiUrl.includes("api.fiscomm.rs"),
    // Poreske labele iz Fiscomm naloga - domaći 20% vs inostranstvo (izvoz/0%).
    // PURS standard: "Ђ" = 20% opšta, "А" = 0%/oslobođeno. Potvrditi preko /receipt/tax-rates.
    labelDomestic: process.env.FISCOMM_TAX_LABEL_DOMESTIC ?? "Ђ",
    labelForeign: process.env.FISCOMM_TAX_LABEL_FOREIGN ?? "А",
  };
}

interface OrderItem { title: string; }

/** PURS tip plaćanja (PascalCase enum važi na oba API-ja). */
function pursPaymentType(method: string): string {
  if (method === "uplatnica") return "WireTransfer";
  return "Card"; // kartica, kartica_rate, paypal (kartično-bazirano)
}

/** Narudžbina svedena na ono što Fiscomm traži - isti oblik za prodaju i za storno. */
function invoiceBody(order: {
  id: string; total: number; country: string | null; payment_method: string; items: unknown;
}) {
  const c = cfg();
  const total = Number(order.total);
  const items = (order.items ?? []) as unknown as OrderItem[];
  const label = order.country !== "RS" ? c.labelForeign : c.labelDomestic;
  const stavke = [{ name: items[0]?.title ?? "Kurs", quantity: 1, unitPrice: total, labels: [label], totalAmount: total }];
  if (c.v2) {
    return {
      // 2.0: payments[] {type, amount}; metaFields OBAVEZNO (šaljemo prazno - ne curi
      // ništa na račun); PDF generiše Fiscomm i vraća URL u odgovoru (invoicePdfUrl se ne šalje).
      payments: [{ type: pursPaymentType(order.payment_method), amount: total }],
      items: stavke,
      metaFields: {},
    };
  }
  return {
    payment: [{ amount: total, paymentType: pursPaymentType(order.payment_method) }],
    invoicePdfUrl: `${SITE_URL}/kupovina/hvala/${order.id}`,
    items: stavke,
  };
}

/**
 * Odgovor Fiscomma → naša polja. Nazivi variraju po verziji API-ja, zato lista kandidata.
 * Na 2.0 se prosleđuje već raspakovan `receipt` objekat (vidi postInvoice).
 *
 * `jeStorno` menja SAMO odakle se čita PFR broj: na odgovoru storna `referentDocumentNumber`
 * je broj ORIGINALNOG računa (onog koji poništavamo), a broj samog storna je `invoiceNumber`.
 * Bez ove razlike bismo u `refund_referent_number` upisali original i mislili da je storniran
 * račun koji nije.
 */
function mapFiscalFields(data: Record<string, Json>, jeStorno = false) {
  const pick = (...keys: string[]): string | null => {
    for (const k of keys) { const v = data[k]; if (typeof v === "string" && v) return v; }
    return null;
  };
  // 2.0 nema `journal` (tekstualni isečak) u ReceiptDetailsDto - možda stigne u `additional`.
  const extra = (data.additional && typeof data.additional === "object" && !Array.isArray(data.additional))
    ? data.additional as Record<string, Json> : {};
  const pickExtra = (...keys: string[]): string | null => {
    for (const k of keys) { const v = extra[k]; if (typeof v === "string" && v) return v; }
    return null;
  };
  return {
    referentNumber: jeStorno
      ? pick("invoiceNumber", "invoiceCounter")
      : pick("referentDocumentNumber", "invoiceNumber", "invoiceCounter"),
    referentDt: pick("referentDocumentDt", "sdcDateTime", "dateTimeOfIssue"),
    journal: pick("journal", "vpfrJournal", "invoiceText") ?? pickExtra("journal", "vpfrJournal"),
    verificationUrl: pick("verificationUrl", "verificationQRCode", "verificationURL"),
    pdfUrl: pick("invoicePdfUrl", "pdfUrl", "invoicePdf"),
  };
}

async function postInvoice(path: string, payload: unknown): Promise<
  | { ok: true; data: Record<string, Json>; fiskal: Record<string, Json> }
  | { ok: false; error: string; data: Record<string, Json> }
> {
  const c = cfg();
  const res = await fetch(`${c.apiUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data: Record<string, Json> = {};
  try { data = JSON.parse(text); } catch { /* ostavi prazno */ }
  if (!res.ok) {
    return {
      ok: false,
      error: `http_${res.status}`,
      data: data && Object.keys(data).length ? data : { raw: text.slice(0, 1000), status: res.status },
    };
  }
  // 2.0 umotava račun: { correlationId, receipt: {...} }. `data` ostaje ceo odgovor
  // (čuva se sirov u bazu), a `fiskal` je objekat iz kog se mapiraju fiskalna polja.
  const fiskal = (c.v2 && data.receipt && typeof data.receipt === "object" && !Array.isArray(data.receipt))
    ? data.receipt as Record<string, Json>
    : data;
  return { ok: true, data, fiskal };
}

/**
 * Izdaje fiskalni račun preko Fiscomm API-ja i upisuje fiskalna polja na narudžbinu.
 * Idempotentno. NE baca grešku - fiskalizacija ne sme da blokira pristup kupcu
 * (ako padne, loguje se i može retry).
 */
export async function fiscalizeOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const c = cfg();
  if (!c.apiKey) {
    console.warn("[fiscomm] FISCOMM_API_KEY nije postavljen - preskačem fiskalizaciju");
    return { ok: false, error: "no_api_key" };
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) return { ok: false, error: "order_not_found" };
  if (order.fiscal_referent_number) return { ok: true }; // već fiskalizovan

  const payload = c.v2
    // 2.0 SaleGatewayRequestDto: orderNumber obavezan; returnIfOrderNumberExists čini
    // retry bezbednim - postojeći račun se vrati umesto duplog izdavanja.
    ? { ...invoiceBody(order), orderNumber: String(order.order_number), settings: { returnIfOrderNumberExists: true } }
    // v0.1.0 IAdditionalData: payment[], items[], invoicePdfUrl (obavezno)
    : { ...invoiceBody(order), invoiceNumber: String(order.order_number) };

  try {
    const res = await postInvoice(c.v2 ? "/receipt/normal/sale" : "/invoices/normal/sale", payload);

    if (!res.ok) {
      const msg = `[fiscomm] API greška ${res.error} za order ${order.order_number}: ${JSON.stringify(res.data).slice(0, 300)}`;
      console.error(msg);
      Sentry.captureException(new Error(msg));
      await admin.from("orders").update({ fiscal_response: res.data }).eq("id", orderId);
      return { ok: false, error: res.error };
    }

    // Mapiranje best-effort (sirov odgovor se čuva pa se svako odstupanje vidi u bazi)
    const f = mapFiscalFields(res.fiskal);
    await admin.from("orders").update({
      fiscal_referent_number: f.referentNumber,
      fiscal_referent_dt: f.referentDt,
      fiscal_journal: f.journal,
      fiscal_verification_url: f.verificationUrl,
      fiscal_pdf_url: f.pdfUrl,
      fiscal_response: res.data,
      fiscalized_at: new Date().toISOString(),
    }).eq("id", orderId);

    return { ok: true };
  } catch (e) {
    console.error("[fiscomm] izuzetak:", e);
    Sentry.captureException(e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Izdaje STORNO (refundacioni fiskalni račun) za već fiskalizovanu narudžbinu.
 * Već izdat račun je registrovan kod PURS-a i ne može da „nestane": poništava se
 * isključivo ovakvim protivračunom.
 *
 * Za razliku od `fiscalizeOrder`, OVA funkcija vraća grešku glasno - storno pokreće admin
 * ručno i mora da vidi da li je prošlo. Idempotentna je: drugi poziv ne izdaje drugi storno.
 *
 * PAŽNJA: ovo je samo poreski dokument. Novac kupcu vraća banka (NestPay Merchant centar,
 * a rate banka radi ručno u pozadini) - to nije deo ove funkcije.
 */
export async function refundOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const c = cfg();
  if (!c.apiKey) return { ok: false, error: "no_api_key" };

  const admin = createAdminClient();
  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) return { ok: false, error: "order_not_found" };
  if (order.refund_referent_number) return { ok: true }; // već storniran
  // Bez originalnog fiskalnog broja nema na šta da se veže storno (referentDocumentNumber
  // je obavezan). Takva narudžbina nikad nije ni fiskalizovana - nema šta da se poništi.
  if (!order.fiscal_referent_number || !order.fiscal_referent_dt) {
    return { ok: false, error: "nema_originalnog_racuna" };
  }

  const payload = c.v2
    // 2.0 RefundGatewayRequestDto: buyerId je obavezan OSIM uz skipBuyerIdValidation -
    // prodajemo fizičkim licima bez buyerId, Fiscomm je 20.08.2026. potvrdio da je flag
    // ispravan za taj slučaj. Pazi: polje je `referentDocumentDt` (malo t), ne `DT`.
    ? {
        ...invoiceBody(order),
        orderNumber: `${order.order_number}-S`,
        referentDocumentNumber: order.fiscal_referent_number,
        referentDocumentDt: order.fiscal_referent_dt,
        settings: { skipBuyerIdValidation: true, returnIfOrderNumberExists: true },
      }
    : {
        ...invoiceBody(order),
        invoiceNumber: `${order.order_number}-S`,
        referentDocumentNumber: order.fiscal_referent_number,
        referentDocumentDT: order.fiscal_referent_dt,
      };

  try {
    const res = await postInvoice(c.v2 ? "/receipt/normal/refund" : "/invoices/normal/refund", payload);

    if (!res.ok) {
      const msg = `[fiscomm] storno pao (${res.error}) za order ${order.order_number}: ${JSON.stringify(res.data).slice(0, 300)}`;
      console.error(msg);
      Sentry.captureException(new Error(msg));
      await admin.from("orders").update({ refund_response: res.data }).eq("id", orderId);
      return { ok: false, error: res.error };
    }

    const f = mapFiscalFields(res.fiskal, true);
    await admin.from("orders").update({
      refund_referent_number: f.referentNumber,
      refund_journal: f.journal,
      refund_verification_url: f.verificationUrl,
      refund_pdf_url: f.pdfUrl,
      refund_response: res.data,
      refunded_at: new Date().toISOString(),
    }).eq("id", orderId);

    return { ok: true };
  } catch (e) {
    console.error("[fiscomm] storno izuzetak:", e);
    Sentry.captureException(e);
    return { ok: false, error: String(e) };
  }
}
