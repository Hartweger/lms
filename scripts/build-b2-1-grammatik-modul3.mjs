// B2.1 — Gramatika + vežbe, MODUL 3 (finale, Zustandspassiv/Passiversatz, adversative Zusammenhänge).
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
    title: "Finalsätze",
    grammar: `${MARK} Gramatika: Finale Zusammenhänge — Ziele und Zwecke (cilj/svrha)

Cilj ili svrhu izražavamo:

• **um … zu** + Infinitiv — kada je **subjekat isti** u obe rečenice:
 *Ich lerne, **um** die Prüfung **zu** bestehen.*
• **damit** — kada je **subjekat različit** (ili kod modalnih značenja):
 *Ich erkläre es dir, **damit** du es verstehst.*
• **zu / für** + imenica, **zwecks** + Genitiv (formalno):
 ***Zur** Vorbereitung lerne ich. / **Für** die Prüfung lerne ich.*

💡 Pravilo: isti subjekat → **um … zu**; različit subjekat → **damit**.`,
    exTitle: "Übung: Finalsätze",
    questions: [
      ["Ich lerne Deutsch, ___ in Deutschland zu studieren.", ["um", "damit", "weil", "dass"], 0],
      ["Ich erkläre es dir noch einmal, ___ du es verstehst.", ["damit", "um", "um zu", "weil"], 0],
      ["___ Vorbereitung auf die Prüfung mache ich viele Übungen.", ["Zur", "Damit", "Um", "Für zu"], 0],
      ["Wir sprechen langsam, ___ uns die Gäste verstehen.", ["damit", "um", "um zu", "ohne dass"], 0],
      ["Welcher Satz ist richtig?", ["Ich gehe früh schlafen, um fit zu sein.", "Ich gehe früh schlafen, damit fit zu sein.", "Ich gehe früh schlafen, um dass ich fit bin.", "Ich gehe früh schlafen, für fit sein."], 0],
      ["Sie joggt jeden Tag, ___ gesund ___ bleiben.", ["um … zu", "damit … zu", "um … —", "damit … —"], 0],
    ],
  },
  {
    title: "Alternativen zu Passiv",
    grammar: `${MARK} Gramatika: Zustandspassiv und Passiversatzformen

**Vorgangspassiv** (radnja): *werden* + Partizip II — *Die Tür **wird** geöffnet.*
**Zustandspassiv** (rezultat/stanje): *sein* + Partizip II — *Die Tür **ist** geöffnet.*

**Alternative za pasiv (Passiversatz):**
• **man** + aktiv — ***Man** öffnet die Tür.*
• **sich lassen** + Infinitiv (= kann … werden) — *Die Tür **lässt sich** öffnen.*
• **sein + zu + Infinitiv** (= muss/kann … werden) — *Der Fehler **ist** leicht **zu** finden.*
• pridev na **-bar** (= kann … werden) — *Das Problem ist **lösbar**.*`,
    exTitle: "Übung: Zustandspassiv & Passiversatz",
    questions: [
      ["Vorgangspassiv: „Das Haus ___ gerade gebaut.\"", ["wird", "ist", "hat", "lässt"], 0],
      ["Zustandspassiv (Resultat): „Das Haus ___ schon gebaut.\"", ["ist", "wird", "hat", "lässt"], 0],
      ["„Das Problem lässt sich lösen.\" bedeutet:", ["Das Problem kann gelöst werden.", "Das Problem wird gelöst.", "Das Problem ist schon gelöst.", "Man muss das Problem nicht lösen."], 0],
      ["„Der Fehler ist leicht zu finden.\" bedeutet:", ["Der Fehler kann leicht gefunden werden.", "Der Fehler wurde gefunden.", "Der Fehler ist schon gefunden.", "Niemand findet den Fehler."], 0],
      ["Welcher Satz ist Zustandspassiv?", ["Die Tür ist geschlossen.", "Die Tür wird geschlossen.", "Man schließt die Tür.", "Die Tür lässt sich schließen."], 0],
      ["Passiversatz mit „man\": „Hier ___ man nicht rauchen.\"", ["darf", "wird", "ist", "lässt"], 0],
    ],
  },
  {
    title: "So tickt unsere innere Uhr! – Tagesrhythmus",
    grammar: `${MARK} Gramatika: Adversative Zusammenhänge — Gegensätze ausdrücken (suprotnost)

Suprotnost (kontrast) izražavamo:

• **aber / doch / jedoch** — *Ich bin müde, **aber** ich arbeite weiter.*
• **während / wohingegen** (zavisna rečenica, glagol na kraj):
 *Ich bin Frühaufsteher, **während** mein Bruder lange **schläft**.*
• **hingegen / dagegen** (prilozi, glagol odmah iza):
 *Ich liebe den Morgen; meine Schwester **hingegen liebt** die Nacht.*
• **zwar … aber** — *Ich bin **zwar** müde, **aber** glücklich.*`,
    exTitle: "Übung: Adversative Zusammenhänge",
    questions: [
      ["Ich bin Frühaufsteher, ___ mein Bruder lange schläft.", ["während", "weil", "damit", "sodass"], 0],
      ["Ich liebe den Morgen; meine Schwester ___ liebt die Nacht.", ["hingegen", "deshalb", "deswegen", "darum"], 0],
      ["Morgens bin ich fit; abends ___ bin ich oft müde.", ["dagegen", "deshalb", "darum", "sodass"], 0],
      ["Welcher Konnektor drückt einen Gegensatz aus?", ["jedoch", "deshalb", "deswegen", "also"], 0],
      ["Tagsüber bin ich aktiv, ___ ich abends lieber ruhe.", ["wohingegen", "weil", "damit", "sodass"], 0],
    ],
  },
];

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b2-1").single();
for (const L of LESSONS) {
  const { data: lesson } = await sb.from("lessons").select("id,sections").eq("course_id", CID).eq("title", L.title).maybeSingle();
  if (!lesson) { console.error(`✗ "${L.title}" ne postoji — preskačem`); continue; }
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
console.log(APPLY ? "✓ Gotovo (Modul 3 gramatika + vežbe)" : "[DRY] --apply za upis.");
