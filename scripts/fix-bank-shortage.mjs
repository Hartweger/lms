// Popravlja fill_blank pitanja iz scripts/bank-shortage-report.json:
// u banku (options.items) dodaje nedostajuće kopije reči koje tačan odgovor traži više puta.
// Komponenta prati iskorišćenost po indeksu, pa duple reči rade ispravno.
// Pokretanje: node scripts/fix-bank-shortage.mjs          (dry-run)
//             node scripts/fix-bank-shortage.mjs --apply  (upis u bazu)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const report = JSON.parse(readFileSync("scripts/bank-shortage-report.json", "utf8"));
console.log(`${APPLY ? "UPIS" : "DRY-RUN"} — ${report.length} pitanja\n`);

let changed = 0;
for (const f of report) {
  const { data: q, error } = await sb.from("exercise_questions")
    .select("id, options, correct_answer").eq("id", f.question_id).single();
  if (error || !q) { console.log("⚠ ne mogu da učitam", f.question_id, error?.message); continue; }

  const opts = q.options;
  if (!opts || typeof opts !== "object" || opts.type !== "fill_blank" || !Array.isArray(opts.items)) {
    console.log("⚠ PRESKOČENO (neočekivan options oblik):", f.question_id); continue;
  }

  // Reizračunaj manjak iz SVEŽIH podataka (ne veruj reportu slepo).
  const norm = (s) => String(s).trim().toLowerCase();
  const answers = (q.correct_answer || "").split(",").map((a) => a.trim()).filter(Boolean);
  const need = new Map(); for (const a of answers) need.set(norm(a), (need.get(norm(a)) || 0) + 1);
  const have = new Map(); for (const it of opts.items) have.set(norm(it), (have.get(norm(it)) || 0) + 1);

  const toAdd = [];
  for (const [w, n] of need) {
    const deficit = n - (have.get(w) || 0);
    // dodaj tačno onu varijantu reči kakva stoji u odgovoru (čuva originalni casing)
    const orig = answers.find((a) => norm(a) === w) || w;
    for (let k = 0; k < deficit; k++) toAdd.push(orig);
  }
  if (toAdd.length === 0) { console.log("· bez izmene:", f.course, f.lesson.slice(0, 30)); continue; }

  const newItems = [...opts.items, ...toAdd];
  const newOptions = { ...opts, items: newItems };

  console.log(`✓ ${f.course} | ${f.lesson.slice(0, 35)}`);
  console.log(`   pre:  [${opts.items.join(", ")}]`);
  console.log(`   posle:[${newItems.join(", ")}]   (+${toAdd.join(", ")})   CA: ${q.correct_answer}`);
  if (APPLY) {
    const { error: upErr } = await sb.from("exercise_questions").update({ options: newOptions }).eq("id", q.id);
    if (upErr) { console.log("   ⚠ UPDATE GREŠKA:", upErr.message); continue; }
  }
  changed++;
}
console.log(`\n${APPLY ? "Izmenjeno" : "Za izmenu"}: ${changed}/${report.length}`);
