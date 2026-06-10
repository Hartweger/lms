import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeCourseProgress, type LessonRef, type AccessRef, type ProgressRef } from "@/lib/progress-stats";

export const dynamic = "force-dynamic";

// Pristup dodeljen migracijom sa starog WP-a (stari napredak nije prenet) — `source` počinje sa "wp-migration".
type AccessWithSource = AccessRef & { source: string | null };
const isMigrated = (s: string | null) => String(s ?? "").startsWith("wp-migration");

// Supabase vraća max 1000 redova po upitu — povuci sve u stranicama.
type Rangeable = { range: (from: number, to: number) => PromiseLike<{ data: unknown[] | null }> };
async function fetchAll<T>(build: () => Rangeable): Promise<T[]> {
  const out: T[] = [];
  const PAGE = 1000;
  let offset = 0;
  for (;;) {
    const { data } = await build().range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    out.push(...(data as T[]));
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

export default async function AdminNapredak({
  searchParams,
}: {
  searchParams: Promise<{ samo?: string }>;
}) {
  const { samo } = await searchParams;
  const onlyNew = samo === "novi";

  const supabase = createAdminClient();

  const lessons = await fetchAll<LessonRef>(() => supabase.from("lessons").select("id, course_id"));
  const allAccess = await fetchAll<AccessWithSource>(() => supabase.from("course_access").select("user_id, course_id, source"));
  const access: AccessRef[] = onlyNew ? allAccess.filter((a) => !isMigrated(a.source)) : allAccess;
  const progress = await fetchAll<ProgressRef>(() =>
    supabase.from("lesson_progress").select("user_id, lesson_id").eq("completed", true)
  );

  const { data: courses } = await supabase.from("courses").select("id, title");
  const titleOf = new Map((courses ?? []).map((c) => [c.id, c.title as string]));

  const stats = computeCourseProgress(lessons, access, progress)
    .map((s) => ({ ...s, title: titleOf.get(s.courseId) ?? s.courseId }))
    .sort((a, b) => b.enrolled - a.enrolled);

  const totalEnrolled = stats.reduce((s, c) => s + c.enrolled, 0);
  const totalCompleted = stats.reduce((s, c) => s + c.completed, 0);
  const overallRate = totalEnrolled ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

  const barColor = (pct: number) => (pct >= 60 ? "bg-green-500" : pct >= 30 ? "bg-yellow-400" : "bg-koral");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Napredak po kursevima</h1>
        <p className="text-sm text-gray-500 mt-1">
          Stopa završavanja i odustajanja. „Nije počeo" = upisan ali nije uradio nijednu lekciju.
        </p>
        <div className="flex gap-2 mt-3">
          <Link
            href="/admin/napredak"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${!onlyNew ? "bg-plava text-white border-plava" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`}
          >
            Svi upisani
          </Link>
          <Link
            href="/admin/napredak?samo=novi"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${onlyNew ? "bg-plava text-white border-plava" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`}
          >
            Samo novi (ne-migrirani)
          </Link>
        </div>
        {onlyNew && (
          <p className="text-xs text-gray-400 mt-2">
            Prikazani su samo polaznici koji su pristup dobili na novoj platformi (bez {" "}
            {/* migrirani isključeni */}migriranih sa starog sajta) — realnija slika završavanja.
          </p>
        )}
      </div>

      {/* Sažetak */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-plava">{totalEnrolled}</div>
          <div className="text-sm text-gray-500 mt-1">Ukupno upisa (sa lekcijama)</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-green-600">{totalCompleted}</div>
          <div className="text-sm text-gray-500 mt-1">Završili ceo kurs</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-plava">{overallRate}%</div>
          <div className="text-sm text-gray-500 mt-1">Prosečna stopa završavanja</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3">Kurs</th>
                <th className="px-4 py-3 text-center">Upisano</th>
                <th className="px-4 py-3 text-center">Nije počeo</th>
                <th className="px-4 py-3 text-center">U toku</th>
                <th className="px-4 py-3 text-center">Završili</th>
                <th className="px-4 py-3">Prosečan napredak</th>
                <th className="px-4 py-3 text-center">Stopa završavanja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.map((c) => {
                const notStartedPct = c.enrolled ? Math.round((c.notStarted / c.enrolled) * 100) : 0;
                return (
                  <tr key={c.courseId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{c.title}</div>
                      <div className="text-xs text-gray-400">{c.totalLessons} lekcija</div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{c.enrolled}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={notStartedPct >= 50 ? "text-koral font-medium" : "text-gray-500"}>
                        {c.notStarted}
                      </span>
                      <span className="text-gray-400 text-xs"> ({notStartedPct}%)</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{c.inProgress}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{c.completed}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor(c.avgProgressPct)}`} style={{ width: `${c.avgProgressPct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-9 text-right">{c.avgProgressPct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900">{c.completionRatePct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {stats.length === 0 && (
          <p className="text-sm text-gray-400 p-6">Još nema podataka o napretku.</p>
        )}
      </div>
    </div>
  );
}
