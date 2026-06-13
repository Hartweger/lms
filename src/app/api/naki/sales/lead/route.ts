import { NextResponse } from "next/server";
import { Resend } from "resend";
import { rateLimit } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(ip).allowed) {
    return NextResponse.json({ error: "Previše zahteva. Pokušaj ponovo za minut." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Neispravan mejl." }, { status: 400 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Mejl servis nije dostupan." }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // 1) Upis u Resend Audience (ako je ID postavljen)
  if (process.env.RESEND_AUDIENCE_ID) {
    try {
      await resend.contacts.create({
        audienceId: process.env.RESEND_AUDIENCE_ID,
        email,
        firstName: name || undefined,
        unsubscribed: false,
      });
    } catch (e) {
      console.error("[smile] audience add failed", e);
    }
  }

  // 2) Welcome mejl
  const greeting = name ? `Zdravo, ${name}!` : "Zdravo!";
  try {
    await resend.emails.send({
      from: "Nataša Hartweger <natasa@hartweger.rs>",
      to: email,
      subject: "Tvoja preporuka kursa - Hartweger",
      html: `<div style="font-family:Arial,sans-serif;font-size:16px;color:#333;line-height:1.6;">
        <p>${greeting}</p>
        <p>Hvala što si razgovarao sa Smile-om! Kao što smo pričali, pogledaj kurseve i izaberi ono što ti odgovara:
        <a href="https://www.hartweger.rs/kursevi" style="color:#F78687;">www.hartweger.rs/kursevi</a></p>
        <p>Ako imaš bilo kakvo pitanje, tu smo na info@hartweger.rs.</p>
        <p>Hartweger tim</p>
      </div>`,
    });
  } catch (e) {
    console.error("[smile] welcome email failed", e);
    return NextResponse.json({ error: "Slanje mejla nije uspelo." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
