// src/app/api/nestpay/callback/route.ts
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCallbackHash, NESTPAY } from "@/lib/nestpay";
import { grantAccessForOrder } from "@/lib/grant-access";
import { startSubscriptionForOrder } from "@/lib/subscription-start";
import { fiscalizeOrder } from "@/lib/fiscomm";
import { sendCardPaymentConfirmationEmail } from "@/lib/email";
import { nestpayTxData } from "@/lib/payment-confirmation";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => { params[k] = String(v); });

  const base = SITE_URL;
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

  // _receivedAt: vreme prijema callback-a - za "datum i vreme transakcije" u Potvrdi o
  // plaćanju (EPM 2.7) kad banka ne pošalje EXTRA.TRXDATE.
  const nestpayResponse = { ...params, _receivedAt: new Date().toISOString() };
  await admin.from("orders").update({
    nestpay_trans_id: params.TransId ?? null,
    nestpay_response: nestpayResponse,
  }).eq("id", order.id);

  const approved = params.ProcReturnCode === "00";

  // Potvrda o plaćanju mejlom - obavezna po EPM 2.7 za OBA ishoda (uspeh i neuspeh).
  // Pretplata: naplaćena je mesečna rata (order.total), ne puna cena iz items[].price -
  // stavka u potvrdi mora da se slaže sa ukupnim iznosom (popust ne utiče na ratu).
  const isPretplata = order.payment_method === "kartica_pretplata";
  const potvrda = (success: boolean) =>
    sendCardPaymentConfirmationEmail({
      email: order.email,
      fullName: order.full_name,
      orderNumber: order.order_number,
      items: ((order.items ?? []) as { title: string; price: number }[]).map((i) => ({
        title: isPretplata ? `${i.title} - mesečna naplata` : i.title,
        price: isPretplata ? order.total : i.price,
      })),
      discount: isPretplata ? 0 : (order.discount ?? 0),
      total: order.total,
      country: order.country,
      success,
      tx: nestpayTxData(nestpayResponse, order.created_at),
    });

  if (!approved) {
    await admin.from("orders").update({ nestpay_status: "failed" }).eq("id", order.id);
    await potvrda(false);
    return NextResponse.redirect(`${base}/kupovina/hvala/${order.id}?status=fail`, { status: 303 });
  }

  // Potpis je kriptografski verifikovan (banka potpisuje odgovor sa store_key), a ProcReturnCode
  // i oid su u potpisanim HASHPARAMS → uplata je zaista odobrena. To je dovoljan dokaz (isto kao
  // stari WP). Iznos koji se naplaćuje je naš (potpisan u request hash-u), pa ne zavisimo od
  // echo-vanog params.amount. Server-side query je UKLONJEN - obarao se na IP/whitelist i lažno
  // označavao uspele uplate kao neuspeh.
  await admin.from("orders").update({ nestpay_status: "charged" }).eq("id", order.id);
  // Mesečno plaćanje: seriju upisujemo PRE dodele pristupa - grant čita subscription_id
  // da bi znao da pristup traje do sledeće naplate i da otvara samo nivoe do ove rate.
  await startSubscriptionForOrder(order, params);
  // Dodela pristupa + GA4 + Meta Purchase (CAPI) iz jedne tačke. Naplata je USPELA — ako grant
  // padne, kupac je platio bez pristupa: alarm odmah (Sentry), order ostaje pending pa ga
  // nestpay-reconcile cron ponavlja. Kupca svejedno vodimo na hvala (novac je prošao).
  const grant = await grantAccessForOrder(order.id);
  if (!grant.ok) {
    Sentry.captureException(new Error(`[nestpay] PLAĆENO-A-NEMA-PRISTUP: grant pao za order ${oid}: ${grant.error}`));
  }
  await fiscalizeOrder(order.id); // fiskalni račun (kartica) - ne blokira pristup ako padne
  await potvrda(true);

  // Auto-login: callback stiže KROZ KUPČEV BROWSER (303 lanac), pa sesiju postavljamo
  // u istom lancu: generateLink → /auth/confirm (verifyOtp + cookie) → hvala.
  // Best-effort: ako padne, kupac ide na hvala odjavljen (staro ponašanje) -
  // plaćanje nikad ne zavisi od logina. Idempotentni replay (gore) NE loguje ponovo.
  const hvalaPath = `/kupovina/hvala/${order.id}?status=ok`;
  try {
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: order.email,
    });
    if (!linkError && link?.properties?.hashed_token) {
      return NextResponse.redirect(
        `${base}/auth/confirm?token_hash=${link.properties.hashed_token}&type=magiclink&next=${encodeURIComponent(hvalaPath)}`,
        { status: 303 },
      );
    }
    console.error(`[nestpay] generateLink za auto-login pao (order ${oid}):`, linkError?.message);
  } catch (e) {
    console.error(`[nestpay] auto-login pao (order ${oid}):`, e);
  }
  return NextResponse.redirect(`${base}${hvalaPath}`, { status: 303 });
}
