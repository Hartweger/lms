// src/app/api/nestpay/callback/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCallbackHash, queryTransaction, NESTPAY } from "@/lib/nestpay";
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

  // 2) HARDENING — server-side query + provera iznosa
  const q = await queryTransaction(oid);
  if (!q || q.procReturnCode !== "00") {
    console.error("[nestpay] server query mismatch for", oid, q);
    await admin.from("orders").update({ nestpay_status: "failed" }).eq("id", order.id);
    return NextResponse.redirect(`${base}/kupovina/hvala/${order.id}?status=fail`, { status: 303 });
  }
  const paid = parseFloat(params.amount ?? "0");
  if (Math.abs(paid - Number(order.total)) > 0.5) {
    console.error("[nestpay] amount mismatch", { paid, total: order.total, oid });
    await admin.from("orders").update({ nestpay_status: "failed" }).eq("id", order.id);
    return NextResponse.redirect(`${base}/kupovina/hvala/${order.id}?status=fail`, { status: 303 });
  }

  // 3) grant
  await admin.from("orders").update({ nestpay_status: "charged" }).eq("id", order.id);
  await grantAccessForOrder(order.id);

  return NextResponse.redirect(`${base}/kupovina/hvala/${order.id}?status=ok`, { status: 303 });
}
