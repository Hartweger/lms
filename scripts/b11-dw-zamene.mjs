// Zamena preostalih DW deep-linkova našim kombinovanim vežbama
// (vokabular match + B1 tekst + pitanja). Idempotentno.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const tf = (q, correct, expl) => ({ question_type: "true_false", question: `Richtig oder falsch: ${q}`, options: { type: "true_false" }, correct_answer: correct ? "true" : "false", explanation: expl });
const mc = (q, items, idx, expl) => ({ question_type: "quiz", question: q, options: { type: "quiz", items }, correct_answer: String(idx), explanation: expl });
const match = (pairs) => ({ question_type: "match_pairs", question: "Spoji parove (nemački – srpski):", options: { type: "match_pairs", items: pairs }, correct_answer: "all", explanation: null });

const LESSONS = [
  {
    id: "6c16b6dd-d448-4154-807f-6333168fb0fa",
    title: "Beruf Krankenpfleger — Wortschatz & Leseverständnis",
    text: `Krankenpfleger und Krankenschwestern arbeiten in Krankenhäusern, Altersheimen und Arztpraxen. Ihr Beruf ist sehr wichtig, aber auch anstrengend. Sie kümmern sich um kranke und alte Menschen und helfen ihnen im Alltag.

Ein typischer Tag beginnt früh. Zuerst messen sie bei den Patienten den Blutdruck und die Temperatur. Danach geben sie Medikamente und manchmal auch Spritzen. Viele Pflegekräfte arbeiten im Schichtdienst, also auch nachts und am Wochenende.

Für diesen Beruf braucht man nicht nur Fachwissen, sondern auch viel Geduld und Einfühlungsvermögen. In Deutschland fehlen zurzeit viele Pflegekräfte, deshalb gibt es gute Chancen auf einen Arbeitsplatz.`,
    ctxTitle: "Beruf Krankenpfleger",
    vocab: [
      { de: "der Krankenpfleger", sr: "medicinski tehničar" },
      { de: "die Pflege", sr: "nega" },
      { de: "der Blutdruck", sr: "krvni pritisak" },
      { de: "die Schicht", sr: "smena" },
      { de: "die Spritze", sr: "injekcija" },
      { de: "die Geduld", sr: "strpljenje" },
    ],
    q: [
      mc("Wo arbeiten Krankenpfleger?", ["Nur im Krankenhaus", "Im Krankenhaus, Altersheim und in Arztpraxen", "Nur in der Schule", "Im Büro"], 1, "Im Text: in Krankenhäusern, Altersheimen und Arztpraxen."),
      tf("Pflegekräfte arbeiten nie nachts.", false, "Im Text: Viele arbeiten im Schichtdienst, also auch nachts."),
      mc("Was machen die Pflegekräfte am Anfang des Tages?", ["Sie schreiben Berichte", "Sie messen Blutdruck und Temperatur", "Sie machen Pause", "Sie gehen nach Hause"], 1, "Im Text: Zuerst messen sie Blutdruck und Temperatur."),
      tf("In Deutschland gibt es genug Pflegekräfte.", false, "Im Text: Zurzeit fehlen viele Pflegekräfte."),
      mc("Welche Eigenschaften braucht man für diesen Beruf?", ["Nur Fachwissen", "Geld und Zeit", "Geduld und Einfühlungsvermögen", "Eine Fremdsprache"], 2, "Im Text: viel Geduld und Einfühlungsvermögen."),
    ],
  },
  {
    id: "38180987-5aa9-4f05-8974-80753f6b4b52",
    title: "Die Entdeckung der Blutgruppen — Leseverständnis",
    text: `Vor etwas mehr als hundert Jahren entdeckte der Wissenschaftler Karl Landsteiner die verschiedenen Blutgruppen. Diese Entdeckung war für die Medizin sehr wichtig.

Früher waren Bluttransfusionen sehr gefährlich. Oft starben die Patienten, weil das fremde Blut nicht zu ihrem eigenen Blut passte. Nach der Entdeckung der Blutgruppen wusste man endlich, welches Blut man einem Patienten geben darf.

Heute werden jeden Tag viele Bluttransfusionen gemacht, und sie sind sicher. Dank dieser Entdeckung können Ärzte das Leben von Millionen Menschen retten. Deshalb bekam Landsteiner später den Nobelpreis.`,
    ctxTitle: "Die Entdeckung der Blutgruppen",
    vocab: [
      { de: "die Blutgruppe", sr: "krvna grupa" },
      { de: "die Entdeckung", sr: "otkriće" },
      { de: "der Wissenschaftler", sr: "naučnik" },
      { de: "die Bluttransfusion", sr: "transfuzija krvi" },
      { de: "retten", sr: "spasiti" },
      { de: "gefährlich", sr: "opasno" },
    ],
    q: [
      mc("Wer entdeckte die Blutgruppen?", ["Albert Einstein", "Karl Landsteiner", "Robert Koch", "Wilhelm Röntgen"], 1, "Im Text: der Wissenschaftler Karl Landsteiner."),
      tf("Früher waren Bluttransfusionen sehr gefährlich.", true, "Im Text: Früher waren sie sehr gefährlich."),
      mc("Warum starben früher viele Patienten?", ["Weil es keine Ärzte gab", "Weil das fremde Blut nicht passte", "Weil sie zu alt waren", "Weil es zu teuer war"], 1, "Im Text: weil das fremde Blut nicht passte."),
      tf("Heute sind Bluttransfusionen sicher.", true, "Im Text: Heute sind sie sicher."),
      mc("Was bekam Landsteiner für seine Arbeit?", ["viel Geld", "ein Krankenhaus", "den Nobelpreis", "nichts"], 2, "Im Text: Er bekam später den Nobelpreis."),
    ],
  },
  {
    id: "01aabdcd-f638-4be5-aeca-3d9afef3588e",
    title: "Auf Jobsuche — Wortschatz & Leseverständnis",
    text: `Wer eine neue Stelle sucht, muss heute aktiv sein. Zuerst liest man Stellenanzeigen im Internet oder in der Zeitung. Wenn eine Anzeige interessant ist, schreibt man eine Bewerbung.

Zu einer guten Bewerbung gehören ein Lebenslauf und ein Anschreiben. Im Lebenslauf stehen die Ausbildung und die Berufserfahrung. Im Anschreiben erklärt man, warum man die Stelle haben möchte.

Wenn die Bewerbung gut ist, wird man zu einem Vorstellungsgespräch eingeladen. Nach dem Gespräch wartet man auf eine Antwort: eine Zusage oder eine Absage. Mit etwas Geduld und guter Vorbereitung findet man am Ende die richtige Stelle.`,
    ctxTitle: "Auf Jobsuche",
    vocab: [
      { de: "die Stellenanzeige", sr: "oglas za posao" },
      { de: "die Bewerbung", sr: "prijava za posao" },
      { de: "der Lebenslauf", sr: "biografija (CV)" },
      { de: "das Vorstellungsgespräch", sr: "razgovor za posao" },
      { de: "die Zusage", sr: "potvrda (prihvatanje)" },
      { de: "die Absage", sr: "odbijanje" },
    ],
    q: [
      mc("Was macht man zuerst bei der Jobsuche?", ["Man schreibt einen Vertrag", "Man liest Stellenanzeigen", "Man kündigt", "Man geht in Urlaub"], 1, "Im Text: Zuerst liest man Stellenanzeigen."),
      tf("Zu einer Bewerbung gehören ein Lebenslauf und ein Anschreiben.", true, "Im Text: Dazu gehören Lebenslauf und Anschreiben."),
      mc("Was steht im Lebenslauf?", ["Die Hobbys und Freunde", "Die Ausbildung und die Berufserfahrung", "Der Lohn", "Die Adresse der Firma"], 1, "Im Text: die Ausbildung und die Berufserfahrung."),
      tf("Nach dem Vorstellungsgespräch bekommt man immer eine Zusage.", false, "Im Text: Es kann eine Zusage oder eine Absage sein."),
      mc("Was bekommt man nach dem Gespräch?", ["sofort die Stelle", "eine Zusage oder eine Absage", "einen Lebenslauf", "ein Anschreiben"], 1, "Im Text: eine Zusage oder eine Absage."),
    ],
  },
];

