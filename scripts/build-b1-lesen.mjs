// B1 Leseverstehen (Modelltest) → Goethe B1. PDF (pitanja) → Supabase. 5 delova, 30 pitanja.
// Tekst je u PDF-u; context po delu nosi link na PDF (da se grupiše). Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const BUCKET = "blog-media", PFX = "kursevi/polozi-goethe-b1/", PDFFILE = "b1.pdf";
const LESSON = "Leseverstehen – Modelltest B1", EX = "Leseverstehen — Modelltest B1";

const RF = ["richtig", "falsch"], JN = ["Ja", "Nein"], ABC = ["a", "b", "c"];
const MATCH = ["A","B","C","D","E","F","G","H","I","J","X"];
// [tip, items, tačan index]; redom Teil 1..5
const SPEC = [
  // Teil 1 R/F: R,R,F,R,R,F
  ...[0,0,1,0,0,1].map(c=>[1,RF,c]),
  // Teil 2 a/b/c: b,b,c,c,c,a
  ...[1,1,2,2,2,0].map(c=>[2,ABC,c]),
  // Teil 3 matching A–J/X: D,J,A,G,X,I,B
  ...[3,9,0,6,10,8,1].map(c=>[3,MATCH,c]),
  // Teil 4 Ja/Nein: N,J,N,J,J,N,J
  ...[1,0,1,0,0,1,0].map(c=>[4,JN,c]),
  // Teil 5 a/b/c: c,c,b,a
  ...[2,2,1,0].map(c=>[5,ABC,c]),
];

const TEILINFO = {
  1: "Teil 1 — richtig / falsch",
  2: "Teil 2 — a / b / c",
  3: "Teil 3 — uparite situaciju sa oglasom (A–J); ako nijedan ne odgovara: X",
  4: "Teil 4 — Ja / Nein",
  5: "Teil 5 — a / b / c",
};

const { data: course } = await sb.from("courses").select("id").eq("slug", "polozi-goethe-b1").single();
console.log(`Goethe B1: ${course.id} | pitanja: ${SPEC.length}`);
if (!APPLY) { console.log("[DRY] --apply (skida b1.pdf → Supabase, pravi lekciju + test)."); process.exit(0); }

const r = await fetch("https://www.hartweger.rs/wp-content/uploads/2024/04/" + PDFFILE);
if (!r.ok) throw new Error("pdf dl " + r.status);
await sb.storage.from(BUCKET).upload(PFX + PDFFILE, Buffer.from(await r.arrayBuffer()), { contentType: "application/pdf", upsert: true });
const pdf = sb.storage.from(BUCKET).getPublicUrl(PFX + PDFFILE).data.publicUrl;
console.log("  ✓ b1.pdf → Supabase");

let { data: lesson } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", LESSON).maybeSingle();
if (!lesson) {
  const { data: mx } = await sb.from("lessons").select("order_index").eq("course_id", course.id).order("order_index", { ascending: false }).limit(1);
  const sections = [
    { type: "badge", module: "Leseverstehen B1" },
    { type: "text", style: "info", content: "Modelltest Lesen (Goethe-Zertifikat B1), 5 delova / 30 zadataka. Tekstovi i zadaci su u PDF-u." },
    { type: "pdf", url: pdf, label: "B1 Lesen — tekstovi i zadaci (PDF)" },
  ];
  ({ data: lesson } = await sb.from("lessons").insert({ course_id: course.id, title: LESSON, lesson_type: "text", order_index: (mx?.[0]?.order_index ?? 0) + 1, sections }).select("id").single());
  console.log(`+ lekcija "${LESSON}"`);
}

await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", EX);
const { data: ex } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: EX, exercise_type: "quiz", order_index: 0 }).select("id").single();
let i = 0;
for (const [part, items, correct] of SPEC) {
  const ctx = { type: "text", title: TEILINFO[part], content: `Tekst i zadaci za ovaj deo su u PDF-u: <a href="${pdf}" target="_blank">📄 B1 Lesen PDF</a>` };
  await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: `<strong>Aufgabe ${i + 1}</strong> — odgovor (vidi PDF)`,
    options: { type: "quiz", items, context: ctx }, correct_answer: String(correct), question_type: "quiz", order_index: i++,
  });
}
console.log(`✓ "${EX}": ${SPEC.length} pitanja (5 delova) na "${LESSON}"`);
