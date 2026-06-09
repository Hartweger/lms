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
