// src/app/api/nestpay/callback/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCallbackHash, NESTPAY } from "@/lib/nestpay";
import { grantAccessForOrder } from "@/lib/grant-access";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => { params[k] = String(v); });

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kurs.hartweger.rs";
  const admin = createAdminClient();
  const oid = params.oid ?? "";

  // 1) verifikacija potpisa
  if (!verifyCallbackHash(params, NESTPAY.storeKey)) {
    console.error("[nestpay] invalid signature for oid", oid);
    return NextResponse.redirect(`${base}/kupovina/greska`, { status: 303 });
  }

  const { data: order } = await admin
    .from("orders").select("*").eq("order_number", oid).single();
  if (!order) {
    console.error("[nestpay] order not found for oid", oid);
    return NextResponse.redirect(`${base}/kupovina/greska`, { status: 303 });
  }

  // idempotencija
  if (order.payment_status === "completed") {
    return NextResponse.redirect(`${base}/kupovina/hvala/${order.id}`, { status: 303 });
  }

  await admin.from("orders").update({
    nestpay_trans_id: params.TransId ?? null,
    nestpay_response: params,
  }).eq("id", order.id);

  const approved = params.ProcReturnCode === "00";

  if (!approved) {
    await admin.from("orders").update({ nestpay_status: "failed" }).eq("id", order.id);
    return NextResponse.redirect(`${base}/kupovina/hvala/${order.id}?status=fail`, { status: 303 });
  }

  // Potpis je kriptografski verifikovan (banka potpisuje odgovor sa store_key), a ProcReturnCode
  // i oid su u potpisanim HASHPARAMS → uplata je zaista odobrena. To je dovoljan dokaz (isto kao
  // stari WP). Iznos koji se naplaćuje je naš (potpisan u request hash-u), pa ne zavisimo od
  // echo-vanog params.amount. Server-side query je UKLONJEN — obarao se na IP/whitelist i lažno
  // označavao uspele uplate kao neuspeh.
  await admin.from("orders").update({ nestpay_status: "charged" }).eq("id", order.id);
  await grantAccessForOrder(order.id);

  return NextResponse.redirect(`${base}/kupovina/hvala/${order.id}?status=ok`, { status: 303 });
}
