import { createAdminClient } from "@/lib/supabase/admin";
import { loadPartnerSummaries } from "@/lib/partners";
import SaradniciClient from "./SaradniciClient";

export const dynamic = "force-dynamic";

export default async function AdminSaradniciPage() {
  const admin = createAdminClient();
  const [partners, { data: courses }] = await Promise.all([
    loadPartnerSummaries(),
    admin.from("courses").select("id, title, slug").eq("is_purchasable", true).order("title"),
  ]);
  return (
    <SaradniciClient
      partners={partners}
      courses={(courses ?? []).map((c) => ({ id: c.id, title: c.title, slug: c.slug }))}
    />
  );
}
