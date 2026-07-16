/**
 * Runda 2 (16.07.2026): duge crtice (— –) → "-" u JAVNO VIDLJIVOM tekstu koji
 * runda 1 (zameni-crtice.mjs, 12.06) nije pokrila: SVE tekst/json kolone u
 * courses, products i blog_posts (runda 1 je u courses dirala samo title+description).
 *
 *   node scripts/zameni-crtice-2.mjs           # dry-run: izlistaj pogođene redove/kolone
 *   node scripts/zameni-crtice-2.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const DASH = /[—–]/g;

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const fix = (s) => s.replace(DASH, "-");
const fixDeep = (v) => {
  if (typeof v === "string") return fix(v);
  if (Array.isArray(v)) return v.map(fixDeep);
  if (v && typeof v === "object") Object.keys(v).forEach((k) => (v[k] = fixDeep(v[k])));
  return v;
};
const containsDash = (v) => {
  if (typeof v === "string") { DASH.lastIndex = 0; return DASH.test(v); }
  if (Array.isArray(v)) return v.some(containsDash);
  if (v && typeof v === "object") return Object.values(v).some(containsDash);
  return false;
};
const excerpt = (v) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  const i = s.search(DASH); DASH.lastIndex = 0;
  return s.slice(Math.max(0, i - 40), i + 40).replace(/\n/g, " ");
};

// kolone koje NE diramo (identifikatori/URL-ovi/tehnika — ionako nemaju — –,
// ali da ne prepisujemo bez potrebe)
const SKIP = new Set(["id", "slug", "created_at", "updated_at", "published_at"]);

let totalRows = 0;
const backup = {};
async function processTable(table, labelCol) {
  backup[table] = [];
  let from = 0, hits = 0;
  for (;;) {
    const { data, error } = await sb.from(table).select("*").range(from, from + 499);
    if (error) { console.error(table, "ERR:", error.message); return; }
    if (!data?.length) break;
    for (const row of data) {
      const patch = {};
      for (const [col, val] of Object.entries(row)) {
        if (SKIP.has(col) || val == null) continue;
        if (containsDash(val)) {
          patch[col] = typeof val === "string" ? fix(val) : fixDeep(JSON.parse(JSON.stringify(val)));
        }
      }
      if (Object.keys(patch).length) {
        hits++;
        const orig = { id: row.id };
        for (const col of Object.keys(patch)) orig[col] = row[col];
        backup[table].push(orig);
        console.log(`  ${table} [${row[labelCol] ?? row.id}] kolone: ${Object.keys(patch).join(", ")}`);
        for (const col of Object.keys(patch)) console.log(`      ${col}: …${excerpt(row[col])}…`);
        if (APPLY) {
          const { error: ue } = await sb.from(table).update(patch).eq("id", row.id);
          if (ue) console.error(`  ${table}/${row.id}: UPDATE ERR: ${ue.message}`);
        }
      }
    }
    if (data.length < 500) break;
    from += 500;
  }
  console.log(`${table}: ${hits} redova ${APPLY ? "izmenjeno" : "za izmenu"}\n`);
  totalRows += hits;
}

await processTable("courses", "slug");
await processTable("products", "slug");
await processTable("blog_posts", "slug");

if (APPLY) {
  const f = path.join(__dirname, "_backup-crtice-2-2026-07-16.json");
  fs.writeFileSync(f, JSON.stringify(backup, null, 2));
  console.log(`Backup originala: ${f}`);
}
console.log(`UKUPNO: ${totalRows} redova. ${APPLY ? "GOTOVO ✓" : "(dry-run — dodaj --apply)"}`);
