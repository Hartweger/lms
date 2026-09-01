import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import {
  buildGradingPrompt,
  computePoints,
  computeScore,
  GRADING_TOOL,
  normalizeCriteria,
  pickGradingModel,
} from "@/lib/essay-grading";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MAX_TEXT_CHARS = 8000;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = await rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Previše zahteva. Pokušaj ponovo za minut." }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text, task, level, maxPoints } = await request.json();

  if (!text || !task) {
    return NextResponse.json({ error: "Missing text or task" }, { status: 400 });
  }
  if (typeof text !== "string" || text.length > MAX_TEXT_CHARS) {
    return NextResponse.json({ error: "Tekst je predugačak." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "placeholder_key") {
    return NextResponse.json({
      feedback: "AI provera trenutno nije dostupna. Tvoj odgovor je sačuvan.",
      corrections: [],
      score: null,
    });
  }

  // Ispitne vežbe (Modelltest) nose 20/40 bodova - AI tada, pored ocene 1-5,
  // predlaže i bodove na pravoj skali (profesorki kao polazna vrednost).
  const mp = typeof maxPoints === "number" && Number.isFinite(maxPoints) ? maxPoints : 5;
  const isExam = mp > 5;

  try {
    const message = await anthropic.messages.create({
      model: pickGradingModel(level),
      max_tokens: 2048,
      temperature: 0,
      tools: [GRADING_TOOL],
      tool_choice: { type: "tool", name: GRADING_TOOL.name },
      messages: [
        { role: "user", content: buildGradingPrompt({ task, text, level, isExam }) },
      ],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("Nema tool_use bloka u odgovoru");
    const result = toolUse.input as {
      criteria?: unknown;
      nedostaje?: string;
      feedback?: string;
      corrections?: { original: string; corrected: string; explanation?: string }[];
    };

    // Zbirna ocena se računa deterministički iz kriterijuma (Erfüllung x2,
    // Erfüllung 0 obara rad) - ne prepušta se modelu.
    const criteria = normalizeCriteria(result.criteria);
    const score = computeScore(criteria);
    const suggestedPoints = isExam ? computePoints(criteria, mp) : undefined;

    return NextResponse.json({
      feedback: result.feedback || "",
      corrections: (result.corrections || []).slice(0, 3),
      score,
      criteria: {
        ...criteria,
        ...(result.nedostaje?.trim() ? { nedostaje: result.nedostaje.trim() } : {}),
        ...(suggestedPoints !== undefined ? { suggestedPoints, maxPoints: mp } : {}),
      },
    });
  } catch (error) {
    console.error("AI check error:", error);
    return NextResponse.json({
      feedback: "Greška pri proveri. Tvoj odgovor je sačuvan.",
      corrections: [],
      score: null,
    });
  }
}
