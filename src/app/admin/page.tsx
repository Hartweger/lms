import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPregled() {
  const supabase = createAdminClient();

  // --- Statistika ---
  const { count: studentCount } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");

  const { count: professorCount } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "professor");

  const { count: courseCount } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);

  const { count: accessCount } = await supabase
    .from("course_access")
    .select("*", { count: "exact", head: true });

  // Week boundaries
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  // Active students (lesson completed in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: activeStudents } = await supabase
    .from("lesson_progress")
    .select("user_id")
    .eq("completed", true)
    .gte("completed_at", sevenDaysAgo.toISOString());

  const activeCount = new Set(activeStudents?.map((a) => a.user_id) ?? []).size;

  // Pending essays
  const { count: pendingEssays } = await supabase
    .from("essay_submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Professor assignments count
  const { count: assignmentCount } = await supabase
    .from("professor_students")
    .select("*", { count: "exact", head: true });

  // New students this week (from WC webhook or manual)
  const { count: newThisWeek } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student")
    .gte("created_at", startOfWeek.toISOString());

  // Students who have logged in at least once
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const loggedInCount = authUsers.filter(u => u.last_sign_in_at).length;

  const stats = [
    { label: "Studenti", value: studentCount ?? 0, href: "/admin/studenti" },
    { label: "Prijavili se", value: loggedInCount, href: "/admin/studenti" },
    { label: "Novi ove nedelje", value: newThisWeek ?? 0, href: "/admin/studenti" },
    { label: "Aktivni (7 dana)", value: activeCount, href: "/admin/studenti" },
  ];

  // --- Zahteva pažnju ---
  const in30days = new Date();
  in30days.setDate(in30days.getDate() + 30);

  const { data: expiringAccess } = await supabase
    .from("course_access")
    .select(
      "id, expires_at, user_id, course_id, user_profiles(full_name, email), courses(title)"
    )
    .not("expires_at", "is", null)
    .gte("expires_at", new Date().toISOString())
    .lte("expires_at", in30days.toISOString())
    .order("expires_at", { ascending: true })
    .limit(10);

  // --- Skorašnje aktivnosti (lesson completions this week) ---
  const { data: recentProgress } = await supabase
    .from("lesson_progress")
    .select("user_id, lesson_id, completed_at, lessons(title), user_profiles: user_id(full_name, email)")
    .eq("completed", true)
    .gte("completed_at", startOfWeek.toISOString())
    .order("completed_at", { ascending: false })
    .limit(15);

  const { data: recentRegistrations } = await supabase
    .from("user_profiles")
    .select("id, full_name, email, created_at, role")
    .gte("created_at", startOfWeek.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  // Combine activity feed
  type ActivityItem = {
    type: "registration" | "lesson";
    date: string;
    name: string;
    detail: string;
  };

  const activities: ActivityItem[] = [];

  recentRegistrations?.forEach((r) => {
    activities.push({
      type: "registration",
      date: r.created_at,
      name: r.full_name || r.email,
      detail: r.role === "professor" ? "profesor" : "student",
    });
  });

  recentProgress?.forEach((p) => {
    const profile = p.user_profiles as unknown as { full_name: string; email: string } | null;
    const lesson = p.lessons as unknown as { title: string } | null;
    activities.push({
      type: "lesson",
      date: p.completed_at ?? "",
      name: profile?.full_name || profile?.email || "—",
      detail: lesson?.title || "—",
    });
  });

  activities.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("sr-Latn", {
      day: "numeric",
      month: "short",
    });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin panel</h1>

      {/* Statistika */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-plava">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Status kartica */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Eseji za pregled</div>
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold ${(pendingEssays ?? 0) > 0 ? "text-koral" : "text-green-600"}`}>
              {pendingEssays ?? 0}
            </span>
            {(pendingEssays ?? 0) > 0 && (
              <Link href="/admin/eseji" className="text-xs text-plava hover:underline">Pregledaj →</Link>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Aktivni pristupi</div>
          <div className="text-2xl font-bold text-plava">{accessCount ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Dodeljeni studenti</div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-plava">{assignmentCount ?? 0}</span>
            <Link href="/admin/profesori" className="text-xs text-plava hover:underline">Upravljaj →</Link>
          </div>
        </div>
      </div>

      {/* Zahteva pažnju */}
      {expiringAccess && expiringAccess.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ističe pristup (narednih 30 dana)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 pr-4">Student</th>
                  <th className="pb-2 pr-4">Kurs</th>
                  <th className="pb-2 pr-4">Ističe</th>
                  <th className="pb-2">Akcija</th>
                </tr>
              </thead>
              <tbody>
                {expiringAccess.map((row) => {
                  const profile = row.user_profiles as unknown as {
                    full_name: string;
                    email: string;
                  } | null;
                  const course = row.courses as unknown as {
                    title: string;
                  } | null;
                  return (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        {profile?.full_name || profile?.email || "—"}
                      </td>
                      <td className="py-2 pr-4">{course?.title || "—"}</td>
                      <td className="py-2 pr-4">
                        {row.expires_at ? formatDate(row.expires_at) : "—"}
                      </td>
                      <td className="py-2">
                        <Link
                          href={`/admin/studenti/${row.user_id}`}
                          className="text-plava hover:underline text-xs"
                        >
                          Upravljaj
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aktivnosti ove nedelje */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Aktivnosti ove nedelje
        </h2>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 15).map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3 text-sm border-b last:border-0 pb-3 last:pb-0"
              >
                <span className="mt-0.5 text-lg">
                  {a.type === "registration" ? "👤" : "📖"}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900">{a.name}</span>
                  <span className="text-gray-500">
                    {a.type === "registration"
                      ? ` — novi ${a.detail}`
                      : ` — završio/la: ${a.detail}`}
                  </span>
                </div>
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {formatDate(a.date)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Nema aktivnosti ove nedelje.
          </p>
        )}
      </div>

      {/* Brze prečice */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/admin/studenti"
          className="flex items-center justify-center gap-2 border border-plava text-plava py-3 rounded-lg text-sm font-medium hover:bg-plava hover:text-white transition-colors"
        >
          Studenti
        </Link>
        <Link
          href="/admin/profesori"
          className="flex items-center justify-center gap-2 border border-plava text-plava py-3 rounded-lg text-sm font-medium hover:bg-plava hover:text-white transition-colors"
        >
          Profesori
        </Link>
        <Link
          href="/admin/eseji"
          className="flex items-center justify-center gap-2 border border-plava text-plava py-3 rounded-lg text-sm font-medium hover:bg-plava hover:text-white transition-colors"
        >
          Eseji
        </Link>
        <Link
          href="/admin/pristup"
          className="flex items-center justify-center gap-2 border border-plava text-plava py-3 rounded-lg text-sm font-medium hover:bg-plava hover:text-white transition-colors"
        >
          Pristup
        </Link>
      </div>
    </div>
  );
}
