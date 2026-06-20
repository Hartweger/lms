/**
 * Kreira lekciju „Lesen & Hören B1 — Praktikum & Bewerbungsgespräch" u Nemački B1.1 (Modul 5).
 * Teil 1: Lückentext (zadatak 12, 6 praznina a/b/c). Teil 2: Hörverstehen (zadatak 13, audio + 7 R/F).
 * Tekst DOSLOVNO. Cloze: 1a 2b 3c 4a 5c 6c. Hören: aR bF cR dF eR fR gF.
 * Privremeni order_index = 104. Idempotentno.
 * Run: npx tsx scripts/create-b11-lesen-hoeren-praktikum.ts
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
const TITLE = "Lesen & Hören B1 — Praktikum & Bewerbungsgespräch";
const AUDIO = "https://rzmyglynjcygsbicssbt.supabase.co/storage/v1/object/public/blog-media/kursevi/b1-1/hoeren-vorstellungsgespraech/gespraech.mp3";

const EMAIL =
  "**E-Mail senden**\n\nLieber Lucas,\n\n" +
  "Du wolltest wissen, wie es mir __(1)__ meinem Praktikum geht. Heute schaffe ich es endlich, Dir __(2)__ antworten. Gut geht es mir! Besonders gut gefällt mir, __(3)__ ich so viele Aufgaben selbstständig erledigen darf. Ich soll __(4)__ des Praktikums sogar ein eigenes kleines Projekt realisieren. Das macht mich schon ein wenig nervös, denn ich soll __(5)__ von nur drei Monaten einen kleinen Roboter entwickeln. Zum Glück unterstützen __(6)__ die Kollegen sehr.\n\n" +
  "Und wie geht es Dir bei Deinem Praktikum? Erzähl doch mal!\n\nViele Grüße, Antonio";

const sections = [
  { type: "badge", module: "Modul 5", category: "lesen" },
  { type: "text", style: "info",
    content: "Lekcija ima dva dela: **Teil 1 — Lückentext** (pročitaj mejl i za svaku prazninu izaberi tačnu reč a/b/c) i **Teil 2 — Hörverstehen** (slušaj razgovor pa reši tvrdnje *richtig/falsch*). Klikni na pitanje da vidiš rešenje." },

  // Teil 1
  { type: "text", style: "default",
    content: "## Teil 1 · Lückentext\n\n**12 — Welches Wort (a, b oder c) passt in die Lücken 1–6?**\n\nLesen Sie den folgenden Text und kreuzen Sie an." },
  { type: "text", style: "beispiele", content: EMAIL },
  { type: "spoiler", title: "Lücken 1–6 — welches Wort? (klikni za rešenje)",
    items: [
      { question: "1. … wie es mir ___ meinem Praktikum geht\n\na) bei\nb) an\nc) für", answer: "a) bei" },
      { question: "2. Heute schaffe ich es endlich, Dir ___ antworten\n\na) –\nb) zu\nc) auch", answer: "b) zu — „es schaffen, … zu + Infinitiv“." },
      { question: "3. Besonders gut gefällt mir, ___ ich so viele Aufgaben … erledigen darf\n\na) zu\nb) weil\nc) dass", answer: "c) dass" },
      { question: "4. Ich soll ___ des Praktikums sogar ein eigenes Projekt realisieren\n\na) während\nb) außerhalb\nc) bei", answer: "a) während — „während des Praktikums“ (Genitiv)." },
      { question: "5. … ich soll ___ von nur drei Monaten einen Roboter entwickeln\n\na) bis\nb) während\nc) innerhalb", answer: "c) innerhalb — „innerhalb von drei Monaten“." },
      { question: "6. Zum Glück unterstützen ___ die Kollegen sehr\n\na) mir\nb) meine\nc) mich", answer: "c) mich — „unterstützen“ ide sa akuzativom." },
    ] },

  // Teil 2
  { type: "text", style: "default",
    content: "## Teil 2 · Hörverstehen\n\n**13 — Sie hören nun ein Gespräch.**\n\nSie hören das Gespräch einmal. Dazu gibt es sieben Aufgaben. Wählen Sie: Sind die Aussagen richtig oder falsch?" },
  { type: "audio", url: AUDIO, label: "Gespräch (hört einmal)" },
  { type: "spoiler", title: "Aussagen a–g — richtig oder falsch? (klikni za rešenje)",
    items: [
      { question: "a) Rufen Sie vor dem Vorstellungsgespräch noch einmal an oder schreiben Sie, dass Sie kommen und sich auf das Gespräch freuen.\n\nrichtig / falsch?", answer: "richtig" },
      { question: "b) Fahren Sie zur Sicherheit vor dem Gespräch schon einmal zur Firma.\n\nrichtig / falsch?", answer: "falsch" },
      { question: "c) Sammeln Sie möglichst viele Informationen über die Firma.\n\nrichtig / falsch?", answer: "richtig" },
      { question: "d) Geben Sie auf jede Frage des Arbeitgebers eine Antwort. Man muss dabei nicht immer die Wahrheit sagen.\n\nrichtig / falsch?", answer: "falsch" },
      { question: "e) Sagen Sie dem Arbeitgeber, was Sie können und warum Sie sich besonders gut für die Stelle eignen.\n\nrichtig / falsch?", answer: "richtig" },
      { question: "f) Versuchen Sie, mit dem Arbeitgeber ein richtiges Gespräch zu führen. Dabei können Sie auch Fragen stellen.\n\nrichtig / falsch?", answer: "richtig" },
      { question: "g) Ziehen Sie sich so an, wie Sie sich am wohlsten fühlen. Die Kleidung und das Aussehen sind nicht so wichtig.\n\nrichtig / falsch?", answer: "falsch" },
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
    .insert({ course_id: B11_COURSE, title: TITLE, order_index: 104, lesson_type: "text", is_free_preview: false, sections })
    .select("id").single();
  if (error) { console.error("Greška:", error.message); process.exit(1); }
  console.log(`✅ Kreirana lekcija „${TITLE}"  id=${data.id}  (order_index=104)`);
}
main();
