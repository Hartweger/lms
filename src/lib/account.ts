export type AccessState = "none" | "active" | "expiring" | "expired";
export interface AccessStatus {
  state: AccessState;
  daysLeft: number | null;
}

const DAY = 86_400_000;
const EXPIRING_THRESHOLD_DAYS = 7;

export function accessStatus(expiresAt: string | null, now: Date = new Date()): AccessStatus {
  if (!expiresAt) return { state: "none", daysLeft: null };
  const daysLeft = Math.round((new Date(expiresAt).getTime() - now.getTime()) / DAY);
  if (daysLeft < 0) return { state: "expired", daysLeft };
  if (daysLeft <= EXPIRING_THRESHOLD_DAYS) return { state: "expiring", daysLeft };
  return { state: "active", daysLeft };
}

export function remainingSessions(packageLessons: number, lessonsUsed: number): number {
  return Math.max(0, packageLessons - lessonsUsed);
}

export function shouldShowRenew(s: AccessStatus): boolean {
  return s.state === "expiring" || s.state === "expired";
}
