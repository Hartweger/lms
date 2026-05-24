import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import type { Section } from "@/lib/section-types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface DialogMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_TURNS = 7;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Previše zahteva. Pokušaj ponovo za minut." }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId, messages, turnNumber } = await request.json() as {
    lessonId: string;
    messages: DialogMessage[];
    turnNumber: number;
  };

  if (!lessonId || turnNumber < 1 || turnNumber > MAX_TURNS + 1) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (messages && messages.length > 20) {
    return NextResponse.json({ error: "Too many messages" }, { status: 400 });
  }

  // Fetch lesson info + course level
  const { data: lesson } = await supabase
    .from("lessons")
    .select("title, sections, course_id, courses(title)")
    .eq("id", lessonId)
    .single();

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Extract level from course title (e.g. "Nemački A1.1" → "A1")
  const courseTitle = (lesson.courses as unknown as { title: string } | null)?.title ?? "";
  const levelMatch = courseTitle.match(/[AB][12]/i);
  const level = levelMatch ? levelMatch[0].toUpperCase() : "A1";

  // Extract vocabulary from flashcard sections
  const sections = (lesson.sections ?? []) as Section[];
  const flashcardSections = sections.filter((s) => s.type === "flashcard");
  const vocabList = flashcardSections
    .flatMap((s) => s.type === "flashcard" ? s.items : [])
    .map((item) => `${item.front} = ${item.back}`)
    .slice(0, 30)
    .join(", ");

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "placeholder_key") {
    return NextResponse.json({
      aiMessage: "AI vežba trenutno nije dostupna.",
      options: null,
      finished: true,
      summary: "Servis privremeno nedostupan.",
      translations: [],
    });
  }

  const isLastTurn = turnNumber >= MAX_TURNS;

  const systemPrompt = `Ti si AI partner za vežbanje nemačkog jezika na nivou ${level}.

ZADATAK:
- Vodiš kratki svakodnevni dijalog vezan za temu lekcije: "${lesson.title}"
- Igraš JEDNU KONKRETNU ulogu odgovarajuću situaciji (konobar, prodavac, recepcioner, itd.)
- Student bira od 2 ponuđene opcije za svaku svoju repliku

NAJVAŽNIJA PRAVILA:
- OSTANI U ULOZI i u okviru situacije CELO VREME. Ako si konobar — pričaj samo o hrani, piću, računu. NIKADA ne skreći na druge teme.
- Kad student izabere BILO KOJU opciju (čak i nelogičnu), ti nastavi dijalog LOGIČNO u okviru situacije. Ako student kaže nešto čudno, ljubazno ga vrati na temu.
- Dijalog treba da ima PRIRODAN TOK: pozdrav → glavni deo (naručivanje/kupovina/pitanje) → završetak (plaćanje/pozdrav)
- Tvoje replike su kratke (1-2 rečenice na nemačkom)
- Za svaku turu daješ studentu TAČNO 2 opcije za odgovor na nemačkom
- OBE opcije moraju biti SMISLENE u kontekstu situacije — razlika je u tome što jedna nastavlja dijalog idealnim tokom, a druga je manje idealna ali i dalje logična (npr. naruči nešto skupo vs. jeftino, pitaj za račun prerano vs. naruči desert)
- NIKADA ne daj opciju koja je potpuno van konteksta situacije
- Obe opcije koriste vokabular prigodan za nivo ${level}
- Dijalog traje tačno ${MAX_TURNS} tura (sada je tura ${turnNumber})
${level === "A1" ? "- Koristi Präsens, jednostavne rečenice, osnovni vokabular" : level === "A2" ? "- Koristi Präsens/Perfekt, srednje složene rečenice" : "- Možeš koristiti složenije strukture, modalne glagole, Konjunktiv II"}
${vocabList ? `- Koristi ove reči iz lekcije kad je moguće: ${vocabList}` : ""}

FORMAT ODGOVORA — odgovaraj ISKLJUČIVO validnim JSON objektom:
${turnNumber === 1 ? `{"scenario": "opis situacije na srpskom (1 rečenica)", "aiMessage": "tvoja prva replika na nemačkom", "options": ["opcija A", "opcija B"], "finished": false}` : isLastTurn ? `{"aiMessage": "tvoja poslednja replika na nemačkom — zaključi razgovor", "options": null, "finished": true, "summary": "kratka pohvala na srpskom", "translations": [{"de": "nemački tekst", "sr": "srpski prevod"} za SVAKU repliku iz celog dijaloga uključujući ovu poslednju]}` : `{"aiMessage": "tvoja replika na nemačkom", "options": ["opcija A", "opcija B"], "finished": false}`}`;

  try {
    const claudeMessages: { role: "user" | "assistant"; content: string }[] = messages
      ? messages.map((m) => ({ role: m.role, content: m.content }))
      : [];

    // For first turn, add a user message to trigger the AI
    if (turnNumber === 1) {
      claudeMessages.push({ role: "user", content: "Počni dijalog." });
    }

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: systemPrompt,
      messages: claudeMessages,
    });

    let responseText = message.content[0].type === "text" ? message.content[0].text : "";
    responseText = responseText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json(parsed);
    } catch {
      // If JSON parsing fails, return a graceful fallback
      return NextResponse.json({
        aiMessage: responseText.slice(0, 200),
        options: null,
        finished: true,
        summary: "Došlo je do greške. Pokušaj ponovo.",
        translations: [],
      });
    }
  } catch (error) {
    console.error("[ai-dialog-exercise] Error:", error);
    return NextResponse.json({
      aiMessage: "Greška pri komunikaciji sa AI-jem.",
      options: null,
      finished: true,
      summary: "Servis privremeno nedostupan.",
      translations: [],
    });
  }
}
