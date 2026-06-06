/**
 * Prebacuje slike i PDF-ove iz lekcija (sections) sa www.hartweger.rs na Supabase Storage
 * (bucket blog-media, prefiks kursevi/<slug>/) i prepisuje URL u bazi.
 * Da se sadržaj ne polomi kad se ugasi stari WP.
 *
 *   npx tsx scripts/migrate-course-media.ts <slug>            # dry-run
 *   npx tsx scripts/migrate-course-media.ts <slug> --write    # stvarno
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("="); if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const slug = process.argv[2];
const WRITE = process.argv.includes("--write");
const BUCKET = "blog-media";
if (!slug) { console.error("Usage: tsx scripts/migrate-course-media.ts <slug> [--write]"); process.exit(1); }

const isWP = (u: string) => /hartweger\.rs\/wp-content\//i.test(u || "");
const fileNameFrom = (u: string) => decodeURIComponent(u.split("?")[0].split("/").pop() || "file")
  .replace(/[^a-zA-Z0-9._-]/g, "_");
const ctFor = (name: string) => name.endsWith(".pdf") ? "application/pdf"
  : /\.(jpg|jpeg)$/i.test(name) ? "image/jpeg" : /\.png$/i.test(name) ? "image/png"
  : /\.webp$/i.test(name) ? "image/webp" : /\.gif$/i.test(name) ? "image/gif" : "application/octet-stream";

async function run() {
  const { data: course } = await sb.from("courses").select("id").eq("slug", slug).single();
  if (!course) throw new Error(`kurs ${slug} ne postoji`);
  const { data: lessons } = await sb.from("lessons").select("id,title,sections").eq("course_id", course.id);

  let found = 0, migrated = 0;
  for (const lesson of lessons || []) {
    const sections = lesson.sections as any[];
    if (!Array.isArray(sections)) continue;
    let changed = false;
    for (const s of sections) {
      const url = s?.url as string | undefined;
      if (!url || !isWP(url) || (s.type !== "image" && s.type !== "pdf")) continue;
      found++;
      const name = fileNameFrom(url);
      const storagePath = `kursevi/${slug}/${name}`;
      console.log(`  [${s.type}] ${lesson.title} → ${name}`);
      if (!WRITE) continue;
      const res = await fetch(url);
      if (!res.ok) { console.error(`    ✗ download ${res.status}: ${url}`); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      const { error: upErr } = await sb.storage.from(BUCKET).upload(storagePath, buf, { contentType: ctFor(name), upsert: true });
      if (upErr) { console.error(`    ✗ upload: ${upErr.message}`); continue; }
      const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
      s.url = pub.publicUrl;
      changed = true; migrated++;
    }
    if (WRITE && changed) {
      const { error } = await sb.from("lessons").update({ sections }).eq("id", lesson.id);
      if (error) console.error(`  ✗ update lesson ${lesson.title}: ${error.message}`);
    }
  }
  console.log(`\n${WRITE ? "Prebačeno" : "[DRY] našao"}: ${WRITE ? migrated : found} fajlova (slike/PDF) za ${slug}.`);
  if (!WRITE) console.log("Pokreni sa --write za stvarno.");
}
run().catch((e) => { console.error(e); process.exit(1); });
