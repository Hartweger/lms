/** B1.2 Modul 1 — poređaj na vrh + uskladi badge. Dry-run podrazumevano; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const MODULE = "Modul 1 · Unter Kollegen";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: all } = await sb.from("lessons").select("id, title, order_index, sections").eq("course_id", course.id).order("order_index");

const norm = (t) => t.toLowerCase().replace(/[—–-]/g, "-").replace(/\s+/g, " ").trim();
const find = (frag) => all.find((l) => norm(l.title).includes(norm(frag)));

const willkommen = find("willkommen");
// redosled Modula 1 (5 lekcija + Reči); nova Prüfung lekcija se dodaje kasnije, posle Reči
const M1_CONTENT = ["wenn oder falls", "relativsätze mit präpositionen", "höfliche bitten", "probleme im büro", "freundschaften im job"];
const m1 = M1_CONTENT.map(find);
const reci = find("modul 1 - reči");

const missing = M1_CONTENT.filter((f, i) => !m1[i]);
if (missing.length || !willkommen || !reci) {
  console.log("⚠️ nije nađeno:", [...missing, !willkommen && "Willkommen", !reci && "Modul 1 - Reči"].filter(Boolean).join(", "));
  process.exit(1);
}

const head = [willkommen, ...m1, reci];
const headIds = new Set(head.map((l) => l.id));
const rest = all.filter((l) => !headIds.has(l.id)); // čuvaju relativni redosled
const seq = [...head, ...rest];

console.log("=== NOVI VRH (Modul 1) ===");
seq.slice(0, 8).forEach((l, i) => console.log(`${String(i).padStart(2)}  ${l.title}`));
console.log("  ...ostale lekcije zadržavaju relativni redosled posle (#7+).");

// badge.module update plan za 5 sadržajnih lekcija
const badgeUpdates = m1.map((l) => {
  const secs = Array.isArray(l.sections) ? l.sections : [];
  const cur = secs.find((s) => s.type === "badge")?.module ?? "(nema badge)";
  return { l, cur, change: cur !== MODULE };
});
console.log("\n=== BADGE ===");
badgeUpdates.forEach((b) => console.log(`  ${b.change ? "→ menjam" : "ok"}  "${b.cur}"  | ${b.l.title}`));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

let reidx = 0;
for (let i = 0; i < seq.length; i++) {
  if (seq[i].order_index !== i) { await sb.from("lessons").update({ order_index: i }).eq("id", seq[i].id); reidx++; }
}
let bch = 0;
for (const b of badgeUpdates) {
  if (!b.change) continue;
  const secs = Array.isArray(b.l.sections) ? [...b.l.sections] : [];
  const bi = secs.findIndex((s) => s.type === "badge");
  if (bi >= 0) secs[bi] = { ...secs[bi], module: MODULE };
  else secs.unshift({ type: "badge", module: MODULE });
  await sb.from("lessons").update({ sections: secs }).eq("id", b.l.id);
  bch++;
}
console.log(`\nGOTOVO ✓  order_index: ${reidx} pomereno · badge: ${bch} ažurirano`);
