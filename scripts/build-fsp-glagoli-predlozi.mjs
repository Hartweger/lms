// Gradi FSP lekciju "Glagoli sa predlozima" iz Natašinog dokumenta
// "FSP novi/glagoli sa predlozima i padezima.docx".
// Vlasnica je tražila klikni-pa-izađe-primer format → lekcija je SPOILER-driven:
//   prikaže glagol + predlog (+ padež), klik otkrije primer rečenice.
// Sekcije: badge + kratak uvod (text) + spoiler blokovi (grupisani abecedno)
//          + richtig/falsch + typing za utvrđivanje predloga/padeža (inline {type:"exercise"}).
// Izvor se PARSIRA iz .docx u runtime-u (textutil) → bez ručnog prepisivanja.
// Dry-run default; pokreni sa --apply (sadržaj je reverzibilan: brišu se stare vežbe + prepisuju sekcije).
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSON_ID = "b3f43434-4709-42ca-8a4d-69f198a8b961"; // FSP > Glagoli sa predlozima
const DOCX = "/Users/natasahartweger/Documents/Claude/sajt/FSP novi/glagoli sa predlozima i padezima.docx";

// ---------- PARSIRANJE IZVORA ----------
// Dokument je niz parova:
//   <glagol> (<predlog/padež>)
//   Beispiel: <nemačka rečenica>
// Skupljamo sve parove glagol→primer; čistimo crtice na običnu "-".
function dash(s) { return s.replace(/[–—]/g, "-"); }

function parseDoc() {
  const txt = execFileSync("textutil", ["-convert", "txt", "-stdout", DOCX], { encoding: "utf8" });
  const lines = txt.split("\n").map((l) => l.replace(/\r$/, ""));
  const items = [];
  let pendingHead = null;
  for (let raw of lines) {
    const line = dash(raw).trim();
    if (!line) continue;
    const bm = line.match(/^Beispiel:\s*(.+)$/i);
    if (bm) {
      if (pendingHead) {
        items.push({ head: pendingHead, example: bm[1].trim() });
        pendingHead = null;
      }
      continue;
    }
    // Ponekad su glava i Beispiel u istom redu: "bestellen (+ Akk.) Beispiel: ..."
    const inline = line.match(/^(.*?)\s+Beispiel:\s*(.+)$/i);
    if (inline) {
      items.push({ head: inline[1].trim(), example: inline[2].trim() });
      pendingHead = null;
      continue;
    }
    // inače je ovo glava (glagol + eventualno predlog/padež)
    pendingHead = line;
  }
  // dedup po identičnoj glavi+primeru i po samoj glavi (dokument ima ponavljanja)
  const seenHead = new Set();
  const out = [];
  for (const it of items) {
    const key = it.head.toLowerCase();
    if (seenHead.has(key)) continue;
    seenHead.add(key);
    out.push(it);
  }
  out.sort((a, b) =>
    a.head.replace(/[^a-zäöü]/gi, "").localeCompare(b.head.replace(/[^a-zäöü]/gi, ""), "de"));
  return out;
}

const verbs = parseDoc();

// sortni ključ = prvo slovo glagola bez "(sich)" i razmaka;
// umlaute svrstavamo kao njihov osnovni samoglasnik (ä→A, ö→O, ü→U) po nemačkoj abecedi.
function firstLetter(head) {
  const m = head.replace(/^\(sich\)\s*/i, "").replace(/^sich\s+/i, "").trim();
  const c = (m[0] || "?").toUpperCase();
  return { "Ä": "A", "Ö": "O", "Ü": "U" }[c] || c;
}

// Grupisanje abecedno u blokove (A-B, C-E, ...) da spoileri ne budu predugački.
const GROUPS = [
  { label: "A", letters: ["A"] },
  { label: "B", letters: ["B"] },
  { label: "C - E", letters: ["C", "D", "E"] },
  { label: "F - K", letters: ["F", "G", "H", "I", "J", "K"] },
  { label: "L - R", letters: ["L", "M", "N", "O", "P", "Q", "R"] },
  { label: "S", letters: ["S"] },
  { label: "T - U", letters: ["T", "U"] },
  { label: "V", letters: ["V"] },
  { label: "W - Z", letters: ["W", "X", "Y", "Z"] },
];

