import type { GrupaRaspored } from "./raspored";

export const DAY_LABELS: Record<number, string> = {
  1: "pon", 2: "uto", 3: "sre", 4: "čet", 5: "pet", 6: "sub", 7: "ned",
};

export function formatDays(days: number[] | null): string {
  if (!days || !days.length) return "";
  return days.map((d) => DAY_LABELS[d] ?? "").filter(Boolean).join(", ");
}

export function formatPocetak(d: string | null): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

const YEAR_MS = 365 * 86400000;
// Vrati ms roka: max(postojeći, danas+365) — nikad ne skraćuje.
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
}

export interface OpenGroupRow { id: string; level: string; status: string; start_date: string | null; }

/** Otvorena grupa za nivo, sa najranijim start_date. null ako ne postoji. */
export function pickOpenGroupForNivo<T extends OpenGroupRow>(groups: T[], nivo: string): T | null {
  const open = groups.filter((g) => g.level === nivo && g.status === "otvoren");
  if (!open.length) return null;
  // Grupa bez datuma ne pobeđuje datiranu (sentinel u daleku budućnost). slice() da ne mutiramo ulaz.
  return open.slice().sort((a, b) => (a.start_date ?? "9999-12-31").localeCompare(b.start_date ?? "9999-12-31"))[0];
}

/**
 * Svi datumi časova: od start_date, na zadate dane (1=pon..7=ned), ukupno weeks×dani časova.
 * Vraća niz "yyyy-mm-dd" (prazan ako nema dovoljno podataka).
 */
export function computeSessionDates(startDate: string | null, days: number[] | null, weeks: number | null): string[] {
  if (!startDate || !days?.length || !weeks) return [];
  const total = weeks * days.length;
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
export function computeEndDate(startDate: string | null, days: number[] | null, weeks: number | null): string | null {
  const dates = computeSessionDates(startDate, days, weeks);
  return dates.length ? dates[dates.length - 1] : null;
}

export function mapGroupToRaspored(g: GroupRowForDisplay, profName: string, activeEnrollments: number): GrupaRaspored {
  const seats = computeSeats({ maxSeats: g.max_seats, manualEnrolled: g.manual_enrolled, activeEnrollments });
  return {
    nivo: g.level,
    prof: profName,
    status: STATUS_LABEL[g.status] ?? g.status,
    pocetak: formatPocetak(g.start_date),
    trajanje: g.duration_weeks != null ? String(g.duration_weeks) : "",
    dani: formatDays(g.days),
    sat: g.session_time ?? "",
    maks: String(g.max_seats),
    upisanih: String(seats.enrolled),
    slobodnih: String(seats.slobodnih),
    full: seats.full,
  };
}
