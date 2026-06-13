import { createAdminClient } from "@/lib/supabase/admin";
import { loadPayables } from "@/lib/professor-payable";
import ObavezeClient from "./ObavezeClient";

export const dynamic = "force-dynamic";

export default async function AdminObavezePage() {
  const admin = createAdminClient();
  const payables = await loadPayables();

  const { data: pending } = await admin.from("professor_activities")
    .select("id, professor_id, description, amount, activity_date")
    .eq("status", "na_cekanju").order("created_at", { ascending: true });

  const { data: groups } = await admin.from("groups")
    .select("id, level, professor_id").in("status", ["otvoren", "u_toku"]);

  const { data: profs } = await admin.from("user_profiles")
    .select("id, full_name").eq("role", "professor").order("full_name");

  const profName: Record<string, string> = Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name ?? "-"]));

  return (
    <ObavezeClient
      payables={payables.map((p) => ({ professorId: p.professorId, name: p.name, earned: p.earned, paid: p.paid, balance: p.balance }))}
      pending={(pending ?? []).map((a) => ({ ...a, profName: profName[a.professor_id] ?? "-" }))}
      groups={(groups ?? []).map((g) => ({ id: g.id, label: `${g.level} (${profName[g.professor_id] ?? "?"})` }))}
      profs={(profs ?? []).map((p) => ({ id: p.id, name: p.full_name ?? "-" }))}
    />
  );
}
