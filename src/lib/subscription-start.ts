// src/lib/subscription-start.ts
// Upis pretplate posle uspešne PRVE naplate. Serijski broj (RECURRINGID) stiže
// u parametrima callbacka kao `EXTRA.RECURRINGID` (provereno na testu 20.07.2026)
// i jedini je ključ kojim kasnije dohvatamo rate 2-12 - bez njega serija je za nas
// nevidljiva, jer banka za naredne naplate ne šalje callback.
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { planForSlug } from "@/lib/subscription-plans";

export function recurringIdFromCallback(params: Record<string, string>): string | null {
  return params["EXTRA.RECURRINGID"] || params["RECURRINGID"] || null;
}

interface OrderRow {
  id: string;
  user_id: string;
  order_number: string;
  total: number;
  payment_method: string;
  items: unknown;
  subscription_id: string | null;
}

/** Idempotentno: ako porudžbina već ima pretplatu, ne radi ništa. */
export async function startSubscriptionForOrder(
  order: OrderRow,
  params: Record<string, string>,
): Promise<string | null> {
  if (order.payment_method !== "kartica_pretplata" || order.subscription_id) return null;

  const item = Array.isArray(order.items)
    ? (order.items[0] as { course_id?: string; course_slug?: string })
    : null;
  const plan = item?.course_slug ? planForSlug(item.course_slug) : null;
  const recurringId = recurringIdFromCallback(params);

  if (!plan || !item?.course_id || !recurringId) {
    // Naplata je prošla, a seriju ne možemo da pratimo - to mora da vidi čovek.
    Sentry.captureException(
      new Error(
        `[pretplata] Ne mogu da upišem pretplatu za ${order.order_number}: ` +
          `plan=${!!plan} course=${!!item?.course_id} recurringId=${recurringId ?? "null"}`,
      ),
    );
    return null;
  }

  const admin = createAdminClient();
  const nextCharge = new Date();
  nextCharge.setMonth(nextCharge.getMonth() + 1);

  const { data: sub, error } = await admin
    .from("subscriptions")
    .insert({
      user_id: order.user_id,
      course_id: item.course_id,
      initial_order_id: order.id,
      recurring_id: recurringId,
      base_oid: order.order_number,
      amount: order.total,
      total_payments: plan.totalPayments,
      paid_payments: 1,
      status: "active",
      next_charge_at: nextCharge.toISOString(),
    })
    .select("id")
    .single();

  if (error || !sub) {
    Sentry.captureException(new Error(`[pretplata] upis pao za ${order.order_number}: ${error?.message}`));
    return null;
  }

  await admin
    .from("orders")
    .update({ subscription_id: sub.id, installment_no: 1, nestpay_oid: order.order_number })
    .eq("id", order.id);

  return sub.id;
}
