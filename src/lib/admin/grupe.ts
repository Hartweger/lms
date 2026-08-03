import type { SupabaseClient } from "@supabase/supabase-js";

// Čitanje grupa sa brojem aktivnih polaznika. Deli ga GET /api/admin/grupe
// (osvežavanje posle izmena iz klijenta) i /admin/grupe server stranica
// (početno stanje), da se ista logika ne piše na dva mesta.
export async function ucitajGrupeSaBrojem(admin: SupabaseClient) {
  const { data: groups } = await admin
    .from("groups")
    .select("*, professor:professor_id(full_name), content_course:content_course_id(slug,title)")
    .order("start_date", { ascending: false });

  const { data: enr } = await admin
    .from("group_enrollments")
    .select("group_id")
    .eq("status", "active");

  const counts: Record<string, number> = {};
  (enr || []).forEach((e) => {
    counts[e.group_id] = (counts[e.group_id] || 0) + 1;
  });

  return (groups || []).map((g) => ({ ...g, enrolled: counts[g.id] || 0 }));
}
