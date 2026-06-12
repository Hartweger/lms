/**
 * Dodaje flashcard blok (kartice kao na A1.1) na dno svake sadržajne lekcije
 * koja ima vocabulary tabelu ali NEMA kartice. Reči = parovi iz vocabulary sekcija.
 * Idempotentno: lekcije koje već imaju flashcard blok se preskaču.
 *
 *   node scripts/add-flashcards-iz-vocab.mjs           # dry-run
 *   node scripts/add-flashcards-iz-vocab.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const SLUGS = ["nemacki-a2-1", "nemacki-a2-2", "nemacki-b1-1", "nemacki-b1-2"];

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

let changed = 0;
for (const slug of SLUGS) {
  const { data: c } = await sb.from("courses").select("id,title").eq("slug", slug).single();
  const { data: lessons } = await sb.from("lessons").select("id,title,lesson_type,sections").eq("course_id", c.id).order("order_index");
  for (const l of lessons) {
    const secs = l.sections || [];
    if (secs.some((s) => s.type === "wordset")) continue;       // Reči lekcije ne diramo
    if (secs.some((s) => s.type === "flashcard")) continue;     // već ima kartice
    const vocab = secs.filter((s) => s.type === "vocabulary");
    if (!vocab.length) continue;
    const seen = new Set();
    const items = [];
    for (const v of vocab) {
      for (const row of v.rows || []) {
        if (!Array.isArray(row) || !row[0] || !row[1]) continue;
        const key = String(row[0]).trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({ front: String(row[0]).trim(), back: String(row[1]).trim() });
      }
    }
    if (items.length < 3) { console.log(`· premalo reči (${items.length}): ${c.title} | ${l.title}`); continue; }
    console.log(`✓ ${c.title} | ${l.title} → ${items.length} kartica`);
    if (APPLY) {
      const { error } = await sb.from("lessons").update({ sections: [...secs, { type: "flashcard", items }] }).eq("id", l.id);
      if (error) { console.log("  ⚠ GREŠKA:", error.message); continue; }
    }
    changed++;
  }
}
console.log(`\n${APPLY ? "Dodato" : "Za dodavanje"}: ${changed} lekcija. ${APPLY ? "GOTOVO ✓" : "(dry-run — dodaj --apply)"}`);
