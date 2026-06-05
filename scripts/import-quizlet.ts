/**
 * Quizlet export → WordSetSection JSON.
 *   npx tsx scripts/import-quizlet.ts <export.txt> <setKey> "<Naslov>" > out.json
 * Auto-dopuna roda/množine NIJE ovde (radi se zasebno + Natašina potvrda).
 */
import * as fs from "fs";
import { parseQuizlet } from "./quizlet-parse";

const [, , file, setKey, title] = process.argv;
if (!file || !setKey || !title) { console.error("Upotreba: import-quizlet.ts <export.txt> <setKey> <Naslov>"); process.exit(1); }

const text = fs.readFileSync(file, "utf-8");
const { cards, skipped } = parseQuizlet(text);
const section = { type: "wordset", title, setKey, frontLabel: "DE", backLabel: "SR", items: cards };

console.error(`Kartica: ${cards.length}, preskočeno (bez prevoda): ${skipped.length}`);
if (skipped.length) console.error("  Dopuni prevod za: " + skipped.join(", "));
console.log(JSON.stringify(section, null, 2));
