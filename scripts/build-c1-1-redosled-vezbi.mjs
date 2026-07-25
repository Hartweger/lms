// C1.1 - redosled vežbi u tematskim lekcijama: „Leseverstehen" ide PRVI (odmah posle Lesetext-a),
// pa gramatičke vežbe, pa Wortschatz, pa „Test: Selbstkontrolle" na kraju.
// Menja ISKLJUČIVO exercises.order_index (sadržaj vežbi se ne dira). Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3bfe17d7-62fa-4b06-b844-b10db9acd5ed";

// rang: manji broj = ranije u listi
const rank = (title) => {
  if (title.startsWith("Leseverstehen:")) return 0;
  if (title.startsWith("Test:")) return 3;
  if (title.startsWith("Vežba: Wortschatz")) return 2;
  return 1; // gramatičke vežbe
};

const { data: lessons } = await sb.from("lessons").select("id,title,order_index").eq("course_id", CID).order("order_index");
let changed = 0;

for (const l of lessons ?? []) {
  const { data: exs } = await sb.from("exercises").select("id,title,order_index").eq("lesson_id", l.id).order("order_index");
  if (!exs?.length || !exs.some((e) => e.title.startsWith("Leseverstehen:"))) continue;

  // stabilno sortiranje: prvo po rangu, unutar ranga zadrži postojeći redosled
  const sorted = exs
    .map((e, i) => ({ ...e, i }))
    .sort((a, b) => rank(a.title) - rank(b.title) || a.i - b.i);

  const plan = sorted.map((e, idx) => ({ ...e, novi: idx })).filter((e) => e.novi !== e.order_index);
  if (!plan.length) continue;

  console.log(`\n${l.title}`);
  for (const e of plan) console.log(`  ${e.order_index} -> ${e.novi}  ${e.title}`);
  changed += plan.length;

  if (APPLY) {
    // privremeni pomak da se izbegne sudar vrednosti tokom preslaganja
    for (const e of plan) {
      const { error } = await sb.from("exercises").update({ order_index: e.novi + 100 }).eq("id", e.id);
      if (error) throw error;
    }
    for (const e of plan) {
      const { error } = await sb.from("exercises").update({ order_index: e.novi }).eq("id", e.id);
      if (error) throw error;
    }
  }
}

console.log(`\n${APPLY ? "✓ Gotovo" : "[DRY]"} - promenjenih vežbi: ${changed}`);
