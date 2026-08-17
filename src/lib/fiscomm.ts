// src/lib/fiscomm.ts - Fiscomm PURS fiskalizacija (Virtual PFR)
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site-url";
import type { Json } from "@/lib/supabase/database.types";

const FISCOMM = {
  // v0.1.0 API (Google Cloud Functions) - isti koji stari WP plugin koristi; ključ je važeći ovde
  apiUrl: process.env.FISCOMM_API_URL ?? "https://us-central1-fiscal-38558.cloudfunctions.net/api",
  apiKey: process.env.FISCOMM_API_KEY ?? "",
  // Poreske labele iz Fiscomm naloga - domaći 20% vs inostranstvo (izvoz/0%).
  // PURS standard: "Ђ" = 20% opšta, "А" = 0%/oslobođeno. Potvrditi preko /receipt/tax-rates.
  labelDomestic: process.env.FISCOMM_TAX_LABEL_DOMESTIC ?? "Ђ",
  labelForeign: process.env.FISCOMM_TAX_LABEL_FOREIGN ?? "А",
};

interface OrderItem { title: string; }

/** PURS tip plaćanja (PascalCase, iz /system/payment-methods). */
function pursPaymentType(method: string): string {
  if (method === "uplatnica") return "WireTransfer";
  return "Card"; // kartica, kartica_rate, paypal (kartično-bazirano)
}

/** Narudžbina svedena na ono što Fiscomm traži - isti oblik za prodaju i za storno. */
function invoiceBody(order: {
  id: string; total: number; country: string | null; payment_method: string; items: unknown;
}) {
  const total = Number(order.total);
  const items = (order.items ?? []) as unknown as OrderItem[];
  const label = order.country !== "RS" ? FISCOMM.labelForeign : FISCOMM.labelDomestic;
  return {
    payment: [{ amount: total, paymentType: pursPaymentType(order.payment_method) }],
    invoicePdfUrl: `${SITE_URL}/kupovina/hvala/${order.id}`,
    items: [{ name: items[0]?.title ?? "Kurs", quantity: 1, unitPrice: total, labels: [label], totalAmount: total }],
  };
}

/**
 * Odgovor Fiscomma → naša polja. Nazivi variraju po verziji API-ja, zato lista kandidata.
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
  return {
    referentNumber: jeStorno
      ? pick("invoiceNumber", "invoiceCounter")
      : pick("referentDocumentNumber", "invoiceNumber", "invoiceCounter"),
    referentDt: pick("referentDocumentDt", "sdcDateTime", "dateTimeOfIssue"),
    journal: pick("journal", "vpfrJournal", "invoiceText"),
    verificationUrl: pick("verificationUrl", "verificationQRCode", "verificationURL"),
    pdfUrl: pick("invoicePdfUrl", "pdfUrl", "invoicePdf"),
  };
}

async function postInvoice(path: string, payload: unknown): Promise<
  { ok: true; data: Record<string, Json> } | { ok: false; error: string; data: Record<string, Json> }
> {
  const res = await fetch(`${FISCOMM.apiUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FISCOMM.apiKey}`,
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
  return { ok: true, data };
}

/**
 * Izdaje fiskalni račun preko Fiscomm API-ja (POST /receipt/normal/sale) i upisuje
 * fiskalna polja na narudžbinu. Idempotentno. NE baca grešku - fiskalizacija ne sme
 * da blokira pristup kupcu (ako padne, loguje se i može retry).
 */
export async function fiscalizeOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  if (!FISCOMM.apiKey) {
    console.warn("[fiscomm] FISCOMM_API_KEY nije postavljen - preskačem fiskalizaciju");
    return { ok: false, error: "no_api_key" };
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) return { ok: false, error: "order_not_found" };
  if (order.fiscal_referent_number) return { ok: true }; // već fiskalizovan

  // IAdditionalData šema (v0.1.0): payment[], items[], invoicePdfUrl (obavezno)
  const payload = { ...invoiceBody(order), invoiceNumber: String(order.order_number) };

  try {
    const res = await postInvoice("/invoices/normal/sale", payload);

    if (!res.ok) {
      const msg = `[fiscomm] API greška ${res.error} za order ${order.order_number}: ${JSON.stringify(res.data).slice(0, 300)}`;
      console.error(msg);
      Sentry.captureException(new Error(msg));
      await admin.from("orders").update({ fiscal_response: res.data }).eq("id", orderId);
      return { ok: false, error: res.error };
    }

    // Mapiranje best-effort (tačni nazivi se potvrđuju iz prvog stvarnog odgovora - zato čuvamo i sirov)
    const f = mapFiscalFields(res.data);
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
 * Izdaje STORNO (refundacioni fiskalni račun) za već fiskalizovanu narudžbinu -
 * `POST /invoices/normal/refund`. Već izdat račun je registrovan kod PURS-a i ne može da
 * „nestane": poništava se isključivo ovakvim protivračunom.
 *
 * Za razliku od `fiscalizeOrder`, OVA funkcija vraća grešku glasno - storno pokreće admin
 * ručno i mora da vidi da li je prošlo. Idempotentna je: drugi poziv ne izdaje drugi storno.
 *
 * PAŽNJA: ovo je samo poreski dokument. Novac kupcu vraća banka (NestPay Merchant centar,
 * a rate banka radi ručno u pozadini) - to nije deo ove funkcije.
 */
export async function refundOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  if (!FISCOMM.apiKey) return { ok: false, error: "no_api_key" };

  const admin = createAdminClient();
  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) return { ok: false, error: "order_not_found" };
  if (order.refund_referent_number) return { ok: true }; // već storniran
  // Bez originalnog fiskalnog broja nema na šta da se veže storno (referentDocumentNumber
  // je obavezan). Takva narudžbina nikad nije ni fiskalizovana - nema šta da se poništi.
  if (!order.fiscal_referent_number || !order.fiscal_referent_dt) {
    return { ok: false, error: "nema_originalnog_racuna" };
  }

  const payload = {
    ...invoiceBody(order),
    invoiceNumber: `${order.order_number}-S`,
    referentDocumentNumber: order.fiscal_referent_number,
    referentDocumentDT: order.fiscal_referent_dt,
  };

  try {
    const res = await postInvoice("/invoices/normal/refund", payload);

    if (!res.ok) {
      const msg = `[fiscomm] storno pao (${res.error}) za order ${order.order_number}: ${JSON.stringify(res.data).slice(0, 300)}`;
      console.error(msg);
      Sentry.captureException(new Error(msg));
      await admin.from("orders").update({ refund_response: res.data }).eq("id", orderId);
      return { ok: false, error: res.error };
    }

    const f = mapFiscalFields(res.data, true);
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
