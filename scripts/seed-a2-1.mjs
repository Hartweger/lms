/**
 * A2.1: „Modul N — Reči" lekcije POSLE zadate lekcije (nema Test: Modul markera).
 * Idempotentno. node scripts/seed-a2-1.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const COURSE_ID = "16a471dd-9544-4da1-8f74-a52469a6e726"; // Nemački A2.1

// modul -> posle koje lekcije ide REČI (po naslovu)
const ANCHORS = {
  1: "Weil Sätze",
  2: "Wechselpräpositionen",
  3: "Indefinitpronomen im Nominativ und Akkusativ",
  4: "Arbeitszeit, Urlaubs- und Feiertage",
  5: "Modalni glagoli u prošlosti",
  6: "Ausbildung in Deutschland",
};

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ws = (n) => { const s = JSON.parse(fs.readFileSync(path.join(__dirname, "flashcards", `a2-1-lektion-${n}.json`), "utf8")); s.title = `Modul ${n} — Reči`; return s; };

const { data: lessons, error } = await sb.from("lessons").select("id,title,order_index,sections").eq("course_id", COURSE_ID).order("order_index");
if (error) { console.error("ERR:", error.message); process.exit(1); }

const existingReci = new Map();
for (const l of lessons) { const m = l.title.match(/^Modul\s*(\d+)\s*—\s*Reči$/); if (m) existingReci.set(Number(m[1]), l); }

if (!APPLY) {
  for (let n = 1; n <= 6; n++) { const a = lessons.find((l) => l.title.trim() === ANCHORS[n]); console.log(`Modul ${n}: ${ws(n).items.length} reči → posle "${ANCHORS[n]}" ${a ? "(order " + a.order_index + ")" : "!! NEMA ANCHOR"}${existingReci.has(n) ? " [postoji]" : ""}`); }
  console.log("(dry-run)"); process.exit(0);
}

let tmp = 3000;
for (let n = 1; n <= 6; n++) {
  const set = ws(n);
  if (existingReci.has(n)) {
    const keepPdf = (existingReci.get(n).sections || []).filter((s) => s.type === "pdf");
    await sb.from("lessons").update({ sections: [set, ...keepPdf] }).eq("id", existingReci.get(n).id);
    console.log(`Modul ${n}: ažuriran`);
  } else {
    const { data } = await sb.from("lessons").insert({ course_id: COURSE_ID, title: `Modul ${n} — Reči`, lesson_type: "text", content: "", order_index: tmp++, is_free_preview: false, sections: [set] }).select("id").single();
    console.log(`Modul ${n}: ubačen ${data?.id}`);
  }
}

// Renumeracija: REČI tačno posle svog anchor-a
const { data: all2 } = await sb.from("lessons").select("id,title,order_index").eq("course_id", COURSE_ID).order("order_index");
const reciByMod = new Map();
for (const l of all2) { const m = l.title.match(/^Modul\s*(\d+)\s*—\s*Reči$/); if (m) reciByMod.set(Number(m[1]), l.id); }
const anchorTitleToMod = {};
for (const [n, t] of Object.entries(ANCHORS)) anchorTitleToMod[t] = Number(n);
const ordered = all2.filter((l) => !/^Modul\s*\d+\s*—\s*Reči$/.test(l.title));
const final = [];
for (const l of ordered) {
  final.push(l.id);
  const mod = anchorTitleToMod[l.title.trim()];
  if (mod && reciByMod.has(mod)) final.push(reciByMod.get(mod));
}
let idx = 0, changed = 0;
for (const id of final) { const cur = all2.find((x) => x.id === id); if (cur.order_index !== idx) { await sb.from("lessons").update({ order_index: idx }).eq("id", id); changed++; } idx++; }
console.log(`Renumeracija: ${changed} pomereno, ukupno ${final.length}. GOTOVO ✓`);
