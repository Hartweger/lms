// B2.1 — Gramatika + vežbe, MODUL 1. Dodaje text-sekciju (objašnjenje) + quiz vežbu
// u postojeće gramatičke lekcije (koje već imaju Natašin video). Idempotentno.
// Grammar text se prepoznaje po marker-prefiksu "## 📘". Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const COURSE_SLUG = "nemacki-b2-1";
const MARK = "## 📘";

const LESSONS = [
  {
    title: "Nomen mit Präpositionen",
    grammar: `${MARK} Gramatika: Nomen mit fester Präposition

Mnoge **imenice imaju fiksni predlog** (baš kao i glagoli). Predlog ide uz imenicu i određuje padež:

• **die Angst vor** + Dativ — strah od
• **die Begeisterung für** + Akkusativ — oduševljenje za
• **der Grund für** + Akkusativ — razlog za
• **die Einstellung zu** + Dativ — stav prema
• **das Interesse an** + Dativ — interesovanje za
• **die Nähe zu** + Dativ — blizina
• **die Ausbildung zu** + Dativ — obuka za

**Pitanja:**
• za **stvari** → *wo(r)- + predlog*: **Wovor** hast du Angst? **Worauf** wartest du?
• za **osobe** → *predlog + wen/wem*: **Vor wem** hast du Angst? **Auf wen** wartest du?`,
    exTitle: "Übung: Nomen mit Präposition",
    questions: [
      ["die Angst ___ der Zukunft", ["vor", "für", "auf", "an"], 0],
      ["die Begeisterung ___ Sport", ["zu", "für", "von", "an"], 1],
      ["der Grund ___ die Entscheidung", ["für", "vor", "mit", "zu"], 0],
      ["die Einstellung ___ der Arbeit", ["für", "an", "zu", "über"], 2],
      ["das Interesse ___ Politik", ["an", "für", "auf", "über"], 0],
      ["die Nähe ___ der Familie", ["zu", "bei", "an", "mit"], 0],
      ["___ hast du Angst? (vor einer Prüfung)", ["Worauf", "Wovor", "Woran", "Wofür"], 1],
      ["___ wartest du? (auf deinen Freund)", ["Auf wen", "Worauf", "Auf was", "Wem"], 0],
    ],
  },
  {
    title: "Wortstellung mit Dativ und Akkusativ",
    grammar: `${MARK} Gramatika: Ergänzungen im Mittelfeld (Dativ & Akkusativ)

Redosled dopuna u srednjem polju (Mittelfeld) zavisi od toga da li su **imenice ili zamenice**:

• **Imenica + imenica:** Dativ **pre** Akkusativa — *Er schenkt **seiner Frau** (D) **Blumen** (A).*
• **Zamenica + imenica:** zamenica je **uvek prva** — *Er schenkt **ihr** Blumen. / Er schenkt **es** seiner Frau.*
• **Zamenica + zamenica:** Akkusativ **pre** Dativa — *Er schenkt **es** (A) **ihr** (D).*

**Ukratko:** kratko (zamenica) ispred dugog (imenica); kada su obe zamenice → **Akkusativ ispred Dativa**.`,
    exTitle: "Übung: Wortstellung im Mittelfeld",
    questions: [
      ["Ich gebe … (das Buch / dem Studenten)", ["dem Studenten das Buch", "das Buch dem Studenten", "dem Buch den Studenten", "das Studenten dem Buch"], 0],
      ["Er schenkt … (Blumen / ihr)", ["Blumen ihr", "ihr Blumen", "sie Blumen", "Blumen sie"], 1],
      ["Sie gibt … (es / dem Kind)", ["dem Kind es", "es dem Kind", "das Kind es", "es das Kind"], 1],
      ["Kannst du … erklären? (es / mir)", ["es mir", "mir es", "mich es", "es mich"], 0],
      ["Ich habe … gezeigt. (ihn / ihm)", ["ihm ihn", "ihn ihm", "ihn ihn", "ihm ihm"], 1],
      ["Der Lehrer erklärt … (die Regel / den Schülern)", ["die Regel den Schülern", "den Schülern die Regel", "die Schülern die Regel", "den Regel die Schüler"], 1],
    ],
  },
  {
    title: "Modalverben durch die Zeit",
    grammar: `${MARK} Gramatika: Modalverben im Perfekt

Kada modalni glagol u perfektu ima **glavni glagol uz sebe**, koristi se **dvostruki infinitiv** (Doppelinfinitiv): *haben* + infinitiv glavnog glagola + infinitiv modalnog glagola.

• *Ich **habe** lange **arbeiten müssen**.* (morao sam da radim)
• *Sie **hat** nicht kommen **können**.*

Kada **nema** glavnog glagola → običan particip:
• *Ich **habe** es nicht **gekonnt**.*

**U zavisnoj rečenici** pomoćni glagol *haben* dolazi **ispred** dvostrukog infinitiva (ne na kraj):
• *…, weil ich lange **habe arbeiten müssen**.*

💡 U govoru se umesto perfekta često koristi **preteritum**: *Ich **musste** lange arbeiten.*`,
    exTitle: "Übung: Modalverben im Perfekt",
    questions: [
      ["Ich habe gestern lange … .", ["arbeiten müssen", "gemusst arbeiten", "arbeiten gemusst", "müssen arbeiten"], 0],
      ["Sie hat leider nicht … .", ["kommen gekonnt", "kommen können", "können kommen", "gekonnt kommen"], 1],
      ["Wir haben das nicht … . (bez glavnog glagola)", ["wollen", "gewollt", "geworden", "mögen"], 1],
      ["Er ärgert sich, weil er … .", ["hat warten müssen", "warten müssen hat", "gemusst hat warten", "hat müssen warten"], 0],
      ["Als Kind habe ich früh ins Bett … .", ["gehen müssen", "müssen gehen", "gehen gemusst", "gemusst gehen"], 0],
    ],
  },
  {
    title: "Kausale Verbindungen",
    grammar: `${MARK} Gramatika: Kausale Zusammenhänge — Gründe angeben

Razlog (uzrok) možeš izraziti na više načina:

**Zavisna rečenica (glagol na kraj):**
• **weil / da** — *Ich bleibe zu Hause, **weil** ich krank **bin**.*

**Glavna rečenica (veznik na poziciji 0):**
• **denn** — *Ich bleibe zu Hause, **denn** ich **bin** krank.*

**Prilozi (glagol odmah iza — pozicija 2):**
• **deshalb / deswegen / daher / darum** — *Ich bin krank, **deshalb bleibe** ich zu Hause.*
• **nämlich** (u sredini rečenice) — *Ich bleibe zu Hause; ich **bin nämlich** krank.*

**Predlozi (+ Genitiv):**
• **wegen / aufgrund** + Genitiv — ***Wegen** der Krankheit bleibe ich zu Hause.*`,
    exTitle: "Übung: Kausale Verbindungen",
    questions: [
      ["Ich gehe nicht zur Arbeit, ___ ich krank bin.", ["weil", "denn", "deshalb", "wegen"], 0],
      ["Es regnet, ___ nehme ich den Schirm mit.", ["weil", "deshalb", "denn", "da"], 1],
      ["Sie lernt viel, ___ sie die Prüfung bestehen will.", ["deshalb", "denn", "weil", "wegen"], 2],
      ["___ des schlechten Wetters bleiben wir zu Hause.", ["Weil", "Denn", "Wegen", "Deshalb"], 2],
      ["___ ich schlecht geschlafen habe, bin ich heute müde.", ["Da", "Denn", "Deshalb", "Wegen"], 0],
      ["Er kommt zu spät, ___ der Stau sehr lang war.", ["weil", "deshalb", "wegen", "darum"], 0],
    ],
  },
];

