/** A2.2: „Modul N — Reči" POSLE zadate lekcije + PDF dugme. node scripts/seed-a2-2.mjs --apply */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const COURSE_ID = "0b4a095e-2841-4fe8-b6b0-ed0973a30e31"; // Nemački A2.2
const BUCKET = "blog-media";

const ANCHORS = {
  1: "Trotzdem",
  2: "Auf dem Flohmarkt",
  3: "Leseverstehen Granfluencer",
  4: "Drahtesel",
  5: "Wohin fährt Tim?",
  6: "Leseverstehen Bank",
};

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const norm = (t) => t.replace(/\s+/g, " ").trim();
const ws = (n) => { const s = JSON.parse(fs.readFileSync(path.join(__dirname, "flashcards", `a2-2-lektion-${n}.json`), "utf8")); s.title = `Modul ${n} — Reči`; return s; };

const { data: lessons } = await sb.from("lessons").select("id,title,order_index,sections").eq("course_id", COURSE_ID).order("order_index");
const existingReci = new Map();
for (const l of lessons) { const m = l.title.match(/^Modul\s*(\d+)\s*—\s*Reči$/); if (m) existingReci.set(Number(m[1]), l); }

if (!APPLY) {
  for (let n = 1; n <= 6; n++) { const a = lessons.find((l) => norm(l.title) === norm(ANCHORS[n])); console.log(`Modul ${n}: ${ws(n).items.length} reči → posle "${ANCHORS[n]}" ${a ? "✓" : "!! NEMA"}`); }
  process.exit(0);
}

// 1) insert/update REČI
let tmp = 4000;
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

// 2) renumber: REČI posle anchora
const { data: all2 } = await sb.from("lessons").select("id,title,order_index").eq("course_id", COURSE_ID).order("order_index");
const reciByMod = new Map();
for (const l of all2) { const m = l.title.match(/^Modul\s*(\d+)\s*—\s*Reči$/); if (m) reciByMod.set(Number(m[1]), l.id); }
const anchorToMod = {}; for (const [n, t] of Object.entries(ANCHORS)) anchorToMod[norm(t)] = Number(n);
const ordered = all2.filter((l) => !/^Modul\s*\d+\s*—\s*Reči$/.test(l.title));
const final = [];
for (const l of ordered) { final.push(l.id); const mod = anchorToMod[norm(l.title)]; if (mod && reciByMod.has(mod)) final.push(reciByMod.get(mod)); }
let changed = 0;
for (let i = 0; i < final.length; i++) { const cur = all2.find((x) => x.id === final[i]); if (cur.order_index !== i) { await sb.from("lessons").update({ order_index: i }).eq("id", final[i]); changed++; } }
console.log(`Renumeracija: ${changed} pomereno.`);

// 3) PDF upload + dugme
const { data: fresh } = await sb.from("lessons").select("id,title,sections").eq("course_id", COURSE_ID);
for (const l of fresh) {
  const m = l.title.match(/^Modul\s*(\d+)\s*—\s*Reči$/); if (!m) continue;
  const n = m[1]; const file = path.join(__dirname, "flashcards", "pdf", `a2-2-lektion-${n}.pdf`); const key = `flashcards/a2-2-lektion-${n}.pdf`;
  if (!fs.existsSync(file)) continue;
  await sb.storage.from(BUCKET).upload(key, fs.readFileSync(file), { contentType: "application/pdf", upsert: true });
  const url = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  const secs = (l.sections || []).filter((s) => s.type !== "pdf"); secs.push({ type: "pdf", url, label: "Preuzmi reči (PDF)" });
  await sb.from("lessons").update({ sections: secs }).eq("id", l.id);
  console.log(`PDF Modul ${n}: OK`);
}
console.log("GOTOVO ✓");
