// Dodaje Schreiben zadatke iz Modelltest 2/3/4 (Cornelsen Prüfungstraining A2)
// na lekciju L6 "Priprema za ispit A2" (A2.2) + Musterlösungen spoiler.
// Dry-run default; --apply. Idempotentno.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const L6 = "161e0870-c0ec-444e-b553-14cf04ead2e9";
const MARKER = "Musterlösungen — Modelltest 2, 3 i 4";

const EX = [
  { title: "Schreiben Teil 1 — SMS (Markt, Modelltest 2)", order_index: 4, question:
`Schreiben — Teil 1 (SMS)

Du bist mit deiner Freundin Lucy um 12 Uhr auf dem Markt verabredet, aber du kannst nicht pünktlich sein. Schreibe eine SMS an Lucy.

– Entschuldige dich, dass du nicht pünktlich sein kannst.
– Schreib, warum.
– Nenne eine neue Uhrzeit.

Schreib 20 bis 30 Wörter. Schreib zu allen drei Punkten.` },
  { title: "Schreiben Teil 2 — E-Mail (Reparatur, Modelltest 2)", order_index: 5, question:
`Schreiben — Teil 2 (E-Mail)

Die Firma Schmidt möchte am Montagvormittag in Ihre Wohnung kommen und Ihre Heizung reparieren. Sie sind aber nicht zu Hause. Schreiben Sie eine E-Mail an die Firma Schmidt.

– Informieren Sie die Firma, dass Sie am Montagvormittag nicht zu Hause sind.
– Schlagen Sie einen neuen Termin vor.
– Bitten Sie um eine Antwort.

Schreiben Sie 30 bis 40 Wörter. Schreiben Sie zu allen drei Punkten.` },
  { title: "Schreiben Teil 1 — SMS (Abend, Modelltest 3)", order_index: 6, question:
`Schreiben — Teil 1 (SMS)

Du möchtest heute Abend etwas unternehmen. Schreibe eine SMS an deinen Freund Thomas.

– Mach einen Vorschlag.
– Schreib, wann ihr etwas machen wollt.
– Schreib, dass du dich auf den Abend freust.

Schreib 20 bis 30 Wörter. Schreib zu allen drei Punkten.` },
  { title: "Schreiben Teil 2 — E-Mail (Deutschkurs, Modelltest 3)", order_index: 7, question:
`Schreiben — Teil 2 (E-Mail)

Sie können am Donnerstag nicht in den Deutschkurs kommen, weil Sie einen wichtigen Termin haben. Schreiben Sie eine E-Mail an Ihre Kursleiterin, Frau Lippmann.

– Entschuldigen Sie sich, dass Sie nicht kommen können.
– Schreiben Sie, warum.
– Bitten Sie um die Hausaufgaben für Freitag.

Schreiben Sie 30 bis 40 Wörter. Schreiben Sie zu allen drei Punkten.` },
  { title: "Schreiben Teil 1 — SMS (Schwimmbad, Modelltest 4)", order_index: 8, question:
`Schreiben — Teil 1 (SMS)

Du wolltest mit deiner Freundin heute ins Schwimmbad gehen, musst aber arbeiten. Schreibe eine SMS an deine Freundin Roberta.

– Entschuldige dich, dass du heute nicht kommen kannst.
– Schreib, warum.
– Schlag einen neuen Termin vor.

Schreib 20 bis 30 Wörter. Schreib zu allen drei Punkten.` },
  { title: "Schreiben Teil 2 — E-Mail (Chefin, Modelltest 4)", order_index: 9, question:
`Schreiben — Teil 2 (E-Mail)

Ihre Chefin, Frau Hansen, möchte, dass Sie am Freitagabend länger arbeiten. Schreiben Sie Frau Hansen eine E-Mail.

– Schreiben Sie, dass Sie einverstanden sind.
– Fragen Sie nach der Arbeit (was sollen Sie machen?).
– Schreiben Sie, dass Sie dafür in der nächsten Woche einmal früher nach Hause gehen möchten.

Schreiben Sie 30 bis 40 Wörter. Schreiben Sie zu allen drei Punkten.` },
];

