import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import {
  NAKI_SYSTEM_PROMPT,
  NAKI_MODEL,
  NAKI_MAX_TOKENS,
  NAKI_MAX_REQUESTS_PER_DAY,
  blogLinkAddon,
} from "@/lib/naki/system-prompt";
import { createHash } from "crypto";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ChatMessage = { role: "user" | "assistant"; content: string };

function detectLevel(text: string): string | null {
  const m = text.match(/\b(A1|A2|B1|B2|C1)\b/i);
  return m ? m[1].toUpperCase() : null;
}

export async function POST(request: Request) {
  // ── Rate limit po IP (10/min) ──
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Previše zahteva. Sačekaj minut pa probaj ponovo." },
      { status: 429 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "placeholder_key") {
    return NextResponse.json({ error: "AI nije dostupan." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "Neispravan format zahteva." }, { status: 400 });
  }

  const sessionId: string = typeof body.session_id === "string" ? body.session_id.slice(0, 36) : "";

  // ── Validacija poruka (kao PHP: max 5000 znakova, samo user/assistant) ──
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
  const today = new Date().toISOString().slice(0, 10);
  const ipHash = createHash("md5").update(ip).digest("hex");

  // ── Dnevni limit (svi korisnici zajedno) ──
  const { data: usage } = await admin
    .from("naki_daily_usage")
    .select("count")
    .eq("day", today)
    .maybeSingle();
  if ((usage?.count ?? 0) >= NAKI_MAX_REQUESTS_PER_DAY) {
    return NextResponse.json(
      {
        error: "limit_reached",
        message:
          "NaKI je za danas završio sa radom. 😴 Vidimo se sutra sa novom energijom! Do tada, možeš pregledati lekcije na www.hartweger.rs",
      },
      { status: 429 }
    );
  }

  // ── Ko je ulogovan (za premium kasnije; sada samo zabeleži user_id) ──
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  // ── Loguj poslednju korisničku poruku ──
  const last = messages[messages.length - 1];
  if (last.role === "user") {
    await admin.from("naki_messages").insert({
      session_id: sessionId,
      role: "user",
      message: last.content,
      level: detectLevel(last.content),
      ip_hash: ipHash,
      user_id: userId,
    });
  }

  // ── Ograniči istoriju na poslednjih 12 poruka ──
  const history = messages.slice(-12);

  // ── Blog link detekcija ──
  // Statični prompt se kešira (prompt caching); promenljivi blog-addon ide
  // kao odvojen blok da ne kvari keš.
  const linkAddon = last.role === "user" ? blogLinkAddon(last.content) : "";
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: NAKI_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ...(linkAddon ? [{ type: "text" as const, text: linkAddon }] : []),
  ];

  // ── Poziv Claude API ──
  let reply: string;
  try {
    const completion = await anthropic.messages.create({
      model: NAKI_MODEL,
      max_tokens: NAKI_MAX_TOKENS,
      system,
      messages: history,
    });
    const block = completion.content[0];
    reply = block && block.type === "text" ? block.text : "";
  } catch {
    return NextResponse.json(
      { error: "AI servis trenutno nije dostupan. Pokušaj ponovo." },
      { status: 502 }
    );
  }

  if (!reply) {
    return NextResponse.json({ error: "Neočekivan odgovor od AI servisa." }, { status: 502 });
  }

  // ── Ažuriraj dnevni brojač + loguj NaKI odgovor (paralelno) ──
  await Promise.all([
    admin.from("naki_daily_usage").upsert(
      { day: today, count: (usage?.count ?? 0) + 1 },
      { onConflict: "day" }
    ),
    admin.from("naki_messages").insert({
      session_id: sessionId,
      role: "assistant",
      message: reply,
      ip_hash: ipHash,
      user_id: userId,
    }),
  ]);

  return NextResponse.json({ reply });
}
