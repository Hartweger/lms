/** B1.2 — grupiši Modul 2 uzastopno po Natašinom redosledu; Reflexive Verben po strani.
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
const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: all } = await sb.from("lessons").select("id, title, sections, order_index").eq("course_id", course.id).order("order_index");
const byTitle = (t) => all.find((l) => l.title === t);

// Modul 2 blok (tačan redosled)
const BLOCK = [
  "Sind KI-Tools besser als wir?",
  "Temporalsätze: während · bevor · nachdem",
  "Als ob - Konjunktiv II",
  "Prüfung - Lesen und Hören",
  "Modul 2 - Reči",
].map(byTitle);
const missing = BLOCK.some((x) => !x);
if (missing) { console.log("⚠️ Nije nađeno:", BLOCK.map((x, i) => x ? null : i).filter((x) => x !== null)); process.exit(1); }

const anchor = byTitle("Video Duzen vs. Siezen");
const refl = byTitle("Reflexive Verben mit Präpositionen");

// 1) Reflexive Verben badge → po strani (da se ne spaja sa Modul 2)
if (APPLY && refl) {
  const s = refl.sections.map((x) => x.type === "badge" ? { ...x, module: "Za raspoređivanje" } : x);
  await sb.from("lessons").update({ sections: s }).eq("id", refl.id);
}

// 2) redosled: ...do Video Duzen, [BLOK], ...ostalo (rel. redosled)
const blockIds = new Set(BLOCK.map((l) => l.id));
const rest = all.filter((l) => !blockIds.has(l.id));
const ai = rest.findIndex((l) => l.id === anchor.id);
const seq = [];
for (let i = 0; i < rest.length; i++) { seq.push(rest[i]); if (i === ai) seq.push(...BLOCK); }

console.log("=== Modul 1 kraj + Modul 2 ===");
const start = seq.findIndex((l) => l.id === anchor.id);
seq.slice(start, start + 7).forEach((l, i) => console.log(`  ${l.title === "Video Duzen vs. Siezen" ? "[M1 bonus]" : "[M2]"}  ${l.title}`));
console.log("\nReflexive Verben → badge 'Za raspoređivanje' (po strani).");

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }
let n = 0;
for (let i = 0; i < seq.length; i++) { if (all.find((x) => x.id === seq[i].id)?.order_index !== i) { await sb.from("lessons").update({ order_index: i }).eq("id", seq[i].id); n++; } }
console.log(`\nGOTOVO ✓  Modul 2 grupisan, ${n} pomereno.`);
