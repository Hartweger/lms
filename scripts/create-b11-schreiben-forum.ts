/**
 * Kreira Schreiben lekciju „Schreiben B1 — Forumsbeitrag (Sprachen lernen)" u Nemački B1.1 (Modul 4).
 * Tekst (Sandrin Gästebuch + Redemittel) DOSLOVNO. Pisanje = essay vežba (slanje profesorki).
 * Privremeni order_index = 103 (sređuje se reorder-om). Idempotentno.
 * Run: npx tsx scripts/create-b11-schreiben-forum.ts
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
const TITLE = "Schreiben B1 — Forumsbeitrag (Sprachen lernen)";
const EX_TITLE = "Schreiben B1 — Forumsbeitrag: Meinung";

const GAESTEBUCH =
  "**Gästebuch** · 20.02. 14:50 Uhr\n\n**Sandra (55 Jahre) aus Wien:**\n\n" +
  "Also, ich kann einigen Gästen in Ihrer Sendung gar nicht zustimmen. Sie sagen, dass es für einige Lerner am Anfang nicht so wichtig ist, beim Sprechen an den korrekten Gebrauch der Grammatik zu denken. Viel wichtiger ist es, einfach mal zu sprechen und die Angst vor dem freien Sprechen zu verlieren. Ich arbeite mit Ausländern und sehe, dass manche von ihnen später Probleme mit korrektem Deutsch haben und das brauchen sie halt, wenn sie hier in Österreich arbeiten. Ich finde es jedenfalls wichtig, dass sie von Anfang an auf den korrekten Gebrauch der Grammatik achten. Ein Freund aus Italien hat einmal zu mir gesagt: „Wenn mich einfach immer jemand verbessert hätte, könnte ich heute viel besser Deutsch. Jetzt muss ich mich sehr anstrengen und mich beim Sprechen immer konzentrieren, um nicht immer die gleichen Fehler zu machen.“";

const REDEMITTEL =
  "## Redemittel — fraze za izražavanje mišljenja\n\n" +
  "- *Ich denke, dass …*\n" +
  "- *Ich finde es sehr gut / wichtig, dass …*\n" +
  "- *Für mich ist … wichtig, weil / denn …*\n" +
  "- *Am allerwichtigsten ist … Deswegen / Daher / Aus diesem Grund …*\n" +
  "- *Es könnte schwierig sein, dass …*\n" +
  "- *Auf der anderen Seite …*\n" +
  "- *Ich stimme Sandra (nicht) zu, denn …*\n\n" +
  "💡 **Lerntipp:** Sie brauchen diese Sätze, wenn Sie Ihre Meinung ausdrücken wollen. Wiederholen Sie sie möglichst oft.";

const TASK =
  "Schreiben Sie einen Forumsbeitrag: Ihre Meinung zum Thema „Erfolgreich Sprachen lernen“ (circa 80 Wörter).\n\n" +
  "Stimmen Sie Sandra zu? Ja oder nein? Was sind Ihre Argumente? Was finden Sie gut? Was finden Sie nicht richtig?";

const sections = [
  { type: "badge", module: "Modul 4", category: "schreiben" },
  { type: "text", style: "info",
    content: "Vežba pisanja (**Schreiben**) — Forumsbeitrag. Prvo pročitaj mišljenje iz gostne knjige i fraze (Redemittel), pa napiši **svoje mišljenje** (~80 reči) u polje na dnu i pošalji ga profesorki na pregled." },

  { type: "text", style: "default",
    content: "## 17 · Einen Forumsbeitrag schreiben\n\nIm Fernsehen haben Sie eine Diskussionssendung zum Thema „Erfolgreich Sprachen lernen“ gesehen. Dazu gibt es im Online-Gästebuch der Sendung folgende Meinung:" },
  { type: "text", style: "beispiele", content: GAESTEBUCH },

  { type: "text", style: "default",
    content: "**a — Machen Sie Notizen.**\n\nStimmen Sie Sandra zu? Ja oder nein? Was sind Ihre Argumente? Was finden Sie gut? Was finden Sie nicht richtig?" },
  { type: "text", style: "beispiele", content: REDEMITTEL },

  { type: "text", style: "default",
    content: "## b · Schreiben Sie Ihre Meinung\n\nNapiši svoj forum-post (~80 reči) u polje ispod i klikni **Pošalji** — profesorka će ti pregledati rad i dati ocenu i komentar." },
  { type: "exercise", title: EX_TITLE },
];

async function main() {
  let { data: lesson } = await supabase
    .from("lessons").select("id").eq("course_id", B11_COURSE).eq("title", TITLE).maybeSingle();
  if (!lesson) {
    const { data, error } = await supabase
      .from("lessons")
      .insert({ course_id: B11_COURSE, title: TITLE, order_index: 103, lesson_type: "text", is_free_preview: false, sections })
      .select("id").single();
    if (error) { console.error("insert lesson:", error.message); process.exit(1); }
    lesson = data;
    console.log(`✓ Lekcija kreirana (id=${lesson.id})`);
  } else {
    await supabase.from("lessons").update({ sections }).eq("id", lesson.id);
    console.log(`✓ Lekcija postoji — sadržaj ažuriran (id=${lesson.id})`);
  }

  // Essay vežba (idempotentno)
  const { data: existingEx } = await supabase.from("exercises").select("id, exercise_type, order_index").eq("lesson_id", lesson.id);
  let exId = (existingEx ?? []).find((e) => e.exercise_type === "essay")?.id;
  if (!exId) {
    const nextOrder = (existingEx ?? []).reduce((mx, e) => Math.max(mx, e.order_index ?? 0), 0) + 1;
    const { data: ex, error: e1 } = await supabase
      .from("exercises").insert({ lesson_id: lesson.id, title: EX_TITLE, exercise_type: "essay", order_index: nextOrder }).select("id").single();
    if (e1) { console.error("exercises:", e1.message); process.exit(1); }
    exId = ex.id;
    const { error: e2 } = await supabase.from("exercise_questions").insert({
      exercise_id: exId, question: TASK, options: null, correct_answer: "essay", explanation: null, audio_url: null, order_index: 0,
    });
    if (e2) { console.error("exercise_questions:", e2.message); process.exit(1); }
    console.log(`✓ Essay vežba kreirana (exercise ${exId})`);
  } else {
    await supabase.from("exercises").update({ title: EX_TITLE }).eq("id", exId);
    const { data: q } = await supabase.from("exercise_questions").select("id").eq("exercise_id", exId).order("order_index").limit(1).maybeSingle();
    if (q) await supabase.from("exercise_questions").update({ question: TASK }).eq("id", q.id);
    console.log(`✓ Essay vežba postoji — task ažuriran (exercise ${exId})`);
  }

  console.log(`✅ GOTOVO. Lesson id=${lesson.id}`);
}

main();
