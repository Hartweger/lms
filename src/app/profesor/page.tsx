import type { ReactNode } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProfessorView } from "@/lib/professor-view";
import { platformaBadge, napredakLekcije, type PlatformaBadge } from "@/lib/prof-napredak";

export const dynamic = "force-dynamic";

type Row = {
  name: string;
  email: string;
  type: "1:1" | "grupa";
  label: string;      // naziv kursa (1:1) ili "Grupa <nivo>"
  detail: string;     // "X/Y časova" za 1:1, prazno za grupu
  badge: PlatformaBadge | null; // badge aktivnosti na platformi (null = nema platforme)
  lessons: string | null;       // "X/Y lekcija" ili "X lekcija"; null kad nema platforme
};

export default async function ProfesorStudenti({ searchParams }: { searchParams: Promise<{ prof?: string }> }) {
  const { prof } = await searchParams;
  const ctx = await resolveProfessorView(prof);
  if (!ctx) return null;
  const admin = createAdminClient();
  const profId = ctx.profId;

  // 1:1 (aktivni individualni upisi)
  const { data: indEnr } = await admin
    .from("individual_enrollments")
    .select("user_id, course_id, package_lessons, lessons_used, status")
    .eq("professor_id", profId)
    .eq("status", "active");

  // Grupe (otvorene/u toku) + njihovi aktivni polaznici
  const { data: grps } = await admin
    .from("groups")
    .select("id, level, status, content_course_id")
    .eq("professor_id", profId)
    .in("status", ["otvoren", "u_toku"]);
  const groupLevel = new Map((grps ?? []).map((g) => [g.id, g.level as string]));
  const groupContentCourse = new Map(
    (grps ?? []).map((g) => [g.id, (g.content_course_id as string | null) ?? null]),
  );
  const groupIds = (grps ?? []).map((g) => g.id);

  const { data: ge } = groupIds.length
    ? await admin.from("group_enrollments").select("user_id, group_id").eq("status", "active").in("group_id", groupIds)
    : { data: [] };

  // 1:1: kupovni kurs -> sadržaj kurs (course_unlocks)
  const indPurchasableIds = [...new Set((indEnr ?? []).map((e) => e.course_id))];
  const { data: unlocks } = indPurchasableIds.length
    ? await admin.from("course_unlocks").select("purchasable_course_id, content_course_id").in("purchasable_course_id", indPurchasableIds)
    : { data: [] };
  // Bezbedno: individual_enrollments.course_id je uvek individualni-* proizvod
  // koji u course_unlocks ima tačno jedan content_course_id (vidi migr. 030),
  // pa Map ne kolabira više sadržaj-kurseva u jedan.
  const purchasableToContent = new Map(
    (unlocks ?? []).map((u) => [u.purchasable_course_id as string, u.content_course_id as string]),
  );

  // Profili + kursevi
  const userIds = [...new Set([...(indEnr ?? []).map((e) => e.user_id), ...(ge ?? []).map((e) => e.user_id)])];
  const { data: profiles } = userIds.length
    ? await admin.from("user_profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] };
  const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const courseIds = [...new Set((indEnr ?? []).map((e) => e.course_id))];
  const { data: courses } = courseIds.length
    ? await admin.from("courses").select("id, title").in("id", courseIds)
    : { data: [] };
  const cMap = new Map((courses ?? []).map((c) => [c.id, c.title as string]));

  // Skup sadržaj-kurseva relevantnih za prikaz (grupni content + 1:1 mapirani content)
  const contentCourseIds = [
    ...new Set([
      ...[...groupContentCourse.values()].filter((c): c is string => !!c),
      ...[...purchasableToContent.values()],
    ]),
  ];

  // Pristup platformi (course_access) — ima li polaznik bilo koji unlock-ovani sadržaj
  const { data: caRows } = userIds.length
    ? await admin.from("course_access").select("user_id").in("user_id", userIds)
    : { data: [] };
  const hasPlatform = new Set((caRows ?? []).map((r) => r.user_id as string));

  // Lekcije po sadržaj-kursu (za X/Y i atribuciju)
  const { data: allLessons } = contentCourseIds.length
    ? await admin.from("lessons").select("id, course_id").in("course_id", contentCourseIds)
    : { data: [] };
  const lessonsByCourse = new Map<string, Set<string>>();
  for (const l of allLessons ?? []) {
    const set = lessonsByCourse.get(l.course_id as string) ?? new Set<string>();
    set.add(l.id as string);
    lessonsByCourse.set(l.course_id as string, set);
  }

  // Završene lekcije po polazniku
  const { data: allProgress } = userIds.length
    ? await admin.from("lesson_progress").select("user_id, lesson_id, completed_at").eq("completed", true).in("user_id", userIds)
    : { data: [] };
  const progressByUser = new Map<string, { lesson_id: string; completed_at: string | null }[]>();
  for (const p of allProgress ?? []) {
    const list = progressByUser.get(p.user_id as string) ?? [];
    list.push({ lesson_id: p.lesson_id as string, completed_at: p.completed_at as string | null });
    progressByUser.set(p.user_id as string, list);
  }

  const now = new Date();

  // Vrati { badge, lessons } za polaznika u datom sadržaj-kursu (null => fallback na ceo nalog)
  function platformaZa(userId: string, contentCourseId: string | null): { badge: PlatformaBadge | null; lessons: string | null } {
    if (!hasPlatform.has(userId)) return { badge: null, lessons: null };
    const all = progressByUser.get(userId) ?? [];
    const lessonIds = contentCourseId ? lessonsByCourse.get(contentCourseId) ?? null : null;
    const relevant = lessonIds ? all.filter((p) => lessonIds.has(p.lesson_id)) : all;
    const completedCount = relevant.length;
    const total = lessonIds ? lessonIds.size : null;
    const lastActivity = relevant.reduce<string | null>(
      (latest, p) => (p.completed_at && (!latest || p.completed_at > latest) ? p.completed_at : latest),
      null,
    );
    return {
      badge: platformaBadge({ hasPlatform: true, completedCount, lastActivity, now }),
      lessons: napredakLekcije(completedCount, total),
    };
  }

  const rows: Row[] = [];
  for (const e of indEnr ?? []) {
    const p = pMap.get(e.user_id);
    const { badge, lessons } = platformaZa(e.user_id, purchasableToContent.get(e.course_id) ?? null);
    rows.push({
      name: p?.full_name || "-",
      email: p?.email || "",
      type: "1:1",
      label: cMap.get(e.course_id) ?? "-",
      detail: `${e.lessons_used ?? 0}/${e.package_lessons ?? "?"} časova`,
      badge,
      lessons,
    });
  }
  for (const e of ge ?? []) {
    const p = pMap.get(e.user_id);
    const { badge, lessons } = platformaZa(e.user_id, groupContentCourse.get(e.group_id) ?? null);
    rows.push({
      name: p?.full_name || "-",
      email: p?.email || "",
      type: "grupa",
      label: `Grupa ${groupLevel.get(e.group_id) ?? ""}`.trim(),
      detail: "",
      badge,
      lessons,
    });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name, "sr-Latn"));

  if (rows.length === 0) {
    return <p className="text-gray-400 text-sm py-12 text-center">Nemaš aktivnih polaznika.</p>;
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">{rows.length} aktivnih polaznika (1:1 i grupni)</p>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-6 py-3">Polaznik</th>
              <th className="text-left px-6 py-3">Tip / kurs</th>
              <th className="text-left px-6 py-3">Napredak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r, i) => (
              <tr key={`${r.email}-${i}`} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{r.name}</div>
                  <div className="text-xs text-gray-400">{r.email}</div>
                </td>
                <td className="px-6 py-4">
                  {r.type === "1:1" ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-plava-light text-plava">1:1</span>
                      <span className="text-gray-700">{r.label}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Grupa</span>
                      <span className="text-gray-700">{r.label.replace(/^Grupa\s*/, "")}</span>
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {(() => {
                    const toneClass =
                      r.badge?.tone === "green" ? "bg-green-100 text-green-700"
                      : r.badge?.tone === "amber" ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700";
                    const delovi: ReactNode[] = [];
                    if (r.detail) delovi.push(<span key="d">{r.detail}</span>);
                    if (r.badge) {
                      delovi.push(
                        <span key="b" className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${toneClass}`}>
                          <span aria-hidden>●</span>{r.badge.label}
                        </span>,
                      );
                    }
                    if (r.badge && r.lessons) delovi.push(<span key="l" className="text-gray-500">{r.lessons}</span>);
                    if (delovi.length === 0) return "-";
                    return (
                      <span className="inline-flex items-center gap-2 flex-wrap">
                        {delovi.map((d, i) => (
                          <span key={i} className="inline-flex items-center gap-2">
                            {i > 0 && <span className="text-gray-300">·</span>}
                            {d}
                          </span>
                        ))}
                      </span>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
