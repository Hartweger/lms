// Otprema 17 SVG ilustracija oblika lekova (iz Natašinog medikamente_vezbe.html)
// u Supabase Storage (bucket blog-media, folder fsp/illustrations/).
// Boje prebačene na brend: tirkiz #51afd1 -> plava #4fb1d3, roze #e98e8d -> koral #F78687.
// Ispisuje javne URL-ove za upotrebu u gallery bloku. Dry-run default; --apply za otpremanje.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const T = "#4fb1d3", R = "#F78687", G = "#6b7b84", L = "#cdd6db", D = "#f0c987";
const svg = (inner) => `<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

const ICONS = {
  tablette: svg(`<circle cx="50" cy="30" r="18" fill="#fff" stroke="${T}" stroke-width="2.5"/><line x1="32" y1="30" x2="68" y2="30" stroke="${T}" stroke-width="2.5"/>`),
  kapsel: svg(`<rect x="26" y="22" width="48" height="16" rx="8" fill="#fff" stroke="${G}" stroke-width="2"/><path d="M50 22 a8 8 0 0 0 0 16 Z" fill="${R}"/><rect x="26" y="22" width="24" height="16" rx="8" fill="${R}" opacity="0.85"/>`),
  dragee: svg(`<ellipse cx="50" cy="30" rx="16" ry="11" fill="${D}"/><ellipse cx="44" cy="26" rx="5" ry="3" fill="#fff" opacity="0.6"/>`),
  tropfen: svg(`<path d="M50 14 C42 28 42 38 50 44 C58 38 58 28 50 14 Z" fill="${T}" opacity="0.85"/><ellipse cx="46" cy="32" rx="3" ry="5" fill="#fff" opacity="0.5"/>`),
  zaepfchen: svg(`<path d="M50 16 C58 22 58 40 50 46 C42 40 42 22 50 16 Z" fill="#fff" stroke="${G}" stroke-width="2"/>`),
  saft: svg(`<rect x="38" y="18" width="24" height="30" rx="3" fill="${R}" opacity="0.85" stroke="${G}"/><rect x="42" y="12" width="16" height="7" rx="2" fill="${G}"/><rect x="38" y="30" width="24" height="18" fill="${R}"/>`),
  pflaster: svg(`<rect x="24" y="22" width="52" height="16" rx="6" fill="#f0d9bf" stroke="${G}" transform="rotate(-12 50 30)"/><rect x="42" y="24" width="16" height="12" rx="2" fill="#fff" transform="rotate(-12 50 30)"/>`),
  salbe: svg(`<rect x="34" y="22" width="34" height="16" rx="3" fill="#fff" stroke="${G}"/><rect x="68" y="26" width="6" height="8" fill="${T}"/><path d="M74 30 q8 -6 14 0" stroke="#fff" stroke-width="4" fill="none"/><circle cx="86" cy="30" r="4" fill="#fff" stroke="${G}"/>`),
  ampulle: svg(`<path d="M46 14 L46 22 L42 44 L58 44 L54 22 L54 14 Z" fill="${T}" opacity="0.4" stroke="${G}"/><line x1="44" y1="14" x2="56" y2="14" stroke="${G}" stroke-width="2"/><line x1="43" y1="24" x2="57" y2="24" stroke="${R}" stroke-width="2"/>`),
  spritze: svg(`<rect x="24" y="26" width="40" height="9" rx="2" fill="#fff" stroke="${G}"/><rect x="20" y="24" width="6" height="13" fill="${G}"/><line x1="64" y1="30.5" x2="82" y2="30.5" stroke="${G}" stroke-width="2"/><rect x="34" y="26" width="24" height="9" fill="${T}" opacity="0.4"/>`),
  injektion: svg(`<rect x="22" y="27" width="36" height="8" rx="2" fill="#fff" stroke="${T}"/><rect x="18" y="25" width="6" height="12" fill="${T}"/><line x1="58" y1="31" x2="78" y2="31" stroke="${T}" stroke-width="2"/><path d="M70 24 l3 -3 m3 6 l3 -3" stroke="${R}" stroke-width="2"/>`),
  infusion: svg(`<path d="M40 12 L60 12 L56 30 L44 30 Z" fill="${T}" opacity="0.35" stroke="${G}"/><line x1="50" y1="30" x2="50" y2="48" stroke="${G}" stroke-width="2"/><circle cx="50" cy="40" r="2.5" fill="${T}"/>`),
  spray: svg(`<rect x="40" y="20" width="20" height="28" rx="3" fill="${T}" opacity="0.5" stroke="${G}"/><rect x="46" y="12" width="8" height="9" fill="${G}"/><path d="M62 14 l8 -3 M62 18 l8 0 M62 22 l8 3" stroke="${T}" stroke-width="2"/>`),
  rektiole: svg(`<path d="M44 18 L56 18 L54 40 Q50 46 46 40 Z" fill="#fff" stroke="${G}"/><rect x="46" y="14" width="8" height="5" fill="${R}"/>`),
  rezept: svg(`<rect x="32" y="14" width="36" height="34" rx="3" fill="#fff" stroke="${G}"/><text x="38" y="30" font-size="12" fill="${R}" font-family="serif" font-style="italic">Rx</text><line x1="38" y1="36" x2="62" y2="36" stroke="${L}" stroke-width="2"/><line x1="38" y1="42" x2="56" y2="42" stroke="${L}" stroke-width="2"/>`),
  frei: svg(`<circle cx="50" cy="30" r="16" fill="none" stroke="${T}" stroke-width="3"/><path d="M42 30 l5 5 l11 -11" stroke="${T}" stroke-width="3" fill="none"/>`),
  apotheke: svg(`<rect x="30" y="16" width="40" height="32" rx="3" fill="${T}" opacity="0.35" stroke="${G}"/><rect x="46" y="22" width="8" height="20" fill="${R}"/><rect x="40" y="28" width="20" height="8" fill="${R}"/>`),
};

const BUCKET = "blog-media";
const FOLDER = "fsp/illustrations";

async function main() {
  const keys = Object.keys(ICONS);
  console.log(`SVG-ova: ${keys.length}, bucket: ${BUCKET}/${FOLDER}`);
  const urls = {};
  for (const key of keys) {
    const path = `${FOLDER}/${key}.svg`;
    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
    urls[key] = pub.publicUrl;
    if (APPLY) {
      const { error } = await sb.storage.from(BUCKET).upload(path, ICONS[key], { contentType: "image/svg+xml", upsert: true });
      console.log(error ? `  ✗ ${key}: ${error.message}` : `  ✓ ${key}.svg`);
    }
  }
  console.log(`\n${APPLY ? "Otpremljeno." : "[DRY-RUN] Nije otpremljeno (--apply za otpremanje)."}`);
  console.log("URL mapa:\n" + JSON.stringify(urls, null, 2));
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