for (const L of LESSONS) {
  // idempotentno: obriši staru verziju
  const { data: old } = await sb.from("exercises").select("id").eq("lesson_id", L.id).eq("title", L.title);
  for (const e of old ?? []) {
    await sb.from("exercise_questions").delete().eq("exercise_id", e.id);
    await sb.from("exercises").delete().eq("id", e.id);
  }
  // order_index posle postojećih vežbi
  const { data: ex } = await sb.from("exercises").select("order_index").eq("lesson_id", L.id);
  const nextOI = Math.max(-1, ...(ex ?? []).map((e) => e.order_index)) + 1;

  const { data: created, error: exErr } = await sb.from("exercises")
    .insert({ lesson_id: L.id, title: L.title, exercise_type: "quiz", order_index: nextOI })
    .select("id").single();
  if (exErr) throw exErr;

  const ctx = { title: L.ctxTitle, type: "text", content: L.text };
  const rows = [
    { ...match(L.vocab), order_index: 0, exercise_id: created.id },
    ...L.q.map((q, i) => ({
      ...q,
      options: { ...q.options, context: ctx },
      order_index: i + 1,
      exercise_id: created.id,
    })),
  ];
  const { error: qErr } = await sb.from("exercise_questions").insert(rows);
  if (qErr) throw qErr;

  // ukloni DW link sekciju
  const { data: lesson } = await sb.from("lessons").select("sections").eq("id", L.id).single();
  const before = (lesson.sections || []).length;
  const sections = (lesson.sections || []).filter(
    (s) => !(s.type === "link" && typeof s.href === "string" && s.href.includes("learngerman.dw.com"))
  );
  if (sections.length !== before) await sb.from("lessons").update({ sections }).eq("id", L.id);

  console.log(`✓ "${L.title}" — vežba+${rows.length} pitanja, DW link ${sections.length !== before ? "uklonjen" : "već uklonjen"}`);
}
console.log("\nGotovo.");
