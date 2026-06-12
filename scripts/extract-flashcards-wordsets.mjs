/**
 * Iz flashcard + vocabulary sekcija lekcija jednog kursa pravi wordset JSON-ove
 * po modulima (scripts/flashcards/<prefix>-modul-N.json), deduplikovano po front strani.
 * READ-ONLY prema bazi; piše samo lokalne JSON fajlove.
 *
 *   node scripts/extract-flashcards-wordsets.mjs <slug> <prefix>
 *   npr: node scripts/extract-flashcards-wordsets.mjs nemacki-b2-1 b2-1
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [slug, prefix] = process.argv.slice(2);
if (!slug || !prefix) { console.error("Upotreba: node scripts/extract-flashcards-wordsets.mjs <slug> <prefix>"); process.exit(1); }

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: course } = await sb.from("courses").select("id,title").eq("slug", slug).single();
const { data: lessons } = await sb.from("lessons").select("order_index,title,sections,is_free_preview").eq("course_id", course.id).order("order_index");

// grupiši po badge.module (samo "Modul N" oblika)
const byModule = new Map();
for (const l of lessons) {
  const badge = (l.sections || []).find((s) => s.type === "badge");
  const m = (badge?.module || "").match(/^Modul\s*(\d+)/i);
  if (!m) continue;
  const n = Number(m[1]);
  if (!byModule.has(n)) byModule.set(n, { items: [], free: false, lessons: [] });
  const mod = byModule.get(n);
  mod.lessons.push(l.title);
  if (l.is_free_preview) mod.free = true;
  for (const s of (l.sections || []).filter((x) => x.type === "flashcard")) {
    for (const it of s.items || []) mod.items.push(it);
  }
  for (const s of (l.sections || []).filter((x) => x.type === "vocabulary")) {
    for (const row of s.rows || []) {
      if (Array.isArray(row) && row[0] && row[1]) mod.items.push({ front: String(row[0]), back: String(row[1]) });
    }
  }
}

for (const [n, mod] of [...byModule.entries()].sort((a, b) => a[0] - b[0])) {
  // dedup po normalizovanom front
  const seen = new Set();
  const items = [];
  for (const it of mod.items) {
    const key = (it.front || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push({ front: it.front.trim(), back: (it.back || "").trim() });
  }
  const out = { type: "wordset", title: `Modul ${n} — Reči`, setKey: `${prefix}-modul-${n}`, frontLabel: "DE", backLabel: "SR", items };
  const file = path.join(__dirname, "flashcards", `${prefix}-modul-${n}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`Modul ${n}: ${mod.items.length} kartica → ${items.length} posle dedup-a | free modul: ${mod.free} → ${file}`);
}
