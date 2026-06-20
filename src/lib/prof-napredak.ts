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