const MUSTER_SECTION = {
  type: "spoiler",
  title: MARKER + " (otvori posle pisanja)",
  items: [
    { question: "MT2 · Teil 1 — SMS (Lucy, Markt)", answer: "Liebe Lucy, es tut mir leid, aber ich kann um 12 Uhr nicht auf dem Markt sein, weil mein Bus Verspätung hat. Können wir uns um halb eins treffen? Liebe Grüße, Ana" },
    { question: "MT2 · Teil 2 — E-Mail (Firma Schmidt)", answer: "Sehr geehrte Damen und Herren, leider bin ich am Montagvormittag nicht zu Hause. Könnten Sie vielleicht am Dienstagnachmittag kommen, um die Heizung zu reparieren? Bitte antworten Sie mir kurz. Mit freundlichen Grüßen, Ana Marković" },
    { question: "MT3 · Teil 1 — SMS (Thomas, Abend)", answer: "Hallo Thomas, hast du heute Abend Zeit? Wir könnten ins Kino gehen oder einen Spaziergang machen. Vielleicht um 19 Uhr? Ich freue mich schon sehr auf den Abend! Liebe Grüße, Ana" },
    { question: "MT3 · Teil 2 — E-Mail (Frau Lippmann)", answer: "Sehr geehrte Frau Lippmann, leider kann ich am Donnerstag nicht in den Deutschkurs kommen, weil ich einen wichtigen Termin beim Arzt habe. Könnten Sie mir bitte die Hausaufgaben für Freitag schicken? Vielen Dank! Mit freundlichen Grüßen, Ana" },
    { question: "MT4 · Teil 1 — SMS (Roberta, Schwimmbad)", answer: "Liebe Roberta, leider kann ich heute nicht ins Schwimmbad kommen, weil ich arbeiten muss. Das tut mir wirklich leid! Können wir vielleicht am Sonntag gehen? Liebe Grüße, Ana" },
    { question: "MT4 · Teil 2 — E-Mail (Frau Hansen, Chefin)", answer: "Sehr geehrte Frau Hansen, gern arbeite ich am Freitagabend länger. Was genau soll ich machen und wie lange dauert die Arbeit? Könnte ich dafür nächste Woche einmal früher nach Hause gehen? Mit freundlichen Grüßen, Ana" },
  ],
};

// PART A: dodaj Musterlösungen spoiler u sekcije
const { data: l6 } = await sb.from("lessons").select("sections").eq("id", L6).single();
const secs = l6.sections || [];
if (JSON.stringify(secs).includes(MARKER)) { console.log("Musterlösungen MT2-4 sekcija već postoji — preskačem"); }
else {
  console.log("→ dodajem Musterlösungen MT2-4 spoiler u L6 sekcije");
  if (APPLY) { const { error } = await sb.from("lessons").update({ sections: [...secs, MUSTER_SECTION] }).eq("id", L6); console.log(error ? `  ERROR: ${error.message}` : "  ✓ upisano"); }
}

// PART B: dodaj 6 vežbi
const { data: have } = await sb.from("exercises").select("title").eq("lesson_id", L6);
const titles = new Set((have || []).map(e => e.title));
for (const ex of EX) {
  if (titles.has(ex.title)) { console.log(`  "${ex.title}" već postoji — preskačem`); continue; }
  console.log(`→ "${ex.title}"`);
  if (APPLY) {
    const { data: created, error } = await sb.from("exercises").insert({ lesson_id: L6, title: ex.title, exercise_type: "listen_write", order_index: ex.order_index }).select("id").single();
    if (error || !created) { console.log(`  ERROR: ${error?.message}`); continue; }
    const { error: qErr } = await sb.from("exercise_questions").insert({ exercise_id: created.id, question: ex.question, options: null, correct_answer: "essay", explanation: null, order_index: 0 });
    console.log(qErr ? `  ERROR q: ${qErr.message}` : "  ✓ vežba + zadatak");
  }
}
if (!APPLY) console.log("\nDry-run — --apply za upis.");
