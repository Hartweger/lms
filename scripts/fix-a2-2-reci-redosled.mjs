/**
 * A2.2: „Modul 5 — Reči" stoji usred modula 5, a „Modul 6 — Reči" pripada modulu 5
 * (kurs ima 5 modula sa testovima). Fix:
 *  - preimenuj u „Modul 5 — Reči (1. deo)" i „Modul 5 — Reči (2. deo)" (lekcija + wordset title)
 *  - obe pomeri na kraj modula 5: posle „Leseverstehen Bank", pre „Test Modul 5"
 * Bez brisanja — setKey i progres ostaju.
 *
 *   node scripts/fix-a2-2-reci-redosled.mjs [--apply]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-a2-2").single();
const { data: lessons } = await sb.from("lessons").select("id,title,order_index,sections").eq("course_id", course.id).order("order_index");

const reci5 = lessons.find((l) => l.title === "Modul 5 — Reči");
const reci6 = lessons.find((l) => l.title === "Modul 6 — Reči");
const bank = lessons.find((l) => l.title === "Leseverstehen Bank");
const test5 = lessons.find((l) => /^Test Modul 5/.test(l.title));
if (!reci5 || !reci6 || !bank || !test5) { console.error("Ne nalazim očekivane lekcije — već sređeno?", { reci5: !!reci5, reci6: !!reci6, bank: !!bank, test5: !!test5 }); process.exit(1); }

console.log(`Plan: "${reci5.title}"(${reci5.order_index}) → "Modul 5 — Reči (1. deo)" posle "${bank.title}"(${bank.order_index})`);
console.log(`      "${reci6.title}"(${reci6.order_index}) → "Modul 5 [—-] ? Reči (2. deo)" pre "${test5.title}"(${test5.order_index})`);
if (!APPLY) { console.log("(dry-run — dodaj --apply)"); process.exit(0); }

// 1) preimenovanje lekcija + wordset naslova u sekcijama
async function rename(lesson, newTitle) {
  const secs = (lesson.sections || []).map((s) => (s.type === "wordset" ? { ...s, title: newTitle } : s));
  const { error } = await sb.from("lessons").update({ title: newTitle, sections: secs }).eq("id", lesson.id);
  console.log(`${newTitle}: ${error ? "GREŠKA " + error.message : "preimenovano"}`);
}
await rename(reci5, "Modul 5 — Reči (1. deo)");
await rename(reci6, "Modul 5 — Reči (2. deo)");

// 2) novi redosled: izbaci reci5/reci6, ubaci ih posle bank (a pre test5)
const ordered = lessons.filter((l) => l.id !== reci5.id && l.id !== reci6.id);
const final = [];
for (const l of ordered) {
  final.push(l.id);
  if (l.id === bank.id) { final.push(reci5.id); final.push(reci6.id); }
}
const startIdx = Math.min(...lessons.map((l) => l.order_index));
let idx = startIdx, changed = 0;
for (const id of final) {
  const cur = lessons.find((x) => x.id === id);
  if (cur.order_index !== idx) { await sb.from("lessons").update({ order_index: idx }).eq("id", id); changed++; }
  idx++;
}
console.log(`Renumeracija: ${changed} pomereno. GOTOVO ✓`);
