/**
 * Zamenjuje duge crtice (— em-dash, – en-dash) običnom crticom "-" u CELOM
 * sadržaju kurseva: naslovi i opisi kurseva, naslovi lekcija, sections JSON,
 * content, naslovi vežbi, pitanja/opcije/odgovori/objašnjenja.
 * Odluka Nataše 12.06.2026: polaznici ne mogu da otkucaju "—", obična svuda.
 *
 *   node scripts/zameni-crtice.mjs           # dry-run (samo broji)
 *   node scripts/zameni-crtice.mjs --apply
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

const fix = (s) => (typeof s === "string" ? s.replace(DASH, "-") : s);
const fixDeep = (v) => {
  if (typeof v === "string") return fix(v);
  if (Array.isArray(v)) return v.map(fixDeep);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = fixDeep(val);
    return out;
  }
  return v;
};
const hasDash = (v) => DASH.test(JSON.stringify(v) ?? "");

let changed = 0;

async function processTable(table, idCol, fields, jsonFields = []) {
  let from = 0, total = 0;
  for (;;) {
    const { data, error } = await sb.from(table).select([idCol, ...fields, ...jsonFields].join(",")).range(from, from + 499);
    if (error) { console.error(table, "ERR:", error.message); return; }
    if (!data?.length) break;
    for (const row of data) {
      const patch = {};
      for (const f of fields) {
        DASH.lastIndex = 0;
        if (typeof row[f] === "string" && DASH.test(row[f])) patch[f] = fix(row[f]);
      }
      for (const f of jsonFields) {
        DASH.lastIndex = 0;
        if (row[f] != null && hasDash(row[f])) patch[f] = fixDeep(row[f]);
      }
      if (Object.keys(patch).length) {
        total++;
        if (APPLY) {
          const { error: ue } = await sb.from(table).update(patch).eq(idCol, row[idCol]);
          if (ue) console.error(`${table}/${row[idCol]}: ${ue.message}`);
        }
      }
    }
    if (data.length < 500) break;
    from += 500;
  }
  console.log(`${table}: ${total} redova ${APPLY ? "izmenjeno" : "za izmenu"}`);
  changed += total;
}

await processTable("courses", "id", ["title", "description"]);
await processTable("lessons", "id", ["title", "content"], ["sections"]);
await processTable("exercises", "id", ["title"]);
await processTable("exercise_questions", "id", ["question", "correct_answer", "explanation"], ["options"]);

console.log(`\nUKUPNO: ${changed} redova. ${APPLY ? "GOTOVO ✓" : "(dry-run — dodaj --apply)"}`);
