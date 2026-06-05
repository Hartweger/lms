/**
 * wordset JSON (iz import-quizlet) → samostalan HTML za PDF.
 *   npx tsx scripts/generate-wordset-pdf.ts <wordset.json> > prirucnik.html
 * HTML→PDF se radi zasebno (Chrome page.pdf sa page-break pravilima).
 */
import * as fs from "fs";
import type { WordSetSection } from "../src/lib/flashcard-types";

const ws: WordSetSection = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"));
const rows = ws.items.map((c) => {
  const de = `${c.article ? c.article + " " : ""}${c.front}${c.plural ? ", " + c.plural : ""}`;
  const sr = c.back.replace(/\|/g, " / ");
  return `<tr><td>${de}</td><td>${sr}</td></tr>`;
}).join("\n");

console.log(`<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 18mm; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; }
  h1 { font-size: 22px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #eee; }
  th { background: #faf9f6; }
  tr { break-inside: avoid; }
</style></head><body>
  <h1>${ws.title}</h1>
  <p style="color:#888;font-size:12px">Hartweger — Škola nemačkog jezika · kurs.hartweger.rs</p>
  <table><thead><tr><th>Nemački</th><th>Srpski</th></tr></thead><tbody>
  ${rows}
  </tbody></table>
</body></html>`);
