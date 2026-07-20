import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { getFixedTranslations } from "@/lib/fixed-translations";
import { getFixedWriting } from "@/lib/fixed-writing";
import type { Section } from "@/lib/section-types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const NUM_SENTENCES = 4;

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

  const body = await request.json();
  const { lessonId, action, mode } = body as { lessonId: string; action: "generate" | "check"; mode?: "translate" | "writing"; sentence?: string; answer?: string; correct?: string };
  const isWriting = mode === "writing";

  if (!lessonId) {
    return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "placeholder_key") {
    return NextResponse.json({ error: "AI nije dostupan." }, { status: 503 });
  }

  // Fetch lesson info
  const { data: lesson } = await supabase
    .from("lessons")
    .select("title, sections, course_id, courses(title)")
    .eq("id", lessonId)
    .single();

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const courseTitle = (lesson.courses as unknown as { title: string } | null)?.title ?? "";
  const levelMatch = courseTitle.match(/[AB][12]/i);
  const level = levelMatch ? levelMatch[0].toUpperCase() : "A1";

  const sections = (lesson.sections ?? []) as Section[];
  const flashcardSections = sections.filter((s) => s.type === "flashcard");
  const vocabList = flashcardSections
    .flatMap((s) => s.type === "flashcard" ? s.items : [])
    .map((item) => `${item.front} = ${item.back}`)
    .slice(0, 30)
    .join(", ");

  if (action === "generate" && isWriting) {
    // Vežba pisanja: samo fiksni zadaci (bez AI-generisanja).
    const tasks = getFixedWriting(lesson.title);
    if (tasks && tasks.length > 0) {
      return NextResponse.json({ sentences: tasks });
    }
    return NextResponse.json({ error: "Nema zadataka pisanja za ovu lekciju." }, { status: 404 });
  }

  if (action === "generate") {
    // Fiksni prevodi imaju prioritet (pravilo: prevod = fiksne rečenice, ne AI)
    const fixed = getFixedTranslations(lesson.title);
    if (fixed && fixed.length > 0) {
      return NextResponse.json({ sentences: fixed });
    }
    // Inače: AI-generisanje (rezerva)
    try {
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [{ role: "user", content: "Generiši rečenice." }],
        system: `Generiši tačno ${NUM_SENTENCES} jednostavne rečenice na SRPSKOM koje student treba da prevede na nemački.

Tema lekcije: "${lesson.title}"
Nivo: ${level}
${vocabList ? `Vokabular iz lekcije: ${vocabList}` : ""}

PRAVILA:
- Rečenice su na SRPSKOM jeziku
- Svaka rečenica koristi reči/teme iz lekcije
- Prilagodi težinu nivou ${level}
${level === "A1" ? "- Samo Präsens, jednostavne rečenice, 4-8 reči" : level === "A2" ? "- Präsens/Perfekt, srednje rečenice" : "- Složenije strukture"}
- Svaka rečenica mora imati JEDAN JASAN tačan prevod na nemački
- Ne koristi dvosmislene fraze

Odgovori ISKLJUČIVO validnim JSON nizom:
[{"sr": "srpska rečenica", "de": "tačan nemački prevod"}, ...]`
      });

      let text = message.content[0].type === "text" ? message.content[0].text : "[]";
      text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

      try {
        const sentences = JSON.parse(text);
        return NextResponse.json({ sentences });
      } catch {
        return NextResponse.json({ error: "Greška pri generisanju. Pokušaj ponovo." }, { status: 500 });
      }
    } catch (error) {
      console.error("[ai-translate] Generate error:", error);
      return NextResponse.json({ error: "Greška pri komunikaciji sa AI-jem." }, { status: 500 });
    }
  }

  if (action === "check") {
    const { sentence, answer, correct } = body as { lessonId: string; action: "check"; sentence: string; answer: string; correct: string };

    if (!sentence || !answer || !correct) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const userMsg = isWriting
      ? `Elementi zadatka: "${sentence}"\nTačno rešenje: "${correct}"\nOdgovor studenta: "${answer}"`
      : `Srpska rečenica: "${sentence}"\nTačan prevod: "${correct}"\nOdgovor studenta: "${answer}"`;
    const systemMsg = isWriting
      ? `Ti si profesor nemačkog na nivou ${level}. Student spaja zadate elemente u JEDNU rečenicu sa odgovarajućim gramatičkim sredstvom (npr. vremenski veznik bevor/nachdem/während i ispravno slaganje vremena).

Uporedi odgovor studenta sa tačnim rešenjem. Prihvati kao tačno ako je upotrebljen ISPRAVAN veznik/struktura i gramatika je tačna (slaganje vremena, red reči, glagol na kraju zavisne rečenice). Budi blag oko sitnih, gramatički ispravnih varijacija (npr. drugačiji red glavne i zavisne rečenice ako je smisao isti). Netačan veznik ili pogrešno vreme = netačno.

Odgovori ISKLJUČIVO validnim JSON objektom:
{"correct": true/false, "feedback": "kratko objašnjenje na srpskom (1 rečenica)", "corrected": "ispravna verzija ako je netačno, ili odgovor studenta ako je tačno"}`
      : `Ti si profesor nemačkog na nivou ${level}. Student prevodi rečenicu sa srpskog na nemački.

Uporedi odgovor studenta sa tačnim prevodom. Budi BLAG - ako je smisao isti i gramatika uglavnom tačna, prihvati kao tačno. Male greške u članu ili redu reči na A1 nivou su OK.

Odgovori ISKLJUČIVO validnim JSON objektom:
{"correct": true/false, "feedback": "kratko objašnjenje na srpskom (1 rečenica)", "corrected": "ispravna verzija ako je netačno, ili odgovor studenta ako je tačno"}`;

    try {
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: userMsg }],
        system: systemMsg
      });

      let text = message.content[0].type === "text" ? message.content[0].text : "{}";
      text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

      try {
        const result = JSON.parse(text);
        return NextResponse.json(result);
      } catch {
        return NextResponse.json({ correct: false, feedback: "Greška pri proveri.", corrected: correct });
      }
    } catch (error) {
      console.error("[ai-translate] Check error:", error);
      return NextResponse.json({ correct: false, feedback: "Greška pri komunikaciji.", corrected: correct });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
