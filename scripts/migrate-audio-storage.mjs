// Migracija public/audio → Supabase Storage bucket "lekcije-media".
// Kreira javni bucket ako ne postoji, uploaduje sve fajlove čuvajući putanje,
// pa proveri da svaki javni URL vraća 200.
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE;
if (!URL_ || !KEY) { console.error("nema kredencijala"); process.exit(1); }
const sb = createClient(URL_, KEY);

const BUCKET = "lekcije-media";
const { data: buckets } = await sb.storage.listBuckets();
if (!buckets?.some(b => b.name === BUCKET)) {
  const { error } = await sb.storage.createBucket(BUCKET, { public: true });
  if (error) { console.error("createBucket:", error.message); process.exit(1); }
  console.log("bucket kreiran:", BUCKET);
} else {
  console.log("bucket postoji:", BUCKET);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
  );
}
const base = path.join(ROOT, "public");
const files = walk(path.join(base, "audio")).filter(f => !f.endsWith(".DS_Store"));
console.log("fajlova:", files.length);

const TYPES = { ".mp3": "audio/mpeg", ".mp4": "video/mp4", ".txt": "text/plain", ".json": "application/json" };
let ok = 0, fail = 0;
for (const f of files) {
  const key = path.relative(base, f); // npr. audio/hoeren/02_....mp3
  const ext = path.extname(f).toLowerCase();
  const { error } = await sb.storage.from(BUCKET).upload(key, fs.readFileSync(f), {
    contentType: TYPES[ext] ?? "application/octet-stream",
    upsert: true,
    cacheControl: "31536000",
  });
  if (error) { console.error("FAIL", key, error.message); fail++; }
  else { ok++; if (ok % 10 === 0) console.log(`upload ${ok}/${files.length}`); }
}
console.log(`upload gotov: ok=${ok} fail=${fail}`);
if (fail > 0) process.exit(1);

// provera: svaki fajl mora da vrati 200 sa javnog URL-a
let bad = 0;
for (const f of files) {
  const key = path.relative(base, f);
  const pub = `${URL_}/storage/v1/object/public/${BUCKET}/${key}`;
  const r = await fetch(pub, { method: "HEAD" });
  if (r.status !== 200) { console.error("URL NIJE 200:", r.status, key); bad++; }
}
console.log(bad === 0 ? "SVI URL-ovi 200 ✓" : `LOŠIH URL-ova: ${bad}`);
process.exit(bad === 0 ? 0 : 1);
