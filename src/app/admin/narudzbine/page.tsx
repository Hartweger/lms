import { createAdminClient } from "@/lib/supabase/admin";
import NarudzbineClient from "./NarudzbineClient";

export const dynamic = "force-dynamic";

export default async function AdminNarudzbinePage() {
  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, price")
    .eq("is_purchasable", true)
    .order("title");

  // Profesor po narudžbini (individualni: preko individual_enrollments.order_id)
  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: enrs } = await supabase
    .from("individual_enrollments")
    .select("order_id, professor_id")
    .in("order_id", orderIds.length ? orderIds : ["00000000-0000-0000-0000-000000000000"]);
  const profIds = [...new Set((enrs ?? []).map((e) => e.professor_id).filter(Boolean))];
  const { data: profs } = await supabase
    .from("user_profiles")
    .select("id, full_name")
    .in("id", profIds.length ? profIds : ["00000000-0000-0000-0000-000000000000"]);
  const profName: Record<string, string> = Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name ?? ""]));
  const profByOrder: Record<string, string> = {};
  for (const e of enrs ?? []) if (e.order_id && e.professor_id) profByOrder[e.order_id] = profName[e.professor_id] ?? "";
  const enriched = (orders ?? []).map((o) => ({ ...o, professor_name: profByOrder[o.id] || null }));

  return <NarudzbineClient initialOrders={enriched} courses={courses ?? []} />;
}
