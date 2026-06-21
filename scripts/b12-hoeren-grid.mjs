/** B1.2 "Prüfung - Lesen und Hören" — Hören UX: sve tvrdnje vidljive (tekst) + categorize (broj→govornik).
 *  Zamenjuje quiz jedan-po-jedan. Dry-run podrazumevano; --apply za upis. */
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

const AUSSAGEN = [
  "Smartphones gehören inzwischen zum Alltag wie Fahrräder auch.",
  "Smartphones werden erst für Kinder ab zehn Jahren empfohlen.",
  "Wer nicht lesen und schreiben kann, braucht kein Smartphone.",
  "Es ist gut, wenn sich Eltern und Kinder immer erreichen können.",
  "Wie oft das Smartphone genutzt werden darf, entscheiden die Eltern.",
  "Kinder verbringen täglich mehrere Stunden mit ihrem Smartphone.",
  "Durch Smartphones können gefährliche Situationen entstehen.",
  "Bestimmte Apps können Smartphones für Kinder sicherer machen.",
  "Kinder dürfen auch Dinge ohne das Wissen ihrer Eltern tun.",
];
// govornik po tvrdnji (0=Moderator,1=Frau Karl,2=Herr Oehler)
const SPEAKER = [2, 0, 2, 1, 1, 0, 2, 1, 2];
const CATS = ["Moderator", "Frau Karl", "Herr Oehler"];

// vidljiva lista tvrdnji (čita dok sluša)
const listText = "**Wer sagt was?** Hört die Diskussion und ordnet die Nummern den Personen zu.\n\n" +
  AUSSAGEN.map((a, i) => `**${i + 1}.** ${a}${i === 0 ? " *(Beispiel: Herr Oehler)*" : ""}`).join("\n");

const catItems = AUSSAGEN.map((_, i) => ({ text: String(i + 1), category: SPEAKER[i] }));

console.log("Lista tvrdnji + categorize (broj→govornik):");
catItems.forEach((it) => console.log(`   ${it.text} → ${CATS[it.category]}`));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

// 1) obriši stari quiz "Wer sagt was?" + pitanja
const { data: oldEx } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID).eq("title", HEAR_TITLE);
for (const e of oldEx || []) { await sb.from("exercise_questions").delete().eq("exercise_id", e.id); await sb.from("exercises").delete().eq("id", e.id); }

// 2) novi categorize exercise (isti naslov → section ref ostaje)
const { data: ex, error: e1 } = await sb.from("exercises").insert({
  lesson_id: LESSON_ID, title: HEAR_TITLE, exercise_type: "categorize", order_index: 2,
}).select("id").single();
if (e1) { console.error("insert ex:", e1.message); process.exit(1); }
const { error: e2 } = await sb.from("exercise_questions").insert({
  exercise_id: ex.id, question: "Ordne jede Aussage (1-9) der richtigen Person zu.",
  question_type: "categorize", correct_answer: "", explanation: null, order_index: 1,
  options: { type: "categorize", items: { items: catItems, categories: CATS } },
});
if (e2) { console.error("insert q:", e2.message); process.exit(1); }

// 3) ubaci vidljivu listu tvrdnji posle audio sekcije (ako je nema)
let s = [...lesson.sections];
if (!s.some((x) => x.type === "text" && /Hört die Diskussion und ordnet/.test(x.content || ""))) {
  const ai = s.findIndex((x) => x.type === "audio");
  s.splice(ai + 1, 0, { type: "text", style: "default", content: listText });
  await sb.from("lessons").update({ sections: s }).eq("id", LESSON_ID);
}
console.log("Raspored:", s.map((x) => x.type + (x.title ? `(${x.title})` : "")).join(", "));
console.log("\nGOTOVO ✓  Hören: vidljiva lista + categorize (broj→govornik).");
