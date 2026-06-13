import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertContact } from "@/lib/crm/contacts";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? admin : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { data, error } = await admin
    .from("crm_contacts")
    .select("*")
    .order("last_interaction_at", { ascending: false })
    .limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const { name, email, phone, instagram, level, note } = body;
  if (!name && !email && !phone && !instagram) {
    return NextResponse.json({ error: "Unesi bar ime, mejl, telefon ili Instagram." }, { status: 400 });
  }
  const contactId = await upsertContact(admin, {
    name, email, phone, instagram, level, source: "rucno",
  });
  if (!contactId) return NextResponse.json({ error: "Upis nije uspeo." }, { status: 500 });
  if (note) await admin.from("crm_contacts").update({ note }).eq("id", contactId);
  return NextResponse.json({ contact_id: contactId });
}
