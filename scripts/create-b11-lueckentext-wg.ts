/**
 * Kreira Lückentext lekciju „Lückentext B1 — WG-Zimmer" u Nemački B1.1 (Modul 7).
 * Zadatak 22: Anzeige + E-Mail sa 10 praznina, reči a–o. Tekst DOSLOVNO.
 * Rešenja: 1 bin, 2 als, 3 im, 4 oder, 5 hätte, 6 kann, 7 das, 8 könntest, 9 würde, 10 eurer.
 * Privremeni order_index = 107. Idempotentno.
 * Run: npx tsx scripts/create-b11-lueckentext-wg.ts
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
const TITLE = "Lückentext B1 — WG-Zimmer";

const ANZEIGE =
  "**WG-Zimmer frei im April**\n\n" +
  "Ich wohne in Freiburg in einer netten WG und vermiete mein Zimmer im April. Kosten: 450 €. Meine Mitbewohner akzeptieren nur eine Frau.\n" +
  "Zuschriften an: sylvia1543@xmail.com";

const EMAIL =
  "**Von:** Marina Manzo  ·  **An:** sylvia1543@xmail.com  ·  **Gesendet:** 18.2., 17:46\n**Betreff:** Zimmer\n\n" +
  "Hallo Sylvia,\n\n" +
  "ich heiße Marina Manzo, komme aus Italien, __(1)__ 42 Jahre alt und arbeite __(2)__ Ärztin in Rom. Nun habe ich bald zwei Monate frei, und __(3)__ April möchte ich entweder in Freiburg __(4)__ in Berlin einen Deutschkurs machen. Zu Deinem Zimmer __(5)__ ich noch ein paar Fragen: Sind in dem Preis von 450 € alle Nebenkosten inklusive und __(6)__ ich auch die Küche benutzen? Hast du vielleicht ein Foto von dem Zimmer, __(7)__ du mir per Mail schicken __(8)__? Ich __(9)__ mich sehr freuen, einen Monat in __(10)__ WG zu leben.\n\n" +
  "Viele Grüße\nMarina";

const WOERTER =
  "**Wörter (a–o):** a) könntest · b) werde · c) das · d) eurer · e) wie · f) oder · g) würde · h) am · i) hätte · j) bin · k) als · l) kann · m) die · n) im · o) haben\n\n" +
  "*Jedes Wort nur einmal — nicht alle Wörter passen.*";

const sections = [
  { type: "badge", module: "Modul 7", category: "lesen" },
  { type: "text", style: "info",
    content: "Lückentext (čitanje + gramatika). Pročitaj oglas i mejl, pa za svaku prazninu (1–10) izaberi pravu reč iz spiska (a–o). Klikni na prazninu da vidiš rešenje." },
  { type: "text", style: "default",
    content: "## 22 · Welches Wort passt?\n\nLesen Sie die Anzeige und die E-Mail und ordnen Sie die Wörter (a–o) den Lücken (1–10) zu. Sie können jedes Wort nur einmal verwenden und nicht alle Wörter passen in den Text." },
  { type: "text", style: "beispiele", content: ANZEIGE },
  { type: "text", style: "beispiele", content: EMAIL },
  { type: "text", style: "default", content: WOERTER },
  { type: "spoiler", title: "Lücken 1–10 — Lösung (klikni za rešenje)",
    items: [
      { question: "Lücke 1: … komme aus Italien, ___ 42 Jahre alt", answer: "bin (j)" },
      { question: "Lücke 2: … und arbeite ___ Ärztin in Rom", answer: "als (k)" },
      { question: "Lücke 3: … und ___ April möchte ich …", answer: "im (n)" },
      { question: "Lücke 4: … entweder in Freiburg ___ in Berlin …", answer: "oder (f)" },
      { question: "Lücke 5: Zu Deinem Zimmer ___ ich noch ein paar Fragen", answer: "hätte (i) — höflich: „hätte ich ein paar Fragen“." },
      { question: "Lücke 6: … und ___ ich auch die Küche benutzen?", answer: "kann (l)" },
      { question: "Lücke 7: … ein Foto von dem Zimmer, ___ du mir per Mail schicken …", answer: "das (c) — relativna zamenica (das Foto)." },
      { question: "Lücke 8: … schicken ___?", answer: "könntest (a)" },
      { question: "Lücke 9: Ich ___ mich sehr freuen", answer: "würde (g)" },
      { question: "Lücke 10: … einen Monat in ___ WG zu leben", answer: "eurer (d)" },
    ] },
];

async function main() {
  const { data: existing } = await supabase
    .from("lessons").select("id").eq("course_id", B11_COURSE).eq("title", TITLE).maybeSingle();
  if (existing) {
    await supabase.from("lessons").update({ sections }).eq("id", existing.id);
    console.log(`✓ Postoji — sadržaj ažuriran (id=${existing.id}).`);
    return;
  }
  const { data, error } = await supabase
    .from("lessons")
    .insert({ course_id: B11_COURSE, title: TITLE, order_index: 107, lesson_type: "text", is_free_preview: false, sections })
    .select("id").single();
  if (error) { console.error("Greška:", error.message); process.exit(1); }
  console.log(`✅ Kreirana lekcija „${TITLE}"  id=${data.id}  (order_index=107)`);
}
main();
