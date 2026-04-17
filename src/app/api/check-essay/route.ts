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

Kriterijumi za ocenjivanje prema nivou:
- A1: Očekuju se jednostavne rečenice, osnovni vokabular. Tolerišu se greške u redu reči. Važno je da student koristi prave glagole i osnovna pravila (član, rod).
- A2: Očekuju se povezane rečenice, prošlo vreme (Perfekt), modalni glagoli. Manje tolerancije za osnovne greške.
- B1: Očekuju se složenije rečenice, veznici (weil, dass, obwohl), Konjunktiv II za želje. Greške u osnovnoj gramatici se strogo ocenjuju.
- B2: Očekuje se tečan izraz, pasiv, indirektni govor, bogat vokabular. Visoki standardi.

Zadatak: "${task}"
Student je napisao: "${text}"

Pravila:
- Feedback na SRPSKOM jeziku, kratak (1-2 rečenice)
- Maksimum 3 najvažnije ispravke
- Objašnjenja kratka (1 rečenica)
- Ocenjuj STROGO prema nivou — isti tekst na A1 može biti 4/5, a na B1 samo 2/5
- Budi ohrabrujući ali tačan

Odgovori SAMO sa validnim JSON objektom, bez markdown blokova:
{"feedback":"kratka pohvala i savet","corrections":[{"original":"greška","corrected":"ispravka","explanation":"zašto"}],"score":3}`,
        },
      ],
    });

    let responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Strip markdown code block if AI wraps it
    responseText = responseText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    try {
      const parsed = JSON.parse(responseText);
      // Limit to max 3 corrections
      if (parsed.corrections && parsed.corrections.length > 3) {
        parsed.corrections = parsed.corrections.slice(0, 3);
      }
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
