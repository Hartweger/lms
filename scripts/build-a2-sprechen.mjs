// Dodaje Sprechen prep (Goethe A2: Teil 1/2/3 + Redemittel Teil 3) na lekciju
// "Priprema za ispit A2" (A2.2). Izvor: Cornelsen Prüfungstraining A2.
// Dry-run default; --apply. Idempotentno.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const L6 = "161e0870-c0ec-444e-b553-14cf04ead2e9";
const MARKER = "Sprechen — usmeni deo (Goethe A2)";

const SECTIONS = [
  { type: "text", style: "info", content: `## ${MARKER}\n\nUsmeni ispit je **u paru**, traje oko 15 minuta i ima **tri dela**. Nema vremena za pripremu — počinje odmah.` },
  { type: "table", headers: ["Deo", "Šta radiš", "Trajanje"], rows: [
    ["Teil 1", "Postavljaš partneru pitanja o ličnim podacima (kartice) i odgovaraš", "1–2 min"],
    ["Teil 2", "Pričaš o sebi po temi sa kartice (mind-map)", "3–4 min"],
    ["Teil 3", "Sa partnerom nešto dogovarate (termin/aktivnost) — Rollenspiel", "3–4 min"],
  ] },

  { type: "text", style: "default", content: "## Teil 1 — Fragen zur Person\n\nDobiješ 4 kartice sa pojmovima. Sa svakom **postaviš partneru jedno pitanje**, a on odgovara (pa zatim obrnuto)." },
  { type: "table", headers: ["Kartica", "Pitanje", "Beispielantwort"], rows: [
    ["<mark>Wohnort</mark>", "Wo wohnst du?", "Ich wohne in Belgrad."],
    ["<mark>Familie</mark>", "Hast du Geschwister?", "Ja, ich habe einen Bruder und eine Schwester."],
    ["<mark>Beruf</mark>", "Was bist du von Beruf?", "Ich bin Lehrerin. / Ich studiere noch."],
    ["<mark>Hobbys</mark>", "Was sind deine Hobbys?", "Ich lese gern und mache Sport."],
    ["<mark>Sprachen</mark>", "Welche Sprachen sprichst du?", "Serbisch, Deutsch und ein bisschen Englisch."],
    ["<mark>Urlaub</mark>", "Wohin fährst du im Urlaub?", "Meistens fahre ich ans Meer."],
  ] },
  { type: "flashcard", items: [
    { front: "Wohnort?", back: "Wo wohnst du? — Ich wohne in …" },
    { front: "Familie?", back: "Hast du Geschwister? — Ich habe …" },
    { front: "Beruf?", back: "Was bist du von Beruf? — Ich bin …" },
    { front: "Hobbys?", back: "Was machst du gern? — Ich … gern." },
    { front: "Sprachen?", back: "Welche Sprachen sprichst du? — Ich spreche …" },
  ] },

  { type: "text", style: "default", content: "## Teil 2 — Von sich erzählen\n\nDobiješ karticu sa **temom i 4 podpitanja** (mind-map) i pričaš o sebi 3–4 minuta. Koristi reči za povezivanje i učestalost:" },
  { type: "formula", content: "zuerst – dann – danach\nimmer – oft – manchmal – selten – nie\ngern – lieber – am liebsten – nicht so gern" },
  { type: "spoiler", title: "Primer (Teil 2): „Was machst du am Sonntag?“", items: [
    { question: "Tema: Was machst du am Sonntag? (Freunde besuchen / Hobbys / lange schlafen / Fernsehen)", answer: "Beispiel: Am Sonntag schlafe ich lange. Zuerst frühstücke ich in Ruhe, dann besuche ich oft Freunde — manchmal kommen sie auch zu mir. Wir gehen gern ins Kino oder machen ein Picknick. Ich sehe nicht so gern fern, lieber lese ich ein Buch." },
  ] },
  { type: "text", style: "uebung", content: "**Vežbaj i ove teme** (pričaj 3–4 min, koristi gornje reči):\n- Wofür gibst du dein Geld aus? (Wohnung / Hobbys / Urlaub / Essen)\n- Welches Verkehrsmittel benutzt du? (Arbeitsweg / Freizeit / oft – selten)\n- Was machst du in deiner Freizeit? (Freunde / Sport / lesen / …)" },

  { type: "text", style: "default", content: "## Teil 3 — Etwas zusammen planen (Rollenspiel)\n\nSa partnerom dobiješ zadatak (npr. **naći zajednički termin** za kupovinu poklona) i dva *različita* kalendara. **Predlažeš → diskutujete → nađete rešenje.**" },
  { type: "text", style: "default", content: "## Redemittel — Sprechen Teil 3" },
  { type: "table", headers: ["Funkcija", "Fraze"], rows: [
    ["Predlog (Vorschlag)", "Ich schlage vor, dass … · Wollen wir …? · Wir könnten ja …, oder? · Wie findest du …?"],
    ["Slaganje (zustimmen)", "Gute Idee! · Das gefällt mir. · Einverstanden! · Ja, gut, machen wir das so. · Ich bin dafür."],
    ["Nesiguran / drugi predlog", "Ich weiß nicht … · Das ist gut, aber … · Ich finde es besser, wenn … · Wir könnten aber auch …"],
  ] },
  { type: "spoiler", title: "Vežba (Teil 3): dogovori zajednički termin", items: [
    { question: "Predloži da u sredu zajedno idete u kupovinu: „Wollen wir …?“", answer: "Beispiel: Wollen wir am Mittwoch zusammen einkaufen gehen? Hast du Zeit?" },
    { question: "Partner ima Deutschkurs 9–12 h. Predloži popodne:", answer: "Beispiel: Kannst du am Nachmittag, zum Beispiel um 15 Uhr?" },
    { question: "Tebi 15 h ne odgovara (imaš termin kod zubara u 13). Reci i predloži drugo:", answer: "Beispiel: Um 15 Uhr geht es bei mir leider nicht. Wir könnten uns aber um 16 Uhr treffen." },
    { question: "Složi se i potvrdi termin:", answer: "Beispiel: Super, einverstanden! Dann treffen wir uns um 16 Uhr." },
  ] },
  { type: "text", style: "uebung", content: "**Saveti:** govori u **dužim rečenicama** (ne samo „ja/nein“); smeš da praviš greške — ne paniči; pusti i partnera da govori (oboje moraju da pričaju)." },
];

const { data: l } = await sb.from("lessons").select("title, sections").eq("id", L6).single();
const secs = l.sections || [];
if (JSON.stringify(secs).includes(MARKER)) {
  console.log(`"${l.title}" — Sprechen već dodat, preskačem`);
} else {
  console.log(`"${l.title}" — dodajem ${SECTIONS.length} Sprechen sekcija`);
  if (APPLY) {
    const { error } = await sb.from("lessons").update({ sections: [...secs, ...SECTIONS] }).eq("id", L6);
    console.log(error ? `  ERROR: ${error.message}` : `  ✓ upisano (${secs.length + SECTIONS.length} sekcija ukupno)`);
  } else console.log("  (dry-run)");
}
