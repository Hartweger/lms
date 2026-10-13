// src/lib/group-bonus.ts
// I/O: dodatak za veličinu grupe po održanom grupnom času (pravilo u lib/honorar.ts → groupSessionBonus).
import type { createAdminClient } from "@/lib/supabase/admin";
import { groupSessionBonus, GRP_BONUS_OD_STARTA } from "@/lib/honorar";

type Admin = ReturnType<typeof createAdminClient>;

export interface SessionBonus { group_id: string; professor_id: string; session_date: string; bonus: number }

const beogradDatum = (ts: string) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date(ts));

/**
 * Vraća samo časove sa dodatkom > 0. Grupe pre GRP_BONUS_OD_STARTA se uopšte ne učitavaju.
 * Baca grešku kad upit padne - tihi gubitak dodatka bi značio manji honorar bez traga.
 */
export async function loadGroupSessionBonuses(
  admin: Admin,
  opts: { from?: string; toExclusive?: string; upTo: string; profId?: string },
): Promise<SessionBonus[]> {
  const { data: groups, error: gErr } = await admin.from("groups")
    .select("id, start_date").gte("start_date", GRP_BONUS_OD_STARTA);
  if (gErr) throw new Error(`group-bonus: groups upit pao - ${gErr.message}`);
  if (!groups || groups.length === 0) return [];
  const ids = groups.map((g) => g.id);
  const startById = new Map(groups.map((g) => [g.id, g.start_date as string | null]));

  let sq = admin.from("group_sessions").select("group_id, professor_id, session_date")
    .in("group_id", ids).eq("cancelled", false).lte("session_date", opts.upTo).limit(10000);
  if (opts.from) sq = sq.gte("session_date", opts.from);
  if (opts.toExclusive) sq = sq.lt("session_date", opts.toExclusive);
  if (opts.profId) sq = sq.eq("professor_id", opts.profId);
  const [{ data: sessions, error: sErr }, { data: enr, error: eErr }] = await Promise.all([
    sq,
    admin.from("group_enrollments").select("group_id, enrolled_at")
      .in("group_id", ids).eq("status", "active").limit(10000),
  ]);
  if (sErr) throw new Error(`group-bonus: group_sessions upit pao - ${sErr.message}`);
  if (eErr) throw new Error(`group-bonus: group_enrollments upit pao - ${eErr.message}`);

  const upisiPoGrupi = new Map<string, string[]>();
  for (const e of enr ?? []) {
    if (!e.enrolled_at) continue;
    upisiPoGrupi.set(e.group_id, [...(upisiPoGrupi.get(e.group_id) ?? []), beogradDatum(e.enrolled_at)]);
  }

  const out: SessionBonus[] = [];
  for (const s of sessions ?? []) {
    if (!s.professor_id) continue;
    const bonus = groupSessionBonus(startById.get(s.group_id) ?? null, upisiPoGrupi.get(s.group_id) ?? [], s.session_date);
    if (bonus > 0) out.push({ group_id: s.group_id, professor_id: s.professor_id, session_date: s.session_date, bonus });
  }
  return out;
}

/** Zbir dodatka po profesorki. */
export function sumBonusByProf(rows: SessionBonus[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.professor_id, (m.get(r.professor_id) ?? 0) + r.bonus);
  return m;
}
