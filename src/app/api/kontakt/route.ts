import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const { name, email, category, message } = await request.json();

    if (!name || !email || !category || !message) {
      return NextResponse.json(
        { error: "Sva polja su obavezna." },
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
      from: "Hartweger <kurs@hartweger.rs>",
      to: "info@hartweger.rs",
      replyTo: email,
      subject: `Kontakt forma: ${category} — ${name}`,
      text: [
        `Ime: ${name}`,
        `Email: ${email}`,
        `Kategorija: ${category}`,
        ``,
        `Poruka:`,
        message,
      ].join("\n"),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Kontakt form error:", error);
    return NextResponse.json(
      { error: "Greška pri slanju poruke. Pokušajte ponovo." },
      { status: 500 }
    );
  }
}
