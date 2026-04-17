import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPregled() {
  const supabase = await createClient();

  // --- 1. Statistika ---
  const { count: studentCount } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");

  const { count: courseCount } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: monthlyPurchases } = await supabase
    .from("purchases")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")
    .gte("created_at", startOfMonth.toISOString());

  const { data: activeData } = await supabase.rpc("get_active_student_count", {
    days: 7,
  });

  const stats = [
    { label: "Ukupno studenata", value: studentCount ?? 0 },
    { label: "Ukupno kurseva", value: courseCount ?? 0 },
    { label: "Kupovine (mesec)", value: monthlyPurchases ?? 0 },
    { label: "Aktivni (7 dana)", value: Number(activeData) || 0 },
  ];

  // --- 2. Zahteva pažnju: ističe pristup ---
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
    .order("expires_at", { ascending: true });

  // --- 2b. Neaktivni studenti ---
  const { data: inactiveStudents } = await supabase.rpc(
    "get_inactive_students",
    { inactive_days: 14 }
  );

  // --- 3. Skorašnje aktivnosti ---
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const weekStart = startOfWeek.toISOString();

  const { data: recentRegistrations } = await supabase
    .from("user_profiles")
    .select("id, full_name, email, created_at")
    .eq("role", "student")
    .gte("created_at", weekStart)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: recentPurchases } = await supabase
    .from("purchases")
    .select("id, created_at, user_profiles(full_name), courses(title)")
    .eq("status", "completed")
    .gte("created_at", weekStart)
    .order("created_at", { ascending: false })
    .limit(10);

  // --- 4. Drop-off analiza ---
  const { data: dropoffData } = await supabase.rpc("get_course_dropoff");

  // --- Combine activity feed ---
  type ActivityItem = {
    type: "registration" | "purchase";
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
      detail: r.email,
    });
  });

  recentPurchases?.forEach((p) => {
    const profile = p.user_profiles as unknown as { full_name: string } | null;
    const course = p.courses as unknown as { title: string } | null;
    activities.push({
      type: "purchase",
      date: p.created_at,
      name: profile?.full_name || "—",
      detail: course?.title || "—",
    });
  });

  activities.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("sr-Latn", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin panel</h1>

      {/* 1. Statistika */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-plava">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 2. Zahteva pažnju */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Zahteva pažnju
        </h2>

        {/* Ističe pristup */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-koral-dark mb-3">
            Ističe pristup (narednih 30 dana)
          </h3>
          {expiringAccess && expiringAccess.length > 0 ? (
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
          ) : (
            <p className="text-sm text-gray-400">
              Nema studenata kojima uskoro ističe pristup.
            </p>
          )}
        </div>

        {/* Neaktivni studenti */}
        <div>
          <h3 className="text-sm font-medium text-koral-dark mb-3">
            Neaktivni studenti (14+ dana)
          </h3>
          {inactiveStudents && inactiveStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 pr-4">Student</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2">Poslednji login</th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveStudents.map(
                    (s: {
                      id: string;
                      full_name: string;
                      email: string;
                      last_sign_in_at: string;
                    }) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{s.full_name || "—"}</td>
                        <td className="py-2 pr-4">{s.email}</td>
                        <td className="py-2">
                          {s.last_sign_in_at
                            ? formatDate(s.last_sign_in_at)
                            : "Nikad"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
              <Link
                href="/admin/studenti"
                className="text-plava hover:underline text-xs mt-2 inline-block"
              >
                Prikaži sve →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Svi studenti su aktivni.
            </p>
          )}
        </div>
      </div>

      {/* 3. Skorašnje aktivnosti */}
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
                  {a.type === "registration" ? "👤" : "💳"}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900">{a.name}</span>
                  <span className="text-gray-500">
                    {a.type === "registration"
                      ? " se registrovao/la"
                      : ` — kupio/la: ${a.detail}`}
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

      {/* 4. Gde studenti odustaju */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Gde studenti odustaju
        </h2>
        {dropoffData && dropoffData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 pr-4">Kurs</th>
                  <th className="pb-2 pr-4">Lekcija</th>
                  <th className="pb-2 pr-4">Stalo</th>
                  <th className="pb-2">%</th>
                </tr>
              </thead>
              <tbody>
                {dropoffData.map(
                  (d: {
                    course_id: string;
                    course_title: string;
                    dropoff_lesson_title: string;
                    dropoff_lesson_order: number;
                    stopped_count: number;
                    total_started: number;
                  }) => (
                    <tr
                      key={d.course_id}
                      className="border-b last:border-0"
                    >
                      <td className="py-2 pr-4">{d.course_title}</td>
                      <td className="py-2 pr-4">
                        #{d.dropoff_lesson_order} {d.dropoff_lesson_title}
                      </td>
                      <td className="py-2 pr-4">
                        {d.stopped_count} studenata
                      </td>
                      <td className="py-2">
                        {Math.round(
                          (Number(d.stopped_count) / Number(d.total_started)) *
                            100
                        )}
                        %
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Nedovoljno podataka za analizu (minimum 5 studenata po kursu).
          </p>
        )}
      </div>

      {/* 5. Brze prečice */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/admin/studenti"
          className="flex items-center justify-center gap-2 border border-plava text-plava py-3 rounded-lg font-medium hover:bg-plava hover:text-white transition-colors"
        >
          👥 Studenti
        </Link>
        <Link
          href="/admin/kursevi/novi"
          className="flex items-center justify-center gap-2 border border-plava text-plava py-3 rounded-lg font-medium hover:bg-plava hover:text-white transition-colors"
        >
          📚 Dodaj kurs
        </Link>
        <Link
          href="/admin/kupovine"
          className="flex items-center justify-center gap-2 border border-plava text-plava py-3 rounded-lg font-medium hover:bg-plava hover:text-white transition-colors"
        >
          💳 Kupovine
        </Link>
      </div>
    </div>
  );
}
