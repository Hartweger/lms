import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logInteraction } from "@/lib/crm/contacts";

const FROM = "Hartweger <kurs@hartweger.rs>";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? admin : null;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Escape-uje, pretvara gole URL-ove u klikabilne linkove, pa prelome redova u <br>. */
function renderBody(message: string) {
  return esc(message)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#4fb1d3;">$1</a>')
    .replace(/\n/g, "<br>");
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  if (!subject || !message) {
    return NextResponse.json({ error: "Naslov i poruka su obavezni." }, { status: 400 });
  }

  const { data: contact } = await admin
    .from("crm_contacts").select("email,name").eq("id", id).single();
  if (!contact?.email) {
    return NextResponse.json({ error: "Kontakt nema mejl adresu." }, { status: 400 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Mejl servis nije dostupan." }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;color:#333;line-height:1.6;">
    ${renderBody(message)}
    <p style="margin-top:16px;">Srdačno,<br>Hartweger tim</p>
  </div>`;
  try {
    await resend.emails.send({ from: FROM, to: contact.email, replyTo: "info@hartweger.rs", subject, html });
  } catch (e) {
    console.error("[crm] slanje mejla palo", e);
    return NextResponse.json({ error: "Slanje nije uspelo." }, { status: 502 });
  }

  await logInteraction(admin, {
    contactId: id,
    channel: "mejl",
    direction: "odlazna",
    summary: subject,
    body: message,
  });
  return NextResponse.json({ ok: true });
}
