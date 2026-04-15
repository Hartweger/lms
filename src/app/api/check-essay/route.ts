import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const { text, task, level } = await request.json();

  if (!text || !task) {
    return NextResponse.json({ error: "Missing text or task" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "placeholder_key") {
    return NextResponse.json({
      feedback: "AI provera trenutno nije dostupna. Tvoj odgovor je sačuvan.",
      corrections: [],
      score: null,
    });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Ti si profesor nemačkog jezika. Student je na nivou ${level || "A1"}.

Zadatak koji je student dobio:
"${task}"

Student je napisao:
"${text}"

Proveri tekst i daj feedback NA SRPSKOM JEZIKU. Budi ohrabrujući ali tačan.

Odgovori u JSON formatu:
{
  "feedback": "Kratka poruka studentu na srpskom (2-3 rečenice, pohvali šta je dobro, ukaži na greške)",
  "corrections": [
    {"original": "pogrešan deo", "corrected": "ispravljen deo", "explanation": "kratko objašnjenje na srpskom"}
  ],
  "score": broj od 1 do 5 (1=treba dosta rada, 5=odlično)
}

Samo JSON, ništa drugo.`,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        feedback: responseText,
        corrections: [],
        score: null,
      });
    }
  } catch (error) {
    console.error("AI check error:", error);
    return NextResponse.json({
      feedback: "Greška pri proveri. Tvoj odgovor je sačuvan.",
      corrections: [],
      score: null,
    });
  }
}
