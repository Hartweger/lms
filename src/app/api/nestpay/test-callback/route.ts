// src/app/api/nestpay/test-callback/route.ts
// Callback za NestPay RECURRING TEST (testni gateway banke). Nema veze sa
// produkcijskim /api/nestpay/callback: ne dira orders, ne dodeljuje pristup,
// ne fiskalizuje. Jedini zadatak: ZABELEŽI SVE što banka pošalje (metod,
// parametre, potpis) u nestpay_test_callbacks, da empirijski vidimo da li
// naplate 2..N recurring serije uopšte stižu do nas.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCallbackHash } from "@/lib/nestpay";
import { NESTPAY_TEST } from "@/lib/nestpay-test";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const SAFE_HEADERS = ["user-agent", "content-type", "referer", "x-forwarded-for", "x-real-ip"];

async function logCallback(request: Request, params: Record<string, string>) {
  const headers: Record<string, string> = {};
  for (const h of SAFE_HEADERS) {
    const v = request.headers.get(h);
    if (v) headers[h] = v;
  }
  const hashValid = params.HASH
    ? verifyCallbackHash(params, NESTPAY_TEST.storeKey)
    : null;

  const admin = createAdminClient();
  const { error } = await admin.from("nestpay_test_callbacks").insert({
    oid: params.oid ?? null,
    method: request.method,
    hash_valid: hashValid,
    proc_return_code: params.ProcReturnCode ?? null,
    trans_id: params.TransId ?? null,
    params,
    headers,
  });
  if (error) console.error("[nestpay-test] upis callback loga pao:", error.message);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => { params[k] = String(v); });
  await logCallback(request, params);
  // Prva naplata ide kroz browser (3D lanac) - vrati čoveka na admin stranicu.
  // Server-to-server pozivi (ako ih banka šalje za 2..N) ignorišu redirect.
  return NextResponse.redirect(`${SITE_URL}/admin/nestpay-recurring-test`, { status: 303 });
}

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  await logCallback(request, params);
  return NextResponse.redirect(`${SITE_URL}/admin/nestpay-recurring-test`, { status: 303 });
}
