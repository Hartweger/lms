// Ispravke B1.1 po komentarima profesorke (jun 2026).
// Idempotentno: bezbedno za višestruko pokretanje.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const log = (...a) => console.log(...a);

// --- 1. Sekcije lekcija -----------------------------------------------------
async function patchLessonSections(lessonId, mutate, label) {
  const { data, error } = await sb.from("lessons").select("sections").eq("id", lessonId).single();
  if (error) throw error;
  const before = JSON.stringify(data.sections);
  const sections = data.sections;
  mutate(sections);
  const after = JSON.stringify(sections);
  if (before === after) { log(`= ${label}: bez promene (već ispravljeno?)`); return; }
  const { error: uerr } = await sb.from("lessons").update({ sections }).eq("id", lessonId);
  if (uerr) throw uerr;
  log(`✓ ${label}`);
}

// L#0 Willkommen — opis "Šta ćeš naučiti": davnoprošlo → davno prošlo
await patchLessonSections("af4fefa8-55ed-4e30-9e21-a421b7f00a46", (sections) => {
  for (const s of sections) {
    if (typeof s.content === "string" && s.content.includes("davnoprošlo")) {
      s.content = s.content.replace(/davnoprošlo vreme/g, "davno prošlo vreme");
    }
  }
}, "L#0 opis: 'davno prošlo vreme'");

// L#11 Genitiv — višesložne imenice: primeri sa stvarnim -s nastavkom
await patchLessonSections("87920019-5182-4af0-994a-2b29977353a2", (sections) => {
  for (const s of sections) {
    if (typeof s.content === "string" && s.content.includes("Višesložne imenice")) {
      s.content = s.content
        .replace(/Višesložne imenice: \+ \*\*-s\*\* → des Arzt\*\*es\*\*, des Krankenhaus\*\*es\*\*/,
                 "Višesložne imenice: + **-s** → des Lehrer**s**, des Computer**s**")
        .replace(/Imenice na -s, -ß, -z, -x: uvek \*\*-es\*\* → des Haus\*\*es\*\*/,
                 "Imenice na -s, -ß, -z, -x: uvek **-es** → des Haus**es**, des Arzt**es**");
    }
  }
}, "L#11 Genitiv: višesložne -s primeri");

// L#16 Schreiben — obriši zapetu nakon "Liebe Grüße" (Schluss tabela + Korisne fraze)
await patchLessonSections("db7b4f6f-a53c-4173-8fc0-5ca61580148b", (sections) => {
  for (const s of sections) {
    if (s.type === "table" && Array.isArray(s.rows)) {
      for (const row of s.rows) {
        for (let i = 0; i < row.length; i++) {
          if (typeof row[i] === "string") row[i] = row[i].replace(/Liebe Grüße,\s*\[Name\]/g, "Liebe Grüße [Name]");
        }
      }
    }
    if (s.type === "spoiler" && Array.isArray(s.items)) {
      for (const it of s.items) {
        if (typeof it.answer === "string") it.answer = it.answer.replace(/Liebe Grüße,\s*\[tvoje ime\]/g, "Liebe Grüße [tvoje ime]");
      }
    }
  }
}, "L#16 Schreiben: bez zapete nakon 'Liebe Grüße'");

// --- 2. Pitanja -------------------------------------------------------------
async function setQuestion(qId, patch, label) {
  const { data, error } = await sb.from("exercise_questions").select("options, correct_answer, question").eq("id", qId).single();
  if (error) throw error;
  const next = { ...data, ...patch(data) };
  if (JSON.stringify(next) === JSON.stringify({ options: data.options, correct_answer: data.correct_answer, question: data.question })) {
    log(`= ${label}: bez promene`); return;
  }
  const { error: uerr } = await sb.from("exercise_questions").update(next).eq("id", qId);
  if (uerr) throw uerr;
  log(`✓ ${label}`);
}

// Konverzija slomljenih fill_blank (dvodelni odgovor sa zarezom) → quiz.
// Tačan odgovor je u svim slučajevima prva opcija (index 0).
const toQuizQuestions = [
  { id: "e557ce43-c319-4b33-a872-7c37475aac0b", label: "Test Modul 4 q4 → quiz" },
  { id: "0a1bc59e-e284-4346-81de-21e25e89042b", label: "Test Modul 4 q5 → quiz" },
  { id: "637db669-6af9-4dce-af80-8d7a09a1b679", label: "Test Modul 7 q3 → quiz" },
  { id: "2e80625b-f048-4e3f-bcd7-12117a8abade", label: "Test Modul 7 q4 → quiz" },
  { id: "1c64b81e-d6e1-4080-9102-5c1bfc458348", label: "Test Modul 7 q9 → quiz" },
  { id: "9d40cacf-0014-4ce0-81d2-ed8ae86b0708", label: "Modelltest B1.1 q13 → quiz" },
];
for (const q of toQuizQuestions) {
  await setQuestion(q.id, (data) => {
    const items = data.options?.items ?? [];
    // pronađi index tačnog odgovora (correct_answer je bio puni string ili već index)
    let idx = parseInt(data.correct_answer);
    if (isNaN(idx)) idx = items.findIndex((it) => it === data.correct_answer);
    if (idx < 0) idx = 0;
    return { options: { type: "quiz", items }, correct_answer: String(idx) };
  }, q.label);
}

// Test Modul 1 q10 (oi=9): drugi deo je bio "Weißt du, ___ er ... kam?" — to je
// indirektno pitanje pa "als" tu NIJE tačno (moralo bi "wann"). Preformuliši
// drugu rečenicu u jasnu temporalnu (als = jednokratna prošlost), odgovor ostaje
// "wann / als" (index 0).
await setQuestion("9c0f3173-4fda-4144-9c8a-9ab307cd97ad", (data) => {
  if (data.correct_answer !== "0") return {}; // ne diraj ako je već menjano
  return {
    question: "Ich weiß nicht, ______ der Zug ankommt. Gestern, ______ ich am Bahnhof war, hatte er Verspätung.",
  };
}, "Test Modul 1 q10: ispravljeno (als jasno tačno)");

log("\nGotovo.");
