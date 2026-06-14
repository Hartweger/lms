// Generiše statički istorijski honorar po mesecu/profesorki u src/lib/honorari-history.json.
// Izvor: Natašin Google Sheet "Isplata 2026" (jan-mart, Ukupan iznos) + ručna dopuna za april
// (sheet april ima #REF/zastarele vrednosti). Stvarne isplate za časove - ZAMENJUJU obračun iz
// migriranih časova za te mesece (koji je nepotpun). Nataša/Danica isključene (owner / nije na platformi).
import { writeFileSync } from "node:fs";
import { client } from "./lib/exam-packer.mjs";
const sb = client();

// ime u sheet-u → deo full_name u bazi (za rezoluciju professor_id)
const AMOUNTS = {
  "Hristina": { match: "Hristina", jan: 25200, feb: 34300, mar: 49000, apr: 40600 },
  "Katarina": { match: "Katarina", jan: 74280, feb: 105046, mar: 96480, apr: 71200 },
  "Marija":   { match: "Marija",   jan: 20600, feb: 29800, mar: 39200, apr: 54200 },
  "Milica":   { match: "Milica",   jan: 102525, feb: 112890, mar: 142600, apr: 92600 },
  "Suzana":   { match: "Suzana",   jan: 82200, feb: 52400, mar: 52000, apr: 49600 },
};

const { data: profs } = await sb.from("user_profiles").select("id, full_name").eq("role", "professor");
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4 };
const rows = [];
for (const [, info] of Object.entries(AMOUNTS)) {
  const p = (profs ?? []).find((x) => (x.full_name ?? "").includes(info.match));
  if (!p) { console.error(`! Nije nađena profesorka: ${info.match}`); continue; }
  for (const [mk, mnum] of Object.entries(MONTHS)) {
    if (info[mk] != null) rows.push({ year: 2026, month: mnum, professor_id: p.id, ime: p.full_name, amount: info[mk] });
  }
}
writeFileSync("src/lib/honorari-history.json", JSON.stringify({ "2026": rows }, null, 2) + "\n");

const f = (n) => n.toLocaleString("de-DE");
const byM = {};
for (const r of rows) byM[r.month] = (byM[r.month] || 0) + r.amount;
console.log("Honorari po mesecu (override):");
for (const m of [1, 2, 3, 4]) console.log(`  2026-0${m}: ${f(byM[m] || 0)} RSD`);
console.log(`✓ src/lib/honorari-history.json (${rows.length} redova)`);
