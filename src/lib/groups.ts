import type { GrupaRaspored } from "./raspored";
import { nivoForSlug } from "@/lib/course-nivo";

export const DAY_LABELS: Record<number, string> = {
  1: "pon", 2: "uto", 3: "sre", 4: "čet", 5: "pet", 6: "sub", 7: "ned",
};

export function formatDays(days: number[] | null): string {
  if (!days || !days.length) return "";
  return days.map((d) => DAY_LABELS[d] ?? "").filter(Boolean).join(", ");
}

export const DAY_LABELS_FULL: Record<number, string> = {
  1: "Ponedeljak", 2: "Utorak", 3: "Sreda", 4: "Četvrtak",
  5: "Petak", 6: "Subota", 7: "Nedelja",
};

export function formatDaysFull(days: number[] | null): string {
  if (!days || !days.length) return "";
  return days.map((d) => DAY_LABELS_FULL[d] ?? "").filter(Boolean).join(", ");
}

export interface PurchasableCourseLite {
  id: string;
  slug: string;
  price: string | number | null; // numeric iz PostgREST-a stiže kao string
  paypal_price_eur: number | null;
}

/**
 * Kupovni kurs za grupu: prvo direktna veza (purchasable_course_id),
 * fallback po nivou preko SLUG_TO_NIVO (isti obrazac kao fillGroupCourseIds
 * u finansijama - grupe iz Sheet migracije nemaju popunjenu vezu).
 */
export function resolveGroupCourse(
  g: { level: string; purchasable_course_id: string | null },
  courses: PurchasableCourseLite[],
): PurchasableCourseLite | null {
  if (g.purchasable_course_id) {
    const byId = courses.find((c) => c.id === g.purchasable_course_id);
    if (byId) return byId;
  }
  return courses.find((c) => nivoForSlug(c.slug) === g.level) ?? null;
}

export function formatPocetak(d: string | null): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

const YEAR_MS = 365 * 86400000;
// Vrati ms roka: max(postojeći, danas+365) - nikad ne skraćuje.
export function nextExpiry(existingMs: number | null): number {
  const base = Date.now() + YEAR_MS;
  return existingMs != null && existingMs > base ? existingMs : base;
}

const STATUS_LABEL: Record<string, string> = {
  otvoren: "Otvoren za upis", uskoro: "Uskoro", u_toku: "U toku",
  zavrsena: "Završena", planiran: "Planiran", otkazana: "Otkazana",
};

export interface SeatInput { maxSeats: number; manualEnrolled: number | null; activeEnrollments: number; }
export interface SeatResult { enrolled: number; slobodnih: number; full: boolean; }

/** enrolled = osnova (manual_enrolled) + nove uplate (aktivni upisi). */
export function computeSeats({ maxSeats, manualEnrolled, activeEnrollments }: SeatInput): SeatResult {
  const enrolled = (manualEnrolled ?? 0) + activeEnrollments;
  return { enrolled, slobodnih: Math.max(0, maxSeats - enrolled), full: enrolled >= maxSeats };
}

export interface GroupRowForDisplay {
  level: string;
  status: string;
  start_date: string | null;
  duration_weeks: number | null;
  days: number[] | null;
  session_time: string | null;
  max_seats: number;
  manual_enrolled: number | null;
  sessions_count?: number | null;
}

export interface OpenGroupRow { id: string; level: string; status: string; start_date: string | null; }

/** Otvorene grupe za nivo, sortirane po start_date rastuće. */
export function openGroupsForNivo<T extends OpenGroupRow>(groups: T[], nivo: string): T[] {
  // Grupa bez datuma ne pobeđuje datiranu (sentinel u daleku budućnost). slice() da ne mutiramo ulaz.
  return groups
    .filter((g) => g.level === nivo && g.status === "otvoren")
    .slice()
    .sort((a, b) => (a.start_date ?? "9999-12-31").localeCompare(b.start_date ?? "9999-12-31"));
}

/** Otvorena grupa za nivo, sa najranijim start_date. null ako ne postoji. */
export function pickOpenGroupForNivo<T extends OpenGroupRow>(groups: T[], nivo: string): T | null {
  return openGroupsForNivo(groups, nivo)[0] ?? null;
}

export interface OpenGroupSeatRow extends OpenGroupRow { max_seats: number; manual_enrolled: number | null; }

/**
 * Prva otvorena grupa za nivo KOJA IMA SLOBODNO MESTO (po start_date rastuće).
 * null kad su sve pune ili ih nema. Bez ovoga puna ranija grupa blokira prodaju
 * iako je sledeći termin već otvoren (A1.1, avgust 2026: 15.09 puna, 28.09 prazna).
 */
export function pickOpenGroupWithSeats<T extends OpenGroupSeatRow>(
  groups: T[],
  nivo: string,
  activeByGroupId: Record<string, number>,
): T | null {
  return (
    openGroupsForNivo(groups, nivo).find(
      (g) =>
        !computeSeats({
          maxSeats: g.max_seats,
          manualEnrolled: g.manual_enrolled,
          activeEnrollments: activeByGroupId[g.id] ?? 0,
        }).full,
    ) ?? null
  );
}

/**
 * Svi datumi časova: od start_date, na zadate dane (1=pon..7=ned), ukupno weeks×dani časova.
 * sessionsCount (groups.sessions_count) prepisuje ukupan broj - B2 nivoi imaju 8 ned × 2 dana
 * ali ukupno 15 časova (poslednja nedelja samo 1 čas).
 * Vraća niz "yyyy-mm-dd" (prazan ako nema dovoljno podataka).
 */
