// C1.1 — kreira sadržajni kurs nemacki-c1-1 (is_published=false) sa 18 lekcija:
// Willkommen + 4 modula x (3 lekcije + Reči) + Abschlusstest (kviz 25 pitanja).
// Podaci: scripts/c1-1-data/modul-{1..4}.json + abschlusstest.json. Idempotentno. --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const SLUG = "nemacki-c1-1";
const COURSE = {
  title: "Nemački C1.1",
  slug: SLUG,
  description: "Video kurs nemačkog jezika za nivo C1.1 (prva polovina C1). 4 modula sa po 3 lekcije: gramatika sa objašnjenjima na nemačkom, reči sa karticama i završni test.",
  course_type: "video",
  is_published: false,
  is_purchasable: false,
};

const data = [1, 2, 3, 4].map((n) => JSON.parse(readFileSync(`scripts/c1-1-data/modul-${n}.json`, "utf8")));
const test = JSON.parse(readFileSync("scripts/c1-1-data/abschlusstest.json", "utf8"));

// ---- plan lekcija (title -> sections), redosled = order_index
const plan = [];
plan.push({
  title: "Willkommen",
  sections: [
    { type: "badge", module: "Willkommen" },
    {
      type: "text",
      style: "info",
      content:
        "## Willkommen zum C1.1-Kurs! 🎉\n\nHerzlich willkommen zu deinem **C1.1-Kurs**! Wir freuen uns, dich auf deinem Weg zu besseren Deutschkenntnissen zu begleiten.\n\nDer Kurs ist in **4 Module** mit je drei Lektionen aufgeteilt. In jeder Lektion findest du **Grammatik mit Erklärungen auf Deutsch, Wortschatz mit Lernkarten und Übungen**. Am Ende wartet ein **Abschlusstest**.\n\nViel Erfolg und Spaß beim Lernen! 💪",
    },
  ],
});
for (const mod of data) {
  for (const l of mod.lessons) plan.push({ title: l.title, sections: l.sections });
  plan.push({
    title: `${mod.module} - Reči`,
    sections: [
      { type: "badge", module: mod.module, category: "wortschatz" },
      ...mod.wordsets.map((w) => ({
        type: "wordset",
        title: w.title,
        setKey: w.setKey,
        items: w.items,
      })),
    ],
  });
}
plan.push({
  title: test.lessonTitle,
  sections: [
    { type: "badge", module: "Završni ispit", category: "grammatik", pruefung: true },
    {
      type: "text",
      style: "info",
      content:
        "## 📝 Abschlusstest C1.1\n\nMit diesem Test überprüfst du den gesamten Lernstoff des Kurses: **25 Aufgaben** zu Grammatik und Wortschatz aller 12 Lektionen sowie ein kurzer Lesetext.\n\nNimm dir ca. **30 Minuten** Zeit. Viel Erfolg!\n\n**Mit mehr als 60 % (ab 16 von 25 Punkten) erhältst du automatisch dein Zertifikat des HARTWEGER-Zentrums.** Du kannst den Test wiederholen - es zählt das beste Ergebnis.",
    },
    { type: "exercise", title: test.exerciseTitle },
  ],
});

// ---- validacija pre pisanja
const okTypes = new Set(["badge", "text", "table", "wordset", "exercise"]);
for (const l of plan) {
  for (const s of l.sections) {
    if (!okTypes.has(s.type)) throw new Error(`Nepoznat tip sekcije "${s.type}" u lekciji "${l.title}"`);
    if (s.type === "wordset" && (!s.setKey || !Array.isArray(s.items) || !s.items.length))
      throw new Error(`Prazan wordset u "${l.title}"`);
  }
}
const totalWords = data.flatMap((m) => m.wordsets).reduce((a, w) => a + w.items.length, 0);
console.log(`Plan: ${plan.length} lekcija, ${totalWords} reči, test sa ${test.questions.length} pitanja. APPLY=${APPLY}`);

// ---- kurs
let { data: course } = await sb.from("courses").select("id,slug,is_published").eq("slug", SLUG).maybeSingle();
if (!course) {
  console.log(`+ kurs ${SLUG} (is_published=false)`);
  if (APPLY) {
    const { data: c, error } = await sb.from("courses").insert(COURSE).select("id,slug").single();
    if (error) throw error;
    course = c;
  }
} else {
  console.log(`= kurs ${SLUG} postoji (id=${course.id}, is_published=${course.is_published}) — ne diram courses red`);
}

if (!APPLY && !course) {
  console.log("Dry-run bez postojećeg kursa — lekcije bi bile kreirane kako sledi:");
  plan.forEach((l, i) => console.log(`  ${i + 1}. ${l.title} (${l.sections.length} sekcija)`));
  process.exit(0);
}

// ---- lekcije (idempotentno po naslovu unutar kursa)
const { data: existing, error: exErr } = await sb.from("lessons").select("id,title,order_index").eq("course_id", course.id);
if (exErr) throw exErr;
const byTitle = new Map((existing ?? []).map((l) => [l.title, l]));

let lessonIdByTitle = new Map();
for (let i = 0; i < plan.length; i++) {
  const l = plan[i];
  const order = i + 1;
  const row = {
    course_id: course.id,
    title: l.title,
    lesson_type: "text",
    sections: l.sections,
    order_index: order,
    is_free_preview: false,
  };
  const ex = byTitle.get(l.title);
  if (ex) {
    console.log(`~ update lekcija ${order}. ${l.title}`);
    if (APPLY) {
      const { error } = await sb.from("lessons").update({ sections: l.sections, order_index: order }).eq("id", ex.id);
      if (error) throw error;
    }
    lessonIdByTitle.set(l.title, ex.id);
  } else {
    console.log(`+ insert lekcija ${order}. ${l.title}`);
    if (APPLY) {
      const { data: ins, error } = await sb.from("lessons").insert(row).select("id").single();
      if (error) throw error;
      lessonIdByTitle.set(l.title, ins.id);
    }
  }
}

// ---- Abschlusstest vežba + pitanja
const testLessonId = lessonIdByTitle.get(test.lessonTitle);
if (APPLY && testLessonId) {
  let { data: exr } = await sb.from("exercises").select("id").eq("lesson_id", testLessonId).eq("title", test.exerciseTitle).maybeSingle();
  if (!exr) {
    console.log(`+ vežba "${test.exerciseTitle}"`);
    const { data: e, error } = await sb
      .from("exercises")
      .insert({ lesson_id: testLessonId, title: test.exerciseTitle, exercise_type: "quiz", order_index: 1 })
      .select("id")
      .single();
    if (error) throw error;
    exr = e;
  } else {
    console.log(`~ vežba postoji — zamenjujem pitanja`);
    const { error } = await sb.from("exercise_questions").delete().eq("exercise_id", exr.id);
    if (error) throw error;
  }
  const rows = test.questions.map((q, i) => ({
    exercise_id: exr.id,
    question: q.question,
    options: { type: "quiz", items: q.items, ...(q.context ? { context: q.context } : {}) },
    correct_answer: String(q.correct),
    explanation: q.explanation ?? null,
    question_type: "quiz",
    order_index: i + 1,
  }));
  const { error: qErr } = await sb.from("exercise_questions").insert(rows);
  if (qErr) throw qErr;
  console.log(`+ ${rows.length} pitanja upisano`);
} else if (!APPLY) {
  console.log(`(dry-run) vežba "${test.exerciseTitle}" sa ${test.questions.length} pitanja`);
}

console.log(APPLY ? "GOTOVO (apply)." : "GOTOVO (dry-run — ništa nije pisano). Pokreni sa --apply.");
