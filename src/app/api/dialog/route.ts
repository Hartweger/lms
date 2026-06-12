import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface DialogMessage {
  role: "user" | "assistant";
  content: string;
}

interface DialogConfig {
  scenario: string;
  ai_role: string;
  level: string;
  dialog_mode: "guided" | "free";
  max_turns: number;
  goals: string[];
  opening_message: string;
  system_prompt_extra?: string;
}

export async function POST(request: Request) {
  // Auth check
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

  const { exerciseId, messages, turnNumber } = await request.json() as {
    exerciseId: string;
    messages: DialogMessage[];
    turnNumber: number;
  };

  if (!exerciseId || !messages || !turnNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate turn bounds
  if (turnNumber < 1 || turnNumber > 20) {
    return NextResponse.json({ error: "Invalid turn number" }, { status: 400 });
  }
  if (messages.length > 40) {
    return NextResponse.json({ error: "Too many messages" }, { status: 400 });
  }

  // Fetch dialog config from database - never trust client
  const { data: question } = await supabase
    .from("exercise_questions")
    .select("options")
    .eq("exercise_id", exerciseId)
    .single();

  if (!question?.options) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  // options may be stored as a JSON string (double-encoded) - parse before use
  const config = (typeof question.options === "string"
    ? JSON.parse(question.options)
    : question.options) as DialogConfig;
  const { scenario, ai_role: aiRole, level, dialog_mode: dialogMode, max_turns: maxTurns, goals, system_prompt_extra: systemPromptExtra } = config;

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "placeholder_key") {
    return NextResponse.json({
      reply: "AI dijalog trenutno nije dostupan.",
      completed_goals: [],
      is_finished: true,
      summary: null,
    });
  }

  const isLastTurn = turnNumber >= maxTurns;

  const goalsText = goals.map((g, i) => `${i + 1}. ${g}`).join("\n");

  const systemPrompt = `Ti si ${aiRole} u sledećoj situaciji: ${scenario}.
Student uči nemački na nivou ${level}.

PRAVILA:
- Odgovaraj SAMO na nemačkom, u ulozi ${aiRole}
- Budi kratak - 1-2 rečenice po odgovoru
- NE ispravljaj greške studenta tokom dijaloga
- Ako student skrene s teme, vrati ga na zadatak
- Prilagodi složenost jezika nivou ${level}
${level === "A1" || level === "A2" ? "- Koristi jednostavne rečenice, Präsens, osnovni vokabular" : "- Možeš koristiti složenije strukture, Perfekt, modalne glagole"}
${systemPromptExtra ? `\nDodatne instrukcije: ${systemPromptExtra}` : ""}

CILJEVI koje student treba da ispuni:
${goalsText}

Prati koje ciljeve je student ispunio kroz razgovor.

${isLastTurn ? `Ovo je POSLEDNJA razmena. Završi razgovor prirodno.

Odgovori SAMO sa validnim JSON objektom, bez markdown blokova:
{"reply":"tvoja poslednja replika na nemačkom","completed_goals":[0,1],"is_finished":true,"summary":{"goals_completed":[{"goal":"tekst cilja","completed":true},{"goal":"tekst cilja","completed":false}],"corrections":[{"original":"greška studenta","corrected":"ispravka","explanation":"kratko objašnjenje na srpskom"}],"score":2,"total":${goals.length}}}

U corrections stavi maksimum 3 najvažnije greške iz CELOG razgovora.
U goals_completed navedi SVE ciljeve sa statusom.
Score je broj ispunjenih ciljeva.` : `Odgovori SAMO sa validnim JSON objektom, bez markdown blokova:
{"reply":"tvoja replika na nemačkom","completed_goals":[0],"is_finished":false${dialogMode === "guided" ? ',"choices":["opcija 1 na nemačkom","opcija 2 na nemačkom","opcija 3 na nemačkom"]' : ""}}

completed_goals: niz indeksa (0-based) SVIH ciljeva ispunjenih DO SAD (kumulativno).
is_finished: true samo ako su SVI ciljevi ispunjeni.${dialogMode === "guided" ? "\nchoices: 3 ponuđena odgovora za studenta na nemačkom, prilagođena nivou " + level + "." : ""}

Ako su svi ciljevi ispunjeni, postavi is_finished na true i dodaj summary polje sa korekcijama (kao u formatu za poslednju razmenu).`}`;

  try {
    const claudeMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    });

    let responseText = message.content[0].type === "text" ? message.content[0].text : "";
    responseText = responseText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    try {
      const parsed = JSON.parse(responseText);
      if (parsed.summary?.corrections && parsed.summary.corrections.length > 3) {
        parsed.summary.corrections = parsed.summary.corrections.slice(0, 3);
      }
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        reply: responseText,
        completed_goals: [],
        is_finished: false,
      });
    }
  } catch (error) {
    console.error("Dialog AI error:", error);
    return NextResponse.json({
      reply: "Greška pri komunikaciji sa AI-jem.",
      completed_goals: [],
      is_finished: true,
      summary: null,
    });
  }
}
