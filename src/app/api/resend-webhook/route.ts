// Resend webhook - bounce i spam prijave u email_bounces (prikazuje ih jutarnji pregled).
// Potpis se verifikuje preko RESEND_WEBHOOK_SECRET (svix), bez toga se zahtev odbija.
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ResendEvent = {
  type: string;
  data: {
    to?: string[];
    subject?: string;
    bounce?: { message?: string };
  };
};

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret || !process.env.RESEND_API_KEY) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET/API_KEY nisu podešeni");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const payload = await req.text(); // verifikacija traži sirov tekst, ne req.json()
  let event: ResendEvent;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    }) as ResendEvent;
  } catch (e) {
    console.error("[resend-webhook] nevažeći potpis:", e);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  if (event.type === "email.bounced" || event.type === "email.complained") {
    const admin = createAdminClient();
    const tip = event.type === "email.bounced" ? "bounced" : "complained";
    for (const to of event.data.to ?? []) {
      const { error } = await admin.from("email_bounces").insert({
        email: to.toLowerCase(),
        event: tip,
        reason: event.data.bounce?.message ?? null,
        subject: event.data.subject ?? null,
      });
      if (error) console.error("[resend-webhook] upis pao:", error);
      else console.log(`[resend-webhook] ${tip}: ${to}`);
    }
  }

  return NextResponse.json({ ok: true });
}
