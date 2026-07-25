// src/lib/subscription-cancel-reason.ts
// Razlog otkazivanja mesečnog plaćanja. Pita se u trenutku odluke („Moj nalog"),
// jer se kasnije ne može rekonstruisati - a bez njega ne znamo da li ljudi odlaze
// zbog cene, vremena ili tempa. Odgovor je dobrovoljan: preskočeno pitanje je i
// samo podatak, zato parser vraća null umesto da puca.
export const CANCEL_REASONS = [
  { key: "skupo", label: "Preskupo mi je" },
  { key: "vreme", label: "Nemam vremena" },
  { key: "tempo", label: "Ne odgovara mi tempo" },
  { key: "zavrsio", label: "Završio/la sam ono što sam hteo/la" },
] as const;

export type CancelReasonKey = (typeof CANCEL_REASONS)[number]["key"];

/** Prihvata samo ključeve iz liste - sve ostalo je null (nije upisano). */
export function parseCancelReason(value: unknown): CancelReasonKey | null {
  if (typeof value !== "string") return null;
  return CANCEL_REASONS.find((r) => r.key === value)?.key ?? null;
}

/** Za izveštaje: nepoznat ili nepostojeći ključ se čita kao „bez odgovora". */
export function cancelReasonLabel(key: string | null): string {
  return CANCEL_REASONS.find((r) => r.key === key)?.label ?? "bez odgovora";
}
