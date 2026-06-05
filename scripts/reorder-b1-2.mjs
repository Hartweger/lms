/** B1.2 reorder po Schritte 6 (L8-14) + Glück/Erfolg → B1.1. node scripts/reorder-b1-2.mjs --apply */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const B11 = "b8c765b7-c377-4941-a1f9-ebe39372fe4a";
const B12 = "393b99f7-abe9-40e4-9cab-2e39ae523fff";

// B1.2 redosled (fragmenti za fuzzy match), po modulima L8-L14
const ORDER = [
  "Willkommen",
  // M1 L8 Unter Kollegen
  "Wenn oder Falls", "Je…desto", "Relativsätze mit Präpositionen", "Reflexive Verben mit Präpositionen",
  "Höfliche Bitten", "Konjunktiv II — Irreale Wünsche", "Probleme im Büro", "Freundschaften im Job",
  "Duzen vs. Siezen – Prüfung", "Zweiteilige Konnektoren", "Video Duzen vs. Siezen",
  // M2 L9 Virtuelle Welt
  "Sind KI-Tools", "Lese – und Hörverstehen", "Als ob", "Das Paket ist nicht angekommen",
  // M3 L10 Werbung und Konsum
  "Partizip Präsens", "Passiv und Ratschläge",
  // M4 L11 Miteinander
  "Futur I", "Temporalsätze", "Seitdem ich hier lebe", "Familie, Generationen",
  // M5 L12 Soziales Engagement
  "Ehrenamt", "Finalsätze",
  // M6 L13 Politik und Geschichte
  "Politik, Rechte",
  // M7 L14 / Ispit
  "20 glagola", "100 reči", "Vremena u nemačkom", "Schreiben Teil 1", "Schreiben Teil 2", "Schreiben Teil 3",
  "Položi B1 TELC", "Položi B1", "Lakše pamtimo",
];
const MOVE_TO_B11 = "Glück, Erfolg";

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const norm = (t) => t.toLowerCase().replace(/[—–-]/g, "-").replace(/\s+/g, " ").trim();

const { data: all } = await sb.from("lessons").select("id,title,order_index").eq("course_id", B12).order("order_index");
const findBy = (frag) => all.find((l) => norm(l.title).includes(norm(frag)));

const glueck = findBy(MOVE_TO_B11);
const used = new Set(); const final = []; const missing = [];
for (const t of ORDER) { const l = findBy(t); if (l && l.id !== (glueck && glueck.id) && !used.has(l.id)) { used.add(l.id); final.push(l); } else if (!l) missing.push(t); }
const leftover = all.filter((l) => !used.has(l.id) && l.id !== (glueck && glueck.id));

console.log("=== NOVI REDOSLED B1.2 ===");
final.forEach((l, i) => console.log(String(i).padStart(2) + "  " + l.title));
console.log("\n→ B1.1 (Modul 1, posle Glück):", glueck ? glueck.title : "!! NIJE NAĐEN");
if (missing.length) console.log("⚠️ nemapirano:", missing.join(", "));
if (leftover.length) console.log("⚠️ van plana (na kraj):", leftover.map((l) => l.title).join(", "));

if (!APPLY) { console.log("\n(dry-run)"); process.exit(0); }

// 1) Glück/Erfolg → B1.1 posle "Glück"
if (glueck) {
  const { data: b11 } = await sb.from("lessons").select("id,title,order_index").eq("course_id", B11).order("order_index");
  const gl = b11.find((l) => norm(l.title) === "glück");
  await sb.from("lessons").update({ course_id: B11 }).eq("id", glueck.id);
  // renumber B1.1 da glueck dođe odmah posle "Glück"
  const b11b = [...b11.filter((l) => l.id !== glueck.id)];
  const seq11 = [];
  for (const l of b11b) { seq11.push(l.id); if (gl && l.id === gl.id) seq11.push(glueck.id); }
  for (let i = 0; i < seq11.length; i++) await sb.from("lessons").update({ order_index: i }).eq("id", seq11[i]);
  console.log("Glück/Erfolg prebačen u B1.1 posle 'Glück'");
}
// 2) reorder B1.2
const seq = [...final, ...leftover];
let ch = 0;
for (let i = 0; i < seq.length; i++) { if (seq[i].order_index !== i) { await sb.from("lessons").update({ order_index: i }).eq("id", seq[i].id); ch++; } }
console.log(`B1.2 reorder: ${ch} pomereno. GOTOVO ✓`);
