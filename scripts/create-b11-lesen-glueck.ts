/**
 * Kreira novu Lesen lekciju „Leseverstehen B1 — Was bringt Glück?" u kursu Nemački B1.1 (Modul 1).
 * Nemački tekst i pitanja DOSLOVNO iz udžbenika. Rešenja izvedena iz teksta (1c, 2a, 3c, 4b).
 * Privremeni order_index = 100 (sređuje se kasnijim reorder-om Modula 1).
 * Run: npx tsx scripts/create-b11-lesen-glueck.ts
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
const TITLE = "Leseverstehen B1 — Was bringt Glück?";

const sections = [
  { type: "badge", module: "Modul 1", category: "lesen" },

  {
    type: "text",
    style: "info",
    content:
      "Vežba čitanja (**Leseverstehen**) — format kao na ispitu B1. Prvo pažljivo pročitaj tri teksta, pa za svako pitanje (1–4) izaberi tačno rešenje **a, b** ili **c**. Klikni na pitanje da vidiš rešenje i objašnjenje.",
  },

  {
    type: "text",
    style: "default",
    content:
      "## Glücksbringer aus verschiedenen Ländern\n\n**Unsere Reporterin Karin war wieder unterwegs und hat Menschen aus verschiedenen Ländern interviewt zum Thema: „Was bringt in Ihren Heimatländern Glück?“**",
  },

  {
    type: "text",
    style: "beispiele",
    content:
      "**A** — Amadou K. aus dem Senegal berichtet: „Immer, wenn ich wieder nach Deutschland reise, macht meine Mutter ein Glücksritual. Ich ziehe an der Haustür einen Schuh aus und sie gießt kaltes Wasser über meinen Fuß auf den Sandboden. Den nassen Sand legt meine Mutter in ein Tuch. Das hängt sie dann im Haus auf. Das bringt Glück und bedeutet, dass ich gesund wiederkomme. An einem Dienstag oder Freitag sollte man übrigens bei uns nicht reisen, denn das sind Unglückstage.“\n\n**B** — „Bei uns in der Türkei ist das blaue Auge der wichtigste Glücksbringer“, berichtet Filiz T. aus der Türkei. „Es beschützt die Menschen vor Unglück, einem Unfall oder Krankheit. Wenn ein Baby geboren wird, schenkt man oft das blaue Auge, man hängt es an die Wohnungstür oder ins Auto oder trägt es als Schmuck am Körper. Manche Leute malen es sogar an die Wohnzimmerwand. Ja, das blaue Auge findet man bei uns überall.“\n\n**C** — „Also, bei uns in Iran ist das persische Neujahr das wichtigste Fest im ganzen Jahr“, erzählt Keyvan I. „Ein sehr altes Ritual gibt es bei uns in der Nacht vom letzten Dienstag des Jahres auf Mittwoch. Man sieht dann überall in der Stadt und auf dem Land viele schöne kleine und große Feuer, die die Menschen extra für Neujahr gemacht haben. Alle Menschen, auch alte Leute, springen oder steigen darüber. Das bringt Glück. Man ‚verbrennt‘ dabei alle Krankheiten und bekommt die Energie vom Feuer. Dieses Fest ist immer ein besonderes Erlebnis für alle.“",
  },

  {
    type: "text",
    style: "default",
    content:
      "**b** — Lesen Sie noch einmal die Texte in a und die Aufgaben 1–4. Entscheiden Sie, welche Lösung (a, b oder c) richtig ist.",
  },

  {
    type: "spoiler",
    title: "Aufgaben 1–4 — Welche Lösung ist richtig? (klikni za rešenje)",
    items: [
      {
        question:
          "1. In diesem Zeitungsartikel berichten Personen\n\na) über ihre persönlichen Glücksbringer.\nb) über ein glückliches Erlebnis.\nc) darüber, was in ihrer Kultur Glück bringt.",
        answer:
          "Tačno: c — članak je o tome šta u njihovoj zemlji/kulturi donosi sreću (tema: „Was bringt in Ihren Heimatländern Glück?“).",
      },
      {
        question:
          "2. Der nasse Sand bedeutet, dass\n\na) auf einer Reise nichts passiert.\nb) man seine Schuhe putzen muss.\nc) man nicht an einem Dienstag reisen soll.",
        answer:
          "Tačno: a — mokar pesak „bringt Glück und bedeutet, dass ich gesund wiederkomme“ (da se sa puta vratiš zdrav, ništa loše se ne desi).",
      },
      {
        question:
          "3. Das blaue Auge\n\na) kann man nicht als Schmuckstück tragen.\nb) findet man an jeder Wohnzimmerwand.\nc) wird oft bei einer Geburt verschenkt.",
        answer:
          "Tačno: c — „Wenn ein Baby geboren wird, schenkt man oft das blaue Auge.“",
      },
      {
        question:
          "4. Wenn die Menschen über das Feuer steigen,\n\na) feiern sie den letzten Mittwoch im Jahr.\nb) möchten sie Gesundheit und Energie für das neue Jahr bekommen.\nc) verbrennen sie sich die Kleider.",
        answer:
          "Tačno: b — „Man ‚verbrennt‘ dabei alle Krankheiten und bekommt die Energie vom Feuer.“ (zdravlje i energija za novu godinu).",
      },
    ],
  },

  {
    type: "vocabulary",
    rows: [
      ["der Glücksbringer", "donosilac sreće, amajlija"],
      ["das Glücksritual", "ritual za sreću"],
      ["der Sandboden", "peskovito tlo"],
      ["das Tuch", "krpa, marama"],
      ["beschützen (vor)", "štititi (od)"],
      ["das Unglück", "nesreća"],
      ["schenken", "pokloniti"],
      ["der Schmuck", "nakit"],
      ["das (persische) Neujahr", "(persijska) Nova godina"],
      ["verbrennen", "spaliti, sagoreti"],
      ["das Erlebnis", "doživljaj"],
    ],
  },
];

async function main() {
  // Spreči duplikat
  const { data: existing } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", B11_COURSE)
    .eq("title", TITLE)
    .maybeSingle();
  if (existing) {
    console.log(`Lekcija već postoji (id=${existing.id}) — radim update sadržaja.`);
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
      order_index: 100,
      lesson_type: "text",
      is_free_preview: false,
      sections,
    })
    .select("id")
    .single();
  if (error) { console.error("Greška:", error); process.exit(1); }
  console.log(`✅ Kreirana lekcija „${TITLE}"  id=${data.id}  (privremeni order_index=100)`);
  console.log("Sledeće: uvrstiti je u Modul 1 pri reorder-u B1.1.");
}

main();
