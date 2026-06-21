// Otprema SVG ilustracije zanimanja (iz Natašinog berufe_vezbe.html)
// u Supabase Storage (bucket blog-media, folder fsp/illustrations/, prefix berufe-).
// SVG markup se NE prepisuje ručno: čita se var IC={...} iz HTML-a i evaluira u sandboxu.
// Boje prebačene na brend: tirkiz var(--tirkiz) -> plava #4fb1d3, roze var(--roze) -> koral #F78687.
// Ostale hardkodirane boje ostaju. Dry-run default; --apply za otpremanje.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const HTML = "/Users/natasahartweger/Documents/Claude/sajt/FSP novi/html/berufe_vezbe.html";
const html = readFileSync(HTML, "utf8");

// Izvuci tekst objekta var IC={ ... }; (do prvog "};" na nivou)
const start = html.indexOf("var IC={");
if (start < 0) throw new Error("var IC= nije nađen u HTML-u");
const objStart = html.indexOf("{", start);
// nadji odgovarajuću zatvarajuću zagradu
let depth = 0, end = -1;
for (let i = objStart; i < html.length; i++) {
  if (html[i] === "{") depth++;
  else if (html[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
}
if (end < 0) throw new Error("zatvarajuća } za IC nije nađena");
const objLiteral = html.slice(objStart, end + 1);

// Sandbox: brend boje, ostale hardkodirane ostaju u markupu.
const T = "#4fb1d3", R = "#F78687", G = "#6b7b84", L = "#cdd6db", SK = "#f0c987";
const svg = (i) => `<svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">${i}</svg>`;
const IC = new Function("svg", "T", "R", "G", "L", "SK", `return (${objLiteral});`)(svg, T, R, G, L, SK);

const BUCKET = "blog-media";
const FOLDER = "fsp/illustrations";

async function main() {
  const keys = Object.keys(IC);
  console.log(`SVG-ova: ${keys.length}, bucket: ${BUCKET}/${FOLDER} (prefix berufe-)`);
  const urls = {};
  for (const key of keys) {
    const path = `${FOLDER}/berufe-${key}.svg`;
    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
    urls[key] = pub.publicUrl;
    if (APPLY) {
      const { error } = await sb.storage.from(BUCKET).upload(path, IC[key], { contentType: "image/svg+xml", upsert: true });
      console.log(error ? `  ✗ ${key}: ${error.message}` : `  ✓ berufe-${key}.svg`);
    }
  }
  console.log(`\n${APPLY ? "Otpremljeno." : "[DRY-RUN] Nije otpremljeno (--apply za otpremanje)."}`);
  console.log("URL mapa:\n" + JSON.stringify(urls, null, 2));
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
