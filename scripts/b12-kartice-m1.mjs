// B1.2 — Kartice/vokabular, MODUL 1 (lekcije #2–#5): množina imenica + predlog/padež.
// Format: "die Beschwerde, Beschwerden" · "sich bewerben um + Akk" · "(nur Sg.)" · "(Pl.)".
// Menja samo nemačku stranu (row[0]); prevod ostaje. Dry-run; --apply za upis.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

// originalni nemački termin → obogaćeni
const MAP = {
  "der Auftrag": "der Auftrag, Aufträge",
  "die Zusammenarbeit": "die Zusammenarbeit (nur Sg.)",
  "der Einfluss": "der Einfluss, Einflüsse",
  "der Arbeitsplatz": "der Arbeitsplatz, Arbeitsplätze",
  "sich bewerben um": "sich bewerben um + Akk",
  "sich wenden an": "sich wenden an + Akk",
  "die Konsequenz": "die Konsequenz, Konsequenzen",
  "das Betriebsklima": "das Betriebsklima (nur Sg.)",
  "die Karriereexpertin": "die Karriereexpertin, -nen",
  "der Umgang": "der Umgang (nur Sg.)",
  "verwechseln": "verwechseln (mit + Dat)",
  "das Tabuthema": "das Tabuthema, Tabuthemen",
  "die Geldsorgen": "die Geldsorgen (Pl.)",
  "trennen": "trennen (von + Dat)",
  "die Beschwerde": "die Beschwerde, Beschwerden",
  "das Problem": "das Problem, Probleme",
  "die Frist": "die Frist, Fristen",
  "die Mahnung": "die Mahnung, Mahnungen",
  "der Fehler": "der Fehler, Fehler",
  "das Missverständnis": "das Missverständnis, Missverständnisse",
  "die Lösung": "die Lösung, Lösungen",
  "der Termin": "der Termin, Termine",
  "der Vorgesetzte": "der Vorgesetzte, Vorgesetzten",
  "die Verspätung": "die Verspätung, Verspätungen",
};

const LESSONS = [2, 3, 4, 5];

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: lessons } = await sb.from("lessons").select("id, order_index, title, sections").eq("course_id", course.id).in("order_index", LESSONS);
const byIdx = Object.fromEntries(lessons.map((l) => [l.order_index, l]));

for (const idx of LESSONS) {
  const l = byIdx[idx];
  if (!l) { console.log(`#${idx}: NEMA`); continue; }
  const sections = JSON.parse(JSON.stringify(l.sections));
  const hits = [];
  for (const s of sections) {
    if (s.type === "vocabulary" && Array.isArray(s.rows)) {
      for (const row of s.rows) {
        if (MAP[row[0]]) { hits.push(`${row[0]} → ${MAP[row[0]]}`); row[0] = MAP[row[0]]; }
      }
    }
  }
  console.log(`\n#${idx} ${l.title} — ${hits.length} izmena`);
  hits.forEach((h) => console.log("   • " + h));
  if (hits.length && APPLY) {
    const { error } = await sb.from("lessons").update({ sections }).eq("id", l.id);
    console.log(error ? "   ✗ " + error.message : "   ✓ upisano");
  }
}
if (!APPLY) console.log("\nDry-run — pokreni sa --apply za upis.");