function spoilerItem(v) {
  return { question: v.head, answer: v.example };
}

const sections = [
  { type: "badge", module: "Gramatika", category: "grammatik" },

  { type: "text", style: "default", content:
`## Glagoli sa predlozima i padežima

U medicinskom nemačkom mnogi glagoli idu uz tačno određeni predlog i padež - i baš to je čest izvor grešaka. Najlakše ih je naučiti kroz primer rečenice, jer onda odmah vidiš i predlog i padež u kontekstu.

Ovo nije lista za bubanje. Pređi preko glagola, pokušaj sam da se setiš kako se koristi, pa **klikni da ti izađe primer rečenice**. Tako gradiš osećaj za rekciju glagola, a ne samo suvu listu.` },

  { type: "text", style: "info", content:
`**Kako da učiš:** prvo pročitaj glagol i (ako ga ima) predlog sa padežom u zagradi. Sastavi rečenicu u glavi, pa klikni da proveriš sa Natašinim primerom. "(sich)" znači da je glagol povratni (refleksivan).` },
];

// spoiler blokovi po grupama
let totalItems = 0;
for (const g of GROUPS) {
  const inGroup = verbs.filter((v) => g.letters.includes(firstLetter(v.head)));
  if (!inGroup.length) continue;
  totalItems += inGroup.length;
  sections.push({
    type: "spoiler",
    title: `Glagoli sa predlozima (${g.label}) - klikni za primer`,
    items: inGroup.map(spoilerItem),
  });
}

// ---------- RICHTIG ODER FALSCH (predlog + padež u celoj rečenici) ----------
// Pune nemačke rečenice sa glagol+predlog(+padež); pola tačnih, pola sa
// pogrešnim predlogom/padežom. Učenik klikne richtig/falsch.
const TF = [
  { q: "Richtig oder falsch? „Viele Menschen leiden an Allergien.“", c: "true", e: "Richtig. leiden an + Dat. - Viele Menschen leiden an Allergien." },
  { q: "Richtig oder falsch? „Die Patienten klagen an starke Schmerzen.“", c: "false", e: "Falsch. klagen über + Akk. - richtig: Die Patienten klagen über starke Schmerzen." },
  { q: "Richtig oder falsch? „Der Patient reagiert gut auf die Behandlung.“", c: "true", e: "Richtig. reagieren auf + Akk. - Der Patient reagiert gut auf die Behandlung." },
  { q: "Richtig oder falsch? „Der Patient muss von Alkohol verzichten.“", c: "false", e: "Falsch. verzichten auf + Akk. - richtig: Der Patient muss auf Alkohol verzichten." },
  { q: "Richtig oder falsch? „Der Arzt rät zu einer gesunden Ernährung.“", c: "true", e: "Richtig. raten zu + Dat. - Der Arzt rät zu einer gesunden Ernährung." },
  { q: "Richtig oder falsch? „Unbehandelte Krankheiten können auf Komplikationen führen.“", c: "false", e: "Falsch. führen zu + Dat. - richtig: Unbehandelte Krankheiten können zu Komplikationen führen." },
];

const TF_TITLE = "Aufgabe - Richtig oder falsch?";

// typing vežba: dopuni predlog + padež po glagolu (više tačnih varijanti preko "|")
const TYPING = [
  { q: "Ergänzen Sie Präposition + Kasus: „Der Patient klagt ______ Kopfschmerzen.“", a: "über die|über", e: "klagen über + Akk. - Der Patient klagt über Kopfschmerzen." },
  { q: "Ergänzen Sie Präposition + Kasus: „Viele Menschen leiden ______ Migräne.“", a: "an|an der", e: "leiden an + Dat. - Viele Menschen leiden an Migräne." },
  { q: "Ergänzen Sie die Präposition: „Der Patient muss ______ Nikotin verzichten.“", a: "auf|auf das", e: "verzichten auf + Akk. - Der Patient muss auf Nikotin verzichten." },
];
const TYPING_TITLE = "Aufgabe - Präposition ergänzen";

