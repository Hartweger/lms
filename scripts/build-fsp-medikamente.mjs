// VOKABULAR UZORAK: FSP lekcija "Medikamenti" iz "FSP novi" materijala
// (medikamente_vezbe.html). Ilustrovana galerija oblika lekova + lista dejstava
// + wordset glagola (Quizlet učenje) + 4 vežbe (kviz, richtig/falsch, klik, pisanje).
// Dry-run default; --apply za primenu. Idempotentno.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSON_ID = "f9cbf2f7-6001-4d66-b617-6b9e61de87dd"; // FSP > Medikamenti
const IMG = (k) => `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-media/fsp/illustrations/${k}.svg`;

const forms = [
  ["tablette", "die Tablette (-n)", "tableta"],
  ["kapsel", "die Kapsel (-n)", "kapsula"],
  ["dragee", "das Dragee (-s)", "dražeja"],
  ["tropfen", "die Tropfen (-)", "kapi"],
  ["zaepfchen", "das Zäpfchen (-)", "čepić"],
  ["saft", "der Saft", "sirup"],
  ["pflaster", "das Pflaster (-)", "flaster"],
  ["salbe", "die Salbe (-n)", "mast"],
  ["ampulle", "die Ampulle (-n)", "ampula"],
  ["spritze", "die Spritze (-n)", "špric"],
  ["injektion", "die Injektion (-en)", "injekcija"],
  ["infusion", "die Infusion / der Tropf", "infuzija / kapaljka"],
  ["spray", "das Spray / der Inhalator", "sprej / inhalator"],
  ["rektiole", "die Rektiole (-n)", "rektiola"],
  ["rezept", "rezeptpflichtig", "na recept"],
  ["frei", "freiverkäuflich", "bez recepta"],
  ["apotheke", "apothekenpflichtig", "samo u apoteci"],
];

const wirkungen = [
  ["das Schmerzmittel / schmerzlindernd / analgetisch", "lek protiv bolova / analgetik"],
  ["fiebersenkend / antipyretisch", "snižava temperaturu / antipiretik"],
  ["entzündungshemmend / antiphlogistisch", "protivupalno / antiinflamatorno"],
  ["blutdrucksenkend / antihypertonisch", "snižava krvni pritisak / antihipertenziv"],
  ["gefäßerweiternd / vasodilatativ", "širi krvne sudove / vazodilatator"],
  ["durchblutungssteigernd", "poboljšava cirkulaciju"],
  ["entwässernd / wassertreibend / diuretisch", "diuretik / izbacuje tečnost"],
  ["gerinnungshemmend / blutverdünnend / antikoagulativ", "antikoagulans / razređuje krv"],
  ["krampflösend", "spazmolitik / opušta grčeve"],
  ["antibakteriell / antibiotisch", "antibakterijski / antibiotik"],
  ["antiviral", "antivirusno"],
  ["gegen Pilzinfektionen", "protiv gljivičnih infekcija"],
  ["antiallergisch / antihistaminisch", "protiv alergija / antihistaminik"],
  ["gegen Übelkeit, Erbrechen, Schwindel", "protiv mučnine, povraćanja, vrtoglavice"],
  ["das Beruhigungsmittel / beruhigend / sedierend", "sredstvo za smirenje / sedativ"],
  ["das Schlafmittel", "lek za spavanje"],
  ["das Betäubungsmittel", "narkotik"],
  ["das Herzmittel", "lek za srce"],
  ["das Aufputschmittel / aufputschend / stimulierend", "stimulans / stimulativno"],
  ["das Verhütungsmittel / empfängnisverhütend / kontrazeptiv", "kontraceptiv / kontraceptivno"],
];

const verben = [
  ["einnehmen", "uzeti lek"],
  ["verabreichen", "dati lek"],
  ["vorbereiten", "pripremiti lekove za pacijenta"],
  ["aussetzen", "pauzirati uzimanje"],
  ["einstellen", "polako povećavati dozu do ciljne vrednosti"],
  ["ausschleichen", "polako smanjivati dozu do ukidanja"],
  ["verschreiben", "prepisati na recept"],
  ["absetzen", "prekinuti uzimanje (definitivno)"],
  ["umstellen", "preći s jednog leka na drugi"],
  ["verordnen", "prepisati, naložiti"],
  ["anpassen", "prilagoditi dozu pacijentu"],
];

