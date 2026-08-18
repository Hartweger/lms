// src/app/api/cron/nestpay-reconcile/route.ts
import { NextResponse } from "next/server";
import { withCronLog } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { reconcilePendingCards } from "@/lib/reconcile-cards";
import { sendCardRetryEmail, sendCardReminder2Email, sendOrderCancelledEmail, sendUplataReminderEmail } from "@/lib/email";
import { recoveryAction, uplataReminderAction, calculatePaypalEur, needsFiscalRetry } from "@/lib/order-utils";
import { generateIpsQrUrl } from "@/lib/ips-qr";
import { fiscalizeOrder } from "@/lib/fiscomm";
import * as Sentry from "@sentry/nextjs";

function slugOf(items: unknown): string {
  return (Array.isArray(items) ? (items[0] as { course_slug?: string })?.course_slug : "") ?? "";
}
function titleOf(items: unknown): string {
  return (Array.isArray(items) ? (items[0] as { title?: string })?.title : "") || "kurs";
}

export const dynamic = "force-dynamic";

async function cronHandler(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const now = Date.now();

  // 1) Oporavak izgubljenog callback-a: kartica pending >15 min → pitaj banku, ako je naplaćeno dodeli pristup.
  //    Puni prolaz, bez ograničenja starosti (brzi cron nestpay-poll pokriva poslednja 24h na 15 min).
  const { checked, reconciled, answers } = await reconcilePendingCards(admin, { nowMs: now });

  // Banka nije odgovorila ni „jeste" ni „nije": upit je pao ili porudžbina nije stigla na red.
  // Takva porudžbina u koraku 2 ne sme da dobije mejl/otkazivanje - vidi komentar tamo.
  const neodgovoreno = [...answers.values()].filter((a) => a === "unknown").length;
  if (neodgovoreno > 0) {
    Sentry.captureException(
      new Error(`[nestpay] banka nije odgovorila na ${neodgovoreno} upit(a) o statusu - podsetnici preskočeni`)
    );
  }

  // 2) Sekvenca povraćaja (abandoned cart) - mašina stanja po recovery_stage:
  //    mejl1 (1h) → mejl2 (3 dana) → otkazivanje + mejl (7 dana). Ako je polaznik prešao na drugi
  //    način plaćanja / platio isti kurs, mejlovi se preskaču, a mrtva porudžbina se tiho otkaže posle 7 dana.
  const { data: candidates } = await admin
    .from("orders")
    .select("id, order_number, email, full_name, items, created_at, recovery_stage")
    .in("payment_method", ["kartica", "kartica_rate"])
    .eq("payment_status", "pending")
    .lt("recovery_stage", 3)
    .limit(100);

  const counts = { mejl1: 0, mejl2: 0, cancel: 0, cancelSilent: 0 };
  for (const o of candidates ?? []) {
    const courseSlug = slugOf(o.items);
    const courseTitle = titleOf(o.items);
    if (!courseSlug || !o.email || !o.order_number) continue; // bez slug-a/mejla/broja nema korisnog linka

    const { data: others } = await admin
      .from("orders")
      .select("order_number, created_at, payment_status, items")
      .eq("email", o.email);
    const otherOrders = (others ?? []).map((x) => ({
      order_number: x.order_number,
      created_at: x.created_at,
      payment_status: x.payment_status,
      courseSlug: slugOf(x.items),
    }));

    const action = recoveryAction(
      { order_number: o.order_number, created_at: o.created_at, recovery_stage: o.recovery_stage ?? 0, courseSlug },
      otherOrders,
      now
    );
    const mail = { email: o.email, fullName: o.full_name ?? "", courseTitle, courseSlug, orderNumber: o.order_number };

    // „Nije ti ništa naplaćeno" i otkazivanje su tvrdnje o novcu: šaljemo ih samo kad je
    // banka u koraku 1 izričito rekla da naplate nema. Ako je upit pao (unknown), ćutimo
    // i čekamo sledeći prolaz - inače kupac koji je upravo platio dobije poruku da nije.
    // (cancel-silent nije tvrdnja - polaznik je već platio drugačije, samo zatvaramo mrtav red.)
    if (action !== "cancel-silent" && answers.get(o.id) !== "not-charged") continue;

    if (action === "mejl1") {
      await sendCardRetryEmail(mail);
      await admin.from("orders").update({ recovery_stage: 1, recovery_email_sent_at: new Date().toISOString() }).eq("id", o.id);
      counts.mejl1++;
    } else if (action === "mejl2") {
      await sendCardReminder2Email(mail);
      await admin.from("orders").update({ recovery_stage: 2 }).eq("id", o.id);
      counts.mejl2++;
    } else if (action === "cancel") {
      await sendOrderCancelledEmail(mail);
      await admin.from("orders").update({ recovery_stage: 3, payment_status: "cancelled" }).eq("id", o.id);
      counts.cancel++;
    } else if (action === "cancel-silent") {
      // Polaznik je platio/prešao na drugi način - samo zatvori mrtvu porudžbinu, bez mejla.
      await admin.from("orders").update({ recovery_stage: 3, payment_status: "cancelled" }).eq("id", o.id);
      counts.cancelSilent++;
    }
  }

  // 3) Podsetnici za uplatnicu/PayPal koji čekaju uplatu - mejl1 (3 dana) → mejl2 (8 dana).
  //    BEZ automatskog otkazivanja (uplata je možda već poslata - odluku donosi admin);
  //    izuzetak: ako je isti kurs plaćen drugačije / postoji novija narudžbina, tiho se zatvori.
  const { data: uplate } = await admin
    .from("orders")
    .select("id, order_number, email, full_name, items, total, created_at, recovery_stage, recovery_email_sent_at, payment_method")
    .in("payment_method", ["uplatnica", "paypal"])
    .eq("payment_status", "pending")
    .lt("recovery_stage", 3)
    .limit(100);

  const uplCounts = { uplMejl1: 0, uplMejl2: 0, uplCancelSilent: 0 };
  for (const o of uplate ?? []) {
    const courseSlug = slugOf(o.items);
    const courseTitle = titleOf(o.items);
    if (!courseSlug || !o.email || !o.order_number) continue;

    const { data: others } = await admin
      .from("orders")
      .select("order_number, created_at, payment_status, items")
      .eq("email", o.email);
    const otherOrders = (others ?? []).map((x) => ({
      order_number: x.order_number,
      created_at: x.created_at,
      payment_status: x.payment_status,
      courseSlug: slugOf(x.items),
    }));

    const action = uplataReminderAction(
      { order_number: o.order_number, created_at: o.created_at, recovery_stage: o.recovery_stage ?? 0, courseSlug, recovery_email_sent_at: o.recovery_email_sent_at },
      otherOrders,
      now
    );
    if (action === "none") continue;

    if (action === "cancel-silent") {
      await admin.from("orders").update({ recovery_stage: 3, payment_status: "cancelled" }).eq("id", o.id);
      uplCounts.uplCancelSilent++;
      continue;
    }

    const stage = action === "mejl1" ? 1 : 2;
    const isUplatnica = o.payment_method === "uplatnica";
    await sendUplataReminderEmail({
      email: o.email,
      fullName: o.full_name ?? "",
      courseTitle,
      courseSlug,
      orderNumber: o.order_number,
      totalRsd: o.total,
      paymentMethod: isUplatnica ? "uplatnica" : "paypal",
      stage,
      paypalEur: isUplatnica ? undefined : calculatePaypalEur(o.total),
      ipsQrUrl: isUplatnica
        ? (await generateIpsQrUrl(admin, { total: o.total, order_number: o.order_number })) ?? undefined
        : undefined,
    });
    await admin.from("orders").update({
      recovery_stage: stage,
      ...(stage === 1 ? { recovery_email_sent_at: new Date().toISOString() } : {}),
    }).eq("id", o.id);
    if (stage === 1) uplCounts.uplMejl1++; else uplCounts.uplMejl2++;
  }

  // 4) Fiskalizacija retry: uspela naplata + pala fiskalizacija = completed bez fiskalnog broja.
  //    Takva porudžbina je do sada bila NEVIDLJIVA (korak 1 hvata samo pending). Samo skorašnje
  //    (needsFiscalRetry: >30 min, <7 dana, total>0) — istorijske/migrirane se ne fiskalizuju naknadno.
  const fiscalCutoff = new Date(now - 7 * 86400000).toISOString();
  const { data: fiscalGaps } = await admin
    .from("orders")
    .select("id, order_number, payment_status, payment_method, fiscal_referent_number, total, created_at")
    .eq("payment_status", "completed")
    .in("payment_method", ["kartica", "kartica_rate"])
    .is("fiscal_referent_number", null)
    .gte("created_at", fiscalCutoff)
    .limit(20);

  let fiscalRetried = 0, fiscalFailed = 0;
  for (const o of fiscalGaps ?? []) {
    if (!needsFiscalRetry(o, now)) continue;
    const r = await fiscalizeOrder(o.id);
    if (r.ok) fiscalRetried++;
    else {
      fiscalFailed++;
      Sentry.captureException(new Error(`[fiscomm] retry fiskalizacije pao za order ${o.order_number}: ${r.error}`));
    }
  }

  return NextResponse.json({ checked, reconciled, neodgovoreno, ...counts, ...uplCounts, fiscalRetried, fiscalFailed });
}

export const GET = withCronLog("nestpay-reconcile", cronHandler);
