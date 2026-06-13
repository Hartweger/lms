import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { upsertContact, logInteraction } from "@/lib/crm/contacts";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Previše zahteva. Pokušaj ponovo za minut." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neispravan format podataka." }, { status: 400 });
  }

  const { email } = body;
  const trimmedEmail = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return NextResponse.json({ error: "Neispravna email adresa." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: dbError } = await supabase.from("masterclass_signups").insert({
    masterclass: "reci",
    email: trimmedEmail,
    ip_address: ip,
  });
  if (dbError) {
    console.error("Supabase masterclass_signups error:", dbError);
  }

  const mlApiKey = process.env.MAILERLITE_API_KEY;
  if (mlApiKey) {
    try {
      await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mlApiKey}`,
        },
        body: JSON.stringify({
          email: trimmedEmail,
          groups: [process.env.MAILERLITE_RECI_GROUP_ID].filter(Boolean),
        }),
      });
    } catch (mlError) {
      console.error("MailerLite error:", mlError);
    }
  }

  // Upis u CRM (best-effort)
  try {
    const admin = createAdminClient();
    const contactId = await upsertContact(admin, {
      email: trimmedEmail,
      source: "masterclass",
    });
    if (contactId) {
      await logInteraction(admin, {
        contactId,
        channel: "sistem",
        direction: "dolazna",
        summary: "Prijava na masterclass „reci\"",
        body: null,
        meta: { masterclass: "reci" },
      });
    }
  } catch (e) {
    console.error("[masterclass] CRM upis nije uspeo", e);
  }

  return NextResponse.json({ success: true });
}