// dodaj sekciju Vežbe + inline reference (tačan match na title vežbe)
sections.push(
  { type: "text", style: "uebung", content: "## Vežbe\n\nKad pređeš glagole gore, proveri da li ti je rekcija (predlog + padež) ostala u glavi:" },
  { type: "exercise", title: TF_TITLE },
  { type: "exercise", title: TYPING_TITLE },
);

const exercises = [
  { title: TF_TITLE, exercise_type: "true_false", questions: TF.map((x) => ({ q: x.q, c: x.c, e: x.e })) },
  { title: TYPING_TITLE, exercise_type: "typing", questions: TYPING.map((x) => ({ q: x.q, a: x.a, e: x.e })) },
];

function buildRows(ex, exId) {
  return ex.questions.map((q, i) => {
    if (ex.exercise_type === "true_false") {
      // true_false - options null, correct_answer "true"/"false"
      return { exercise_id: exId, question: q.q, options: null, correct_answer: q.c, explanation: q.e, order_index: i };
    }
    // typing - options MORA biti { type: "typing" } (null pada na default quiz)
    return { exercise_id: exId, question: q.q, options: { type: "typing" }, correct_answer: q.a, explanation: q.e, order_index: i };
  });
}

async function main() {
  const { data: lesson, error: le } = await sb.from("lessons").select("id,title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));

  const spoilerSecs = sections.filter((s) => s.type === "spoiler");
  console.log(`\nLekcija: ${lesson.title} (${LESSON_ID})`);
  console.log(`Parsirano glagola iz .docx: ${verbs.length}`);
  console.log(`Trenutno sekcija: ${(lesson.sections || []).length} → novo: ${sections.length}`);
  console.log(`Spoiler blokova: ${spoilerSecs.length} (ukupno stavki: ${totalItems})`);
  console.log(`Vežbe za kreiranje: ${exercises.length} (${exercises.map((e) => `${e.exercise_type}=${e.questions.length}`).join(", ")})`);

  if (!APPLY) {
    console.log("\n[DRY-RUN] Ništa nije upisano. Pokreni sa --apply.\n");
    console.log("Pregled sekcija:");
    sections.forEach((s, i) => {
      const extra = s.type === "spoiler" ? ` → ${s.title} [${s.items.length} stavki]`
        : s.title ? " → " + s.title : "";
      console.log(`  ${i + 1}. ${s.type}${extra}`);
    });
    console.log("\nPrvih 5 spoiler stavki (prvi blok):");
    (spoilerSecs[0]?.items || []).slice(0, 5).forEach((it) => console.log(`   • ${it.question}  ⇒  ${it.answer}`));
    return;
  }

  // 1) sekcije
  const { error: ue } = await sb.from("lessons").update({ sections, title: "Glagoli sa predlozima" }).eq("id", LESSON_ID);
  if (ue) throw new Error("Update sekcija: " + ue.message);
  console.log("✓ Sekcije ažurirane");

  // 2) obriši stare vežbe ove lekcije (idempotentno)
  const { data: oldEx } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID);
  if (oldEx?.length) {
    const ids = oldEx.map((e) => e.id);
    await sb.from("exercise_questions").delete().in("exercise_id", ids);
    await sb.from("exercises").delete().in("id", ids);
    console.log(`✓ Obrisano starih vežbi: ${ids.length}`);
  }

  // 3) nove vežbe + pitanja
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const { data: row, error: ee } = await sb.from("exercises")
      .insert({ lesson_id: LESSON_ID, title: ex.title, exercise_type: ex.exercise_type, order_index: i })
      .select("id").single();
    if (ee) throw new Error("Insert vežbe: " + ee.message);
    const { error: qe } = await sb.from("exercise_questions").insert(buildRows(ex, row.id));
    if (qe) throw new Error("Insert pitanja: " + qe.message);
    console.log(`✓ ${ex.title} (${ex.questions.length} pitanja)`);
  }

  console.log("\nGotovo. Pregledaj uživo: /kurs/fsp → Glagoli sa predlozima\n");
}

main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
