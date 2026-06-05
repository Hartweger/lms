/**
 * A1.2: pravi „Modul N — Reči" lekcije (kraj svakog modula, pre „Test: Modul N")
 * i puni postojeću „Reči za ispit A1" lekciju sa ispit-setom.
 * Idempotentno. node scripts/seed-a1-2.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const COURSE_ID = "3dc26901-a719-43d5-96eb-5c95de5322cc"; // Nemački A1.2

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ws = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, "flashcards", file), "utf8"));

const { data: lessons, error } = await sb.from("lessons")
  .select("id,title,order_index,sections").eq("course_id", COURSE_ID).order("order_index");
if (error) { console.error("ERR:", error.message); process.exit(1); }

const testPos = {};
for (const l of lessons) { const m = l.title.match(/Test:\s*Modul\s*(\d+)/i); if (m) testPos[Number(m[1])] = l.order_index; }
const existingReci = new Map();
for (const l of lessons) { const m = l.title.match(/^Modul\s*(\d+)\s*—\s*Reči$/); if (m) existingReci.set(Number(m[1]), l); }
console.log("Testovi:", testPos);

if (APPLY) {
  // 1) Moduli 1-6
  let tmp = 2000;
  for (let n = 1; n <= 6; n++) {
    if (!(n in testPos)) { console.warn(`! nema Test: Modul ${n}`); continue; }
    const set = ws(`a1-2-lektion-${n}.json`); set.title = `Modul ${n} — Reči`;
    if (existingReci.has(n)) {
      const keepPdf = (existingReci.get(n).sections || []).filter((s) => s.type === "pdf");
      await sb.from("lessons").update({ sections: [set, ...keepPdf] }).eq("id", existingReci.get(n).id);
      console.log(`Modul ${n}: ažuriran`);
    } else {
      const { data } = await sb.from("lessons").insert({
        course_id: COURSE_ID, title: `Modul ${n} — Reči`, lesson_type: "text",
        content: "", order_index: tmp++, is_free_preview: false, sections: [set],
      }).select("id").single();
      console.log(`Modul ${n}: ubačen ${data?.id}`);
    }
  }
  // 2) Renumeracija — REČI pre Test: Modul N
  const { data: all2 } = await sb.from("lessons").select("id,title,order_index").eq("course_id", COURSE_ID).order("order_index");
  const reciByMod = new Map();
  for (const l of all2) { const m = l.title.match(/^Modul\s*(\d+)\s*—\s*Reči$/); if (m) reciByMod.set(Number(m[1]), l.id); }
  const ordered = all2.filter((l) => !/^Modul\s*\d+\s*—\s*Reči$/.test(l.title));
  const final = [];
  for (const l of ordered) {
    const m = l.title.match(/Test:\s*Modul\s*(\d+)/i);
    if (m && reciByMod.has(Number(m[1]))) final.push(reciByMod.get(Number(m[1])));
    final.push(l.id);
  }
  let idx = 0, changed = 0;
  for (const id of final) { const cur = all2.find((x) => x.id === id); if (cur.order_index !== idx) { await sb.from("lessons").update({ order_index: idx }).eq("id", id); changed++; } idx++; }
  console.log(`Renumeracija: ${changed} pomereno, ukupno ${final.length}.`);

  // 3) „Reči za ispit A1" lekcija
  const exam = lessons.find((l) => /Reči za ispit A1/i.test(l.title));
  if (exam) {
    const set = ws("a1-2-ispit-a1.json");
    const intro = { type: "text", style: "info", content: "Ovo su dodatne reči sa zvanične liste za ispit A1 koje se nisu pojavile tokom kursa. Neke od njih je dovoljno da <b>razumeš</b> kada ih čuješ ili pročitaš — ne moraš sve da znaš da kažeš ili napišeš." };
    const keepPdf = (exam.sections || []).filter((s) => s.type === "pdf");
    await sb.from("lessons").update({ sections: [intro, set, ...keepPdf] }).eq("id", exam.id);
    console.log(`Ispit lekcija: ažurirana (${set.items.length} reči) ${exam.id}`);
  } else console.warn("! nema 'Reči za ispit A1' lekcije");
  console.log("GOTOVO ✓");
} else {
  console.log("(dry-run) Moduli 1-6 + ispit set. Dodaj --apply.");
}