const fmtGrammar = (s) => s; // TextBlock sam parsira markdown

const { data: course } = await sb.from("courses").select("id").eq("slug", COURSE_SLUG).single();
if (!course) { console.error(`Kurs ${COURSE_SLUG} ne postoji`); process.exit(1); }

for (const L of LESSONS) {
  const { data: lesson } = await sb.from("lessons").select("id,sections").eq("course_id", course.id).eq("title", L.title).maybeSingle();
  if (!lesson) { console.error(`✗ Lekcija "${L.title}" ne postoji — preskačem`); continue; }
  const existing = Array.isArray(lesson.sections) ? lesson.sections : [];
  const hadGrammar = existing.some((s) => s.type === "text" && typeof s.content === "string" && s.content.startsWith(MARK));
  console.log(`${hadGrammar ? "~" : "+"} "${L.title}": gramatika ${hadGrammar ? "(zamena)" : "(dodavanje)"} + vežba ${L.questions.length} pit.`);
  if (!APPLY) continue;

  // 1) sekcije: ukloni staru gramatiku, ubaci novu pre vocabulary (ili na kraj)
  const base = existing.filter((s) => !(s.type === "text" && typeof s.content === "string" && s.content.startsWith(MARK)));
  const grammarSec = { type: "text", content: fmtGrammar(L.grammar), style: "default" };
  const vIdx = base.findIndex((s) => s.type === "vocabulary");
  if (vIdx === -1) base.push(grammarSec); else base.splice(vIdx, 0, grammarSec);
  const { error: upErr } = await sb.from("lessons").update({ sections: base }).eq("id", lesson.id);
  if (upErr) throw upErr;

  // 2) vežba: obriši postojeću sa istim naslovom, ubaci novu
  await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", L.exTitle);
  const { data: ex, error: exErr } = await sb.from("exercises").insert({
    lesson_id: lesson.id, title: L.exTitle, exercise_type: "quiz", order_index: 0,
  }).select("id").single();
  if (exErr) throw exErr;
  let i = 0;
  for (const [q, items, correct] of L.questions) {
    const { error } = await sb.from("exercise_questions").insert({
      exercise_id: ex.id, question: q, options: { type: "quiz", items },
      correct_answer: String(correct), question_type: "quiz", order_index: i++,
    });
    if (error) throw error;
  }
}
console.log(APPLY ? "✓ Gotovo (Modul 1 gramatika + vežbe)" : "[DRY] Pokreni sa --apply za upis.");
