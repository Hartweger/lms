import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CrmContact, CrmInteraction } from "@/lib/crm/types";
import CrmDetailClient from "./CrmDetailClient";

export const dynamic = "force-dynamic";

export default async function CrmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: contact } = await admin.from("crm_contacts").select("*").eq("id", id).single();
  if (!contact) notFound();

  const { data: interactions } = await admin
    .from("crm_interactions").select("*").eq("contact_id", id)
    .order("occurred_at", { ascending: false }).limit(500);

  // „Kao polaznik": ako je povezan user_id, pročitaj kurseve sa naslovima (best-effort)
  let courses: { title: string; expires_at: string | null }[] = [];
  if (contact.user_id) {
    const { data: access } = await admin
      .from("course_access")
      .select("expires_at, courses(title)")
      .eq("user_id", contact.user_id);
    courses = (access ?? []).map((a: { expires_at: string | null; courses: { title: string } | { title: string }[] | null }) => ({
      title: Array.isArray(a.courses) ? (a.courses[0]?.title ?? "Kurs") : (a.courses?.title ?? "Kurs"),
      expires_at: a.expires_at,
    }));
  }

  return (
    <CrmDetailClient
      contact={contact as CrmContact}
      interactions={(interactions ?? []) as CrmInteraction[]}
      courses={courses}
    />
  );
}
