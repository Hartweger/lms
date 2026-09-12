// src/lib/partner-balance.ts
// Čist obračun za saradnika (afilijat kod). Broje se SAMO plaćene porudžbine:
// pending (odbijena kartica, neplaćena uplatnica) i refunded (storno) ne ulaze.
// Fee se čita sa porudžbine (snimak), ne sa saradnika.

export interface PartnerOrderLike {
  payment_status: string;
  partner_fee: number | null;
}

export interface PayoutLike {
  amount: number;
}

export interface PartnerBalance {
  upisane: number;
  pripada: number;
  isplaceno: number;
  saldo: number;
}

export function computePartnerBalance(orders: PartnerOrderLike[], payouts: PayoutLike[]): PartnerBalance {
  const placene = orders.filter((o) => o.payment_status === "completed");
  const pripada = placene.reduce((s, o) => s + (o.partner_fee ?? 0), 0);
  const isplaceno = payouts.reduce((s, p) => s + p.amount, 0);
  return { upisane: placene.length, pripada, isplaceno, saldo: pripada - isplaceno };
}
