// src/lib/subscription-charges.ts
// Pretvaranje naplata iz odgovora banke u porudžbine. Svaka naplata = obična
// porudžbina, pa se nasleđuje fiskalizacija, dodela pristupa i mejlovi.
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildChargeRetryXml,
  isRecurringOpApproved,
  postCc5,
  type NestpayEnv,
  type RecurringCharge,
} from "@/lib/nestpay-recurring";
import { grantAccessForOrder } from "@/lib/grant-access";
import { fiscalizeOrder } from "@/lib/fiscomm";
import { generateOrderNumber } from "@/lib/order-utils";
import { sendSubscriptionRetryEmail } from "@/lib/email";

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

/**
 * Bankina granica (potvrda 22.07.2026): pala naplata sme ponovo da se inicira
 * najviše jednom dnevno, ukupno do 30 puta. Brojač važi po naplati.
 */
export const MAX_RETRIES = 30;

/** Kalendarski datum u Beogradu (YYYY-MM-DD) - banka radi po lokalnom vremenu. */
export function belgradeDate(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Belgrade" });
}

/**
 * Pokušaj se zakazuje za SUTRA: današnji termin serije je možda već prošao
 * (cron ide u 5h, a serija se obrađuje u satu inicijalne kupovine).
 */
export function retryStartDate(now: Date): string {
  return belgradeDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));
}

export interface RetryState {
  retry_oid: string | null;
  retry_count: number;
  retry_planned_for: string | null;
}

export type RetryAction = "none" | "wait" | "exhausted" | "retry";

/**
 * Da li danas šaljemo Update za palu naplatu. „wait" dok zakazani datum ne prođe:
 * ne znamo da li banka posle Update-a odmah vrati TRANS_STAT na PN, pa bi slanje
 * pre toga svakog dana iznova pomeralo STARTDATE i naplata se nikad ne bi ni
 * pokušala. Nova pala naplata (drugi oid) kreće sa brojačem od nule.
 */
export function retryDecision(state: RetryState, pala: RecurringCharge | undefined, danasBeograd: string): RetryAction {
  if (!pala) return "none";
  if (state.retry_oid === pala.oid) {
    if (state.retry_count >= MAX_RETRIES) return "exhausted";
    if (state.retry_planned_for && danasBeograd <= state.retry_planned_for) return "wait";
  }
  return "retry";
}

/**
 * Ponovo inicira prvu palu naplatu serije (RECURRINGOPERATION=Update + STARTDATE,
 * priručnik pogl. 7). Kupcu se javlja mejlom samo kod PRVOG pokušaja - ne 30 puta.
 * Kad uspe, sledeći poll je pokupi kao običnu uspelu naplatu (processCharge).
 */
export async function maybeRetryFailedCharge(
  sub: SubscriptionRow & RetryState,
  charges: RecurringCharge[],
  env: NestpayEnv = "prod",
  now: Date = new Date(),
): Promise<RetryAction | "error"> {
  const pala = charges.find((c) => c.retryable);
  const odluka = retryDecision(sub, pala, belgradeDate(now));
  if (odluka !== "retry" || !pala) return odluka;

  const startDate = retryStartDate(now);
  const odgovor = await postCc5(buildChargeRetryXml(pala.oid, startDate, env), env);
  if (!odgovor || !isRecurringOpApproved(odgovor)) {
    Sentry.captureException(
      new Error(`[pretplata] ponovno iniciranje ${pala.oid} nije prošlo: ${odgovor?.slice(0, 300) ?? "banka nije odgovorila"}`),
    );
    return "error";
  }

  const prviPut = sub.retry_oid !== pala.oid;
  const noviBroj = prviPut ? 1 : sub.retry_count + 1;
  const admin = createAdminClient();
  await admin
    .from("subscriptions")
    .update({
      retry_oid: pala.oid,
      retry_count: noviBroj,
      last_retry_at: now.toISOString(),
      retry_planned_for: startDate,
    })
    .eq("id", sub.id);

  if (prviPut) {
    const { data: prva } = await admin
      .from("orders")
      .select("email, full_name, items")
      .eq("id", sub.initial_order_id)
      .single();
    if (prva) {
      const items = prva.items as { title?: string }[] | null;
      await sendSubscriptionRetryEmail({
        email: prva.email,
        name: prva.full_name,
        courseTitle: items?.[0]?.title ?? "kurs",
        installmentNo: pala.installmentNo,
        totalPayments: sub.total_payments,
        amount: sub.amount,
      });
    }
  }
  if (noviBroj >= MAX_RETRIES) {
    Sentry.captureException(
      new Error(`[pretplata] zakazan poslednji (${MAX_RETRIES}.) pokušaj naplate ${pala.oid} - ako ne prođe, javiti se kupcu ručno`),
    );
  }
  return "retry";
}
