import { NextResponse } from "next/server";
import { sendInteresNotification } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertContact, logInteraction } from "@/lib/crm/contacts";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!(await rateLimit(ip)).allowed) {
      return NextResponse.json({ error: "Previše zahteva. Pokušaj ponovo za minut." }, { status: 429 });
    }
    const { nivo, email, ime } = await request.json();
    const mail = String(email || "").toLowerCase().trim();
    if (!mail.includes("@") || !nivo) {
      return NextResponse.json({ error: "Nivo i ispravan mejl su obavezni." }, { status: 400 });
    }
    await sendInteresNotification(String(nivo), mail, String(ime || ""));

    // Upis u CRM da lid ne ostane samo u inboxu (best-effort; ne ruši formu ako padne).
    // Isti obrazac kao kontakt forma - vidi src/app/api/kontakt/route.ts.
    try {
      const admin = createAdminClient();
      const contactId = await upsertContact(admin, {
        email: mail,
        name: String(ime || ""),
        source: "kontakt-forma",
      });
      if (contactId) {
        await logInteraction(admin, {
          contactId,
          channel: "mejl",
          direction: "dolazna",
          summary: `Čeka termin: ${nivo}`,
          body: `Ostavio/la mejl na stranici kursa jer za nivo ${nivo} nema otvorenog termina (ili je grupa popunjena).`,
          meta: { nivo, tip: "interes-za-grupu" },
        });
      }
    } catch (e) {
      console.error("[grupe/interes] CRM upis nije uspeo", e);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[grupe/interes] Error:", e);
    return NextResponse.json({ error: "Greška na serveru." }, { status: 500 });
  }
}
