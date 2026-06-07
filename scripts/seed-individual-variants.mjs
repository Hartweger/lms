// scripts/seed-individual-variants.mjs
// Povlači WC varijacije individualnih kurseva i puni product_variants. Idempotentno
// (briše postojeće varijacije za te kurseve, pa upisuje). Pokretanje (tsx razrešava .ts import):
//   npx tsx scripts/seed-individual-variants.mjs [--apply]
// Bez --apply samo ispisuje izveštaj (dry-run). Kredencijali iz .env.local.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { mapWcVariationsToRows } from "../src/lib/wc-variant-map.ts";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const WC = "https://hartweger.rs/wp-json/wc/v3";
const CK = "ck_5fa42d3e78f75b6ddc9b166f70f0efddb3625322";
const CS = "cs_55c370aec2ab635f6e6fe83e76ea2b645d486bc4";
const APPLY = process.argv.includes("--apply");

// WC product id → naš courses.slug + da li je mesečni (ima Paket atribut).
const WC_TO_SLUG = [
  { id: 35766, slug: "individualni-kurs-nemackog-jezika-a11", monthly: false },
  { id: 35767, slug: "individualni-kurs-nemackog-jezika-a1-2", monthly: false },
  { id: 46494, slug: "paket-nivo-a1-a1-1-a1-2-individualni-standard", monthly: false },
  { id: 35758, slug: "individualni-kurs-nemackog-jezika-a2", monthly: false },
  { id: 35761, slug: "individualni-kurs-nemackog-jezika-a2-2", monthly: false },
  { id: 39308, slug: "individualni-kurs-nemackog-jezika-b11", monthly: false },
  { id: 39309, slug: "individualni-kurs-nemackog-jezika-b1-2", monthly: false },
  { id: 46656, slug: "individualni-kurs-nemackog-jezika-b2-1", monthly: false },
  { id: 47575, slug: "individualni-mesecni-paketi", monthly: true },
];

// Simple proizvodi (bez WC varijacija) → fiksna profesorka + cena.
const SIMPLE = [
  { slug: "individualni-polozi-fide", profEmail: "katarina@hartweger.rs", price: 24360 },
  { slug: "fsp-individualni", profEmail: "milica@hartweger.rs", price: 20500 },
];

async function wc(path) {
  const url = `${WC}${path}${path.includes("?") ? "&" : "?"}consumer_key=${CK}&consumer_secret=${CS}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WC ${res.status} za ${path}`);
  return res.json();
}

async function main() {
  const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Mape: slug→course_id, prof email→id.
  const { data: courses } = await supa.from("courses").select("id, slug");
  const courseIdBySlug = Object.fromEntries((courses ?? []).map((c) => [c.slug, c.id]));
  // Profesorke po 7 poznatih mejlova (Nataša je role='admin', pa NE filtriramo po roli).
  const PROF_EMAILS = [
    "natasa@hartweger.rs", "marija@hartweger.rs", "milica@hartweger.rs", "suzana@hartweger.rs",
    "katarina@hartweger.rs", "hristina@hartweger.rs", "danica@hartweger.rs",
  ];
  const { data: profs } = await supa.from("user_profiles").select("id, email").in("email", PROF_EMAILS);
  const profIdByEmail = Object.fromEntries((profs ?? []).map((p) => [p.email, p.id]));

  const allRows = [];
  const report = [];

  for (const m of WC_TO_SLUG) {
    const courseId = courseIdBySlug[m.slug];
    if (!courseId) { report.push(`SKIP: nema kursa za slug ${m.slug}`); continue; }
    const variations = await wc(`/products/${m.id}/variations?per_page=100`);
    const rows = mapWcVariationsToRows({ courseId, isMonthly: m.monthly, profIdByEmail, variations });
    report.push(`${m.slug}: ${rows.length} varijacija (WC ${variations.length})`);
    allRows.push({ courseId, rows });
    await new Promise((r) => setTimeout(r, 2500)); // WC rate-limit
  }

  for (const s of SIMPLE) {
    const courseId = courseIdBySlug[s.slug];
    const profId = profIdByEmail[s.profEmail];
    if (!courseId || !profId) { report.push(`SKIP simple: ${s.slug} (course=${!!courseId}, prof=${!!profId})`); continue; }
    allRows.push({ courseId, rows: [{ course_id: courseId, professor_id: profId, package_type: null, price: s.price, paypal_price_eur: null, is_active: true }] });
    report.push(`${s.slug}: 1 (simple, ${s.profEmail})`);
  }

  console.log("\n=== IZVEŠTAJ MAPIRANJA ===");
  report.forEach((r) => console.log(" ", r));
  const total = allRows.reduce((n, x) => n + x.rows.length, 0);
  console.log(`Ukupno varijacija: ${total}\n`);

  if (!APPLY) { console.log("DRY-RUN (bez --apply). Ništa nije upisano."); return; }

  for (const { courseId, rows } of allRows) {
    await supa.from("product_variants").delete().eq("course_id", courseId);
    if (rows.length) {
      const { error } = await supa.from("product_variants").insert(rows);
      if (error) throw new Error(`insert za ${courseId}: ${error.message}`);
    }
  }
  console.log("UPISANO.");
}

main().catch((e) => { console.error(e); process.exit(1); });
