/** B1.2 "Prüfung - Lesen und Hören" — Hören "Wer sagt was?" interaktivna vežba (rešenja od Nataše).
 *  Audio mp3 i dalje čeka. Dry-run podrazumevano; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const HEAR_TITLE = "Wer sagt was?";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: lesson } = await sb.from("lessons").select("id, sections").eq("course_id", course.id).eq("title", "Prüfung - Lesen und Hören").single();
const LESSON_ID = lesson.id;

const { data: exExist } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID).eq("title", HEAR_TITLE).maybeSingle();
if (exExist) { console.log("⚠️ Hören vežba već postoji — prekidam."); process.exit(1); }

// opcije: Moderator=0, Frau Karl=1, Herr Oehler=2
const OPTS = ["Moderator", "Frau Karl", "Herr Oehler"];
const Q = [
  ["1. Smartphones gehören inzwischen zum Alltag wie Fahrräder auch.", "2"],
  ["2. Smartphones werden erst für Kinder ab zehn Jahren empfohlen.", "0"],
  ["3. Wer nicht lesen und schreiben kann, braucht kein Smartphone.", "2"],
  ["4. Es ist gut, wenn sich Eltern und Kinder immer erreichen können.", "1"],
  ["5. Wie oft das Smartphone genutzt werden darf, entscheiden die Eltern.", "1"],
  ["6. Kinder verbringen täglich mehrere Stunden mit ihrem Smartphone.", "0"],
  ["7. Durch Smartphones können gefährliche Situationen entstehen.", "2"],
  ["8. Bestimmte Apps können Smartphones für Kinder sicherer machen.", "1"],
  ["9. Kinder dürfen auch Dinge ohne das Wissen ihrer Eltern tun.", "2"],
];

// zameni tekst-sekciju sa 9 tvrdnji exercise-referencom; zadrži Hören intro; osveži napomenu
let s = lesson.sections.map((x) => {
  if (x.type === "text" && /Wer sagt was\?/.test(x.content || "") && /Smartphones gehören/.test(x.content || "")) {
    return { type: "exercise", title: HEAR_TITLE };
  }
  if (x.type === "text" && /Audio snimak i interaktivno/.test(x.content || "")) {
    return { type: "text", style: "info", content: "🎧 *Audio snimak (mp3) dodajemo čim stigne od Nataše. Vežba ispod ima tačna rešenja.*" };
  }
  return x;
});

console.log("Raspored:", s.map((x) => x.type + (x.title ? `(${x.title})` : "")).join(", "));
console.log("\nHören rešenja:");
Q.forEach(([q, a]) => console.log(`   ${q.slice(0, 38).padEnd(40)} → ${OPTS[parseInt(a)]}`));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

const { error: eu } = await sb.from("lessons").update({ sections: s }).eq("id", LESSON_ID);
if (eu) { console.error("update sections:", eu.message); process.exit(1); }

const { data: ex, error: e1 } = await sb.from("exercises").insert({
  lesson_id: LESSON_ID, title: HEAR_TITLE, exercise_type: "quiz", order_index: 2,
}).select("id").single();
if (e1) { console.error("insert ex:", e1.message); process.exit(1); }

let oi = 1;
for (const [q, a] of Q) {
  const { error } = await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: q, question_type: "quiz", correct_answer: a,
    explanation: null, order_index: oi++, options: { type: "quiz", items: OPTS },
  });
  if (error) { console.error("insert q:", error.message); process.exit(1); }
}
console.log("\nGOTOVO ✓  Hören 'Wer sagt was?' (9 pitanja) kreiran.");
