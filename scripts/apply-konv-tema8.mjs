// Nedestruktivno: dodaje SAMO lekciju #8 „Hoffnungen & Erwartungen" + veže grupe.
// NE briše postojeće lekcije (8 polaznika ima napredak).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "baee3f7c-b831-4add-8c13-48c4a5b1fa57";
const LEVEL = "Konverzacija B1+";
const TITLE = "Hoffnungen & Erwartungen";
const KEY = "konv-b1-hoffnungen-erwartungen";

const items = readFileSync("scripts/konverzacijski-wordsets/set-hoffnungen-erwartungen.tsv", "utf8")
  .split("\n").map(l=>l.replace(/\r$/,"")).filter(l=>l.trim()&&l.includes("\t"))
  .map(l=>{const [f,b]=l.split("\t");return {front:f.trim(),back:b.trim()};});

const section = { type:"wordset", title:`${TITLE} - Reči`, setKey:KEY, frontLabel:"DE", backLabel:"SR", items };
console.log(`Lekcija #8 „${TITLE}" — ${items.length} reči`);
console.log("Prva:", JSON.stringify(items[0]), "| Poslednja:", JSON.stringify(items.at(-1)));
if (!APPLY) { console.log("\nDry-run. --apply za upis."); process.exit(0); }

const { data: post } = await sb.from("lessons").select("id,title").eq("course_id", CID).eq("order_index", 8).maybeSingle();
if (post) {
  const { error } = await sb.from("lessons").update({ title: TITLE, sections: [section] }).eq("id", post.id);
  if (error) { console.error(error.message); process.exit(1); }
  console.log("✓ lekcija #8 ažurirana (postojala):", post.id);
} else {
  const { data, error } = await sb.from("lessons").insert({ course_id: CID, title: TITLE, lesson_type: "text", order_index: 8, sections: [section] }).select("id").single();
  if (error) { console.error(error.message); process.exit(1); }
  console.log("✓ lekcija #8 kreirana:", data.id);
}

// Willkommen: skloni fiksni dan (grupe su bile petkom/subotom, sad utorkom)
const { data: w } = await sb.from("lessons").select("id,sections").eq("course_id", CID).eq("order_index", 0).maybeSingle();
if (w?.sections?.[0]?.content?.includes("jednom nedeljno, petkom,")) {
  const secs = structuredClone(w.sections);
  secs[0].content = secs[0].content.replace("jednom nedeljno, petkom,", "jednom nedeljno,");
  const { error } = await sb.from("lessons").update({ sections: secs }).eq("id", w.id);
  console.log(error ? `Willkommen: ${error.message}` : "✓ Willkommen: uklonjeno „petkom“ (grupa je sad utorkom)");
}

// Grupe → sadržajni kurs (prof panel čita napredak preko ovog polja)
const { data: gs } = await sb.from("groups").select("id,start_date,status,content_course_id").eq("level", LEVEL);
for (const g of gs) {
  if (g.content_course_id === CID) { console.log(`  = grupa ${g.start_date} (${g.status}) već vezana`); continue; }
  const { error } = await sb.from("groups").update({ content_course_id: CID }).eq("id", g.id);
  console.log(error ? `grupa ${g.id}: ${error.message}` : `✓ grupa ${g.start_date} (${g.status}) vezana (bilo: ${g.content_course_id ?? "null"})`);
}
