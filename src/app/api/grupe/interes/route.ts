import { NextResponse } from "next/server";
import { sendInteresNotification } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

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
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[grupe/interes] Error:", e);
    return NextResponse.json({ error: "Greška na serveru." }, { status: 500 });
  }
}
