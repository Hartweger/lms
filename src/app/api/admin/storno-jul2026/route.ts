// JEDNOKRATNA ruta: storno (refund) 5 fiskalnih računa koje je nestpay-reconcile
// cron pogrešno auto-izdao za uplatnica/PayPal porudžbine 03-06.07.2026 (bug fiksiran
// u 84dede2, odluka Nataše 07.07: stornirati svih 5). Mora da radi na produkciji jer
// je FISCOMM_API_KEY sensitive env (nedostupan lokalno). OBRISATI posle izvršenja.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED = new Set(["2026-130", "2026-131", "2026-142", "2026-145", "2026-151"]);

const FISCOMM_URL = process.env.FISCOMM_API_URL ?? "https://us-central1-fiscal-38558.cloudfunctions.net/api";

function pursPaymentType(method: string): string {
  if (method === "uplatnica") return "WireTransfer";
  return "Card";
}

export async function POST(request: Request) {
  const secret = process.env.STORNO_SECRET;
  if (!secret || request.headers.get("x-storno-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!process.env.FISCOMM_API_KEY) {
    return NextResponse.json({ error: "no_fiscomm_key" }, { status: 500 });
  }

  const { orderNumber, dry } = await request.json();
  if (!ALLOWED.has(orderNumber)) {
    return NextResponse.json({ error: "order_not_in_allowed_list" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: o, error } = await admin.from("orders").select("*").eq("order_number", orderNumber).single();
  if (error || !o) return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  if (!o.fiscal_referent_number || !o.fiscal_response?.invoiceNumber) {
    return NextResponse.json({ error: "not_fiscalized", note: "već stornirana?" }, { status: 400 });
  }

  const label = o.country !== "RS" ? "А" : "Ђ";
  const total = Number(o.total);
  const name = (o.items?.[0]?.title as string) ?? "Kurs";
  const payload = {
    payment: [{ amount: total, paymentType: pursPaymentType(o.payment_method) }],
    invoiceNumber: String(o.order_number),
    invoicePdfUrl: `https://www.hartweger.rs/kupovina/hvala/${o.id}`,
    items: [{ name, quantity: 1, unitPrice: total, labels: [label], totalAmount: total }],
    referentDocumentNumber: o.fiscal_response.invoiceNumber as string,
    referentDocumentDT: o.fiscal_response.sdcDateTime as string,
  };

  if (dry) return NextResponse.json({ dry: true, orderNumber, payload });

  const res = await fetch(`${FISCOMM_URL}/invoices/normal/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FISCOMM_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(text); } catch { /* prazan */ }

  if (!res.ok) {
    return NextResponse.json({ error: `fiscomm_http_${res.status}`, body: text.slice(0, 600) }, { status: 502 });
  }

  const { error: upErr } = await admin.from("orders").update({
    fiscal_response: { sale: o.fiscal_response, storno: data, storno_razlog: "auto-fiskalizacija bug 36d4a1f, storno 07.07.2026" },
    fiscal_referent_number: null,
    fiscal_referent_dt: null,
    fiscal_journal: null,
    fiscal_verification_url: null,
    fiscal_pdf_url: null,
    fiscalized_at: null,
  }).eq("id", o.id);

  return NextResponse.json({
    ok: true,
    orderNumber,
    stornoInvoiceNumber: data.invoiceNumber ?? null,
    stornoSdcDateTime: data.sdcDateTime ?? null,
    dbUpdate: upErr ? `FAILED: ${upErr.message}` : "ok",
  });
}
