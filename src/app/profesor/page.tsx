import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProfessorView } from "@/lib/professor-view";

export const dynamic = "force-dynamic";

type Row = {
  name: string;
  email: string;
  type: "1:1" | "grupa";
  label: string;      // naziv kursa (1:1) ili "Grupa <nivo>"
  detail: string;     // "X/Y časova" za 1:1, prazno za grupu
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
    .select("id, level, status")
    .eq("professor_id", profId)
    .in("status", ["otvoren", "u_toku"]);
  const groupLevel = new Map((grps ?? []).map((g) => [g.id, g.level as string]));
  const groupIds = (grps ?? []).map((g) => g.id);

  const { data: ge } = groupIds.length
    ? await admin.from("group_enrollments").select("user_id, group_id").eq("status", "active").in("group_id", groupIds)
    : { data: [] };

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

  const rows: Row[] = [];
  for (const e of indEnr ?? []) {
    const p = pMap.get(e.user_id);
    rows.push({
      name: p?.full_name || "-",
      email: p?.email || "",
      type: "1:1",
      label: cMap.get(e.course_id) ?? "-",
      detail: `${e.lessons_used ?? 0}/${e.package_lessons ?? "?"} časova`,
    });
  }
  for (const e of ge ?? []) {
    const p = pMap.get(e.user_id);
    rows.push({
      name: p?.full_name || "-",
      email: p?.email || "",
      type: "grupa",
      label: `Grupa ${groupLevel.get(e.group_id) ?? ""}`.trim(),
      detail: "",
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
                <td className="px-6 py-4 text-gray-500">{r.detail || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
