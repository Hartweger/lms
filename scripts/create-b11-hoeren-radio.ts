/**
 * Kreira Hörverstehen lekciju „Hörverstehen B1 — Fünf Radioansagen" u Nemački B1.1 (Modul 6).
 * 5 Ansage (audio iz Supabase) + 5 pitanja a/b/c DOSLOVNO. Rešenja: 1c 2a 3b 4c 5b.
 * Privremeni order_index = 105. Idempotentno.
 * Run: npx tsx scripts/create-b11-hoeren-radio.ts
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
const TITLE = "Hörverstehen B1 — Fünf Radioansagen";
const BASE = "https://rzmyglynjcygsbicssbt.supabase.co/storage/v1/object/public/blog-media/kursevi/b1-1/hoeren-radio-ansagen/";

const sections = [
  { type: "badge", module: "Modul 6", category: "hoeren" },
  { type: "text", style: "info",
    content: "Vežba slušanja (**Hörverstehen**) — slušaš **pet najava sa radija** (Ansagen). Uz svaku biraš tačno rešenje *a, b* ili *c*. Pusti audio, pa klikni na pitanje da vidiš rešenje." },
  { type: "text", style: "default",
    content: "## 22 · Sie hören fünf Ansagen aus dem Radio\n\nWas ist richtig? Hören Sie und kreuzen Sie an." },
  { type: "text", style: "uebung",
    content: "💡 **Lerntipp:** Lesen Sie vor dem Hören jeweils die Fragen und Antworten a–c genau durch. Markieren Sie dabei wichtige Informationen und Unterschiede." },

  { type: "audio", url: `${BASE}ansage1.mp3`, label: "Ansage 1" },
  { type: "spoiler", title: "Ansage 1 — Aufgabe 1 (klikni za rešenje)",
    items: [{ question: "1. Sie hören …\n\na) Werbung.\nb) den Verkehrsfunk.\nc) die Nachrichten.", answer: "c) die Nachrichten." }] },

  { type: "audio", url: `${BASE}ansage2.mp3`, label: "Ansage 2" },
  { type: "spoiler", title: "Ansage 2 — Aufgabe 2 (klikni za rešenje)",
    items: [{ question: "2. Was kann man bei Radio Glocke gewinnen?\n\na) Einen Spanischkurs.\nb) Einen von hundert Kursen an der Volkshochschule.\nc) Eine Reise nach Spanien.", answer: "a) Einen Spanischkurs." }] },

  { type: "audio", url: `${BASE}ansage3.mp3`, label: "Ansage 3" },
  { type: "spoiler", title: "Ansage 3 — Aufgabe 3 (klikni za rešenje)",
    items: [{ question: "3. Wann ist die Messe geöffnet?\n\na) Am Freitag und Samstag von 13–19 Uhr, am Sonntag von 9–19 Uhr.\nb) Am Freitagnachmittag von 13–19 Uhr und am Wochenende jeweils den ganzen Tag ab 9 Uhr.\nc) Am Freitag von 9–13 Uhr, am Samstag und Sonntag jeweils von 9–17 Uhr.", answer: "b) Am Freitagnachmittag von 13–19 Uhr und am Wochenende jeweils den ganzen Tag ab 9 Uhr." }] },

  { type: "audio", url: `${BASE}ansage4.mp3`, label: "Ansage 4" },
  { type: "spoiler", title: "Ansage 4 — Aufgabe 4 (klikni za rešenje)",
    items: [{ question: "4. Was soll man tun?\n\na) Man soll rechtzeitig losfahren.\nb) Man soll sich am Flughafen über die Flüge informieren.\nc) Man soll sich im Internet nach der aktuellen Verkehrssituation erkundigen.", answer: "c) Man soll sich im Internet nach der aktuellen Verkehrssituation erkundigen." }] },

  { type: "audio", url: `${BASE}ansage5.mp3`, label: "Ansage 5" },
  { type: "spoiler", title: "Ansage 5 — Aufgabe 5 (klikni za rešenje)",
    items: [{ question: "5. Das ist Werbung für …\n\na) ein Modeltraining.\nb) einen kostenlosen Friseurbesuch.\nc) den Friseurberuf.", answer: "b) einen kostenlosen Friseurbesuch." }] },
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
    .insert({ course_id: B11_COURSE, title: TITLE, order_index: 105, lesson_type: "text", is_free_preview: false, sections })
    .select("id").single();
  if (error) { console.error("Greška:", error.message); process.exit(1); }
  console.log(`✅ Kreirana lekcija „${TITLE}"  id=${data.id}  (order_index=105)`);
}
main();
