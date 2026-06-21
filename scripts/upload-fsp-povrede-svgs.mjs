// Otprema SVG ilustracije (mesto nesreće + glagoli povreda) iz Natašinog
// nezgode_povrede_vezbe.html u Supabase Storage (bucket blog-media, folder fsp/illustrations/).
// SVG-ovi se izvlače iz `var ic={...}` u HTML-u i evaluiraju sa brend bojama:
// tirkiz var(--tirkiz) -> #4fb1d3, roze var(--roze) -> #F78687 (ostale hardkodirane boje ostaju).
// Putanja: fsp/illustrations/povrede-<key>.svg. Dry-run default; --apply za otpremanje.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const HTML = "/Users/natasahartweger/Documents/Claude/sajt/FSP novi/html/nezgode_povrede_vezbe.html";
const BUCKET = "blog-media";
const FOLDER = "fsp/illustrations";
const PREFIX = "povrede-";

// Izvuci objekat-literal `var ic={ ... };` iz HTML-a
function extractIcObject(html) {
  const start = html.indexOf("var ic={");
  if (start < 0) throw new Error("Nije nađen `var ic={` u HTML-u");
  let i = html.indexOf("{", start);
  let depth = 0;
  for (let j = i; j < html.length; j++) {
    const ch = html[j];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return html.slice(i, j + 1);
    }
  }
  throw new Error("Nije zatvorena zagrada za `var ic`");
}

function buildIcons(html) {
  const objLiteral = extractIcObject(html);
  // Brend boje: T/R remapovani; G/L kao u izvoru; ostale hardkodirane (#ffd34d, #7fb98f, #f6e0d0, #dfe6ea...) ostaju.
  const svg = (i) => `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">${i}</svg>`;
  const T = "#4fb1d3", R = "#F78687", G = "#6b7b84", L = "#cdd6db";
  // eslint-disable-next-line no-new-func
  const fn = new Function("svg", "T", "R", "G", "L", `return (${objLiteral});`);
  return fn(svg, T, R, G, L);
}

async function main() {
  const html = readFileSync(HTML, "utf8");
  const icons = buildIcons(html);
  const keys = Object.keys(icons);
  console.log(`SVG-ova: ${keys.length}, bucket: ${BUCKET}/${FOLDER}, prefix: ${PREFIX}`);
  const urls = {};
  for (const key of keys) {
    const path = `${FOLDER}/${PREFIX}${key}.svg`;
    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
    urls[key] = pub.publicUrl;
    if (APPLY) {
      const { error } = await sb.storage.from(BUCKET).upload(path, icons[key], { contentType: "image/svg+xml", upsert: true });
      console.log(error ? `  ✗ ${key}: ${error.message}` : `  ✓ ${PREFIX}${key}.svg`);
    }
  }
  console.log(`\n${APPLY ? "Otpremljeno." : "[DRY-RUN] Nije otpremljeno (--apply za otpremanje)."}`);
  console.log("URL mapa:\n" + JSON.stringify(urls, null, 2));
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
