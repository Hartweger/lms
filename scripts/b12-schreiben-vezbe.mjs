// B1.2 — kreira „Schreiben" (essay) text-box vežbe za #16/#22/#23/#24.
// Idempotentno: preskače lekciju koja već ima essay vežbu. Dry-run; --apply za upis.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const VEZBE = {
  16: {
    title: "Schreiben – KI-Tools",
    task: "Schreib 4–5 Sätze auf Deutsch: Benutzt du KI-Tools und wofür? Was macht die KI besser als Menschen – und was machen Menschen besser? Benutze mindestens vier Verben aus der Lektion.",
  },
  22: {
    title: "Schreiben Teil 1 – Informelle E-Mail",
    task: "Ihr Freund Carsten liegt im Krankenhaus, weil er sich bei einem Unfall das rechte Bein gebrochen hat. Sie haben ihn gestern besucht und schreiben einem gemeinsamen Freund.\n\n– Beschreiben Sie: Wie geht es Carsten?\n– Begründen Sie: Was braucht er in seiner Situation?\n– Machen Sie einen Vorschlag für einen gemeinsamen Besuch.\n\nSchreiben Sie eine E-Mail (ca. 80 Wörter). Achten Sie auf Anrede, Reihenfolge der Punkte und Schluss.",
  },
  23: {
    title: "Schreiben Teil 2 – Meinung im Forum",
    task: "In einem Online-Forum liest du folgenden Kommentar zum Thema „Handys in der Schule“:\n\nMarkus: „Handys gehören nicht in die Schule! Die Schüler sind nur abgelenkt und lernen nichts mehr. Ein Verbot wäre die beste Lösung.“\n\nSchreib deine Meinung (ca. 80 Wörter): Stimmst du Markus zu? Begründe deinen Standpunkt mit mindestens zwei Argumenten und mach einen Lösungsvorschlag.",
  },
  24: {
    title: "Schreiben Teil 3 – Formelle E-Mail",
    task: "Ihr Lehrer, Herr Möller, hat Sie zu einem internationalen Theatertreffen eingeladen. Zu dem Termin im August können Sie aber nicht kommen.\n\nSchreiben Sie an Herrn Möller: Bedanken Sie sich, entschuldigen Sie sich höflich und berichten Sie, warum Sie nicht teilnehmen können.\n\nSchreiben Sie eine E-Mail (ca. 40 Wörter). Vergessen Sie nicht Anrede und Gruß am Schluss.",
  },
};

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: lessons } = await sb.from("lessons").select("id, order_index, title").eq("course_id", course.id);
const byIdx = Object.fromEntries(lessons.map((l) => [l.order_index, l]));

for (const [idx, v] of Object.entries(VEZBE)) {
  const l = byIdx[idx];
  if (!l) { console.log(`#${idx}: NEMA lekcije`); continue; }
  const { data: existing } = await sb.from("exercises").select("id, exercise_type, order_index").eq("lesson_id", l.id);
  const hasEssay = (existing || []).some((e) => e.exercise_type === "essay");
  const nextOrder = (existing || []).reduce((mx, e) => Math.max(mx, e.order_index ?? 0), 0) + 1;
  console.log(`\n#${idx} ${l.title}`);
  if (hasEssay) { console.log("   • već ima essay vežbu — preskačem"); continue; }
  console.log(`   • + essay vežba „${v.title}" (order ${nextOrder})`);
  console.log(`     task: ${v.task.slice(0, 70)}…`);
  if (APPLY) {
    const { data: ex, error: e1 } = await sb
      .from("exercises")
      .insert({ lesson_id: l.id, title: v.title, exercise_type: "essay", order_index: nextOrder })
      .select("id").single();
    if (e1) { console.log("   ✗ ERROR exercises: " + e1.message); continue; }
    const { error: e2 } = await sb.from("exercise_questions").insert({
      exercise_id: ex.id, question: v.task, options: null, correct_answer: "essay", explanation: null, audio_url: null, order_index: 0,
    });
    console.log(e2 ? "   ✗ ERROR question: " + e2.message : `   ✓ kreirano (exercise ${ex.id})`);
  }
}
if (!APPLY) console.log("\nDry-run — pokreni sa --apply za upis.");
