/**
 * Čista logika grupnih beleški - bez baze, da se testira bez mock-ova.
 *
 * group_sessions ima unique(group_id, session_date), pa za (grupa, datum) postoji najviše
 * jedan red; zato ulaz za pickSessionForNote ima 0 ili 1 element.
 */

export type SessionPick =
  | { kind: "none" }
  | { kind: "found"; sessionId: string }
  | { kind: "cancelled" };

export function pickSessionForNote(rows: { id: string; cancelled: boolean }[]): SessionPick {
  const row = rows[0];
  if (!row) return { kind: "none" };
  if (row.cancelled) return { kind: "cancelled" };
  return { kind: "found", sessionId: row.id };
}

/** Sesije bez beleške - samo njih sme da obriše osvežavanje rasporeda. */
export function withoutNotedSessions<T extends { id: string }>(rows: T[], notedIds: Set<string>): T[] {
  return rows.filter((r) => !notedIds.has(r.id));
}
