// READ-ONLY: audit "Modul N — Reči" (wordset) lekcija po modulima za kurseve A1.1–B2.2.
// Za svaki modul: ima li wordset lekciju na kraju (pre testa), koliko flashcard/vocabulary
// materijala postoji u lekcijama modula (potencijalni izvor reči za set).
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const SLUGS = ["nemacki-a1-1", "nemacki-a1-2", "nemacki-a2-1", "nemacki-a2-2", "nemacki-b1-1", "nemacki-b1-2", "nemacki-b2-1", "nemacki-b2-2"];
const out = [];

for (const slug of SLUGS) {
  const { data: c } = await sb.from("courses").select("id,title").eq("slug", slug).single();
  if (!c) { console.log(slug, "— NEMA KURSA"); continue; }
  const { data: lessons } = await sb.from("lessons").select("id, order_index, title, lesson_type, sections").eq("course_id", c.id).order("order_index");

  // grupiši u module logikom sa kurs stranice: badge.module, test naslov, modelltest
  const modules = [];
  let cur = null;
  for (const l of lessons) {
    const secs = Array.isArray(l.sections) ? l.sections : [];
    const badge = secs.find((s) => s.type === "badge");
    let name = badge?.module || "";
    if (!name && /modelltest|završni|zavrsni/i.test(l.title)) name = "Završni ispit";
    if (!name && /^test/i.test(l.title)) name = cur?.name || "Test";
    if (!name) name = cur?.name || "Lekcije";
    if (!cur || cur.name !== name) { cur = { name, lessons: [] }; modules.push(cur); }
    cur.lessons.push({ ...l, secs });
  }
  // "Modul N — Reči" lekcije nemaju badge pa upadnu u prethodni modul — to i želimo

  const courseOut = { slug, title: c.title, modules: [] };
  for (const m of modules) {
    const wordsetLessons = m.lessons.filter((l) => l.secs.some((s) => s.type === "wordset"));
    const wsWords = wordsetLessons.flatMap((l) => l.secs.filter((s) => s.type === "wordset")).reduce((n, s) => n + (s.items?.length || 0), 0);
    const fcItems = m.lessons.flatMap((l) => l.secs.filter((s) => s.type === "flashcard")).reduce((n, s) => n + (s.items?.length || 0), 0);
    const vocabItems = m.lessons.flatMap((l) => l.secs.filter((s) => s.type === "vocabulary")).reduce((n, s) => n + (s.items?.length || s.words?.length || 0), 0);
    courseOut.modules.push({
      name: m.name, lessons: m.lessons.length,
      wordset: wordsetLessons.length ? `DA (${wsWords} reči: ${wordsetLessons.map((l) => l.title).join("; ")})` : "NE",
      flashcards_u_modulu: fcItems, vocabulary_u_modulu: vocabItems,
    });
  }
  out.push(courseOut);

  console.log(`\n=== ${c.title} (${slug}) ===`);
  for (const m of courseOut.modules) {
    const flag = m.wordset === "NE" && /^modul/i.test(m.name) ? "❌" : (m.wordset !== "NE" ? "✅" : "·");
    console.log(`${flag} ${m.name.padEnd(16)} | lekcija: ${String(m.lessons).padStart(2)} | wordset: ${m.wordset} | flashcard kartica u modulu: ${m.flashcards_u_modulu} | vocab: ${m.vocabulary_u_modulu}`);
  }
}
writeFileSync("scripts/wordset-audit.json", JSON.stringify(out, null, 2));
console.log("\n→ scripts/wordset-audit.json");
