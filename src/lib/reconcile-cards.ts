// src/lib/reconcile-cards.ts - server-to-server provera kartičnih porudžbina kod banke.
//
// NestPay 3d_pay_hosting rezultat plaćanja vraća POST-om kroz PRETRAŽIVAČ kupca (okUrl).
// Ako se pretraživač ne vrati - zatvoren tab, aplikacija banke ostane u prvom planu, pao
// mobilni internet - callback nikad ne stigne, pa porudžbina ostaje „pending" iako je
// kartica naplaćena: kupac nema ni pristup ni mejl, a novac je otišao. To se ne može
// popraviti na našoj strani, jedini lek je da sami pitamo banku i to dovoljno često
// (porudžbina 2026-311, 16.08.2026: naplaćeno ~14:05, pristup tek u 22:01 UTC).
import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { queryTransaction } from "@/lib/nestpay";
import { grantAccessForOrder } from "@/lib/grant-access";

/**
 * Šta je banka rekla za jednu porudžbinu u ovom prolazu:
 * - `charged` - naplaćeno (pristup je upravo dodeljen)
 * - `not-charged` - banka izričito kaže da naplate nema
 * - `unknown` - upit pao/nije obavljen; NE znamo ništa i ne smemo ništa da tvrdimo kupcu
 */
export type BankAnswer = "charged" | "not-charged" | "unknown";

/**
 * Porudžbina mlađa od ovoga se ne pita - kupac je verovatno još na 3D strani banke,
 * a i banka tek upisuje transakciju.
 */
export const MIN_AGE_MS = 15 * 60_000;

const DEFAULT_LIMIT = 100;

export interface ReconcileResult {
  checked: number;
  reconciled: number;
  /** id porudžbine → odgovor banke. Prazna mapa = ništa nije ni pitano. */
  answers: Map<string, BankAnswer>;
}

/**
 * Pita banku za status svake pending kartične porudžbine i dodeljuje pristup onima
 * koje su naplaćene. Bez mejlova i bez otkazivanja - to ostaje na pozivaocu.
 *
 * `maxAgeMs` ograničava prolaz na sveže porudžbine (brzi cron na 15 min gleda samo
 * poslednja 24h; puni prolaz 3x dnevno gleda sve, pa i zaostale).
 */
export async function reconcilePendingCards(
  admin: SupabaseClient,
  opts: { nowMs: number; maxAgeMs?: number; limit?: number }
): Promise<ReconcileResult> {
  let q = admin
    .from("orders")
    .select("id, order_number")
    .in("payment_method", ["kartica", "kartica_rate"])
    .eq("payment_status", "pending")
    .lt("created_at", new Date(opts.nowMs - MIN_AGE_MS).toISOString());
  if (opts.maxAgeMs) {
    q = q.gte("created_at", new Date(opts.nowMs - opts.maxAgeMs).toISOString());
  }

  const { data: pending, error } = await q.limit(opts.limit ?? DEFAULT_LIMIT);
  if (error) throw new Error(`[reconcile-cards] upit nad orders pao: ${error.message}`);

  const answers = new Map<string, BankAnswer>();
  let reconciled = 0;

  for (const o of pending ?? []) {
    // Kartične porudžbine uvek imaju broj; bez njega nema OID-a za upit banci.
    if (!o.order_number) {
      answers.set(o.id, "unknown");
      continue;
    }
    let res: Awaited<ReturnType<typeof queryTransaction>> = null;
    try {
      res = await queryTransaction(o.order_number);
    } catch (e) {
      // Bez hvatanja bi jedan mrežni prekid oborio ceo cron - i podsetnike i fiskalizaciju.
      console.error(`[reconcile-cards] upit banci pao za ${o.order_number}:`, e);
      Sentry.captureException(e);
    }
    if (!res) {
      answers.set(o.id, "unknown");
      continue;
    }
    if (res.procReturnCode !== "00") {
      answers.set(o.id, "not-charged");
      continue;
    }
    await admin.from("orders").update({ nestpay_status: "charged" }).eq("id", o.id);
    await grantAccessForOrder(o.id);
    answers.set(o.id, "charged");
    reconciled++;
  }

  return { checked: pending?.length ?? 0, reconciled, answers };
}
