// Čista logika za prikaz napretka polaznika na platformi u profesorskom panelu.
// Bez Supabase/React zavisnosti — lako testirati.

export type PlatformaTon = "green" | "amber" | "red";

export interface PlatformaBadge {
  label: string;
  tone: PlatformaTon;
}

export interface PlatformaBadgeInput {
  hasPlatform: boolean;       // ima li polaznik pristup platformi (course_access)
  completedCount: number;     // broj završenih lekcija u relevantnom kursu
  lastActivity: string | null; // ISO datum poslednje završene lekcije
  now: Date;
}

const DAN_MS = 24 * 60 * 60 * 1000;

// Badge aktivnosti. null => ne prikazuj ništa (nema platforme).
export function platformaBadge(input: PlatformaBadgeInput): PlatformaBadge | null {
  const { hasPlatform, completedCount, lastActivity, now } = input;
  if (!hasPlatform) return null;
  if (completedCount === 0 || !lastActivity) return { label: "nije počeo", tone: "red" };

  const dana = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / DAN_MS);
  if (dana <= 7) return { label: "aktivna", tone: "green" };
  if (dana <= 14) return { label: `${dana}d`, tone: "amber" };
  return { label: `${dana}d`, tone: "red" };
}

// Tekst napretka: "X/Y lekcija" kad je ukupan broj poznat, inače "X lekcija".
export function napredakLekcije(completed: number, total: number | null): string {
  if (total && total > 0) return `${completed}/${total} lekcija`;
  return `${completed} lekcija`;
}

// Grejs-period: "nije počeo" se flaguje tek kad pristup traje duže od ovoliko dana
// (da se sveži upisi ne prijavljuju kao zapostavljeni).
export const NIJE_POCEO_GRACE_DANA = 7;

export interface TrebaPaznjuInput {
  hasPlatform: boolean;
  completedCount: number;
  lastActivity: string | null;
  accessGrantedAt: string | null; // najstariji course_access.granted_at polaznika
  now: Date;
}

// Da li polaznik "traži pažnju" za ponedeljni podsetnik profesorki:
// crven (>14 dana neaktivnosti) ILI "nije počeo" (0 lekcija) ali tek posle grejs-perioda.
export function trebaPaznju(input: TrebaPaznjuInput): { red: boolean; razlog: string } {
  const badge = platformaBadge({
    hasPlatform: input.hasPlatform,
    completedCount: input.completedCount,
    lastActivity: input.lastActivity,
    now: input.now,
  });
  if (!badge || badge.tone !== "red") return { red: false, razlog: "" };

  if (badge.label === "nije počeo") {
    if (!input.accessGrantedAt) return { red: false, razlog: "" };
    const dana = Math.floor((input.now.getTime() - new Date(input.accessGrantedAt).getTime()) / (24 * 60 * 60 * 1000));
    if (dana <= NIJE_POCEO_GRACE_DANA) return { red: false, razlog: "" };
    return { red: true, razlog: "nije počeo" };
  }

  return { red: true, razlog: `neaktivna ${badge.label}` };
}
