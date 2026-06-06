// Obogaćuje A2.2 lekciju "Am Geldautomaten" iz Cornelsen Wortschatztraining
// (8 Post und Bank): Bank/Post vokabular, "koja reč ne pripada", dijalog na
// šalteru, flashcards. Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const ID = "25cdddd5-7107-4409-a530-80dd8b7f7061"; // Am Geldautomaten
const MARKER = "Vokabular — Bank, Post i novac";

const SECTIONS = [
  { type: "text", style: "default", content: "## Vokabular — Bank, Post i novac" },
  { type: "vocabulary", rows: [
    ["das Konto, Konten", "račun (bankovni)"],
    ["Geld überweisen / die Überweisung", "preneti novac / uplata"],
    ["einzahlen", "uplatiti (gotovinu)"],
    ["der Schalter, -", "šalter"],
    ["bar zahlen", "platiti gotovinom"],
    ["die Kreditkarte, -n", "kreditna kartica"],
    ["der Kredit — beantragen / zurückzahlen", "kredit — zatražiti / vratiti"],
    ["das Formular ausfüllen", "popuniti formular"],
    ["unterschreiben", "potpisati"],
    ["die Kontonummer / IBAN", "broj računa / IBAN"],
    ["der Empfänger", "primalac"],
    ["die Briefmarke, -n", "poštanska marka"],
    ["das Paket / die Post", "paket / pošta"],
  ] },
  { type: "flashcard", items: [
    { front: "das Konto", back: "račun (bankovni)" },
    { front: "Geld überweisen", back: "preneti novac" },
    { front: "einzahlen ↔ abheben", back: "uplatiti ↔ podići" },
    { front: "der Schalter", back: "šalter" },
    { front: "bar zahlen", back: "platiti gotovinom" },
    { front: "ein Formular ausfüllen", back: "popuniti formular" },
    { front: "unterschreiben", back: "potpisati" },
  ] },
  { type: "text", style: "uebung", content: "## Mini-vežba: koja reč NE pripada?\n\nKoji glagol ne ide uz datu imenicu? (otvori za rešenje)" },
  { type: "spoiler", title: "Welches Wort passt nicht?", items: [
    { question: "ein Formular: unterschreiben · ausfüllen · bekommen · anrufen", answer: "anrufen (formular se popunjava/potpisuje, ne „zove se“)" },
    { question: "einen Vertrag: unterschreiben · kündigen · kaufen · umziehen", answer: "umziehen (ugovor se potpisuje/raskida, ne „seli“)" },
    { question: "einen Ausweis: kündigen · abholen · anmelden · bekommen", answer: "kündigen (ličnu kartu ne „otkazuješ“)" },
    { question: "einen Kredit: beantragen · bekommen · zurückzahlen · kaufen", answer: "kaufen (kredit se traži/dobija/vraća, ne „kupuje“)" },
  ] },
  { type: "text", style: "default", content: "## Na šalteru / bankomatu — dijalog" },
  { type: "formula", content: "– Guten Tag. Ich möchte 200 Euro abheben.\n– Haben Sie eine EC-Karte?\n– Ja. Wo muss ich die Geheimzahl (PIN) eingeben?\n– Hier. Möchten Sie auch einen Kontoauszug?" },
  { type: "spoiler", title: "Mini-vežba: popuni (Bank)", items: [
    { question: "Ich möchte kein Bargeld. Ich möchte das Geld ______.", answer: "überweisen" },
    { question: "Bitte ______ Sie das Formular aus und ______ Sie unten.", answer: "füllen … aus / unterschreiben" },
    { question: "Wie viel Geld möchten Sie vom Konto ______?", answer: "abheben" },
    { question: "Überweisen Sie bitte den Betrag auf mein ______, IBAN DE…", answer: "Konto" },
  ] },
];

const { data: l } = await sb.from("lessons").select("title, sections").eq("id", ID).single();
const secs = l.sections || [];
if (JSON.stringify(secs).includes(MARKER)) {
  console.log(`"${l.title}" — već obogaćeno, preskačem`);
} else {
  console.log(`"${l.title}" — dodajem ${SECTIONS.length} sekcija`);
  if (APPLY) {
    const { error } = await sb.from("lessons").update({ sections: [...secs, ...SECTIONS] }).eq("id", ID);
    console.log(error ? `  ERROR: ${error.message}` : `  ✓ upisano (${secs.length + SECTIONS.length} sekcija ukupno)`);
  } else console.log("  (dry-run)");
}
