/** A2.2: premesti Weihnachten/Adventskranz/Priprema za ispit posle „Deklinacija prideva – Masterclass". node scripts/reorder-a2-2-bonus.mjs --apply */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const COURSE_ID = "0b4a095e-2841-4fe8-b6b0-ed0973a30e31"; // Nemački A2.2

const BONUS = ["Weihnachten ist…", "Adventskranz", "Priprema za ispit A2"];
const ANCHOR = "Deklinacija prideva – Masterclass";

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: all } = await sb.from("lessons").select("id,title,order_index").eq("course_id", COURSE_ID).order("order_index");
const norm = (t) => t.replace(/\s+/g, " ").trim();
const isBonus = (t) => BONUS.some((b) => norm(b) === norm(t));
const rest = all.filter((l) => !isBonus(l.title));
const bonusLessons = BONUS.map((b) => all.find((l) => norm(l.title) === norm(b))).filter(Boolean);
if (bonusLessons.length !== 3) { console.error("! nisam našao sve 3 bonus lekcije:", bonusLessons.map((l) => l.title)); process.exit(1); }
const anchor = all.find((l) => norm(l.title) === norm(ANCHOR));
if (!anchor) { console.error("! nema anchor", ANCHOR); process.exit(1); }

const final = [];
for (const l of rest) { final.push(l); if (norm(l.title) === norm(ANCHOR)) final.push(...bonusLessons); }

console.log("=== NOVI REDOSLED ===");
final.forEach((l, i) => console.log(String(i).padStart(2) + "  " + (isBonus(l.title) ? "★ " : "  ") + l.title));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }
let changed = 0;
for (let i = 0; i < final.length; i++) { if (final[i].order_index !== i) { await sb.from("lessons").update({ order_index: i }).eq("id", final[i].id); changed++; } }
console.log(`\nPomereno: ${changed}. GOTOVO ✓`);
