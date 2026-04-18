import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface DialogMessage {
  role: "user" | "assistant";
  content: string;
}

interface DialogRequest {
  exerciseId: string;
  messages: DialogMessage[];
  turnNumber: number;
  scenario: string;
  aiRole: string;
  level: string;
  dialogMode: "guided" | "free";
  maxTurns: number;
  goals: string[];
  systemPromptExtra?: string;
}

export async function POST(request: Request) {
  const body: DialogRequest = await request.json();
  const {
    messages,
    turnNumber,
    scenario,
    aiRole,
    level,
    dialogMode,
    maxTurns,
    goals,
    systemPromptExtra,
  } = body;

  if (!messages || !scenario || !aiRole || !goals) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

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
- Budi kratak — 1-2 rečenice po odgovoru
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
