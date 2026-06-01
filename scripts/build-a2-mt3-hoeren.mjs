// Kreira lekciju "Modelltest 3 — Hören" (A2.2) + Hören vežbu (Teil 1 tekst,
// Teil 3 slike, Teil 4 Ja/Nein), 15 pitanja, sa audiom i slikama iz Cornelsen MT3.
// Dry-run default; --apply. Idempotentno.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const COURSE = "0b4a095e-2841-4fe8-b6b0-ed0973a30e31"; // nemacki-a2-2
const A = "/audio/hoeren-mt3";

const T1HEAD = "<strong>Hören Teil 1</strong> — Slušaj audio (svaki tekst 2×) i izaberi tačan odgovor.<br><br>";
const T3HEAD = "<strong>Hören Teil 3</strong> — Slušaj kratke razgovore i izaberi sliku (a / b / c).<br><br>";
const T4HEAD = "<strong>Hören Teil 4</strong> — Interview. Odgovori Ja ili Nein.<br><br>";
const q = (n, txt, head = "") => `${head}<strong>${n}.</strong> ${txt}`;
const img = (n, alt) => `<br><img src="${A}/q${n}.png" alt="${alt}" class="rounded-lg">`;

const QUESTIONS = [
  // Teil 1 — audio teil1.mp3 (text a/b/c)
  { question: q(1, "Wie kann man 50 Euro gewinnen?", T1HEAD), items: ["Man muss am Wochenende Radio Pop FM hören.", "Man muss eine E-Mail schreiben.", "Man muss am Telefon seinen Musikwunsch sagen."], correct: "0", audio: `${A}/teil1.mp3` },
  { question: q(2, "Wie wird das Wetter in Norddeutschland?"), items: ["Die Sonne scheint.", "Es regnet.", "Es gibt Schnee."], correct: "2", audio: `${A}/teil1.mp3` },
  { question: q(3, "Was möchte Anne tun?"), items: ["Ihre Freundin besuchen.", "Tanzen gehen.", "Ein Buch lesen."], correct: "0", audio: `${A}/teil1.mp3` },
  { question: q(4, "Was sagt die Frau von der Sprachschule?"), items: ["Die Schule hat eine neue Adresse.", "Es gibt keine freien Plätze mehr.", "Der Kurs fängt später an."], correct: "0", audio: `${A}/teil1.mp3` },
  { question: q(5, "Wie kommt man heute zum Hauptbahnhof?"), items: ["Mit der Straßenbahn.", "Mit der Straßenbahn und dem Bus.", "Nur zu Fuß."], correct: "1", audio: `${A}/teil1.mp3` },
  // Teil 3 — audio teil3.mp3 (slike, opcije a/b/c)
  { question: q(11, "Was möchte John trinken?", T3HEAD) + img(11, "a) Kaffee  b) Wasser/Saft  c) Bier"), items: ["a", "b", "c"], correct: "1", audio: `${A}/teil3.mp3` },
  { question: q(12, "Wie wird das Wetter am Wochenende?") + img(12, "a) Regen  b) Sonne  c) Wolken"), items: ["a", "b", "c"], correct: "1", audio: `${A}/teil3.mp3` },
  { question: q(13, "Wie kommt der Mann zur Arbeit?") + img(13, "a) Auto  b) Fahrrad  c) Bus"), items: ["a", "b", "c"], correct: "2", audio: `${A}/teil3.mp3` },
  { question: q(14, "Was hat die Frau vergessen?") + img(14, "a) unterschreiben  b) Mietvertrag/Schlüssel  c) Möbel"), items: ["a", "b", "c"], correct: "0", audio: `${A}/teil3.mp3` },
  { question: q(15, "Was ist kaputt?") + img(15, "a) Fenster  b) Aufzug  c) Heizung"), items: ["a", "b", "c"], correct: "1", audio: `${A}/teil3.mp3` },
  // Teil 4 — audio teil4.mp3 (Ja/Nein)
  { question: q(16, "Herr Hermann fährt mit dem Bus zur Arbeit.", T4HEAD), items: ["Ja", "Nein"], correct: "0", audio: `${A}/teil4.mp3` },
  { question: q(17, "In der Freizeit benutzt er sein Auto nicht oft."), items: ["Ja", "Nein"], correct: "1", audio: `${A}/teil4.mp3` },
  { question: q(18, "Herr Hermann findet Radfahren in der Stadt nicht gefährlich."), items: ["Ja", "Nein"], correct: "0", audio: `${A}/teil4.mp3` },
  { question: q(19, "Herr Hermann ist auch als Jugendlicher schon gern Fahrrad gefahren."), items: ["Ja", "Nein"], correct: "1", audio: `${A}/teil4.mp3` },
  { question: q(20, "Sein Sohn hat ein Motorrad zum Geburtstag bekommen."), items: ["Ja", "Nein"], correct: "1", audio: `${A}/teil4.mp3` },
];

// 1) lekcija
let { data: lesson } = await sb.from("lessons").select("id").eq("course_id", COURSE).eq("title", "Modelltest 3 — Hören").maybeSingle();
if (lesson) {
  console.log("Lekcija 'Modelltest 3 — Hören' već postoji:", lesson.id);
} else {
  console.log("→ kreiram lekciju 'Modelltest 3 — Hören' (order_index 34)");
  if (APPLY) {
    const sections = [
      { type: "badge", module: "Modelltest 3", category: "hoeren" },
      { type: "text", style: "info", content: "## Modelltest 3 — Hören\n\nVežbaj slušanje kao na ispitu (Goethe-Zertifikat A2). Pusti audio za svaki deo i izaberi tačan odgovor.\n\n- **Teil 1:** 5 kratkih tekstova (slušaš 2×), a/b/c\n- **Teil 3:** 5 kratkih razgovora — izaberi **sliku** (a/b/c)\n- **Teil 4:** intervju — **Ja/Nein**" },
    ];
    const { data: created, error } = await sb.from("lessons").insert({ course_id: COURSE, title: "Modelltest 3 — Hören", lesson_type: "text", content: "", order_index: 34, is_free_preview: false, sections }).select("id").single();
    if (error) { console.log("  ERROR lekcija:", error.message); process.exit(1); }
    lesson = created; console.log("  ✓ lekcija:", lesson.id);
  }
}

// 2) vežba + pitanja
if (APPLY && lesson) {
  const { data: exEx } = await sb.from("exercises").select("id").eq("lesson_id", lesson.id).eq("title", "Hören — Modelltest 3").maybeSingle();
  if (exEx) { console.log("Vežba već postoji:", exEx.id); }
  else {
    const { data: ex, error: exErr } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: "Hören — Modelltest 3", exercise_type: "quiz", order_index: 0 }).select("id").single();
    if (exErr) { console.log("  ERROR vežba:", exErr.message); process.exit(1); }
    console.log("  ✓ vežba:", ex.id);
    const rows = QUESTIONS.map((qq, i) => ({ exercise_id: ex.id, question: qq.question, options: { type: "quiz", items: qq.items }, correct_answer: qq.correct, explanation: null, audio_url: qq.audio, order_index: i }));
    const { error: qErr } = await sb.from("exercise_questions").insert(rows);
    console.log(qErr ? `  ERROR pitanja: ${qErr.message}` : `  ✓ ${rows.length} pitanja upisana`);
  }
} else if (!APPLY) {
  console.log(`(dry-run) bi se kreirala vežba 'Hören — Modelltest 3' sa ${QUESTIONS.length} pitanja`);
}
