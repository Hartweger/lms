/**
 * Vremenski prozor za kupone obnove (`renewal_only`, npr. OBNOVI50).
 *
 * Do 07.08.2026. kod je važio bez ikakvog roka - proveravalo se samo da li mejl
 * poseduje kurs, nikad kada mu pristup ističe. Zbog toga je pola cene mogao da
 * uzme i onaj kome pristup traje još 11 meseci (350 polaznika), kao i onaj ko je
 * pauzirao godinu dana pa se vratio. Popust je vezan za TRENUTAK OBNOVE:
 * otvara se `renewal_days_before` dana pre isteka (kad ionako ide podsetnik) i
 * zatvara `renewal_days_after` dana posle. Ko je van roka ne kupuje jeftinije,
 * ali ni ne gubi ništa - napredak ostaje, kurs se kupuje po redovnoj ceni.
 *
 * Prozor je opcion: kupon bez podešenih kolona radi kao i pre.
 */

export type RenewalWindowStatus =
  | { ok: true }
  | { ok: false; reason: "prerano" | "kasno" | "bez_isteka"; expiresAt: string | null };

const DAN_MS = 24 * 60 * 60 * 1000;

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function renewalWindowStatus(
  expiresAt: string | Date | null,
  now: Date,
  daysBefore: number | null,
  daysAfter: number | null
): RenewalWindowStatus {
  if (daysBefore == null && daysAfter == null) return { ok: true };

  // Trajan pristup (`expires_at IS NULL`, 22 polaznika) nema šta da obnovi.
  if (expiresAt == null) return { ok: false, reason: "bez_isteka", expiresAt: null };

  const istek = new Date(iso(expiresAt)).getTime();
  const sada = now.getTime();

  if (daysBefore != null && sada < istek - daysBefore * DAN_MS) {
    return { ok: false, reason: "prerano", expiresAt: iso(expiresAt) };
  }
  if (daysAfter != null && sada > istek + daysAfter * DAN_MS) {
    return { ok: false, reason: "kasno", expiresAt: iso(expiresAt) };
  }
  return { ok: true };
}

function datum(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("sr-Latn-RS", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Poruka koju polaznik vidi u checkoutu kad je van prozora - objašnjenje, ne odbijanje. */
export function renewalWindowMessage(
  status: Extract<RenewalWindowStatus, { ok: false }>,
  daysBefore: number | null,
  daysAfter: number | null
): string {
  if (status.reason === "bez_isteka") {
    return "Tvoj pristup ovom kursu ne ističe, pa kod za obnovu nije potreban.";
  }
  if (status.reason === "prerano") {
    return `Kod za obnovu se otvara ${daysBefore} dana pre isteka pristupa. Tvoj pristup važi do ${datum(status.expiresAt)} - podsetnik sa kodom stiže ti na mejl na vreme.`;
  }
  return `Pristup ti je istekao ${datum(status.expiresAt)}, a kod za obnovu važi ${daysAfter} dana posle isteka. Kurs možeš kupiti po redovnoj ceni - sav tvoj napredak je sačuvan i vraća ti se čim obnoviš.`;
}
