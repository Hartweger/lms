import { createAdminClient } from "@/lib/supabase/admin";
import type { Variant } from "@/lib/individual-pricing";
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
    .select("id, title, slug, price, course_type, category, included_lessons")
    .eq("is_purchasable", true)
    .order("title");

  // Individualni kursevi: učitaj varijacije (cena po profesorki/paketu) da admin
  // može ručno da kreira 1:1 narudžbinu sa izborom profesorke i broja termina.
  // Service-role: imena profesorki su u user_profiles (RLS), pa čitamo na serveru.
  const indivCourses = (courses ?? []).filter(
    (c) => c.course_type === "individual" || ["individualni", "mesecni"].includes(c.category ?? ""),
  );
  const variantsByCourse: Record<string, Variant[]> = {};
  if (indivCourses.length) {
    const { data: vData } = await supabase
      .from("product_variants")
      .select("id, course_id, professor_id, package_type, price, paypal_price_eur, professor:professor_id(id, full_name)")
      .in("course_id", indivCourses.map((c) => c.id))
      .eq("is_active", true);
    for (const v of vData ?? []) {
      const prof = Array.isArray(v.professor) ? v.professor[0] ?? null : v.professor;
      (variantsByCourse[v.course_id] ??= []).push({
        id: v.id, professor_id: v.professor_id, package_type: v.package_type,
        price: v.price, paypal_price_eur: v.paypal_price_eur, professor: prof,
      });
    }
  }

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

  return <NarudzbineClient initialOrders={enriched} courses={courses ?? []} variantsByCourse={variantsByCourse} />;
}
