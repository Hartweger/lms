import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPartnerDetail } from "@/lib/partners";
import SaradnikClient from "./SaradnikClient";

export const dynamic = "force-dynamic";

export default async function AdminSaradnikPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const [partner, { data: courses }] = await Promise.all([
    loadPartnerDetail(id),
    admin.from("courses").select("id, title, slug").eq("is_purchasable", true).order("title"),
  ]);
  if (!partner) notFound();
  return <SaradnikClient partner={partner} courses={(courses ?? []).map((c) => ({ id: c.id, title: c.title, slug: c.slug }))} />;
}
