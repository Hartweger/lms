import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertContact, logInteraction } from "@/lib/crm/contacts";
import { parseIngest } from "./validate";
import type { CrmSource } from "@/lib/crm/types";

export async function POST(request: Request) {
  const token = request.headers.get("x-crm-token");
  if (!process.env.CRM_INGEST_TOKEN || token !== process.env.CRM_INGEST_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseIngest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const v = parsed.value;

  const admin = createAdminClient();
  const source: CrmSource = v.channel === "manychat" ? "manychat" : v.channel;
  const contactId = await upsertContact(admin, {
    email: v.email,
    name: v.name,
    phone: v.phone,
    instagram: v.instagram,
    source,
  });
  if (!contactId) {
    return NextResponse.json({ error: "Upis nije uspeo." }, { status: 500 });
  }
  await logInteraction(admin, {
    contactId,
    channel: v.channel,
    direction: "dolazna",
    summary: v.subject || `Poruka sa ${v.channel}`,
    body: v.message,
  });
  return NextResponse.json({ ok: true, contact_id: contactId });
}
