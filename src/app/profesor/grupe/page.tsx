import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProfessorView } from "@/lib/professor-view";

export const dynamic = "force-dynamic";

interface GrupniPolaznik {
  user_id: string;
  full_name: string;
  email: string;
  nivo: string;
  enrolled_at: string | null;
  total_lessons: number;
  completed_lessons: number;
  progress: number;
  last_activity: string | null;
}

export default async function ProfesorGrupe({ searchParams }: { searchParams: Promise<{ prof?: string }> }) {
  const { prof } = await searchParams;
  const ctx = await resolveProfessorView(prof);
  if (!ctx) return null;

  // Admin klijent, striktno filtrirano na grupe ovog profesora (ili onog koga admin „gleda kao").
  const admin = createAdminClient();
  const { data: groups } = await admin
    .from("groups")
    .select("id, level, content_course_id")
    .eq("professor_id", ctx.profId);

  const myGroups = groups ?? [];
  if (myGroups.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Nemaš grupa.</p>
        <p className="text-sm text-gray-300 mt-2">Admin te dodeljuje kao profesora grupi.</p>
      </div>
    );
  }

  const groupIds = myGroups.map((g) => g.id);
  const groupById = new Map(myGroups.map((g) => [g.id, g]));
  const courseIds = [...new Set(myGroups.map((g) => g.content_course_id).filter(Boolean))] as string[];

  // Aktivni upisi u mojim grupama
  const { data: enrollments } = await admin
    .from("group_enrollments")
    .select("user_id, group_id, enrolled_at")
    .in("group_id", groupIds)
    .eq("status", "active");

  const enr = enrollments ?? [];
  if (enr.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Još nema upisanih polaznika u tvoje grupe.</p>
      </div>
    );
  }

  const userIds = [...new Set(enr.map((e) => e.user_id))];

  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, full_name, email")
    .in("id", userIds);
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  // Lekcije po sadržajnom kursu grupe (prazan in() vraća prazno - bezbedno)
  const { data: allLessons } = await admin
    .from("lessons").select("id, course_id").in("course_id", courseIds.length ? courseIds : ["__none__"]);
  const lessonsByCourse = new Map<string, Set<string>>();
  for (const l of allLessons ?? []) {
    const set = lessonsByCourse.get(l.course_id) ?? new Set<string>();
    set.add(l.id);
    lessonsByCourse.set(l.course_id, set);
  }

  // Napredak svih polaznika (završene lekcije)
  const { data: allProgress } = await admin
    .from("lesson_progress")
    .select("user_id, lesson_id, completed_at")
    .eq("completed", true)
    .in("user_id", userIds);
  const progressByUser = new Map<string, { lesson_id: string; completed_at: string | null }[]>();
  for (const p of allProgress ?? []) {
    const list = progressByUser.get(p.user_id) ?? [];
    list.push({ lesson_id: p.lesson_id, completed_at: p.completed_at });
    progressByUser.set(p.user_id, list);
  }

  const polaznici: GrupniPolaznik[] = [];
  for (const e of enr) {
    const group = groupById.get(e.group_id);
    const profile = profileMap.get(e.user_id);
    if (!group || !profile) continue;

    const lessonIds = group.content_course_id ? lessonsByCourse.get(group.content_course_id) ?? new Set<string>() : new Set<string>();
    const totalLessons = lessonIds.size;
    const userProgress = (progressByUser.get(e.user_id) ?? []).filter((p) => lessonIds.has(p.lesson_id));
    const completedLessons = userProgress.length;
    const lastActivity = userProgress.reduce(
      (latest, p) => (p.completed_at && (!latest || p.completed_at > latest) ? p.completed_at : latest),
      null as string | null,
    );
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    polaznici.push({
      user_id: e.user_id,
      full_name: profile.full_name ?? "",
      email: profile.email,
      nivo: group.level,
      enrolled_at: e.enrolled_at,
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      progress,
      last_activity: lastActivity,
    });
  }

  // Sort: po nivou, pa najskorija aktivnost
  polaznici.sort((a, b) => {
    if (a.nivo !== b.nivo) return a.nivo.localeCompare(b.nivo);
    if (!a.last_activity && !b.last_activity) return 0;
    if (!a.last_activity) return 1;
    if (!b.last_activity) return -1;
    return b.last_activity.localeCompare(a.last_activity);
  });

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">{polaznici.length} polaznika u {myGroups.length} grupa</p>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-6 py-3">Ime</th>
              <th className="text-left px-6 py-3">Grupa</th>
              <th className="text-left px-6 py-3">Progres</th>
              <th className="text-left px-6 py-3">Poslednja aktivnost</th>
              <th className="text-left px-6 py-3">Upisan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {polaznici.map((s, i) => (
              <tr key={`${s.user_id}-${s.nivo}-${i}`} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{s.full_name || "-"}</div>
                  <div className="text-xs text-gray-400">{s.email}</div>
                </td>
                <td className="px-6 py-4 text-gray-600">{s.nivo}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-100 rounded-full h-2">
                      <div className="bg-plava h-2 rounded-full transition-all" style={{ width: `${s.progress}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{s.completed_lessons}/{s.total_lessons}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {s.last_activity ? new Date(s.last_activity).toLocaleDateString("sr-Latn") : "Nema aktivnosti"}
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString("sr-Latn") : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
