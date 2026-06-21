/** B1.2 — Modul 3 · Werbung und Konsum: Partizip Präsens + Zweiteilige Konnektoren (+ Reči na kraj).
 *  Dry-run podrazumevano; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const MODULE = "Modul 3 · Werbung und Konsum";
const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: all } = await sb.from("lessons").select("id, title, sections, order_index").eq("course_id", course.id).order("order_index");
const byTitle = (t) => all.find((l) => l.title === t);

const CONTENT = ["Partizip Präsens", "Zweiteilige Konnektoren"].map(byTitle);
const reci = byTitle("Modul 3 - Reči");
const anchor = byTitle("Modul 2 - Reči");
if (CONTENT.some((x) => !x) || !anchor) { console.log("⚠️ nije nađeno (content/anchor)"); process.exit(1); }

const BLOCK = [...CONTENT, ...(reci ? [reci] : [])];

// 1) badge → Modul 3 za sadržajne lekcije
if (APPLY) {
  for (const l of CONTENT) {
    const s = l.sections.map((x) => x.type === "badge" ? { ...x, module: MODULE } : x);
    await sb.from("lessons").update({ sections: s }).eq("id", l.id);
  }
}

// 2) grupiši odmah posle "Modul 2 - Reči"
const blockIds = new Set(BLOCK.map((l) => l.id));
const rest = all.filter((l) => !blockIds.has(l.id));
const ai = rest.findIndex((l) => l.id === anchor.id);
const seq = [];
for (let i = 0; i < rest.length; i++) { seq.push(rest[i]); if (i === ai) seq.push(...BLOCK); }

console.log("=== Modul 3 (posle Modul 2 - Reči) ===");
const start = seq.findIndex((l) => l.id === anchor.id);
seq.slice(start, start + 5).forEach((l) => console.log(`   ${l.id === anchor.id ? "[M2 reči]" : "[M3]"}  ${l.title}`));
console.log(reci ? "\n+ 'Modul 3 - Reči' na kraj." : "\n(napomena: 'Modul 3 - Reči' ne postoji — samo 2 lekcije)");

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }
let n = 0;
for (let i = 0; i < seq.length; i++) { if (all.find((x) => x.id === seq[i].id)?.order_index !== i) { await sb.from("lessons").update({ order_index: i }).eq("id", seq[i].id); n++; } }
console.log(`\nGOTOVO ✓  Modul 3 grupisan, ${n} pomereno.`);
