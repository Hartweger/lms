import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { upsertContact } from "@/lib/crm/contacts";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;
  const { data, error } = await admin
    .from("crm_contacts")
    .select("*")
    .order("last_interaction_at", { ascending: false })
    .limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;
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
