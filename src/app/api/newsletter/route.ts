import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Unesite ispravnu email adresu." },
        { status: 400 }
      );
    }

    const apiKey = process.env.MAILERLITE_API_KEY;
    if (!apiKey) {
      console.error("MAILERLITE_API_KEY is not set");
      return NextResponse.json(
        { error: "Greška na serveru. Pokušajte kasnije." },
        { status: 500 }
      );
    }

    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    // MailerLite returns 200 for new subscribers, 200 for existing ones
    if (res.ok) {
      return NextResponse.json({
        success: true,
        message: "Uspešno ste se prijavili na newsletter!",
      });
    }

    // 422 = validation error (e.g., already subscribed with different status)
    if (res.status === 422) {
      return NextResponse.json({
        success: true,
        message: "Već ste prijavljeni!",
      });
    }

    console.error("MailerLite error:", data);
    return NextResponse.json(
      { error: "Greška pri prijavi. Pokušajte ponovo." },
      { status: 500 }
    );
  } catch (error) {
    console.error("Newsletter signup error:", error);
    return NextResponse.json(
      { error: "Greška na serveru. Pokušajte kasnije." },
      { status: 500 }
    );
  }
}