export function computeSessionDates(startDate: string | null, days: number[] | null, weeks: number | null, sessionsCount?: number | null): string[] {
  if (!startDate || !days?.length || !weeks) return [];
  const total = sessionsCount && sessionsCount > 0 ? sessionsCount : weeks * days.length;
  const jsDays = new Set(days.map((d) => (d === 7 ? 0 : d))); // 0=ned..6=sub
  const d = new Date(startDate + "T00:00:00Z");
  if (isNaN(d.getTime())) return [];
  const out: string[] = [];
  let guard = 0;
  while (out.length < total && guard < 1000) {
    if (jsDays.has(d.getUTCDay())) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
    guard++;
  }
  return out;
}

/**
 * Datum poslednjeg časa (yyyy-mm-dd) ili null. Izveden iz computeSessionDates.
 */
export function computeEndDate(startDate: string | null, days: number[] | null, weeks: number | null, sessionsCount?: number | null): string | null {
  const dates = computeSessionDates(startDate, days, weeks, sessionsCount);
  return dates.length ? dates[dates.length - 1] : null;
}

/**
 * Datum PRVOG ČASA (yyyy-mm-dd) - ono što polaznik vidi kao „Sledeći termin".
 * start_date je početak nedelje u kojoj grupa kreće i ne mora da padne na dan nastave:
 * A1.1 (avgust 2026) ima start_date pon 10.08, a nastavu uto+čet - prvi čas je 11.08.
 * Fallback na start_date kad nemamo dane/trajanje (grupe iz Sheet migracije).
 */
export function computeFirstSessionDate(startDate: string | null, days: number[] | null, weeks: number | null, sessionsCount?: number | null): string | null {
  return computeSessionDates(startDate, days, weeks, sessionsCount)[0] ?? startDate;
}

/** Današnji datum u Beogradu (yyyy-mm-dd) - „u toku" se meri po lokalnom danu, ne po UTC. */
export function danasBeograd(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(now);
}

export interface GrupaProgres {
  /** Bar jedan čas je iza nas - grupa više ne „počinje", nego traje. */
  uToku: boolean;
  /** Prvi čas od danas naviše (yyyy-mm-dd), null kad ih više nema. */
  sledeciCas: string | null;
  ukupno: number;
  preostalo: number;
}

/**
 * Napredak grupe iz datuma časova. Današnji čas se broji kao preostao (još nije
 * održan), pa je i on „sledeći". Grupa otvorena za naknadni upis ima start_date u
 * prošlosti - tada se polazniku prikazuje sledeći čas, ne datum početka.
 */
export function computeGrupaProgres(sessionDates: string[], today: string): GrupaProgres {
  const sorted = [...sessionDates].sort();
  const preostali = sorted.filter((d) => d >= today);
  return {
    uToku: sorted.length > 0 && preostali.length < sorted.length,
    sledeciCas: preostali[0] ?? null,
    ukupno: sorted.length,
    preostalo: preostali.length,
  };
}

export interface RasporedProgresInput {
  /** Datumi ne-otkazanih časova iz group_sessions. Bez njih se izvode iz rasporeda. */
  sessionDates?: string[] | null;
  today?: string;
}

export function mapGroupToRaspored(
  g: GroupRowForDisplay,
  profName: string,
  activeEnrollments: number,
  course?: PurchasableCourseLite | null,
  progresInput?: RasporedProgresInput,
): GrupaRaspored {
  const seats = computeSeats({ maxSeats: g.max_seats, manualEnrolled: g.manual_enrolled, activeEnrollments });
  const sessionDates = progresInput?.sessionDates?.length
    ? progresInput.sessionDates
    : computeSessionDates(g.start_date, g.days, g.duration_weeks, g.sessions_count);
  const progres = computeGrupaProgres(sessionDates, progresInput?.today ?? danasBeograd());
  return {
    nivo: g.level,
    prof: profName,
    status: STATUS_LABEL[g.status] ?? g.status,
    pocetak: formatPocetak(computeFirstSessionDate(g.start_date, g.days, g.duration_weeks, g.sessions_count)),
    uToku: progres.uToku,
    sledeciCas: formatPocetak(progres.sledeciCas),
    ukupnoCasova: progres.ukupno,
    preostaloCasova: progres.preostalo,
    trajanje: g.duration_weeks != null ? String(g.duration_weeks) : "",
    dani: formatDays(g.days),
    daniPuni: formatDaysFull(g.days),
    sat: g.session_time ?? "",
    maks: String(g.max_seats),
    upisanih: String(seats.enrolled),
    slobodnih: String(seats.slobodnih),
    full: seats.full,
    checkoutSlug: course?.slug ?? null,
    cena: course?.price != null ? Number(course.price) : null,
    cenaEur: course?.paypal_price_eur ?? null,
  };
}

/**
 * Naknadni upis: grupa koja je već počela, a namerno je vraćena na "otvoren"
 * da bi primala nove polaznike u toku.
 *
 * Bez ovoga bi je noćni cron close-groups sledeće jutro vratio na "u_toku"
 * (jer joj je start_date u prošlosti), pa bi nestala sa /raspored i stranice
 * kursa - usred kampanje koja na nju šalje ljude.
 *
 * Vraća true kad zastavicu treba upaliti, false kad je treba ugasiti,
 * null kad status ne dira upis (npr. menja se samo termin).
 */
export function naknadniUpisZaStatus(
  status: string | undefined,
  startDate: string | null | undefined,
  today: string,
): boolean | null {
  if (!status) return null;
  if (status === "otvoren") return Boolean(startDate) && startDate! < today;
  // svaki drugi status (u_toku, zavrsena, otkazana, planiran, uskoro) gasi zastavicu
  return false;
}
