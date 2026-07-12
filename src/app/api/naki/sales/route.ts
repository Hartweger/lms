import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";
import { buildSalesSystemPrompt, SMILE_MAX_TOKENS, SMILE_MAX_REQUESTS_PER_DAY } from "@/lib/naki/sales-prompt";
import { getCatalogText } from "@/lib/naki/catalog";
import { getSmileConfig, isPurchaseSignal, extractEmail } from "@/lib/naki/smile-config";
import { upsertContact, logInteraction } from "@/lib/crm/contacts";
import { userOwnsAnyVideoCourse } from "@/lib/coupon-ownership";
import { createHash } from "crypto";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ChatMessage = { role: "user" | "assistant"; content: string };

// GET: javna konfiguracija za widget (samo prekidači koji utiču na UI).
export async function GET() {
  const admin = createAdminClient();
  const cfg = await getSmileConfig(admin);
  return NextResponse.json({
    enabled: cfg.enabled,
    nudge: cfg.nudge,
    leadCapture: cfg.leadCapture,
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(ip).allowed) {
    return NextResponse.json({ error: "Previše zahteva. Sačekaj minut pa probaj ponovo." }, { status: 429 });
  }
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "placeholder_key") {
    return NextResponse.json({ error: "AI nije dostupan." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "Neispravan format zahteva." }, { status: 400 });
  }
  const sessionId: string = typeof body.session_id === "string" ? body.session_id.slice(0, 36) : "";

  const messages: ChatMessage[] = [];
  for (const msg of body.messages) {
    if (!msg || (msg.role !== "user" && msg.role !== "assistant")) continue;
    const content = typeof msg.content === "string" ? msg.content.trim() : "";
    if (content.length === 0 || content.length > 5000) continue;
    messages.push({ role: msg.role, content });
  }
  if (messages.length === 0) {
    return NextResponse.json({ error: "Nema validnih poruka." }, { status: 400 });
  }

  const admin = createAdminClient();
  const cfg = await getSmileConfig(admin);
  if (!cfg.enabled) {
    return NextResponse.json({ error: "Smile trenutno nije dostupan." }, { status: 503 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const ipHash = createHash("md5").update(ip).digest("hex");

  // Dnevni budžet (odvojen od tutora)
  const { data: usage } = await admin.from("smile_daily_usage").select("count").eq("day", today).maybeSingle();
  if ((usage?.count ?? 0) >= SMILE_MAX_REQUESTS_PER_DAY) {
    return NextResponse.json(
      { error: "limit_reached", message: "Smile je za danas završio. Pogledaj kurseve na www.hartweger.rs/kursevi ili piši na info@hartweger.rs" },
      { status: 429 }
    );
  }

  // Ko je ulogovan (za kupon proveru)
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch { userId = null; }

  const last = messages[messages.length - 1];
  if (last.role === "user") {
    await admin.from("naki_messages").insert({
      session_id: sessionId, role: "user", message: last.content, ip_hash: ipHash, user_id: userId, kind: "smile",
    });
  }

  const history = messages.slice(-10);

  // Kupon samo ne-kupcima i ako je prekidač uključen
  const offerCoupon = cfg.coupon && !(userId && (await userOwnsAnyVideoCourse(admin, userId)));
  const catalogText = await getCatalogText(admin);
  const systemPrompt = buildSalesSystemPrompt(catalogText, { coupon: offerCoupon });

  let reply: string;
  try {
    const completion = await anthropic.messages.create({
      model: cfg.model,
      max_tokens: SMILE_MAX_TOKENS,
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: history,
    });
    const block = completion.content[0];
    reply = block && block.type === "text" ? block.text : "";
  } catch {
    return NextResponse.json({ error: "AI servis trenutno nije dostupan. Pokušaj ponovo." }, { status: 502 });
  }
  if (!reply) {
    return NextResponse.json({ error: "Neočekivan odgovor od AI servisa." }, { status: 502 });
  }

  await Promise.all([
    admin.from("smile_daily_usage").upsert({ day: today, count: (usage?.count ?? 0) + 1 }, { onConflict: "day" }),
    admin.from("naki_messages").insert({
      session_id: sessionId, role: "assistant", message: reply, ip_hash: ipHash, user_id: userId, kind: "smile",
    }),
  ]);

  // Lid: posetilac ostavio mejl u razgovoru → CRM + notify za ljudski odgovor (ne ruši chat ako padne)
  const leadEmail = last.role === "user" ? extractEmail(last.content) : null;
  if (leadEmail) {
    const convo = history
      .map((m) => `${m.role === "user" ? "Korisnik" : "Smile"}: ${m.content}`)
      .join("\n")
      .slice(0, 8000);
    try {
      const contactId = await upsertContact(admin, { email: leadEmail, source: "smile", userId });
      if (contactId) {
        await logInteraction(admin, {
          contactId,
          channel: "smile",
          direction: "dolazna",
          summary: "Ostavio mejl u razgovoru sa Smile-om - čeka odgovor",
          body: convo,
        });
      }
    } catch (e) {
      console.error("[smile] CRM upis lida nije uspeo", e);
    }
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Smile <info@hartweger.rs>",
          to: "info@hartweger.rs",
          replyTo: leadEmail,
          subject: `Smile · Posetilac čeka odgovor: ${leadEmail}`,
          text: `Posetilac je ostavio mejl u razgovoru i obećan mu je brz odgovor.\nOdgovori mu direktno (reply ide na ${leadEmail}).\n\nRazgovor:\n${convo}\n\nSmile je upravo odgovorio:\n${reply}\n\n---\nSmile · Hartweger sajt`,
        });
      } catch (e) {
        console.error("[smile] lead-notify failed", e);
      }
    }
  } else if (last.role === "user" && isPurchaseSignal(last.content) && process.env.RESEND_API_KEY) {
    // Admin-notify za kupovni signal (ne ruši chat ako padne)
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Smile <info@hartweger.rs>",
        to: "info@hartweger.rs",
        subject: "Smile · Kupovni signal sa sajta",
        text: `Korisnik je pitao:\n\n${last.content}\n\nSmile je odgovorio:\n${reply}\n\n---\nSmile · Hartweger sajt`,
      });
    } catch (e) {
      console.error("[smile] admin-notify failed", e);
    }
  }

  return NextResponse.json({ reply });
}
