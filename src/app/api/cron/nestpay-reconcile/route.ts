// src/app/api/cron/nestpay-reconcile/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queryTransaction } from "@/lib/nestpay";
import { grantAccessForOrder } from "@/lib/grant-access";
import { sendCardRetryEmail, sendCardReminder2Email, sendOrderCancelledEmail, sendUplataReminderEmail } from "@/lib/email";
import { recoveryAction, uplataReminderAction, calculatePaypalEur } from "@/lib/order-utils";
import { generateIpsQrUrl } from "@/lib/ips-qr";

function slugOf(items: unknown): string {
  return (Array.isArray(items) ? (items[0] as { course_slug?: string })?.course_slug : "") ?? "";
}
function titleOf(items: unknown): string {
  return (Array.isArray(items) ? (items[0] as { title?: string })?.title : "") || "kurs";
}

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createAdminClient();
  const now = Date.now();

  // 1) Oporavak izgubljenog callback-a: kartica pending >15 min → pitaj banku, ako je naplaćeno dodeli pristup.
  const cutoff = new Date(now - 15 * 60 * 1000).toISOString();
  const { data: pending } = await admin
    .from("orders").select("id, order_number, total")
    .in("payment_method", ["kartica", "kartica_rate"])
    .eq("payment_status", "pending")
    .lt("created_at", cutoff)
    .limit(50);

  let reconciled = 0;
  for (const o of pending ?? []) {
    const q = await queryTransaction(o.order_number);
    if (q?.procReturnCode === "00") {
      await admin.from("orders").update({ nestpay_status: "charged" }).eq("id", o.id);
      await grantAccessForOrder(o.id);
      reconciled++;
    }
  }

  // 2) Sekvenca povraćaja (abandoned cart) — mašina stanja po recovery_stage:
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
    if (!courseSlug || !o.email) continue; // bez slug-a/mejla nema korisnog linka

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
      // Polaznik je platio/prešao na drugi način — samo zatvori mrtvu porudžbinu, bez mejla.
      await admin.from("orders").update({ recovery_stage: 3, payment_status: "cancelled" }).eq("id", o.id);
      counts.cancelSilent++;
    }
  }

  // 3) Podsetnici za uplatnicu/PayPal koji čekaju uplatu — mejl1 (3 dana) → mejl2 (8 dana).
  //    BEZ automatskog otkazivanja (uplata je možda već poslata — odluku donosi admin);
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
    if (!courseSlug || !o.email) continue;

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

  return NextResponse.json({ checked: pending?.length ?? 0, reconciled, ...counts, ...uplCounts });
}
