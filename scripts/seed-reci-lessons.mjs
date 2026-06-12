/**
 * Pravi „REČI" lekciju na kraju svakog A1.1 modula (tačno pre „Test: Modul N").
 * Svaka nosi jedan `wordset` blok iz scripts/flashcards/a1-1-lektion-N.json.
 * Idempotentno: ako „Modul N — Reči" već postoji, preskače (samo osveži sadržaj).
 *
 *   node scripts/seed-reci-lessons.mjs          # dry-run (samo plan)
 *   node scripts/seed-reci-lessons.mjs --apply  # primeni
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const COURSE_ID = "0e9a62b5-9b1c-44b6-a8cb-9b1985abe0cb"; // Nemački A1.1

// env iz .env.local
const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const reciTitle = (n) => `Modul ${n} - Reči`;
// Modul 1 je besplatan preview (kao i ostale lekcije tog modula); 2–7 plaćeno.
const isFree = (n) => n === 1;

const { data: lessons, error } = await sb
  .from("lessons").select("id,title,order_index,is_free_preview,sections")
  .eq("course_id", COURSE_ID).order("order_index");
if (error) { console.error("ERR čitanje:", error.message); process.exit(1); }

// Mapa: broj modula -> order_index „Test: Modul N" lekcije
const testPos = {};
for (const l of lessons) {
  const m = l.title.match(/Test:\s*Modul\s*(\d+)/i);
  if (m) testPos[Number(m[1])] = l.order_index;
}
console.log("Testovi po modulu:", testPos);

// Učitaj wordset za svaki modul i pripremi sekciju
function wordsetSection(n) {
  const ws = JSON.parse(fs.readFileSync(path.join(__dirname, "flashcards", `a1-1-lektion-${n}.json`), "utf8"));
  ws.title = reciTitle(n); // prikaži „Modul N — Reči" (kurs koristi „Modul")
  return ws;
}

// Postojeće REČI lekcije (idempotentnost)
const existingReci = new Map();
for (const l of lessons) {
  const m = l.title.match(/^Modul\s*(\d+)\s*[—-]\s*Reči$/);
  if (m) existingReci.set(Number(m[1]), l);
}

const plan = [];
for (let n = 1; n <= 7; n++) {
  if (!(n in testPos)) { console.warn(`! nema Test: Modul ${n} — preskačem`); continue; }
  const ws = wordsetSection(n);
  if (existingReci.has(n)) plan.push({ n, action: "update", id: existingReci.get(n).id, ws });
  else plan.push({ n, action: "insert", beforeTest: testPos[n], ws, free: isFree(n) });
}

console.log("\n=== PLAN ===");
for (const p of plan) console.log(`Modul ${p.n}: ${p.action.toUpperCase()} (${p.ws.items.length} reči)${p.action === "insert" ? ` pre order ${p.beforeTest}, free=${p.free}` : ""}`);

if (!APPLY) { console.log("\n(dry-run — pokreni sa --apply da primeniš)"); process.exit(0); }

// 1) Update postojećih
for (const p of plan.filter((x) => x.action === "update")) {
  const { error: e } = await sb.from("lessons").update({ sections: [p.ws] }).eq("id", p.id);
  console.log(`Modul ${p.n}: ${e ? "GREŠKA " + e.message : "ažuriran"}`);
}

// 2) Insert novih sa privremenim visokim order_index (da ne sudara)
let tmp = 1000;
for (const p of plan.filter((x) => x.action === "insert")) {
  const { data, error: e } = await sb.from("lessons").insert({
    course_id: COURSE_ID, title: reciTitle(p.n), lesson_type: "text",
    content: "", order_index: tmp++, is_free_preview: p.free, sections: [p.ws],
  }).select("id").single();
  p.newId = data?.id;
  console.log(`Modul ${p.n}: ${e ? "GREŠKA " + e.message : "ubačen " + data.id}`);
}

// 3) Renumeracija: REČI ide tačno pre „Test: Modul N"
const { data: all2 } = await sb.from("lessons")
  .select("id,title,order_index").eq("course_id", COURSE_ID).order("order_index");
const reciByMod = new Map();
for (const l of all2) { const m = l.title.match(/^Modul\s*(\d+)\s*[—-]\s*Reči$/); if (m) reciByMod.set(Number(m[1]), l.id); }

// Redosled: prođi sve NE-reči lekcije po order-u; kad naiđeš na Test: Modul N, prvo ubaci REČI N pa Test.
const ordered = all2.filter((l) => !/^Modul\s*\d+\s*[—-]\s*Reči$/.test(l.title));
const final = [];
for (const l of ordered) {
  const m = l.title.match(/Test:\s*Modul\s*(\d+)/i);
  if (m && reciByMod.has(Number(m[1]))) final.push({ id: reciByMod.get(Number(m[1])) });
  final.push({ id: l.id });
}
let idx = 1, changed = 0;
for (const f of final) {
  const cur = all2.find((x) => x.id === f.id);
  if (cur.order_index !== idx) { await sb.from("lessons").update({ order_index: idx }).eq("id", f.id); changed++; }
  idx++;
}
console.log(`\nRenumeracija: ${changed} lekcija pomereno, ukupno ${final.length}.`);
console.log("GOTOVO ✓");
