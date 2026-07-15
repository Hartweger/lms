import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertContact, logInteraction } from "@/lib/crm/contacts";
import { rateLimit } from "@/lib/rate-limit";

const VALID_CATEGORIES = ["video", "grupni", "individualni", "usluge", "placanje", "ostalo"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!rateLimit(`kontakt:${ip}`, { max: 3, windowMs: 10 * 60 * 1000 }).allowed) {
      return NextResponse.json(
        { error: "Previše poruka. Pokušajte ponovo za nekoliko minuta." },
        { status: 429 }
      );
    }

    const { name, email, category, message, website } = await request.json();

    // Honeypot: skriveno polje koje ljudi ne vide — popunjen = bot, lažni uspeh
    if (website) {
      return NextResponse.json({ success: true });
    }

    if (!name || !email || !category || !message) {
      return NextResponse.json(
        { error: "Sva polja su obavezna." },
        { status: 400 }
      );
    }

    if (
      typeof name !== "string" || name.length > 200 ||
      typeof message !== "string" || message.length > 5000 ||
      typeof email !== "string" || !EMAIL_RE.test(email) ||
      !VALID_CATEGORIES.includes(category)
    ) {
      return NextResponse.json(
        { error: "Neispravni podaci u formi." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not set");
      return NextResponse.json(
        { error: "Greška na serveru. Pokušajte kasnije." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "Hartweger <info@hartweger.rs>",
      to: "info@hartweger.rs",
      replyTo: email,
      subject: `Kontakt forma: ${category} - ${name}`,
      text: [
        `Ime: ${name}`,
        `Email: ${email}`,
        `Kategorija: ${category}`,
        ``,
        `Poruka:`,
        message,
      ].join("\n"),
    });

    // Upis u CRM da upit ne propadne (best-effort; ne ruši formu ako padne)
    try {
      const admin = createAdminClient();
      const contactId = await upsertContact(admin, {
        email,
        name,
        source: "kontakt-forma",
      });
      if (contactId) {
        await logInteraction(admin, {
          contactId,
          channel: "mejl",
          direction: "dolazna",
          summary: `Kontakt forma: ${category}`,
          body: message,
          meta: { category },
        });
      }
    } catch (e) {
      console.error("[kontakt] CRM upis nije uspeo", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Kontakt form error:", error);
    return NextResponse.json(
      { error: "Greška pri slanju poruke. Pokušajte ponovo." },
      { status: 500 }
    );
  }
}
