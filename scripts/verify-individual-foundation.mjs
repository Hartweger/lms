// scripts/verify-individual-foundation.mjs — provera Etape 0. Pokretanje: node scripts/verify-individual-foundation.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
let ok = true;
const fail = (m) => { console.error("✗", m); ok = false; };
const pass = (m) => console.log("✓", m);

const PROF_EMAILS = ["natasa@hartweger.rs","marija@hartweger.rs","milica@hartweger.rs","suzana@hartweger.rs","katarina@hartweger.rs","hristina@hartweger.rs","danica@hartweger.rs"];
const { data: profs } = await supa.from("user_profiles")
  .select("email, calendar_url, honorar_ind, honorar_grp").in("email", PROF_EMAILS);
const configured = (profs ?? []).filter((p) => p.calendar_url && p.honorar_ind && p.honorar_grp);
configured.length >= 7 ? pass(`prof config: ${configured.length} profesorki`) : fail(`prof config: samo ${configured.length} (očekivano ≥7)`);

const { data: variants } = await supa.from("product_variants").select("course_id, professor_id, package_type, price");
(variants?.length ?? 0) >= 40 ? pass(`product_variants: ${variants.length} redova`) : fail(`product_variants: ${variants?.length} (premalo)`);

const badPrice = (variants ?? []).filter((v) => !v.price || v.price <= 0);
badPrice.length === 0 ? pass("sve varijacije imaju cenu") : fail(`${badPrice.length} varijacija bez cene`);

const { data: lessons } = await supa.from("courses").select("slug, included_lessons").not("included_lessons", "is", null);
(lessons?.length ?? 0) >= 10 ? pass(`included_lessons: ${lessons.length} kurseva`) : fail(`included_lessons: ${lessons?.length}`);

process.exit(ok ? 0 : 1);
