export const EUR_RATE = 117;
export const PAYPAL_SURCHARGE = 0.12;

export const BANK_DETAILS = {
  primalac: "Hartweger, Beograd, 11070 Beograd",
  racun: "170-10559767000-18",
  sifraPalcanja: "189",
  model: "",
};

export const PAYPAL_ME_URL = "https://www.paypal.com/paypalme/natasahartweger1";

// IPS QR string (NBS standard) za uplatnicu — isti format kao na hvala stranici. Pure string.
export function buildIpsString(o: { total: number; order_number: string }): string {
  return [
    "K:PR", "V:01", "C:1",
    `R:${BANK_DETAILS.racun}`,
    `N:${BANK_DETAILS.primalac}`,
    `I:RSD${Number(o.total).toFixed(2)}`,
    `P:Placanje porudzbine #${o.order_number}`,
    `SF:${BANK_DETAILS.sifraPalcanja}`,
    `RO:${o.order_number}`,
  ].join("|");
}

export async function generateOrderNumber(): Promise<string> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const year = new Date().getFullYear();
  const startOfYear = `${year}-01-01T00:00:00.000Z`;
  const endOfYear = `${year + 1}-01-01T00:00:00.000Z`;

  // MAX(sequence)+1, ne COUNT+1 — count-based numerisanje puca na svako brisanje/otkazivanje
  // ordera (gap u count-u → kolizija sa postojećim order_number, UNIQUE violation).
  const { data: last, error } = await supabase
    .from("orders")
    .select("order_number")
    .gte("created_at", startOfYear)
    .lt("created_at", endOfYear)
    .order("order_number", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Failed to generate order number: ${error.message}`);
  }

  let nextSeq = 1;
  if (last && last.length > 0) {
    const m = String(last[0].order_number).match(/-(\d+)$/);
    if (m) nextSeq = parseInt(m[1], 10) + 1;
  }

  const seq = nextSeq.toString().padStart(3, "0");
  return `${year}-${seq}`;
}

export function calculatePaypalEur(priceRsd: number): number {
  return Math.ceil((priceRsd / EUR_RATE) * (1 + PAYPAL_SURCHARGE));
}

// Narudžbina se sme obrisati samo ako još ništa nije "krenulo": nije potvrđena
// i nije dodeljen pristup. Potvrđene narudžbine se stornitaju (Fiscomm), ne brišu.
export function canDeleteOrder(order: { payment_status: string; granted: boolean }): boolean {
  return order.payment_status === "pending" && order.granted === false;
}

// Zbir iznosa po statusu — za finansijski pregled na vrhu liste.
export function orderTotals(
  orders: { payment_status: string; total: number }[]
): { confirmed: number; pending: number } {
  return orders.reduce(
    (acc, o) => {
      if (o.payment_status === "completed") acc.confirmed += o.total;
      else if (o.payment_status === "pending") acc.pending += o.total;
      return acc;
    },
    { confirmed: 0, pending: 0 }
  );
}

// "na" = nema računa (pending), "ok" = fiskalizovano, "missing" = potvrđeno ali račun nije izdat.
export function orderFiscalStatus(order: {
  payment_status: string;
  fiscalized_at: string | null;
}): "na" | "ok" | "missing" {
  if (order.payment_status !== "completed") return "na";
  return order.fiscalized_at ? "ok" : "missing";
}

// Posle koliko minuta započetu-a nezavršenu karticu tretiramo kao "nije prošlo".
export const CARD_INCOMPLETE_MINUTES = 15;

/**
 * Klasifikuje narudžbinu koja je još `pending`, da admin vidi ŠTA se desilo sa karticom:
 *  - "declined"   → banka odbila karticu (nestpay_status="failed")
 *  - "incomplete" → kartica započeta ali nikad završena (nema callback-a, starija od praga)
 *  - "waiting"    → normalno čeka (uplatnica/PayPal, ili sveža kartica još u toku)
 * Vraća null ako narudžbina nije pending. `nowMs` se prosleđuje radi testabilnosti.
 */
export function pendingPaymentState(
  order: {
    payment_status: string;
    payment_method: string;
    nestpay_status: string | null;
    created_at: string;
  },
  nowMs: number
): "declined" | "incomplete" | "waiting" | null {
  if (order.payment_status !== "pending") return null;
  const isCard = order.payment_method === "kartica" || order.payment_method === "kartica_rate";
  if (!isCard) return "waiting"; // uplatnica/PayPal — normalno čeka uplatu
  if (order.nestpay_status === "failed") return "declined";
  if (order.nestpay_status === "charged") return "waiting"; // čeka grant (callback stigao, pristup samo što nije)
  const ageMin = (nowMs - new Date(order.created_at).getTime()) / 60000;
  return ageMin >= CARD_INCOMPLETE_MINUTES ? "incomplete" : "waiting";
}

type RecoveryOrder = { order_number: string; created_at: string; payment_status: string; courseSlug: string };

/**
 * Da li slati recovery ("pokušaj ponovo") mejl za neuspelu kartičnu narudžbinu.
 * NE šalje ako je polaznik za ISTI kurs:
 *  - već platio (neka druga narudžbina = completed), ili
 *  - promenio način plaćanja (novija ili istovremena narudžbina — npr. kartica → uplatnica,
 *    kao Jelena Vrećo: kartica 14:35 → uplatnica 14:36).
 * `otherOrders` su ostale narudžbine istog polaznika (isti email).
 */
export function shouldSendRecovery(candidate: RecoveryOrder, otherOrders: RecoveryOrder[]): boolean {
  const candTime = new Date(candidate.created_at).getTime();
  for (const o of otherOrders) {
    if (o.order_number === candidate.order_number) continue;
    if (o.courseSlug !== candidate.courseSlug) continue;
    if (o.payment_status === "completed") return false; // platio na drugi način
    if (new Date(o.created_at).getTime() >= candTime) return false; // promenio način plaćanja
  }
  return true;
}

// Tajming sekvence povraćaja neuspele kartične kupovine.
export const RETRY1_MIN = 60;   // 1. mejl "pokušaj ponovo" — sat vremena posle
export const RETRY2_DAYS = 3;   // 2. podsetnik — 3 dana posle
export const CANCEL_DAYS = 7;   // otkazivanje + mejl — 7 dana posle porudžbine

export type RecoveryActionResult = "mejl1" | "mejl2" | "cancel" | "cancel-silent" | "none";

/**
 * Sledeći korak za neuspelu/nezavršenu kartičnu narudžbinu (mašina stanja po `recovery_stage` 0→3).
 * Ako je polaznik prešao na drugi način / platio (superseded): NE šalje mejlove, samo tiho otkaže
 * mrtvu porudžbinu posle CANCEL_DAYS. Inače: mejl1 (1h) → mejl2 (3d) → otkazivanje+mejl (7d).
 * Po jedan korak po pozivu (stage se uvećava), pa cron postepeno napreduje.
 */
export function recoveryAction(
  order: { created_at: string; recovery_stage: number; courseSlug: string; order_number: string },
  otherOrders: RecoveryOrder[],
  nowMs: number
): RecoveryActionResult {
  const ageMs = nowMs - new Date(order.created_at).getTime();
  const ageMin = ageMs / 60000;
  const ageDays = ageMs / 86400000;
  const stage = order.recovery_stage ?? 0;
  const superseded = !shouldSendRecovery(
    { order_number: order.order_number, created_at: order.created_at, payment_status: "pending", courseSlug: order.courseSlug },
    otherOrders
  );

  if (superseded) {
    return stage < 3 && ageDays >= CANCEL_DAYS ? "cancel-silent" : "none";
  }
  if (stage < 1 && ageMin >= RETRY1_MIN) return "mejl1";
  if (stage < 2 && ageDays >= RETRY2_DAYS) return "mejl2";
  if (stage < 3 && ageDays >= CANCEL_DAYS) return "cancel";
  return "none";
}
