/** B1.2 Temporalsätze — izbaci statične #7/#8 (sad AI vežba pisanja), badge→Modul 2, premesti u Modul 2.
 *  Dry-run podrazumevano; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const ID = "5066fc5d-4ef2-4061-9df6-6426213a6822";
const MODULE = "Modul 2 · Bildung & Gefühle";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: l } = await sb.from("lessons").select("sections").eq("id", ID).single();

// 1) izbaci statične #7/#8 (Toms Morgen + Mein Tag tekst i Lösung spoilere)
let s = l.sections.filter((x) => {
  if (x.type === "text" && /\(Toms Morgen\)|Mein Tag\. Schreibe Sätze/.test(x.content || "")) return false;
  if (x.type === "spoiler" && /^Lösung - (Toms Morgen|Mein Tag)$/.test(x.title || "")) return false;
  return true;
});
// 2) badge → Modul 2
s = s.map((x) => x.type === "badge" ? { ...x, module: MODULE } : x);

console.log("Sekcije posle:", s.map((x) => x.type + (x.title ? `(${x.title.slice(0,16)})` : "")).join(", "));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

await sb.from("lessons").update({ sections: s }).eq("id", ID);

// 3) premesti odmah posle "Prüfung - Lesen und Hören" (grupiše Modul 2)
const { data: all } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
const rest = all.filter((x) => x.id !== ID);
const pi = rest.findIndex((x) => x.title === "Prüfung - Lesen und Hören");
const seq = [];
for (let i = 0; i < rest.length; i++) { seq.push(rest[i].id); if (i === pi) seq.push(ID); }
let ch = 0;
for (let i = 0; i < seq.length; i++) { if (all.find((x) => x.id === seq[i])?.order_index !== i) { await sb.from("lessons").update({ order_index: i }).eq("id", seq[i]); ch++; } }
console.log(`\nGOTOVO ✓  badge→Modul 2, #7/#8 izbačeni, premešteno (${ch} izmena).`);
