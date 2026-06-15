#!/usr/bin/env node
/**
 * Post-deploy smoke test.
 *
 * Zelen `next build` NE garantuje da ruta radi — Server Component može da padne
 * tek kad request pogodi serverless funkciju (npr. jsdom/ERR_REQUIRE_ESM koji je
 * srušio sve lekcije 2026-06-01). Ova skripta otvori kritične rute na pravom
 * domenu i padne (exit 1) ako bilo koja vrati ne-200 ili "server error" marker.
 *
 * Pokretanje:
 *   node scripts/smoke-deploy.mjs                      # default https://www.hartweger.rs
 *   node scripts/smoke-deploy.mjs https://<preview>... # drugi domen
 *
 * Supabase URL/anon ključ se čitaju iz .env.local / .env.production / process.env
 * (samo da bi se dohvatio jedan free-preview lesson id; ako ne uspe, koristi se
 * fallback lista poznatih free lekcija).
 */
import { readFileSync } from "node:fs";

const BASE = (process.argv[2] || "https://www.hartweger.rs").replace(/\/$/, "");
const ERROR_MARKERS = ["server error occurred", "server-side exception", "Application error"];
const FALLBACK_LESSON_IDS = [
  "af4fefa8-55ed-4e30-9e21-a421b7f00a46", // Willkommen (free preview)
  "055bffbf-4abf-4590-afee-0e67b5027375", // Berufe (free preview)
];

function loadEnv() {
  const env = { ...process.env };
  for (const file of [".env.local", ".env.production", ".env"]) {
    try {
      for (const line of readFileSync(new URL(`../${file}`, import.meta.url), "utf8").split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch { /* file optional */ }
  }
  return env;
}

async function fetchFreeLessonIds(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return FALLBACK_LESSON_IDS;
  try {
    const r = await fetch(
      `${url}/rest/v1/lessons?select=id&is_free_preview=eq.true&limit=3`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!r.ok) return FALLBACK_LESSON_IDS;
    const rows = await r.json();
    const ids = rows.map((x) => x.id).filter(Boolean);
    return ids.length ? ids : FALLBACK_LESSON_IDS;
  } catch {
    return FALLBACK_LESSON_IDS;
  }
}

async function check(path, { expect = 200 } = {}) {
  const url = `${BASE}${path}`;
  try {
    const r = await fetch(url, { redirect: "manual" });
    // Vercel auto-mitigacija (DDoS challenge): sajt JE gore, samo firewall izaziva
    // botove JS-challenge-om koji node-fetch ne može da reši. Ne tretiraj kao pad.
    if (r.headers.get("x-vercel-mitigated") === "challenge") {
      return { path, status: r.status, ok: true, note: "vercel challenge (gore, zaštićeno)" };
    }
    const body = r.status === expect ? await r.text() : "";
    const marker = ERROR_MARKERS.find((m) => body.includes(m));
    const ok = r.status === expect && !marker;
    return { path, status: r.status, ok, note: marker ? `contains "${marker}"` : "" };
  } catch (e) {
    return { path, status: "ERR", ok: false, note: String(e.message || e) };
  }
}

const env = loadEnv();
const lessonIds = await fetchFreeLessonIds(env);

const checks = [
  check("/"),
  check("/kursevi"),
  check("/dashboard", { expect: 307 }), // auth redirect — ne 500
  ...lessonIds.map((id) => check(`/lekcija/${id}`)),
];

const results = await Promise.all(checks);
let failed = 0;
console.log(`Smoke test → ${BASE}\n`);
for (const r of results) {
  const tag = r.ok ? "  ok " : "FAIL ";
  if (!r.ok) failed++;
  console.log(`${tag} ${String(r.status).padEnd(4)} ${r.path}${r.note ? `  (${r.note})` : ""}`);
}
console.log("");
if (failed) {
  console.error(`✗ ${failed}/${results.length} provera palo — deploy NIJE zdrav.`);
  process.exit(1);
}
console.log(`✓ svih ${results.length} provera prošlo.`);
