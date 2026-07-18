// JEDNOKRATNA ruta: prenos Tamare Rašković (kurcubictamara042@gmail.com) sa otkazane
// A2.2 grupe (stari WP order #50013, 19.600 din kartica, 06.03.2026) na individualni
// paket 4 kod Suzane. Storno starog fiskalnog računa + nova porudžbina 14.000 +
// grant (upis/beleške/mejlovi) + novi fiskalni račun. Razliku 5.600 Nataša vraća ručno.
// Mora na produkciji jer je FISCOMM_API_KEY sensitive env. OBRISATI posle izvršenja.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantAccessForOrder } from "@/lib/grant-access";
import { fiscalizeOrder } from "@/lib/fiscomm";
import { generateOrderNumber } from "@/lib/order-utils";

const FISCOMM_URL = process.env.FISCOMM_API_URL ?? "https://us-central1-fiscal-38558.cloudfunctions.net/api";

// Stari račun (iz WP backup dumpa, hw_postmeta za order 50013)
const OLD = {
  wcOrderId: 50013,
  amount: 19600,
  itemName: "Grupni kurs nemačkog jezika A2.2",
  referentDocumentNumber: "QQ9JGBJ7-C38FDVO0-265",
  referentDocumentDT: "2026-03-06T18:28:41.7006641+01:00",
};

// Nova porudžbina
const NEW = {
  userId: "30b02dac-bf8d-4bd1-bb11-b352b3e33454",
  email: "kurcubictamara042@gmail.com",
  fullName: "Tamara Raskovic",
  courseId: "fb8e4e0f-3c12-4589-b16d-2e3aff730535",
  courseSlug: "individualni-mesecni-paketi",
  title: "Individualni mesečni paketi",
  professorId: "c703a053-5ef6-410f-bbab-a2f099568839", // Suzana Marjanović
  packageLessons: 4,
  price: 14000, // product_variants paket4 kod Suzane
};

export async function POST(request: Request) {
  const secret = process.env.STORNO_SECRET;
  if (!secret || request.headers.get("x-storno-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!process.env.FISCOMM_API_KEY) {
    return NextResponse.json({ error: "no_fiscomm_key" }, { status: 500 });
  }

  const { dry } = await request.json().catch(() => ({ dry: true }));
  const admin = createAdminClient();

  // Idempotency guard: ako je porudžbina već napravljena, ne ponavljaj ništa (ni storno).
  const { data: existing } = await admin
    .from("orders")
    .select("id, order_number, payment_status, fiscal_referent_number")
    .eq("user_id", NEW.userId)
    .eq("email", NEW.email)
    .gte("created_at", "2026-07-18")
    .eq("items->0->>course_id", NEW.courseId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ alreadyDone: true, existing });
  }

  const stornoPayload = {
    payment: [{ amount: OLD.amount, paymentType: "Card" }],
    invoiceNumber: `WP-${OLD.wcOrderId}`,
    invoicePdfUrl: `https://www.hartweger.rs/kupovina/hvala/wp-${OLD.wcOrderId}`,
    items: [{ name: OLD.itemName, quantity: 1, unitPrice: OLD.amount, labels: ["Ђ"], totalAmount: OLD.amount }],
    referentDocumentNumber: OLD.referentDocumentNumber,
    referentDocumentDT: OLD.referentDocumentDT,
  };

  if (dry) {
    return NextResponse.json({ dry: true, stornoPayload, newOrder: NEW });
  }

  // 1) Storno starog računa
  const res = await fetch(`${FISCOMM_URL}/invoices/normal/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FISCOMM_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(stornoPayload),
  });
  const text = await res.text();
  let storno: Record<string, unknown> = {};
  try { storno = JSON.parse(text); } catch { /* prazan */ }
  if (!res.ok) {
    return NextResponse.json({ error: `fiscomm_refund_http_${res.status}`, body: text.slice(0, 600) }, { status: 502 });
  }

  // 2) Nova porudžbina (pending; grantAccessForOrder je prebacuje u completed)
  const orderNumber = await generateOrderNumber();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: NEW.userId,
      email: NEW.email,
      full_name: NEW.fullName,
      country: "RS",
      items: [{
        course_id: NEW.courseId,
        course_slug: NEW.courseSlug,
        title: NEW.title,
        price: NEW.price,
        professor_id: NEW.professorId,
        package_lessons: NEW.packageLessons,
      }],
      subtotal: NEW.price,
      total: NEW.price,
      payment_method: "kartica",
      order_number: orderNumber,
      payment_status: "pending",
      granted: false,
      source_type: "prenos-otkazana-grupa",
    })
    .select("*")
    .single();
  if (orderError || !order) {
    return NextResponse.json({
      error: "order_insert_failed", detail: orderError?.message,
      stornoDone: true, storno,
    }, { status: 500 });
  }

  // 3) Grant: individual enrollment + GAS beleške + mejlovi Tamari i Suzani
  const grant = await grantAccessForOrder(order.id);

  // 4) Fiskalizacija nove porudžbine (14.000, Card)
  const fiscal = await fiscalizeOrder(order.id);

  // 5) Storno podaci za knjigovođu uz novu porudžbinu
  const { data: after } = await admin.from("orders").select("fiscal_response, fiscal_referent_number").eq("id", order.id).single();
  await admin.from("orders").update({
    fiscal_response: {
      sale: after?.fiscal_response ?? null,
      storno_wp_50013: storno,
      napomena: "Prenos sa otkazane A2.2 grupe (WP #50013, 19.600 kartica 06.03.2026, račun QQ9JGBJ7-C38FDVO0-265 STORNIRAN 18.07.2026) na ind. paket 4 kod Suzane; razlika 5.600 din za povraćaj polazniku.",
    },
  }).eq("id", order.id);

  return NextResponse.json({
    ok: true,
    stornoInvoiceNumber: (storno.invoiceNumber as string) ?? null,
    stornoSdcDateTime: (storno.sdcDateTime as string) ?? null,
    newOrderNumber: order.order_number,
    newOrderId: order.id,
    grant,
    fiscal,
    newFiscalNumber: after?.fiscal_referent_number ?? null,
  });
}
