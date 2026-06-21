/** B1.2 "Prüfung - Lesen und Hören" — upload Hören mp3 na Supabase Storage + dodaj audio plejer.
 *  Dry-run podrazumevano; --apply za upload+upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const MP3 = "/Users/natasahartweger/Documents/Claude/sajt/LMS/B1/audio/Schritte_int_Neu_6_AB_CD_2_Track_10_L09_Schritt_E_23.mp3";
const BUCKET = "blog-media";
const PATH = "kursevi/b1-2/hoeren-smartphones-kinder/diskussion.mp3";
const LABEL = "Diskussion (hört zweimal)";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: lesson } = await sb.from("lessons").select("id, sections").eq("course_id", course.id).eq("title", "Prüfung - Lesen und Hören").single();

console.log("MP3:", MP3.split("/").pop());
console.log("→ bucket:", BUCKET, "path:", PATH);

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

// 1) upload
const buf = readFileSync(MP3);
const { error: ue } = await sb.storage.from(BUCKET).upload(PATH, buf, { contentType: "audio/mpeg", upsert: true });
if (ue) { console.error("upload:", ue.message); process.exit(1); }
const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(PATH);
const url = pub.publicUrl;
console.log("Public URL:", url);

// 2) ubaci audio sekciju posle Hören intro-a, izbaci "audio uskoro" napomenu
let s = lesson.sections.filter((x) => !(x.type === "text" && /Audio snimak \(mp3\)|Audio snimak i interaktivno/.test(x.content || "")));
const audioSec = { type: "audio", url, label: LABEL };
const hi = s.findIndex((x) => x.type === "text" && /## Hören/.test(x.content || ""));
s.splice(hi + 1, 0, audioSec);

const { error: eu } = await sb.from("lessons").update({ sections: s }).eq("id", lesson.id);
if (eu) { console.error("update:", eu.message); process.exit(1); }
console.log("Raspored:", s.map((x) => x.type + (x.title ? `(${x.title})` : "")).join(", "));
console.log("\nGOTOVO ✓  Audio okačen i plejer dodat u Hören deo.");
