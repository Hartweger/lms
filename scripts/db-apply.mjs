// scripts/db-apply.mjs — primeni SQL fajl na Supabase preko Management API-ja.
// Pokretanje: node scripts/db-apply.mjs supabase/migrations/040_individual_courses.sql
// Kredencijali iz .env.local: SUPABASE_ACCESS_TOKEN (sbp_...) + NEXT_PUBLIC_SUPABASE_URL (za project ref).
import { readFileSync } from "node:fs";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const token = env.SUPABASE_ACCESS_TOKEN;
const ref = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/^https?:\/\//, "").split(".")[0];
if (!token) { console.error("Nema SUPABASE_ACCESS_TOKEN u .env.local"); process.exit(1); }
if (!ref) { console.error("Ne mogu da izvučem project ref iz NEXT_PUBLIC_SUPABASE_URL"); process.exit(1); }

const file = process.argv[2];
if (!file) { console.error("Daj putanju do .sql fajla"); process.exit(1); }
const query = readFileSync(file, "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
const text = await res.text();
if (!res.ok) { console.error(`HTTP ${res.status}:`, text); process.exit(1); }
console.log(`OK (${res.status}) — primenjeno: ${file}`);
console.log(text.length > 600 ? text.slice(0, 600) + "…" : text);
