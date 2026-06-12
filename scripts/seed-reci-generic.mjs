/**
 * Pravi „Modul N — Reči" lekciju na kraju svakog modula kursa, po šablonu sa A1.1.
 * Wordset dolazi iz scripts/flashcards/<prefix>-modul-N.json.
 * Pozicija: pre prve test-lekcije modula (Test/Prüfung/Ispit u naslovu), inače posle
 * poslednje lekcije modula. Idempotentno: postojeća „Modul N — Reči" se samo ažurira.
 *
 *   node scripts/seed-reci-generic.mjs <slug> <prefix>           # dry-run
 *   node scripts/seed-reci-generic.mjs <slug> <prefix> --apply
 *   --after-last: ignoriši test-detekciju, Reči ide posle poslednje lekcije modula
 *                 (za kurseve gde naslovi tipa „Prüfungsvorbereitung" nisu testovi)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const AFTER_LAST = process.argv.includes("--after-last");
const [slug, prefix] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!slug || !prefix) { console.error("Upotreba: node scripts/seed-reci-generic.mjs <slug> <prefix> [--apply]"); process.exit(1); }

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: course } = await sb.from("courses").select("id,title").eq("slug", slug).single();
if (!course) { console.error("Nema kursa:", slug); process.exit(1); }
const COURSE_ID = course.id;
const TESTLIKE = /test|prüfung|pruefung|ispit/i;
const reciTitle = (n) => `Modul ${n} — Reči`;
const isReci = (t) => /^Modul\s*\d+\s*—\s*Reči$/.test(t);

const { data: lessons } = await sb.from("lessons")
  .select("id,title,order_index,is_free_preview,sections")
  .eq("course_id", COURSE_ID).order("order_index");

// moduli po badge-u
const moduleOf = (l) => {
  const badge = (l.sections || []).find((s) => s.type === "badge");
  const m = (badge?.module || "").match(/^Modul\s*(\d+)/i);
  return m ? Number(m[1]) : null;
};

// anchor po modulu: { beforeId } (prva test-lekcija modula) ili { afterId } (poslednja lekcija modula)
const anchors = new Map();
const freeMod = new Map();
for (const l of lessons) {
  const n = moduleOf(l);
  if (n === null) continue;
  if (l.is_free_preview) freeMod.set(n, true);
  const a = anchors.get(n) || {};
  if (AFTER_LAST) {
    a.afterId = l.id; // uvek poslednja lekcija modula
  } else {
    if (!a.beforeId && TESTLIKE.test(l.title)) a.beforeId = l.id;
    if (!a.beforeId) a.afterId = l.id; // poslednja ne-test lekcija do sada
  }
  anchors.set(n, a);
}

const existingReci = new Map();
for (const l of lessons) { const m = l.title.match(/^Modul\s*(\d+)\s*—\s*Reči$/); if (m) existingReci.set(Number(m[1]), l); }

const plan = [];
for (const [n, anchor] of [...anchors.entries()].sort((a, b) => a[0] - b[0])) {
  const file = path.join(__dirname, "flashcards", `${prefix}-modul-${n}.json`);
  if (!fs.existsSync(file)) { console.warn(`! nema JSON za Modul ${n} (${file}) — preskačem`); continue; }
  const ws = JSON.parse(fs.readFileSync(file, "utf8"));
  ws.title = reciTitle(n);
  if (existingReci.has(n)) plan.push({ n, action: "update", id: existingReci.get(n).id, ws });
  else plan.push({ n, action: "insert", anchor, ws, free: freeMod.get(n) || false });
}

console.log(`=== ${course.title} (${slug}) — PLAN ===`);
for (const p of plan) {
  const pos = p.action === "insert" ? (p.anchor.beforeId ? `pre "${lessons.find((l) => l.id === p.anchor.beforeId).title}"` : `posle "${lessons.find((l) => l.id === p.anchor.afterId).title}"`) : "";
  console.log(`Modul ${p.n}: ${p.action.toUpperCase()} (${p.ws.items.length} reči) ${pos} ${p.action === "insert" ? "free=" + p.free : ""}`);
}
if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

for (const p of plan.filter((x) => x.action === "update")) {
  // zadrži eventualnu pdf sekciju
  const old = existingReci.get(p.n);
  const pdf = (old.sections || []).filter((s) => s.type === "pdf");
  const { error: e } = await sb.from("lessons").update({ sections: [p.ws, ...pdf] }).eq("id", p.id);
  console.log(`Modul ${p.n}: ${e ? "GREŠKA " + e.message : "ažuriran"}`);
}

let tmp = 1000;
for (const p of plan.filter((x) => x.action === "insert")) {
  const { data, error: e } = await sb.from("lessons").insert({
    course_id: COURSE_ID, title: reciTitle(p.n), lesson_type: "text",
    content: "", order_index: tmp++, is_free_preview: p.free, sections: [p.ws],
  }).select("id").single();
  if (e) { console.error(`Modul ${p.n}: GREŠKA ${e.message}`); continue; }
  p.newId = data.id;
  console.log(`Modul ${p.n}: ubačen ${data.id}`);
}

// renumeracija: prođi ne-Reči lekcije po starom redu; Reči N ide pre svog beforeId / posle afterId
const { data: all2 } = await sb.from("lessons").select("id,title,order_index").eq("course_id", COURSE_ID).order("order_index");
const reciByMod = new Map();
for (const l of all2) { const m = l.title.match(/^Modul\s*(\d+)\s*—\s*Reči$/); if (m) reciByMod.set(Number(m[1]), l.id); }

const beforeMap = new Map(); // anchorLessonId -> reciId (ubaci pre)
const afterMap = new Map();  // anchorLessonId -> reciId (ubaci posle)
for (const [n, anchor] of anchors.entries()) {
  const rid = reciByMod.get(n);
  if (!rid) continue;
  if (anchor.beforeId) beforeMap.set(anchor.beforeId, rid);
  else if (anchor.afterId) afterMap.set(anchor.afterId, rid);
}

const placed = new Set();
const final = [];
for (const l of all2.filter((x) => !isReci(x.title))) {
  if (beforeMap.has(l.id) && !placed.has(beforeMap.get(l.id))) { final.push(beforeMap.get(l.id)); placed.add(beforeMap.get(l.id)); }
  final.push(l.id);
  if (afterMap.has(l.id) && !placed.has(afterMap.get(l.id))) { final.push(afterMap.get(l.id)); placed.add(afterMap.get(l.id)); }
}
// Reči koje nisu našle anchor (ne bi smelo) — na kraj
for (const rid of reciByMod.values()) if (!placed.has(rid)) { final.push(rid); placed.add(rid); }

const startIdx = Math.min(...all2.map((l) => l.order_index));
let idx = startIdx, changed = 0;
for (const id of final) {
  const cur = all2.find((x) => x.id === id);
  if (cur.order_index !== idx) { await sb.from("lessons").update({ order_index: idx }).eq("id", id); changed++; }
  idx++;
}
console.log(`Renumeracija: ${changed} pomereno, ukupno ${final.length}. GOTOVO ✓`);
