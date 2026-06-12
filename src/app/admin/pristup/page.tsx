import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface AccessRow {
  id: string;
  user_id: string;
  course_id: string;
  expires_at: string | null;
  granted_at: string;
  userName: string;
  userEmail: string;
  courseTitle: string;
}

export default async function AdminPristup() {
  const supabase = createAdminClient();

  const { data: accessList } = await supabase
    .from("course_access")
    .select("id, user_id, course_id, expires_at, granted_at")
    .order("granted_at", { ascending: false });

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, full_name, email");

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title");

  const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string | null; email: string }) => [p.id, p]));
  const courseMap = new Map((courses ?? []).map((c: { id: string; title: string }) => [c.id, c]));

  const now = new Date();
  const rows: AccessRow[] = (accessList ?? []).map((a: { id: string; user_id: string; course_id: string; expires_at: string | null; granted_at: string }) => {
    const profile = profileMap.get(a.user_id);
    const course = courseMap.get(a.course_id);
    return {
      ...a,
      userName: (profile as { full_name: string | null })?.full_name || "-",
      userEmail: (profile as { email: string })?.email || "-",
      courseTitle: (course as { title: string })?.title || "-",
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pristup kursevima</h1>

      <p className="text-xs text-gray-400 mb-3">
        {rows.length} zapisa
      </p>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-6 py-3">Korisnik</th>
              <th className="text-left px-6 py-3">Email</th>
              <th className="text-left px-6 py-3">Kurs</th>
              <th className="text-left px-6 py-3">Ističe</th>
              <th className="text-left px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row) => {
              const expired = row.expires_at
                ? new Date(row.expires_at) < now
                : false;

              return (
                <tr
                  key={row.id}
                  className={expired ? "bg-red-50/50" : "hover:bg-gray-50"}
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {row.userName}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {row.userEmail}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {row.courseTitle}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {row.expires_at
                      ? new Date(row.expires_at).toLocaleDateString("sr-RS")
                      : "Neograničeno"}
                  </td>
                  <td className="px-6 py-4">
                    {expired ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Istekao
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Aktivan
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Nema zapisa o pristupu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
