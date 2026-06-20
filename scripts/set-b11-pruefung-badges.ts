/**
 * Dodaje pruefung:true na prvi badge svih ispitnih B1.1 lekcija (prikaz „Prüfung" oznake).
 * Run: npx tsx scripts/set-b11-pruefung-badges.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [key, ...v] = line.split("=");
  if (key && v.length > 0) process.env[key.trim()] = v.join("=").trim();
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const B11_COURSE = "b8c765b7-c377-4941-a1f9-ebe39372fe4a";
const TITLES = [
  "Leseverstehen B1 — Was bringt Glück?",
  "Hörverstehen B1 — Gesund leben",
  "Lesen & Schreiben B1 — Bore-out",
  "Schreiben B1 — Forumsbeitrag (Sprachen lernen)",
  "Lesen & Hören B1 — Praktikum & Bewerbungsgespräch",
  "Hörverstehen B1 — Fünf Radioansagen",
  "Lückentext B1 — WG-Zimmer",
  "Schreiben B1 — Entschuldigung an die Nachbarn",
];

async function main() {
  for (const title of TITLES) {
    const { data: lesson } = await supabase
      .from("lessons").select("id, sections").eq("course_id", B11_COURSE).eq("title", title).maybeSingle();
    if (!lesson) { console.log(`⚠️  nema: ${title}`); continue; }
    const sections = (lesson.sections as { type: string; pruefung?: boolean }[]) ?? [];
    const badge = sections.find((s) => s.type === "badge");
    if (!badge) { console.log(`⚠️  nema badge: ${title}`); continue; }
    badge.pruefung = true;
    const { error } = await supabase.from("lessons").update({ sections }).eq("id", lesson.id);
    console.log(error ? `✗ ${title}: ${error.message}` : `✓ ${title}`);
  }
}
main();
