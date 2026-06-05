// B2.1 — Gramatika + vežbe, MODUL 2 (konditional, Mittelfeld/Angaben, TeKaMoLo, zweiteilige Konnektoren).
// Dodaje text-sekciju (marker "## 📘") pre flashcard/vocabulary + quiz vežbu. Idempotentno. Dry-run; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3729f3f5-2582-44ff-bb10-c4cc2ab5676b";
const MARK = "## 📘";

const LESSONS = [
  {
    title: "Erwartungen in der Familie B2.1",
    grammar: `${MARK} Gramatika: Konditionale Zusammenhänge (Bedingungen)

Uslov (Bedingung) izražavamo na više načina:

**Realna mogućnost — wenn / falls** (zavisna rečenica, glagol na kraj):
• ***Wenn** der Familienbetrieb gut läuft, sollten die Kinder ihn übernehmen.*
• *Ich nehme einen Schirm mit, **falls** es regnet.*

**Irealna (zamišljena) — Konjunktiv II:**
• ***Wenn** alle toleranter **wären**, **würde** sich das positiv auswirken.*

**Bez „wenn" (uneingeleitet)** — glagol na 1. mestu:
• ***Wären** alle toleranter, würde sich das positiv auswirken.*

**Posledica neispunjenog uslova — sonst / andernfalls:**
• *Beeil dich, **sonst** verpassen wir den Zug.*`,
    exTitle: "Übung: Konditionale Zusammenhänge",
    questions: [
      ["___ ich mehr Zeit hätte, würde ich meinen Eltern öfter helfen.", ["Wenn", "Als", "Weil", "Obwohl"], 0],
      ["___ meine Eltern toleranter, gäbe es weniger Streit. (ohne „wenn\")", ["Wären", "Wenn wären", "Würden", "Sind"], 0],
      ["Ich nehme einen Regenschirm mit, ___ es regnet.", ["falls", "als", "obwohl", "damit"], 0],
      ["Beeil dich, ___ verpassen wir den Zug.", ["sonst", "wenn", "falls", "weil"], 0],
      ["___ ich du wäre, würde ich offen mit den Eltern sprechen.", ["Wenn", "Als", "Ob", "Während"], 0],
      ["Wenn der Betrieb gut ___, sollten die Kinder ihn übernehmen.", ["läuft", "liefe wäre", "gelaufen würde", "laufen hätte"], 0],
    ],
  },
  {
    title: "Wortstellung im Mittelfeld",
    grammar: `${MARK} Gramatika: Ergänzungen und Angaben im Mittelfeld

Pored dopuna (Ergänzungen: objekti), u srednjem polju stoje i **priloške odredbe (Angaben)**. Njihov redosled:

**Angaben — TeKaMoLo:** **Te**mporal (kada?) → **Ka**usal (zašto?) → **Mo**dal (kako?) → **Lo**kal (gde/kuda?)
• *Ich fahre **morgen** (te) **wegen der Arbeit** (ka) **mit dem Auto** (mo) **nach Berlin** (lo).*

**Dopune + odredbe:**
• Dativ-dopuna stoji rano; Akkusativ-dopuna (imenica) obično kasnije, posle vremenske odredbe.
 *Er hat **seiner Mutter** (D) **zum Geburtstag** (te) **Blumen** (A) geschenkt.*
• **Zamenice idu maksimalno napred** (ispred odredbi): *Er hat **es ihr** gestern geschenkt.*`,
    exTitle: "Übung: Mittelfeld — Ergänzungen & Angaben",
    questions: [
      ["Ich habe … gearbeitet. (gestern / wegen des Projekts / im Büro)", ["gestern wegen des Projekts im Büro", "im Büro gestern wegen des Projekts", "wegen des Projekts im Büro gestern", "gestern im Büro wegen des Projekts"], 0],
      ["Sie fährt … . (mit dem Zug / morgen / nach Wien)", ["morgen mit dem Zug nach Wien", "mit dem Zug morgen nach Wien", "nach Wien morgen mit dem Zug", "morgen nach Wien mit dem Zug"], 0],
      ["Er hat … geschenkt. (seiner Mutter / zum Geburtstag / Blumen)", ["seiner Mutter zum Geburtstag Blumen", "Blumen seiner Mutter zum Geburtstag", "zum Geburtstag seiner Mutter Blumen", "seiner Mutter Blumen zum Geburtstag"], 0],
      ["Pronominale Ergänzungen (z. B. „es ihr\") stehen im Mittelfeld …", ["möglichst weit vorne", "ganz am Satzende", "immer nach den Angaben", "nach dem Vollverb"], 0],
    ],
  },
  {
    title: "TeKaMoLo",
    grammar: `${MARK} Gramatika: TeKaMoLo — Reihenfolge der Angaben

Kada u rečenici imamo više priloških odredbi (Angaben), redosled je:

**TE — KA — MO — LO**
• **Te**mporal — *kada? wann?* (heute, morgen, um 8 Uhr)
• **Ka**usal — *zašto? warum?* (wegen des Wetters, aus Angst, deshalb)
• **Mo**dal — *kako? wie?* (mit dem Auto, zu Fuß, mit Freude, schnell)
• **Lo**kal — *gde/kuda? wo/wohin?* (zu Hause, nach Berlin, im Büro)

*Beispiel:* **Wir fahren** *morgen (te) wegen des Termins (ka) mit dem Zug (mo) nach Wien (lo).*

💡 Pomoć: redosled je isti kao u nemačkom „**Te-Ka-Mo-Lo**".`,
    exTitle: "Übung: TeKaMoLo",
    questions: [
      ["Welche Reihenfolge der Angaben ist richtig?", ["temporal – kausal – modal – lokal", "lokal – modal – kausal – temporal", "kausal – temporal – lokal – modal", "modal – temporal – kausal – lokal"], 0],
      ["Er geht … . (zu Fuß / heute / zur Schule)", ["heute zu Fuß zur Schule", "zu Fuß heute zur Schule", "zur Schule heute zu Fuß", "heute zur Schule zu Fuß"], 0],
      ["Wir bleiben … . (zu Hause / wegen des Wetters / heute)", ["heute wegen des Wetters zu Hause", "zu Hause heute wegen des Wetters", "wegen des Wetters zu Hause heute", "heute zu Hause wegen des Wetters"], 0],
      ["„mit großer Freude\" ist eine … Angabe.", ["modale", "temporale", "kausale", "lokale"], 0],
      ["„aus Angst\" ist eine … Angabe.", ["kausale", "modale", "temporale", "lokale"], 0],
    ],
  },
  {
    title: "Zweiteilige Konnektoren",
    grammar: `${MARK} Gramatika: Zweiteilige Konnektoren (dvodelni veznici)

Povezuju delove rečenice ili cele rečenice u parovima:

• **sowohl … als auch** — i … i *(Sie ist sowohl klug als auch fleißig.)*
• **weder … noch** — ni … ni *(Ich mag weder Kaffee noch Tee.)*
• **entweder … oder** — ili … ili *(Entweder du kommst, oder du bleibst.)*
• **nicht nur … sondern auch** — ne samo … nego i *(Nicht nur die Technik, sondern auch der Markt ändert sich.)*
• **zwar … aber** — doduše … ali *(Man trifft sich zwar täglich, aber kurz.)*
• **je … desto / umso** — što … to (+ komparativ) *(Je mehr man übt, desto besser wird man.)*`,
    exTitle: "Übung: Zweiteilige Konnektoren",
    questions: [
      ["Man kann ___ mit starren Hierarchien ___ mit Einzelkämpfern schnell reagieren.", ["weder … noch", "sowohl … als auch", "entweder … oder", "zwar … aber"], 0],
      ["___ die Technik ___ auch der Markt verändert sich schnell.", ["Nicht nur … sondern", "Weder … noch", "Je … desto", "Entweder … oder"], 0],
      ["Die Mitarbeiter müssen ___ für Kritik ___ für Planänderungen offen sein.", ["sowohl … als auch", "weder … noch", "entweder … oder", "je … desto"], 0],
      ["Man trifft sich ___ jeden Tag, ___ die Besprechungen sind kurz.", ["zwar … aber", "sowohl … als auch", "weder … noch", "nicht nur … sondern"], 0],
      ["___ braucht man die Funktion nicht mehr, ___ die Konkurrenz hat eine bessere Lösung.", ["Entweder … oder", "Sowohl … als auch", "Weder … noch", "Zwar … aber"], 0],
      ["___ mehr man übt, ___ besser wird man.", ["Je … desto", "Zwar … aber", "Entweder … oder", "Sowohl … als auch"], 0],
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
  const sec = { type: "text", content: L.grammar, style: "default" };
  let idx = base.findIndex((s) => s.type === "flashcard" || s.type === "vocabulary");
  if (idx === -1) idx = base.length;
  base.splice(idx, 0, sec);
  const { error: upErr } = await sb.from("lessons").update({ sections: base }).eq("id", lesson.id);
  if (upErr) throw upErr;

  await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", L.exTitle);
  const { data: ex, error: exErr } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: L.exTitle, exercise_type: "quiz", order_index: 0 }).select("id").single();
  if (exErr) throw exErr;
  let i = 0;
  for (const [q, items, correct] of L.questions) {
    const { error } = await sb.from("exercise_questions").insert({ exercise_id: ex.id, question: q, options: { type: "quiz", items }, correct_answer: String(correct), question_type: "quiz", order_index: i++ });
    if (error) throw error;
  }
}
console.log(APPLY ? "✓ Gotovo (Modul 2 gramatika + vežbe)" : "[DRY] Pokreni sa --apply za upis.");
