import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { NAKI_MODEL } from "@/lib/naki/system-prompt";
import { getFallbackPlan, sendNakiWelcomeEmail, addToMailerLite } from "@/lib/naki/capture";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1"];

type HistMsg = { role: "user" | "assistant"; content: string };

async function generateLearningPlan(name: string, level: string, history: HistMsg[]): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return getFallbackPlan(name, level);

  const historyText = history
    .slice(-12)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => `${m.role === "user" ? "Korisnik" : "NaKI"}: ${m.content.trim()}`)
    .join("\n");

  const levelInfo = level ? `Nivo korisnika: ${level}.` : "Nivo nije eksplicitno naveden.";
  const prompt = `Na osnovu sledećeg razgovora, napravi personalizovani plan učenja nemačkog za korisnika po imenu ${name}. ${levelInfo}

Razgovor:
${historyText}

Napiši plan na srpskom jeziku, latinicom. Počni sa 'Hallo, ${name}!' Zatim 2-3 rečenice analize (šta korisnik već zna, na čemu treba da radi). Zatim 3 konkretna prioriteta, svaki sa kratkim primerom na nemačkom. Maksimalno 200 reči. Ton topao i ohrabrujući, kao Nataša Hartweger.`;

  try {
    const completion = await anthropic.messages.create({
      model: NAKI_MODEL,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });
    const block = completion.content[0];
    if (block && block.type === "text" && block.text.trim()) return block.text;
  } catch (e) {
    console.error("[naki] plan generation failed", e);
  }
  return getFallbackPlan(name, level);
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Previše zahteva. Pokušaj ponovo za minut." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Neispravan format zahteva." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  let level = typeof body.level === "string" ? body.level.trim().toUpperCase() : "";
  const history: HistMsg[] = Array.isArray(body.history) ? body.history : [];
  const sessionId = typeof body.session_id === "string" ? body.session_id.slice(0, 36) : "";

  if (!name || name.length > 100) {
    return NextResponse.json({ error: "Neispravan unos — ime." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Neispravan email." }, { status: 400 });
  }
  if (!VALID_LEVELS.includes(level)) level = "";

  // Generiši plan → pošalji mejl → MailerLite (kao stari PHP, redom)
  const plan = await generateLearningPlan(name, level, history);
  await sendNakiWelcomeEmail(email, name, level, plan);
  await addToMailerLite(email, name, level);

  // Upiši/azuriraj profil (bez čuvanja istorije; email je ključ).
  // Brojači se uvećavaju pri svakom capture-u: +1 sesija, + user poruke te sesije.
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("naki_profiles")
    .select("total_sessions, total_messages")
    .eq("email", email)
    .maybeSingle();
  let sessionMsgCount = 0;
  if (sessionId) {
    const { count } = await admin
      .from("naki_messages")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("role", "user");
    sessionMsgCount = count ?? 0;
  }
  await admin.from("naki_profiles").upsert(
    {
      email,
      name,
      level: level || null,
      last_session: new Date().toISOString(),
      total_sessions: (existing?.total_sessions ?? 0) + 1,
      total_messages: (existing?.total_messages ?? 0) + sessionMsgCount,
    },
    { onConflict: "email" }
  );

  // Loguj događaj email_capture (bez emaila u logu poruka)
  await admin.from("naki_messages").insert({
    session_id: sessionId,
    role: "assistant",
    message: `[email_capture] nivo=${level || "?"}`,
    level: level || null,
  });

  return NextResponse.json({ success: true });
}
