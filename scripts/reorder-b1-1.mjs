/** B1.1 reorder po dogovorenoj strukturi + Konjunktiv Irreale → B1.2. node scripts/reorder-b1-1.mjs --apply */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const B11 = "b8c765b7-c377-4941-a1f9-ebe39372fe4a";
const B12 = "393b99f7-abe9-40e4-9cab-2e39ae523fff";

const ORDER = [
  "Willkommen",
  "Rotkäppchen und das Präteritum", "Als oder wenn", "Glück",
  "Relativne rečenice", "Filme und Serien", "Obwohl vs. weil",
  "Profis gesucht: Krankenpfleger", "Blutgruppen", "Pasiv prezenta sa modalnim glagolima", "Genitiv",
  "Konjunktiv II der Vergangenheit", "Sprechblockaden", "Spielerisch Sprachen lernen", "Schreiben B1 — E-Mail an einen Freund",
  "Jobsuche", "Infinitiv mit zu", "Wortschatz B1", "Geschlechtergerechte Sprache", "Temporale Präpositionen",
  "Finalsätze", "Berufswechsel", "Sprechen Prüfung B1",
  "Pflegekrise", "Umzug", "Zweiteilige Konnektoren", "Schreiben B1 — Hotel Mama",
];
const MOVE_TO_B12 = "Konjunktiv II — Irreale Wünsche";

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const norm = (t) => t.toLowerCase().replace(/[—–-]/g, "-").replace(/\s+/g, " ").trim();

const { data: all } = await sb.from("lessons").select("id,title,order_index").eq("course_id", B11).order("order_index");
const findBy = (frag) => all.find((l) => norm(l.title).includes(norm(frag)));

// mapiraj ORDER → lekcije
const used = new Set(); const final = []; const missing = [];
for (const t of ORDER) { const l = findBy(t); if (l && !used.has(l.id)) { used.add(l.id); final.push(l); } else if (!l) missing.push(t); }
const konj = findBy(MOVE_TO_B12);
const leftover = all.filter((l) => !used.has(l.id) && l.id !== (konj && konj.id));

console.log("=== NOVI REDOSLED B1.1 ===");
final.forEach((l, i) => console.log(String(i).padStart(2) + "  " + l.title));
console.log("\n→ B1.2:", konj ? konj.title : "!! NIJE NAĐEN");
if (missing.length) console.log("⚠️ nemapirano iz ORDER:", missing.join(", "));
if (leftover.length) console.log("⚠️ lekcije van plana (ostaju na kraju):", leftover.map((l) => l.title).join(", "));

if (!APPLY) { console.log("\n(dry-run)"); process.exit(0); }

// 1) Konjunktiv Irreale → B1.2 (na kraj)
if (konj) {
  const { data: b12 } = await sb.from("lessons").select("order_index").eq("course_id", B12).order("order_index", { ascending: false }).limit(1);
  await sb.from("lessons").update({ course_id: B12, order_index: (b12[0]?.order_index ?? 0) + 1 }).eq("id", konj.id);
  console.log("Konjunktiv Irreale prebačen u B1.2");
}
// 2) reorder B1.1
const seq = [...final, ...leftover];
let ch = 0;
for (let i = 0; i < seq.length; i++) { if (seq[i].order_index !== i) { await sb.from("lessons").update({ order_index: i }).eq("id", seq[i].id); ch++; } }
console.log(`Reorder: ${ch} pomereno. GOTOVO ✓`);
