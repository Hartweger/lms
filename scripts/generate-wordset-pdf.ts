/**
 * wordset JSON → samostalan HTML (mreža kartica, brendiran logom) za PDF.
 *   npx tsx scripts/generate-wordset-pdf.ts <wordset.json> > prirucnik.html
 * HTML→PDF: Chrome `page.pdf` sa A4 + printBackground (vidi scripts/wordset-pdf.mjs).
 *
 * Svaka reč = zaobljena kartica: nemački (Infinitiv + Particip / član + množina) gore,
 * srpski prevod dole. Logo u zaglavlju. Kartice se ne lome preko strane.
 */
import * as fs from "fs";
import * as path from "path";
import type { WordSetSection } from "../src/lib/flashcard-types";

// Brend boje Hartweger
const PLAVA = "#0AB3D7";
const KORAL = "#F78687";
const PLAVA_LIGHT = "#eafafd";

const ws: WordSetSection = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"));

// Logo ugrađen kao base64 (samostalan HTML, bez spoljnih fajlova).
const logoPath = path.join(__dirname, "..", "public", "logo.jpg");
const logoData = fs.existsSync(logoPath)
  ? `data:image/jpeg;base64,${fs.readFileSync(logoPath).toString("base64")}`
  : "";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const cards = ws.items
  .map((c) => {
    const de = `${c.article ? c.article + " " : ""}${c.front}${c.plural ? ", " + c.plural : ""}`;
    const sr = c.back.replace(/\|/g, " / ");
    return `<div class="card"><div class="de">${esc(de)}</div><div class="sr">${esc(sr)}</div></div>`;
  })
  .join("\n  ");

console.log(`<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; margin: 0; }
  .head { display: flex; align-items: center; gap: 12px; padding-bottom: 10px; margin-bottom: 4px; }
  .head img { height: 40px; }
  .head .t { font-size: 20px; font-weight: 800; color: #1a1a2e; }
  .head .s { font-size: 11px; color: #888; margin-top: 2px; }
  .bar { height: 4px; border-radius: 4px; background: linear-gradient(90deg, ${PLAVA} 0%, ${PLAVA} 50%, ${KORAL} 50%, ${KORAL} 100%); margin-bottom: 16px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .card { break-inside: avoid; border: 1.5px solid ${PLAVA}; border-radius: 12px; background: ${PLAVA_LIGHT}; padding: 9px 11px; min-height: 58px; display: flex; flex-direction: column; justify-content: center; }
  .card .de { font-size: 13px; font-weight: 700; color: ${PLAVA}; line-height: 1.25; }
  .card .sr { font-size: 12.5px; color: #333; margin-top: 5px; padding-top: 5px; border-top: 1px dashed ${KORAL}; }
  .foot { margin-top: 14px; font-size: 9.5px; color: #aaa; text-align: center; }
</style></head><body>
  <div class="head">
    ${logoData ? `<img src="${logoData}" alt="Hartweger">` : ""}
    <div><div class="t">${esc(ws.title)}</div><div class="s">Hartweger — Škola nemačkog jezika · kurs.hartweger.rs · ${ws.items.length} reči</div></div>
  </div>
  <div class="bar"></div>
  <div class="grid">
  ${cards}
  </div>
  <div class="foot">© Hartweger — Škola nemačkog jezika · Samo za polaznike kursa</div>
</body></html>`);
