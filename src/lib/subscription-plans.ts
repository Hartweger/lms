// src/lib/subscription-plans.ts
// Proizvodi koji se mogu platiti kroz mesečne naplate (NestPay recurring).
// Iznos je po RATI, ne ukupno: banka naplaćuje monthlyRsd × totalPayments.
// Granica od 121 naplate je bankina (greška CORE-2029 iznad toga).
export interface PlanUnlock {
  /** Rata sa kojom se nivo otvara. */
  installment: number;
  /** slug sadržajnog kursa iz `course_unlocks` */
  slug: string;
}

export interface SubscriptionPlan {
  slug: string;
  monthlyRsd: number;
  totalPayments: number;
  /**
   * Raspored otvaranja nivoa. Kod mesečnog plaćanja sadržaj se otvara kako rate
   * ulaze - bez toga bi jedna rata od 3.199 din nosila paket od 29.133 din.
   * Jednokratna kupovina i dalje otvara sve odmah.
   */
  unlocks: PlanUnlock[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // Video paket A1+A2+B1: jednokratno 29.133 RSD, mesečno 3.199 × 12 = 38.388 RSD.
  // Ritam (odluka 21.07.2026): jedan podnivo mesečno, pa mesec bez novog gradiva za
  // obnavljanje i završni ispit nivoa - meseci 3 (ispit A1), 6 (ispit A2) i 9-12
  // (obnavljanje B1 + priprema za zvanični ispit). Od 8. rate je sve otključano.
  {
    slug: "paket-a1-a2-b1",
    monthlyRsd: 3199,
    totalPayments: 12,
    unlocks: [
      { installment: 1, slug: "nemacki-a1-1" },
      { installment: 2, slug: "nemacki-a1-2" },
      { installment: 4, slug: "nemacki-a2-1" },
      { installment: 5, slug: "nemacki-a2-2" },
      { installment: 7, slug: "nemacki-b1-1" },
      { installment: 8, slug: "nemacki-b1-2" },
    ],
  },
];

export function planForSlug(slug: string): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS.find((p) => p.slug === slug) ?? null;
}

/**
 * Dokle važi pristup posle jedne naplate: do sledeće naplate + 7 dana zaliha.
 * Zahvaljujući tome prestanak plaćanja sam gasi pristup - nema oduzimanja.
 */
export function accessUntilForCharge(chargedAt: Date): Date {
  const d = new Date(chargedAt);
  d.setMonth(d.getMonth() + 1);
  d.setDate(d.getDate() + 7);
  return d;
}

/**
 * Iznos koji se naplaćuje SADA. Kod pretplate to je jedna rata, a ne puna cena -
 * banka će istu ratu naplatiti totalPayments puta.
 */
export function chargeAmountFor(paymentMethod: string, slug: string, fullPrice: number): number {
  if (paymentMethod !== "kartica_pretplata") return fullPrice;
  return planForSlug(slug)?.monthlyRsd ?? fullPrice;
}

/** Kursevi otvoreni posle `paidPayments` naplata, redom kako se otvaraju. */
export function unlockedSlugsAfter(plan: SubscriptionPlan, paidPayments: number): string[] {
  return plan.unlocks
    .filter((u) => u.installment <= paidPayments)
    .sort((a, b) => a.installment - b.installment)
    .map((u) => u.slug);
}
