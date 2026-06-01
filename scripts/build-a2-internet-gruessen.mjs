// Obogaćuje dve tanke A2.2 lekcije (Über das Internet, Mit freundlichen Grüßen)
// sadržajem iz Nicos Weg (DW) manuskripta + Wortschatza: razumevanje videa,
// prošireni vokabular, flashcards, gramatičke mini-vežbe. Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const PLAN = [
  {
    id: "bd2278c7-8186-4d85-99d3-bde19597f815", // Über das Internet
    marker: "Razumevanje videa — Yara i Pepe",
    sections: [
      { type: "text", style: "default", content: "## Razumevanje videa — Yara i Pepe\n\nPogledaj video, pa odgovori (otvori za rešenje):" },
      { type: "spoiler", title: "Pitanja uz video (Internet)", items: [
        { question: "Was macht Pepes Firma?", answer: "Sie designt digitale Lösungen — Internetseiten, Marketingkonzepte und Blogs." },
        { question: "Was möchte Yara?", answer: "Sie möchte über das Internet mehr Kunden für ihren Fahrradladen bekommen." },
        { question: "Reicht eine Website allein, sagt Pepe?", answer: "Nein. Man muss auch in den sozialen Netzwerken aktiv sein — die Leute müssen liken und posten." },
        { question: "Warum will Pepe die Website zuerst nicht machen?", answer: "Yaras Laden ist zu klein — für seine Firma lohnt sich das nicht." },
        { question: "Wie sind Yara und Pepe verwandt?", answer: "Yara ist Pepes Tante, Pepe ist ihr Neffe." },
      ] },
      { type: "text", style: "default", content: "## Vokabular — digitalni svet" },
      { type: "vocabulary", rows: [
        ["soziale Netzwerke", "društvene mreže"],
        ["liken", "lajkovati"],
        ["posten", "objaviti (post)"],
        ["etwas designen", "dizajnirati"],
        ["etwas erstellen", "napraviti / izraditi"],
        ["die Suchmaschine, -n", "pretraživač"],
        ["das WLAN", "Wi-Fi"],
        ["die Internetverbindung", "internet veza"],
        ["sich auskennen mit + D", "razumeti se u nešto"],
        ["sich lohnen", "isplatiti se"],
        ["die Möglichkeit, -en", "mogućnost"],
        ["erreichen", "dostići (kupce)"],
        ["weltweit", "širom sveta"],
      ] },
      { type: "flashcard", items: [
        { front: "soziale Netzwerke", back: "društvene mreže" },
        { front: "liken / posten", back: "lajkovati / objaviti" },
        { front: "die Suchmaschine", back: "pretraživač" },
        { front: "das WLAN", back: "Wi-Fi" },
        { front: "sich auskennen mit", back: "razumeti se u nešto" },
        { front: "sich lohnen", back: "isplatiti se" },
        { front: "eine Website erstellen", back: "napraviti sajt" },
      ] },
      { type: "text", style: "uebung", content: "## Gramatika: indirektno pitanje sa „ob“\n\nDa/ne pitanje pretvaraš u indirektno sa **ob** — glagol ide na kraj:\n\n*Hilfst du mir?* → *Ich möchte wissen, **ob** du mir hilfst.*" },
      { type: "spoiler", title: "Mini-vežba: napravi rečenicu sa „ob“", items: [
        { question: "Kannst du eine Website machen? → Ich habe dich gefragt, …", answer: "Ich habe dich gefragt, ob du eine Website machen kannst." },
        { question: "Funktioniert das? → Ich möchte wissen, …", answer: "Ich möchte wissen, ob das funktioniert." },
        { question: "Benutzt du soziale Netzwerke? → Er fragt, …", answer: "Er fragt, ob du soziale Netzwerke benutzt." },
        { question: "Lohnt sich das? → Ich weiß nicht, …", answer: "Ich weiß nicht, ob sich das lohnt." },
      ] },
    ],
  },
  {
    id: "d2aceb17-4ced-4497-a08a-ee4867a8c058", // Mit freundlichen Grüßen
    marker: "Razumevanje videa — Nico und Selma",
    sections: [
      { type: "text", style: "default", content: "## Razumevanje videa — Nico und Selma\n\nPogledaj video, pa odgovori:" },
      { type: "spoiler", title: "Pitanja uz video", items: [
        { question: "Wohin geht Selma?", answer: "Zum Sprachkurs (Deutschunterricht)." },
        { question: "Mit wem ist Nico verabredet und was wollen sie machen?", answer: "Mit Selma — sie wollen zusammen Fahrrad fahren." },
        { question: "Was schreibt Nico Selma?", answer: "Eine Nachricht/SMS: „Bin schon da. Wie lange brauchst du noch? … Liebe Grüße!“" },
        { question: "Warum antwortet Selma nicht selbst?", answer: "Sie hat ihr Handy im Flüchtlingsheim vergessen — ihre Mutter Aya hört es klingeln." },
        { question: "Was bedeutet „LG“?", answer: "Liebe Grüße." },
      ] },
      { type: "text", style: "default", content: "## Vokabular — poruke i telefon" },
      { type: "vocabulary", rows: [
        ["die Nachricht, -en", "poruka"],
        ["etwas verschicken / versenden", "poslati (poruku)"],
        ["etwas empfangen", "primiti"],
        ["der Akku, -s", "baterija"],
        ["etwas aufladen", "napuniti (bateriju)"],
        ["das Ladegerät, -e", "punjač"],
        ["leer", "prazan (baterija)"],
        ["die Weckfunktion", "funkcija alarma"],
        ["die Umfrage, -n", "anketa"],
        ["der/die Jugendliche, -n", "mladić / devojka (tinejdžer)"],
        ["der Teenager, -", "tinejdžer"],
      ] },
      { type: "flashcard", items: [
        { front: "die Nachricht", back: "poruka" },
        { front: "verschicken / versenden", back: "poslati" },
        { front: "empfangen", back: "primiti" },
        { front: "der Akku", back: "baterija" },
        { front: "aufladen", back: "napuniti" },
        { front: "das Ladegerät", back: "punjač" },
        { front: "leer", back: "prazan (baterija)" },
      ] },
      { type: "text", style: "uebung", content: "## Skraćenice u porukama i mejlovima\n\nU porukama se često koriste skraćenice. Bitno je da znaš **kada** koja ide:" },
      { type: "table", headers: ["Skraćenica", "Puno", "Kada"], rows: [
        ["<mark>LG</mark>", "Liebe Grüße", "neformalno (prijatelji, „du“)"],
        ["<mark>VG</mark>", "Viele Grüße", "neformalno / neutralno"],
        ["<mark>MfG</mark>", "Mit freundlichen Grüßen", "formalno (zvanično, „Sie“)"],
        ["<mark>PS</mark>", "post scriptum", "dodatak na kraju poruke"],
      ] },
    ],
  },
];

for (const lesson of PLAN) {
  const { data: l } = await sb.from("lessons").select("title, sections").eq("id", lesson.id).single();
  const secs = l.sections || [];
  if (JSON.stringify(secs).includes(lesson.marker)) {
    console.log(`"${l.title}" — već obogaćeno (marker prisutan), preskačem`);
    continue;
  }
  console.log(`"${l.title}" — dodajem ${lesson.sections.length} sekcija (razumevanje + vokabular + flashcards + gramatika)`);
  if (APPLY) {
    const { error } = await sb.from("lessons").update({ sections: [...secs, ...lesson.sections] }).eq("id", lesson.id);
    console.log(error ? `  ERROR: ${error.message}` : `  ✓ upisano (${secs.length + lesson.sections.length} sekcija ukupno)`);
  }
}
if (!APPLY) console.log("\nDry-run — --apply za upis.");
