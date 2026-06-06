// src/lib/fiscomm.ts — Fiscomm PURS fiskalizacija (Virtual PFR)
import { createAdminClient } from "@/lib/supabase/admin";

const FISCOMM = {
  apiUrl: process.env.FISCOMM_API_URL ?? "https://api.fiscomm.rs",
  apiKey: process.env.FISCOMM_API_KEY ?? "",
  // Poreske labele iz Fiscomm naloga — domaći 20% vs inostranstvo (izvoz/0%).
  // PURS standard: "Ђ" = 20% opšta, "А" = 0%/oslobođeno. Potvrditi preko /receipt/tax-rates.
  labelDomestic: process.env.FISCOMM_TAX_LABEL_DOMESTIC ?? "Ђ",
  labelForeign: process.env.FISCOMM_TAX_LABEL_FOREIGN ?? "А",
};

interface OrderItem { title: string; }

/** PURS tip plaćanja za naš payment_method. */
function pursPaymentType(method: string): string {
  if (method === "kartica" || method === "kartica_rate") return "card";
  if (method === "paypal") return "card"; // PayPal je kartično-bazirano
  return "wireTransfer"; // uplatnica (ne fiskalizujemo je, ali za svaki slučaj)
}

/**
 * Izdaje fiskalni račun preko Fiscomm API-ja (POST /receipt/normal/sale) i upisuje
 * fiskalna polja na narudžbinu. Idempotentno. NE baca grešku — fiskalizacija ne sme
 * da blokira pristup kupcu (ako padne, loguje se i može retry).
 */
export async function fiscalizeOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  if (!FISCOMM.apiKey) {
    console.warn("[fiscomm] FISCOMM_API_KEY nije postavljen — preskačem fiskalizaciju");
    return { ok: false, error: "no_api_key" };
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) return { ok: false, error: "order_not_found" };
  if (order.fiscal_referent_number) return { ok: true }; // već fiskalizovan

  const isForeign = order.country !== "RS";
  const label = isForeign ? FISCOMM.labelForeign : FISCOMM.labelDomestic;
  const total = Number(order.total);
  const items = (order.items ?? []) as OrderItem[];
  const name = items[0]?.title ?? "Kurs";

  const payload = {
    payments: [{ amount: total, type: pursPaymentType(order.payment_method) }],
    orderNumber: String(order.order_number),
    options: { OmitQRCodeGen: "1", OmitTextualRepresentation: "1" },
    items: [{ name, quantity: 1, unitPrice: total, labels: [label], totalAmount: total }],
  };

  try {
    const res = await fetch(`${FISCOMM.apiUrl}/receipt/normal/sale`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FISCOMM.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch { /* ostavi prazno */ }

    if (!res.ok) {
      console.error(`[fiscomm] API greška ${res.status} za order ${order.order_number}: ${text.slice(0, 300)}`);
      await admin.from("orders").update({ fiscal_response: data && Object.keys(data).length ? data : { raw: text.slice(0, 1000), status: res.status } }).eq("id", orderId);
      return { ok: false, error: `http_${res.status}` };
    }

    // Mapiranje best-effort (tačni nazivi se potvrđuju iz prvog stvarnog odgovora — zato čuvamo i sirov)
    const pick = (...keys: string[]): string | null => {
      for (const k of keys) { const v = data[k]; if (typeof v === "string" && v) return v; }
      return null;
    };

    await admin.from("orders").update({
      fiscal_referent_number: pick("referentDocumentNumber", "invoiceNumber", "invoiceCounter"),
      fiscal_referent_dt: pick("referentDocumentDt", "sdcDateTime", "dateTimeOfIssue"),
      fiscal_journal: pick("journal", "vpfrJournal", "invoiceText"),
      fiscal_verification_url: pick("verificationUrl", "verificationQRCode", "verificationURL"),
      fiscal_pdf_url: pick("invoicePdfUrl", "pdfUrl", "invoicePdf"),
      fiscal_response: data,
      fiscalized_at: new Date().toISOString(),
    }).eq("id", orderId);

    return { ok: true };
  } catch (e) {
    console.error("[fiscomm] izuzetak:", e);
    return { ok: false, error: String(e) };
  }
}
