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
  conversationMemoryAddon,
} from "@/lib/naki/system-prompt";
import { createHash } from "crypto";
import { userOwnsAnyVideoCourse } from "@/lib/coupon-ownership";
import { stickyLevel, getLevelCourse, courseUpsellAddon } from "@/lib/naki/courses";
import {
  personalDailyLimit,
  limitReachedMessage,
  userIsStudent,
  countTodayMessages,
} from "@/lib/naki/limits";

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

  // ── Ko je ulogovan ──
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  // ── Lični dnevni limit (anon 20, ulogovan 40, polaznik bez limita) ──
  // Na limitu ne odgovaramo "vidimo se sutra" nego nudimo plan učenja na mejl,
  // besplatan nalog i kurs za detektovani nivo uz NAKI10.
  const isStudent = userId ? await userIsStudent(admin, userId) : false;
  const personalLimit = personalDailyLimit({ loggedIn: !!userId, isStudent });
  if (personalLimit !== null) {
    const todayCount = await countTodayMessages(admin, { day: today, userId, ipHash });
    if (todayCount >= personalLimit) {
      const knownLevel = stickyLevel(messages.filter((m) => m.role === "user").map((m) => m.content));
      const levelCourse = await getLevelCourse(admin, knownLevel);
      await admin.from("naki_messages").insert({
        session_id: sessionId,
        role: "assistant",
        message: `[limit_reached] ${userId ? "user" : "anon"} nivo=${knownLevel ?? "?"}`,
        level: knownLevel,
        ip_hash: ipHash,
        user_id: userId,
      });
      return NextResponse.json(
        {
          error: "personal_limit_reached",
          message: limitReachedMessage({ loggedIn: !!userId, course: levelCourse }),
          show_email_gate: !userId,
        },
        { status: 429 }
      );
    }
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
  // Statični prompt se kešira (prompt caching); promenljivi dodaci idu
  // kao odvojeni blokovi da ne kvare keš.
  // Tema se detektuje iz cele skorašnje istorije (lepljiva tema), ne samo poslednje poruke.
  const userTexts = history.filter((m) => m.role === "user").map((m) => m.content);
  const linkAddon = blogLinkAddon(userTexts); // tema se gleda iz skorašnje istorije
  // Nivo i ime se pamte iz CELE istorije (ne samo poslednjih 12 poruka) i ubacuju
  // u nekeširani blok - inače u dugim sesijama model izgubi nivo pa iznova pita
  // "koji nivo" i menja rod oslovljavanja.
  const allUserTexts = messages.filter((m) => m.role === "user").map((m) => m.content);
  const knownLevel = stickyLevel(allUserTexts);
  const memoryAddon = conversationMemoryAddon(allUserTexts, knownLevel);
  // Ulogovani koji već imaju video kurs ne dobijaju NAKI10 (kupon je za nove kupce).
  const couponAddon =
    userId && (await userOwnsAnyVideoCourse(admin, userId))
      ? "\n\nOvaj korisnik je već kupac video kursa - NE pominji kupon NAKI10 (važi samo za prvu kupovinu)."
      : "";
  // Konkretan kurs za detektovani nivo (cena uživo). Prazno ako nivo nije A1/A2/B1.
  const levelCourse = await getLevelCourse(admin, knownLevel);
  const upsellAddon = courseUpsellAddon(levelCourse);
  // Statični prompt se kešira; promenljivi dodaci idu kao odvojen nekeširan blok da ne kvare keš.
  const dynamic = memoryAddon + linkAddon + couponAddon + upsellAddon;
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: NAKI_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ...(dynamic ? [{ type: "text" as const, text: dynamic }] : []),
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
