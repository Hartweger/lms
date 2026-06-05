// B2.1 — Gramatika + vežbe, MODUL 4 (temporale, modale Zusammenhänge, Passiversatzformen).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3729f3f5-2582-44ff-bb10-c4cc2ab5676b";
const MARK = "## 📘";

const LESSONS = [
  {
    title: "Erfolg und Scheitern im Beruf",
    grammar: `${MARK} Gramatika: Temporale Zusammenhänge — Zeitbezüge

• **als** = jednom u prošlosti · **wenn** = ponavljanje / sadašnjost / budućnost
 ***Als** ich 2019 scheiterte … / Immer **wenn** ich scheitere, lerne ich daraus.*
• **während** = istovremeno · **bevor / ehe** = pre toga
 *Ich habe viel gelernt, **während** ich arbeitete. **Bevor** ich kündigte, sparte ich Geld.*
• **nachdem** = posle (radnja pre toga je u **Plusquamperfekt / Perfekt**)
 ***Nachdem** ich gescheitert **war**, fing ich neu an.*
• **sobald** = čim · **seit(dem)** = otkad · **bis** = dok (ne)
 *Warte, **bis** ich zurückkomme.*`,
    exTitle: "Übung: Temporale Zusammenhänge",
    questions: [
      ["___ ich gestern nach Hause kam, war niemand da.", ["Als", "Wenn", "Während", "Bis"], 0],
      ["Immer ___ ich ihn sehe, lächelt er.", ["wenn", "als", "nachdem", "bevor"], 0],
      ["___ er die Prüfung bestanden hatte, feierte er.", ["Nachdem", "Bevor", "Während", "Seit"], 0],
      ["Ich putze die Wohnung, ___ die Gäste kommen.", ["bevor", "nachdem", "seit", "bis"], 0],
      ["___ er in Berlin wohnt, ist er glücklicher.", ["Seit", "Bis", "Bevor", "Als"], 0],
      ["Warte hier, ___ ich zurückkomme.", ["bis", "seit", "während", "nachdem"], 0],
    ],
  },
  {
    title: "Minimalismus",
    grammar: `${MARK} Gramatika: Modale Zusammenhänge — Mittel und Umstände

Na koji način / kojim sredstvom?

• **indem** — *Ich spare Geld, **indem** ich weniger kaufe.*
• **dadurch, dass** — *Ich spare Geld **dadurch, dass** ich weniger kaufe.*
• **ohne … zu** (isti subjekat) / **ohne dass** (različit) — *Er ging, **ohne** sich **zu** verabschieden.*
• **(an)statt … zu** / **anstatt dass** (umesto da) — ***Anstatt** neue Dinge **zu** kaufen, repariert sie alte.*`,
    exTitle: "Übung: Modale Zusammenhänge",
    questions: [
      ["Ich spare Geld, ___ ich weniger kaufe.", ["indem", "ohne dass", "anstatt zu", "obwohl"], 0],
      ["Er verließ den Raum, ___ etwas ___ sagen.", ["ohne … zu", "indem … zu", "anstatt … —", "ohne dass … zu"], 0],
      ["___ neue Dinge zu kaufen, repariert sie alte.", ["Anstatt", "Indem", "Ohne", "Während"], 0],
      ["Man lebt nachhaltiger, ___ man weniger wegwirft.", ["indem", "ohne dass", "anstatt dass", "obwohl"], 0],
      ["Sie ging weg, ___ tschüs zu sagen.", ["ohne", "indem", "anstatt dass", "damit"], 0],
    ],
  },
  {
    title: "Nachbarschaft 2.0",
    grammar: `${MARK} Gramatika: Passiversatzformen (alternative za pasiv)

Umesto pasiva (*wird … + Partizip II*) često koristimo:

• **man** + aktiv — *In der App **kann man** Dinge teilen.*
• **sich lassen** + Infinitiv (= kann … werden) — *Das Werkzeug **lässt sich** leihen.*
• **sein + zu + Infinitiv** (= kann/muss … werden) — *Die Bohrmaschine **ist** im Netzwerk **zu** finden.*
• pridev na **-bar / -lich** (= kann … werden) — *Das Problem ist **lösbar**.*`,
    exTitle: "Übung: Passiversatzformen",
    questions: [
      ["„Das Werkzeug lässt sich leihen.\" bedeutet:", ["Das Werkzeug kann geliehen werden.", "Das Werkzeug wird geliehen.", "Das Werkzeug ist schon geliehen.", "Man leiht das Werkzeug nicht."], 0],
      ["Passiversatz mit „man\": „In der App ___ man Dinge teilen.\"", ["kann", "wird", "ist", "lässt"], 0],
      ["„Das Problem ist lösbar.\" bedeutet:", ["Das Problem kann gelöst werden.", "Das Problem wird gelöst.", "Das Problem ist schon gelöst.", "Das Problem muss gelöst werden."], 0],
      ["„Die Bohrmaschine ist im Netzwerk zu finden.\" bedeutet:", ["Sie kann gefunden werden.", "Sie wurde gefunden.", "Sie ist schon gefunden.", "Sie wird nie gefunden."], 0],
      ["Welcher Satz ist KEIN Passiversatz (sondern echtes Passiv)?", ["Das Haus wird gebaut.", "Das lässt sich machen.", "Man baut das Haus.", "Das ist machbar."], 0],
    ],
  },
];

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b2-1").single();
for (const L of LESSONS) {
  const { data: lesson } = await sb.from("lessons").select("id,sections").eq("course_id", CID).eq("title", L.title).maybeSingle();
  if (!lesson) { console.error(`✗ "${L.title}" ne postoji`); continue; }
  const existing = Array.isArray(lesson.sections) ? lesson.sections : [];
  const had = existing.some((s) => s.type === "text" && typeof s.content === "string" && s.content.startsWith(MARK));
  console.log(`${had ? "~" : "+"} "${L.title}": gramatika ${had ? "(zamena)" : "(dodavanje)"} + vežba ${L.questions.length} pit.`);
  if (!APPLY) continue;
  const base = existing.filter((s) => !(s.type === "text" && typeof s.content === "string" && s.content.startsWith(MARK)));
  let idx = base.findIndex((s) => s.type === "flashcard" || s.type === "vocabulary");
  if (idx === -1) idx = base.length;
  base.splice(idx, 0, { type: "text", content: L.grammar, style: "default" });
  await sb.from("lessons").update({ sections: base }).eq("id", lesson.id);
  await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", L.exTitle);
  const { data: ex } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: L.exTitle, exercise_type: "quiz", order_index: 0 }).select("id").single();
  let i = 0;
  for (const [q, items, correct] of L.questions) {
    await sb.from("exercise_questions").insert({ exercise_id: ex.id, question: q, options: { type: "quiz", items }, correct_answer: String(correct), question_type: "quiz", order_index: i++ });
  }
}
console.log(APPLY ? "✓ Gotovo (Modul 4 gramatika + vežbe)" : "[DRY] --apply za upis.");
