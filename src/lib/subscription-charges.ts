// src/lib/subscription-charges.ts
// Pretvaranje naplata iz odgovora banke u porudžbine. Svaka naplata = obična
// porudžbina, pa se nasleđuje fiskalizacija, dodela pristupa i mejlovi.
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RecurringCharge } from "@/lib/nestpay-recurring";
import { grantAccessForOrder } from "@/lib/grant-access";
import { fiscalizeOrder } from "@/lib/fiscomm";
import { generateOrderNumber } from "@/lib/order-utils";

/** Uspele naplate kojima još nemamo porudžbinu (poredi se po broju kod banke). */
export function chargesToProcess(charges: RecurringCharge[], vecObradjeni: string[]): RecurringCharge[] {
  const set = new Set(vecObradjeni);
  return charges.filter((c) => c.succeeded && !set.has(c.oid));
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  base_oid: string;
  amount: number;
  total_payments: number;
  initial_order_id: string;
}

/**
 * Pravi porudžbinu za jednu ratu i pokreće standardni lanac (pristup → fiskalni
 * račun). Idempotentno: `orders.nestpay_oid` je unique, pa dupli prolaz pada na
 * insertu i tiho se preskače.
 */
export async function processCharge(sub: SubscriptionRow, charge: RecurringCharge): Promise<boolean> {
  const admin = createAdminClient();

  // Podaci se preuzimaju sa prve porudžbine - ista polaznica, isti kurs, isti iznos.
  const { data: prva } = await admin
    .from("orders")
    .select("email, full_name, country, items, user_id, subtotal")
    .eq("id", sub.initial_order_id)
    .single();
  if (!prva) return false;

  const orderNumber = await generateOrderNumber();
  const iznos = charge.amountRsd ?? sub.amount;
  const { data: novi, error } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: prva.user_id,
      email: prva.email,
      full_name: prva.full_name,
      country: prva.country,
      items: prva.items,
      subtotal: iznos,
      discount: 0,
      total: iznos,
      payment_method: "kartica_pretplata",
      payment_status: "pending",
      nestpay_status: "charged",
      subscription_id: sub.id,
      installment_no: charge.installmentNo,
      nestpay_oid: charge.oid,
    })
    .select("id, order_number")
    .single();

  if (error || !novi) {
    // 23505 = unique violation → ovu ratu smo već obradili, sve u redu.
    if ((error as { code?: string } | null)?.code === "23505") return false;
    Sentry.captureException(new Error(`[pretplata] upis rate ${charge.oid} pao: ${error?.message}`));
    return false;
  }

  const grant = await grantAccessForOrder(novi.id);
  if (!grant.ok) {
    Sentry.captureException(
      new Error(`[pretplata] PLAĆENO-A-NEMA-PRISTUP: rata ${charge.oid} (order ${novi.order_number}): ${grant.error}`),
    );
  }
  await fiscalizeOrder(novi.id);

  await admin
    .from("subscriptions")
    .update({ paid_payments: charge.installmentNo })
    .eq("id", sub.id);

  return true;
}
