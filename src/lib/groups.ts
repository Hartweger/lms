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
