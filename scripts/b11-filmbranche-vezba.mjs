// Zamena DW deep-linka na lekciji "Filme und Serien" našom kombinovanom vežbom:
// vokabular (match) + kratak B1 tekst + pitanja za razumevanje.
// Idempotentno: briše prethodno kreiranu vežbu istog naslova pre ponovnog upisa.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const LESSON_ID = "57987df9-dbce-4194-b63b-813dcfef7edd"; // Filme und Serien
const TITLE = "In der Filmbranche — Wortschatz & Leseverständnis";

const TEXT = `Die Filmbranche ist ein spannender, aber auch harter Beruf. Bevor ein Film ins Kino kommt, arbeiten viele Menschen monatelang daran.

Zuerst schreibt der Drehbuchautor die Geschichte. Danach sucht der Regisseur die passenden Schauspieler für die Rollen. Die Dreharbeiten dauern oft mehrere Wochen und finden an verschiedenen Orten statt. Manchmal müssen die Schauspieler eine Szene zehnmal oder öfter wiederholen, bis alles perfekt ist.

Auch das Team hinter der Kamera ist sehr wichtig: Ohne Beleuchtung, Ton und Schnitt gibt es keinen guten Film. Wenn der Film fertig ist, wird er auf einer Premiere zum ersten Mal gezeigt. Erst dann entscheiden die Zuschauer und die Kritiker, ob der Film ein Erfolg wird.`;

const ctx = { title: "In der Filmbranche", type: "text", content: TEXT };

const questions = [
  {
    order_index: 0,
    question_type: "match_pairs",
    question: "Spoji reči iz filmske industrije:",
    options: { type: "match_pairs", items: [
      { de: "der Regisseur", sr: "reditelj" },
      { de: "der Drehbuchautor", sr: "scenarista" },
      { de: "die Hauptrolle", sr: "glavna uloga" },
      { de: "die Dreharbeiten", sr: "snimanje filma" },
      { de: "die Premiere", sr: "premijera" },
      { de: "der Zuschauer", sr: "gledalac" },
    ] },
    correct_answer: "all",
    explanation: null,
  },
  {
    order_index: 1, question_type: "quiz",
    question: "Wer schreibt zuerst die Geschichte für den Film?",
    options: { type: "quiz", items: ["Der Regisseur", "Der Drehbuchautor", "Die Zuschauer", "Der Kameramann"], context: ctx },
    correct_answer: "1",
    explanation: "Im Text: „Zuerst schreibt der Drehbuchautor die Geschichte.“",
  },
  {
    order_index: 2, question_type: "true_false",
    question: "Richtig oder falsch: Die Dreharbeiten dauern meistens nur einen Tag.",
    options: { type: "true_false", context: ctx },
    correct_answer: "false",
    explanation: "Im Text: Die Dreharbeiten dauern oft mehrere Wochen.",
  },
  {
    order_index: 3, question_type: "quiz",
    question: "Was passiert auf einer Premiere?",
    options: { type: "quiz", items: ["Der Film wird geschnitten.", "Der Film wird zum ersten Mal gezeigt.", "Die Schauspieler proben.", "Das Drehbuch wird geschrieben."], context: ctx },
    correct_answer: "1",
    explanation: "Im Text: „...wird er auf einer Premiere zum ersten Mal gezeigt.“",
  },
  {
    order_index: 4, question_type: "true_false",
    question: "Richtig oder falsch: Die Schauspieler wiederholen eine Szene manchmal viele Male.",
    options: { type: "true_false", context: ctx },
    correct_answer: "true",
    explanation: "Im Text: ...eine Szene zehnmal oder öfter wiederholen.",
  },
  {
    order_index: 5, question_type: "quiz",
    question: "Was braucht man neben den Schauspielern für einen guten Film?",
    options: { type: "quiz", items: ["Nur eine teure Kamera", "Beleuchtung, Ton und Schnitt", "Viele Zuschauer", "Eine große Premiere"], context: ctx },
    correct_answer: "1",
    explanation: "Im Text: Ohne Beleuchtung, Ton und Schnitt gibt es keinen guten Film.",
  },
];

// 1. Obriši staru verziju (idempotentnost)
const { data: old } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID).eq("title", TITLE);
for (const e of old ?? []) {
  await sb.from("exercise_questions").delete().eq("exercise_id", e.id);
  await sb.from("exercises").delete().eq("id", e.id);
  console.log("• obrisana stara verzija", e.id);
}

// 2. Kreiraj vežbu
const { data: ex, error: exErr } = await sb.from("exercises")
  .insert({ lesson_id: LESSON_ID, title: TITLE, exercise_type: "quiz", order_index: 2 })
  .select("id").single();
if (exErr) throw exErr;
console.log("✓ vežba kreirana", ex.id);

// 3. Pitanja
const rows = questions.map((q) => ({ ...q, exercise_id: ex.id }));
const { error: qErr } = await sb.from("exercise_questions").insert(rows);
if (qErr) throw qErr;
console.log(`✓ ${rows.length} pitanja upisano`);

// 4. Ukloni DW link sekciju iz lekcije
const { data: lesson } = await sb.from("lessons").select("sections").eq("id", LESSON_ID).single();
const before = (lesson.sections || []).length;
const sections = (lesson.sections || []).filter(
  (s) => !(s.type === "link" && typeof s.href === "string" && s.href.includes("learngerman.dw.com"))
);
if (sections.length !== before) {
  await sb.from("lessons").update({ sections }).eq("id", LESSON_ID);
  console.log(`✓ DW link sekcija uklonjena (${before} → ${sections.length})`);
} else {
  console.log("= DW link sekcija već uklonjena");
}
console.log("\nGotovo.");