const sections = [
  { type: "badge", module: "Wortschatz", category: "wortschatz" },
  { type: "text", style: "default", content:
`## Medikamente - oblici, dejstva i glagoli

Na ispitu i u praksi treba da prepoznaš oblik leka, opišeš njegovo dejstvo i koristiš prave glagole oko terapije. Prvo pregledaj ilustracije i liste, pa proveri znanje kroz vežbe.` },

  { type: "text", style: "default", content: "## Darreichungsformen - oblici lekova" },
  { type: "gallery", title: "Oblici i status lekova", items: forms.map(([k, de, sr]) => ({ image: IMG(k), de, sr })) },

  { type: "text", style: "default", content: "## Wirkungen und Indikationen - dejstva i namene" },
  { type: "vocabulary", rows: wirkungen },

  { type: "text", style: "default", content: "## Verben der Medikation - glagoli oko terapije\n\nVežbaj ove glagole kao kartice (kviz, kucanje, igra memorije):" },
  { type: "wordset", title: "Glagoli oko terapije", setKey: "fsp-medikamente-verben", frontLabel: "DE", backLabel: "SR",
    items: verben.map(([de, sr]) => ({ front: de, back: sr })) },

  { type: "text", style: "uebung", content: "## Vežbe\n\nProveri šta si naučio:" },
  { type: "exercise", title: "Aufgabe 1 - Darreichungsform und Status" },
  { type: "exercise", title: "Aufgabe 2 - Richtig oder falsch?" },
  { type: "spoiler", title: "Aufgabe 3 - klikni za rešenje", items: [
    { question: "Wegen der Nebenwirkungen mussten wir das Medikament sofort ___ .", answer: "absetzen (endgültig beenden)." },
    { question: "Das Kortison darf man nicht abrupt stoppen, sondern muss es ___ .", answer: "ausschleichen (langsam reduzieren)." },
    { question: "Der Arzt wird Ihnen ein Antibiotikum ___ .", answer: "verschreiben / verordnen." },
    { question: "Die Schwester wird Ihnen die Spritze ___ .", answer: "verabreichen (geben)." },
    { question: "Bitte ___ Sie die Tabletten morgens und abends ___ .", answer: "nehmen ... ein (einnehmen)." },
  ] },
  { type: "exercise", title: "Aufgabe 4 - Schreiben Sie den Fachbegriff" },
];

const exercises = [
  {
    title: "Aufgabe 1 - Darreichungsform und Status",
    exercise_type: "quiz",
    questions: [
      { q: "Eine runde, feste Form zum Schlucken, oft mit Bruchrille.", opts: ["die Tablette", "die Salbe", "der Saft"], c: 0, e: "die Tablette." },
      { q: "Wird rektal eingeführt.", opts: ["das Zäpfchen", "die Tropfen", "das Dragee"], c: 0, e: "das Zäpfchen." },
      { q: "Wird auf die Haut geklebt und gibt den Wirkstoff langsam ab.", opts: ["das Pflaster", "die Salbe", "die Infusion"], c: 0, e: "das Pflaster." },
      { q: "Wird in die Nase oder den Rachen gesprüht / inhaliert.", opts: ["das Zäpfchen", "das Spray / der Inhalator", "die Ampulle"], c: 1, e: "das Spray / der Inhalator." },
      { q: "Man bekommt es nur mit einem Rezept vom Arzt.", opts: ["freiverkäuflich", "rezeptpflichtig", "apothekenpflichtig"], c: 1, e: "rezeptpflichtig." },
      { q: "Ohne Rezept, aber nur in der Apotheke erhältlich.", opts: ["rezeptpflichtig", "freiverkäuflich", "apothekenpflichtig"], c: 2, e: "apothekenpflichtig." },
    ],
  },
  {
    title: "Aufgabe 2 - Richtig oder falsch?",
    exercise_type: "true_false",
    questions: [
      { q: "Richtig oder falsch? „Ein Zäpfchen wird rektal eingeführt.“", a: "true", e: "Richtig - das Zäpfchen wird rektal angewendet." },
      { q: "Richtig oder falsch? „Eine Salbe wird auf die Haut aufgetragen und eingerieben.“", a: "true", e: "Richtig." },
      { q: "Richtig oder falsch? „Eine Infusion wird über einen längeren Zeitraum in die Vene gegeben.“", a: "true", e: "Richtig." },
      { q: "Richtig oder falsch? „Ein rezeptpflichtiges Medikament bekommt man ohne Rezept im Supermarkt.“", a: "false", e: "Falsch - rezeptpflichtig bedeutet, man braucht ein Rezept vom Arzt." },
      { q: "Richtig oder falsch? „Ein Pflaster schluckt man mit Wasser.“", a: "false", e: "Falsch - ein Pflaster klebt man auf die Haut." },
      { q: "Richtig oder falsch? „Freiverkäufliche Medikamente kann man ohne Rezept kaufen.“", a: "true", e: "Richtig." },
    ],
  },
  {
    title: "Aufgabe 4 - Schreiben Sie den Fachbegriff",
    exercise_type: "typing",
    questions: [
      { q: "Napiši stručni pridev (-isch): „snižava temperaturu“.", a: "antipyretisch", e: "antipyretisch" },
      { q: "Napiši stručni pridev (-isch): „lek protiv bolova“.", a: "analgetisch", e: "analgetisch" },
      { q: "Napiši stručni pridev: „antikoagulans / razređuje krv“.", a: "antikoagulativ|antikoagulierend", e: "antikoagulativ / antikoagulierend" },
      { q: "Napiši stručni pridev: „protiv alergija / antihistaminik“.", a: "antihistaminisch", e: "antihistaminisch" },
      { q: "Napiši stručni pridev (-end): „sredstvo za smirenje, dejstvo“.", a: "sedierend", e: "sedierend" },
      { q: "Napiši stručni pridev (-iv): „širi krvne sudove / vazodilatator“.", a: "vasodilatativ", e: "vasodilatativ" },
    ],
  },
];

