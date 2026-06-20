/**
 * Bore-out lekcija: Teil 2 Schreiben → prava ESSAY vežba (polje za pisanje + slanje profesorki).
 * Kreira exercises(essay) + exercise_questions(task) i veže ih u lekciju preko {type:"exercise"} bloka.
 * Idempotentno. Run: npx tsx scripts/fix-b11-boreout-schreiben.ts
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
const LESSON_TITLE = "Lesen & Schreiben B1 — Bore-out";
const EX_TITLE = "Schreiben B1 — Antwort an Katja";

const TASK =
  "Schreiben Sie eine Antwort an Katja.\n\n" +
  "Antworten Sie Katja mit einer E-Mail (etwa 80 Wörter). Schreiben Sie dabei etwas zu den drei folgenden Punkten:\n\n" +
  "– Beschreiben Sie Ihre Arbeit / Ihr Studium: Fühlen Sie sich oft gestresst? Oder eher gelangweilt?\n" +
  "– Wie gefällt Ihnen Katjas Idee eines Sabbatjahrs? Haben Sie das auch schon einmal gemacht? Oder würden Sie es gern tun?\n" +
  "– Was möchten Sie von Katja außerdem wissen?";

const EMAIL =
  "**E-Mail senden**\n\n" +
  "Liebe/r …,\n\n" +
  "bestimmt hast Du Dich schon gefragt, warum Du so lange nichts mehr von mir gehört hast. Es gibt einen Grund: Ich habe mein Leben völlig geändert. Mein Job als Büroangestellte hatte mich nämlich krank gemacht. Immer öfter bekam ich Kopfschmerzen oder Magenbeschwerden. Ich schlief schlecht und hatte auf nichts mehr Lust. Jeden Abend, wenn ich nach Hause kam, fühlte ich mich extrem müde und gestresst. Und das, obwohl ich bei der Arbeit mein Soll immer schaffte. Im Gegenteil, ich hatte oft so wenig zu tun, dass ich neben der Arbeit noch private Dinge erledigte. Ich lief von Arzt zu Arzt, aber keiner fand die Ursache für meine gesundheitlichen Probleme. Schließlich ging ich zu einem Psychologen. Er vermutete, dass es Langeweile war, die mich krank machte. Ich war total überrascht, denn jeder weiß ja, dass Stress krank macht. Aber Langeweile? Bore-out nennt man das, hat der Psychologe mir erklärt. Ich konnte es kaum glauben, denn mein sicherer Job bei der Versicherung schien mir immer genau das Richtige für mich zu sein. Ein stressiger Manager-Job oder der anstrengende Beruf einer Krankenschwester, das wäre alles nichts für mich. Ich habe lange nachgedacht und mich schließlich für ein Sabbatjahr, eine Auszeit, entschieden. Jetzt lebe ich auf einem Bauernhof in den Schweizer Bergen und kümmere mich um Schafe und Kühe. Ich habe gelernt, wie man Käse macht, und helfe bei der Feldarbeit. Die körperliche Arbeit gefällt mir. Ob ich das immer machen möchte, weiß ich noch nicht. Aber eins ist sicher: In meine alte Firma gehe ich nicht zurück.\n\n" +
  "Viele Grüße von Katja";

const sections = [
  { type: "badge", module: "Modul 3", category: "lesen" },
  { type: "text", style: "info",
    content: "Ova lekcija ima dva dela: prvo **Leseverstehen** (pročitaj Katjinu mejl i reši tvrdnje *richtig/falsch*), a zatim **Schreiben** (napiši odgovor Katji i pošalji ga profesorki na pregled)." },

  { type: "text", style: "default",
    content: "## Teil 1 · Leseverstehen\n\n**23 — Lesen Sie den Text und wählen Sie. Sind die Aussagen richtig oder falsch?**" },
  { type: "text", style: "beispiele", content: EMAIL },
  { type: "spoiler", title: "Aussagen a–f — richtig oder falsch? (klikni za rešenje)",
    items: [
      { question: "a) Katjas beruflicher Alltag führte zu gesundheitlichen Problemen.\n\nrichtig / falsch?", answer: "richtig — „Mein Job als Büroangestellte hatte mich krank gemacht“ (Kopfschmerzen, Magenbeschwerden)." },
      { question: "b) Sie hatte einen sehr stressigen Job.\n\nrichtig / falsch?", answer: "falsch — naprotiv, imala je premalo posla; problem je bila dosada (Langeweile / Bore-out)." },
      { question: "c) Langeweile kann die Ursache für Stress und körperliche Beschwerden sein.\n\nrichtig / falsch?", answer: "richtig — psiholog: „es war Langeweile, die mich krank machte“ (Bore-out)." },
      { question: "d) Katja macht jetzt ein Jahr Pause von ihrem Job.\n\nrichtig / falsch?", answer: "richtig — odlučila se za „ein Sabbatjahr, eine Auszeit“." },
      { question: "e) Sie macht Urlaub in den Bergen und entspannt sich.\n\nrichtig / falsch?", answer: "falsch — ne odmara: fizički radi na farmi (Schafe und Kühe, Käse machen, Feldarbeit)." },
      { question: "f) In einem Jahr will sie wieder bei der Versicherung arbeiten.\n\nrichtig / falsch?", answer: "falsch — „In meine alte Firma gehe ich nicht zurück.“" },
    ] },

  { type: "text", style: "default",
    content: "## Teil 2 · Schreiben\n\nNapiši svoj odgovor (oko **80 reči**) u polje ispod i klikni **Pošalji** — profesorka će ti pregledati rad i dati ocenu i komentar." },
  { type: "exercise", title: EX_TITLE },
];

async function main() {
  const { data: lesson } = await supabase
    .from("lessons").select("id").eq("course_id", B11_COURSE).eq("title", LESSON_TITLE).maybeSingle();
  if (!lesson) { console.error("Lekcija nije nađena."); process.exit(1); }

  // Essay vežba (idempotentno)
  const { data: existingEx } = await supabase
    .from("exercises").select("id, exercise_type, order_index").eq("lesson_id", lesson.id);
  let exId = (existingEx ?? []).find((e) => e.exercise_type === "essay" && true)?.id;
  if (!exId) {
    const nextOrder = (existingEx ?? []).reduce((mx, e) => Math.max(mx, e.order_index ?? 0), 0) + 1;
    const { data: ex, error: e1 } = await supabase
      .from("exercises")
      .insert({ lesson_id: lesson.id, title: EX_TITLE, exercise_type: "essay", order_index: nextOrder })
      .select("id").single();
    if (e1) { console.error("exercises:", e1.message); process.exit(1); }
    exId = ex.id;
    const { error: e2 } = await supabase.from("exercise_questions").insert({
      exercise_id: exId, question: TASK, options: null, correct_answer: "essay", explanation: null, audio_url: null, order_index: 0,
    });
    if (e2) { console.error("exercise_questions:", e2.message); process.exit(1); }
    console.log(`✓ Essay vežba kreirana (exercise ${exId})`);
  } else {
    // osiguraj tačan task i naslov
    await supabase.from("exercises").update({ title: EX_TITLE }).eq("id", exId);
    const { data: q } = await supabase.from("exercise_questions").select("id").eq("exercise_id", exId).order("order_index").limit(1).maybeSingle();
    if (q) await supabase.from("exercise_questions").update({ question: TASK }).eq("id", q.id);
    console.log(`✓ Essay vežba već postoji — task ažuriran (exercise ${exId})`);
  }

  const { error: eUpd } = await supabase.from("lessons").update({ sections }).eq("id", lesson.id);
  if (eUpd) { console.error("update sections:", eUpd.message); process.exit(1); }
  console.log("✅ Lekcija ažurirana: Teil 2 je sada essay vežba (slanje profesorki).");
}

main();
