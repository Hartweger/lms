import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Previše zahteva. Pokušaj ponovo za minut." }, { status: 429 });
  }

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
          content: `Ti si iskusan ocenjivač Schreiben zadataka po kriterijumima Goethe-Instituta. Student je na nivou ${level || "A1"}.

Goethe pristup (NE traži se savršenstvo, već KOMUNIKATIVNI USPEH) - oceni kroz 4 dimenzije:
1. ERFÜLLUNG (sadržaj/zadatak) - da li su obrađene sve tačke zadatka i da li je dužina primerena? Ovo je NAJVAŽNIJE.
2. KOHÄRENZ (povezanost) - da li tekst teče i da li su rečenice smisleno povezane?
3. WORTSCHATZ (vokabular) - da li je izbor reči razumljiv i primeren nivou?
4. KORREKTHEIT (gramatika) - broje se prvenstveno greške koje OTEŽAVAJU RAZUMEVANJE. Sitne greške koje ne ometaju komunikaciju NE snižavaju ocenu bitno.

Očekivanja po nivou (greške su NORMALNE, posebno na nižim nivoima):
- A1: jednostavne rečenice i osnovni vokabular su SASVIM DOVOLJNI. Ako se poruka razume i tačke su obrađene - visoka ocena, i pored grešaka u rodu, redu reči ili pravopisu.
- A2: povezane rečenice, prošlo vreme, modalni glagoli. Greške se tolerišu ako poruka prolazi.
- B1: složenije rečenice i veznici; greške koje ometaju razumevanje se računaju, ali komunikativni uspeh ostaje glavno merilo.
- B2: tečan i precizan izraz, viši standard - ali ni ovde se ne traži savršenstvo.

Zadatak: "${task}"
Student je napisao: "${text}"

Pravila:
- Oceni KOMUNIKATIVNI USPEH, ne savršenstvo. Ako je zadatak ispunjen i tekst razumljiv, ocena je visoka i pored grešaka.
- Skala 1-5: 5 = zadatak ispunjen, komunikacija potpuno uspešna (sitne greške dozvoljene); 4 = uspešno uz manje greške; 3 = razumljivo uz nekoliko grešaka ili delimično ispunjen zadatak; 2 = otežano razumevanje ili dosta nedostaje; 1 = zadatak nije ispunjen ili tekst nerazumljiv.
- Označi NAJVIŠE 3 ispravke, i to SAMO jasne greške (ne stilske preferencije); prednost greškama koje ometaju razumevanje. Na A1/A2 ne preteruj sa ispravkama.
- Feedback na SRPSKOM jeziku, kratak (1-2 rečenice), ohrabrujući ali konkretan.
- Objašnjenja kratka (1 rečenica).

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