function buildRows(ex, exId) {
  return ex.questions.map((q, i) => {
    if (ex.exercise_type === "quiz")
      return { exercise_id: exId, question: q.q, options: { type: "quiz", items: q.opts }, correct_answer: String(q.c), explanation: q.e, order_index: i };
    if (ex.exercise_type === "true_false")
      return { exercise_id: exId, question: q.q, options: null, correct_answer: q.a, explanation: q.e, order_index: i };
    return { exercise_id: exId, question: q.q, options: { type: "typing" }, correct_answer: q.a, explanation: q.e, order_index: i };
  });
}

async function main() {
  const { data: lesson, error: le } = await sb.from("lessons").select("id,title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));
  console.log(`\nLekcija: ${lesson.title} (${LESSON_ID})`);
  console.log(`Sekcija: ${(lesson.sections || []).length} -> ${sections.length}`);
  console.log(`Galerija: ${forms.length} | Wirkungen: ${wirkungen.length} | Verben(wordset): ${verben.length}`);
  console.log(`Vežbe: ${exercises.map((e) => `${e.title.split(" - ")[0]}=${e.exercise_type}/${e.questions.length}`).join(", ")} + spoiler`);

  if (!APPLY) { console.log("\n[DRY-RUN] Nije upisano. --apply za primenu.\n"); return; }

  const { error: ue } = await sb.from("lessons").update({ sections, lesson_type: "text" }).eq("id", LESSON_ID);
  if (ue) throw new Error("Update sekcija: " + ue.message);
  console.log("✓ Sekcije ažurirane");

  const { data: oldEx } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID);
  if (oldEx?.length) {
    const ids = oldEx.map((e) => e.id);
    await sb.from("exercise_questions").delete().in("exercise_id", ids);
    await sb.from("exercises").delete().in("id", ids);
    console.log(`✓ Obrisano starih vežbi: ${ids.length}`);
  }
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const { data: row, error: ee } = await sb.from("exercises").insert({ lesson_id: LESSON_ID, title: ex.title, exercise_type: ex.exercise_type, order_index: i }).select("id").single();
    if (ee) throw new Error("Insert vežbe: " + ee.message);
    const { error: qe } = await sb.from("exercise_questions").insert(buildRows(ex, row.id));
    if (qe) throw new Error("Insert pitanja: " + qe.message);
    console.log(`✓ ${ex.title} (${ex.exercise_type}, ${ex.questions.length})`);
  }
  console.log("\nGotovo. Pregled: /lekcija/" + LESSON_ID + "\n");
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
