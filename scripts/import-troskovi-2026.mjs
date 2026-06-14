// Uvoz troškova jan-maj 2026 iz Natašinog sheet-a "Troskovi portfolio po godinama" u expenses tabelu.
// Po-mesečni one-time redovi (recurring=false). NE uvozi "plate" (= honorari, već se broje posebno).
// Jun+ je već u seed-u (recurring od 2026-06-01) pa se ne dira. Idempotentno preko note markera.
// Dry-run default; --apply za upis.
import { client } from "./lib/exam-packer.mjs";
const APPLY = process.argv.includes("--apply");
const sb = client();
const NOTE = "import-troskovi-jan-maj-2026";
const MONTHS = ["2026-01-15", "2026-02-15", "2026-03-15", "2026-04-15", "2026-05-15"]; // jan..maj

// [naziv, kategorija, [jan, feb, mar, apr, maj]]  — 0 = preskoči taj mesec
const ITEMS = [
  ["Knjigovođa", "usluge", [31152, 45312, 31152, 31152, 31152]],
  ["Fiskom licenca", "alati-hosting", [1199, 1199, 1199, 1199, 1199]],
  ["Hostinger", "alati-hosting", [1458, 1458, 1458, 1458, 1458]],
  ["Održavanje sajta", "usluge", [5000, 5000, 5000, 5000, 5000]],
  ["LearnDash", "alati-hosting", [2000, 2000, 2000, 2000, 2000]],
  ["MailerLite", "alati-hosting", [6688, 6688, 6688, 6688, 6688]],
  ["ChatGPT", "alati-hosting", [2314, 2314, 2314, 0, 0]],
  ["Google Workspace", "alati-hosting", [14784, 14784, 14784, 14784, 14784]],
  ["Canva", "alati-hosting", [1764, 1764, 1764, 1764, 1764]],
  ["Veed", "alati-hosting", [2160, 2160, 2160, 2160, 2160]],
  ["CupCut", "alati-hosting", [600, 600, 600, 600, 600]],
  ["Vimeo", "alati-hosting", [1053, 1053, 1053, 1053, 1053]],
  ["ManyChat", "alati-hosting", [7020, 5265, 5265, 5265, 0]],
  ["Gamma", "alati-hosting", [2340, 2340, 2340, 2340, 2340]],
  ["PWA", "alati-hosting", [0, 0, 0, 3042, 1160]],
  ["Claude", "alati-hosting", [0, 0, 0, 11700, 23400]],
  ["Doprinosi", "porezi-doprinosi", [119986, 107549, 120000, 120000, 119987]],
  ["Održavanje računa (banka)", "provizije", [2000, 2000, 2000, 2000, 2000]],
  ["Oglašavanje (ad spend)", "oglasi", [45237, 35367, 44040, 46592, 43462]],
  ["Marketing snimanje/edit", "produkcija-sadrzaja", [103471, 20000, 0, 106130, 40000]],
  ["Eko taksa", "porezi-doprinosi", [420, 420, 420, 420, 420]],
  ["Porez na prostor", "porezi-doprinosi", [2118, 2118, 2118, 2118, 2118]],
  ["Porez na dobit (akontacija)", "porezi-doprinosi", [48950, 0, 36110, 44810, 44810]],
  ["Investicije", "ostalo", [100000, 0, 0, 0, 0]],
  ["Provizija za plaćanje karticama", "provizije", [27579, 27942, 24118, 19686, 18676]],
  ["Marketing tim (Meta)", "oglasi", [82544, 35000, 35000, 35000, 35000]],
  ["PDV", "porezi-doprinosi", [96196, 101884, 147253, 55195, 73155]],
  // "plate" NAMERNO izostavljeno — to su honorari, već se broje preko honorari-history.
];

const rows = [];
for (const [name, category, vals] of ITEMS) {
  vals.forEach((amt, i) => {
    if (amt > 0) rows.push({ name, category, amount: amt, course_id: null, expense_date: MONTHS[i], recurring: false, ended_at: null, note: NOTE });
  });
}

// dry-run rezime: kategorija × mesec
const CATS = ["oglasi", "produkcija-sadrzaja", "provizije", "usluge", "plate-tim", "porezi-doprinosi", "alati-hosting", "materijali", "ostalo"];
const MK = ["jan", "feb", "mar", "apr", "maj"];
const grid = {}; for (const c of CATS) grid[c] = [0, 0, 0, 0, 0];
for (const r of rows) { const mi = MONTHS.indexOf(r.expense_date); grid[r.category][mi] += r.amount; }
const f = (n) => Math.round(n).toLocaleString("de-DE");
console.log(`Redova za upis: ${rows.length}  | ${APPLY ? "APPLY" : "DRY"}`);
console.log("\nKategorija | " + MK.join(" | "));
const colTot = [0, 0, 0, 0, 0];
for (const c of CATS) { const v = grid[c]; if (v.every((x) => x === 0)) continue; v.forEach((x, i) => colTot[i] += x); console.log(`  ${c} | ${v.map(f).join(" | ")}`); }
console.log(`  UKUPNO troškovi | ${colTot.map(f).join(" | ")}`);
console.log(`  (napomena: honorari se broje posebno, NISU ovde)`);

if (!APPLY) { console.log("\n[DRY] dodaj --apply za upis."); process.exit(0); }
// idempotentno: obriši prethodni uvoz pa upiši
const { error: delErr } = await sb.from("expenses").delete().eq("note", NOTE);
if (delErr) throw delErr;
const { error } = await sb.from("expenses").insert(rows);
if (error) throw error;
console.log(`\n✓ Upisano ${rows.length} expenses redova (note=${NOTE}).`);
