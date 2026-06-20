/**
 * Kreira Hörverstehen lekciju „Hörverstehen B1 — Gesund leben" u kursu Nemački B1.1 (Modul 3).
 * 4 Ansage (audio iz Supabase storage) + 8 pitanja DOSLOVNO. Rešenja: 1R 2a 3R 4b 5F 6a 7R 8c.
 * Privremeni order_index = 101 (sređuje se reorder-om).
 * Run: npx tsx scripts/create-b11-hoeren-gesund.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [key, ...v] = line.split("=");
  if (key && v.length > 0) process.env[key.trim()] = v.join("=").trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const B11_COURSE = "b8c765b7-c377-4941-a1f9-ebe39372fe4a";
const TITLE = "Hörverstehen B1 — Gesund leben";
const BASE = "https://rzmyglynjcygsbicssbt.supabase.co/storage/v1/object/public/blog-media/kursevi/b1-1/hoeren-gesund-leben/";

const sections = [
  { type: "badge", module: "Modul 3", category: "hoeren" },

  {
    type: "text",
    style: "info",
    content:
      "Vežba slušanja (**Hörverstehen**) — format kao na ispitu B1. Slušaš četiri najave (Ansagen), svaku **dva puta**. Uz svaku rešavaš dva zadatka — jedno *richtig/falsch* i jedno sa izborom *a/b/c*. Pusti audio, pa klikni na pitanje da vidiš tačno rešenje.",
  },

  {
    type: "text",
    style: "default",
    content:
      "## D · Gesund leben\n\n**18 — Sie hören vier Ansagen. Sie hören jede Ansage zweimal.**\n\nZu jeder Ansage lösen Sie zwei Aufgaben. Wählen Sie bei jeder Aufgabe die richtige Lösung.",
  },

  // ── Ansage 1 ──
  { type: "audio", url: `${BASE}ansage1.mp3`, label: "Ansage 1" },
  {
    type: "spoiler",
    title: "Ansage 1 — Aufgaben 1 & 2 (klikni za rešenje)",
    items: [
      {
        question: "1. Im Moment sind alle Telefonleitungen besetzt.\n\nrichtig / falsch?",
        answer: "richtig",
      },
      {
        question:
          "2. Was soll der Anrufer tun?\n\na) Noch einmal anrufen.\nb) Sich für die Kurse im Frühjahr anmelden.\nc) Sich beim Kursleiter persönlich anmelden.",
        answer: "a — Noch einmal anrufen.",
      },
    ],
  },

  // ── Ansage 2 ──
  { type: "audio", url: `${BASE}ansage2.mp3`, label: "Ansage 2" },
  {
    type: "spoiler",
    title: "Ansage 2 — Aufgaben 3 & 4 (klikni za rešenje)",
    items: [
      {
        question: "3. Die Praxis ist gerade nicht geöffnet.\n\nrichtig / falsch?",
        answer: "richtig",
      },
      {
        question:
          "4. Wann kann man sich zum Rückenkurs anmelden?\n\na) Donnerstags von 9 bis 10 Uhr.\nb) Persönlich oder telefonisch zu den Öffnungszeiten.\nc) Montags bis freitags von 14 bis 20 Uhr.",
        answer: "b — Persönlich oder telefonisch zu den Öffnungszeiten.",
      },
    ],
  },

  // ── Ansage 3 ──
  { type: "audio", url: `${BASE}ansage3.mp3`, label: "Ansage 3" },
  {
    type: "spoiler",
    title: "Ansage 3 — Aufgaben 5 & 6 (klikni za rešenje)",
    items: [
      {
        question: "5. Der Anruf bei der Krankenkasse kostet Geld.\n\nrichtig / falsch?",
        answer: "falsch",
      },
      {
        question:
          "6. Sie möchten an einem Kochkurs Ihrer Krankenkasse teilnehmen. Was müssen Sie tun?\n\na) Die 1 wählen.\nb) Die 3 wählen.\nc) Mit einem Mitarbeiter sprechen.",
        answer: "a — Die 1 wählen.",
      },
    ],
  },

  // ── Ansage 4 ──
  { type: "audio", url: `${BASE}ansage4.mp3`, label: "Ansage 4" },
  {
    type: "spoiler",
    title: "Ansage 4 — Aufgaben 7 & 8 (klikni za rešenje)",
    items: [
      {
        question: "7. Der Betriebsarzt empfiehlt die Grippeimpfung.\n\nrichtig / falsch?",
        answer: "richtig",
      },
      {
        question:
          "8. Was müssen Sie für die Grippeimpfung beachten?\n\na) Sie müssen sich zur Impfung anmelden.\nb) Sie sollen Ihre Telefonnummer hinterlassen.\nc) Sie müssen Ihren Impfpass mitbringen.",
        answer: "c — Sie müssen Ihren Impfpass mitbringen.",
      },
    ],
  },

  {
    type: "text",
    style: "uebung",
    content:
      "💡 **Lerntipp:** Sie sind sich nicht sicher? Kreuzen Sie auf jeden Fall eine Option an — na ispitu se pogrešan odgovor ne kažnjava, pa uvek nešto zaokruži.",
  },
];

async function main() {
  const { data: existing } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", B11_COURSE)
    .eq("title", TITLE)
    .maybeSingle();
  if (existing) {
    console.log(`Lekcija već postoji (id=${existing.id}) — update sadržaja.`);
    const { error } = await supabase.from("lessons").update({ sections }).eq("id", existing.id);
    if (error) { console.error(error); process.exit(1); }
    console.log("✅ Sadržaj ažuriran.");
    return;
  }

  const { data, error } = await supabase
    .from("lessons")
    .insert({
      course_id: B11_COURSE,
      title: TITLE,
      order_index: 101,
      lesson_type: "text",
      is_free_preview: false,
      sections,
    })
    .select("id")
    .single();
  if (error) { console.error("Greška:", error); process.exit(1); }
  console.log(`✅ Kreirana lekcija „${TITLE}"  id=${data.id}  (privremeni order_index=101)`);
}

main();
