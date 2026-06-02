// B1 Hörverstehen (Modelltest) → Goethe B1. PDF (pitanja) + 4 mp3 → Supabase.
// Test: 30 pitanja, audio po delu, R/F ili a/b/c (tekst pitanja je u PDF-u). Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const BUCKET = "blog-media";
const PFX = "kursevi/polozi-goethe-b1/";
const LESSON = "Hörverstehen – Modelltest B1";
const EX = "Hörverstehen — Modelltest B1";

const FILES = {
  pdf: "B1-hoeren.pdf",
  a1: "2_02_Fit_fuer_Zertifikat_B1_Erwachsene_Simulation_Hoeren_1.mp3",
  a2: "2_03_Fit_fuer_Zertifikat_B1_Erwachsene_Simulation_Hoeren_2.mp3",
  a3: "2_04_Fit_fuer_Zertifikat_B1_Erwachsene_Simulation_Hoeren_3.mp3",
  a4: "2_05_Fit_fuer_Zertifikat_B1_Erwachsene_Simulation_Hoeren_4.mp3",
};
const WP = "https://www.hartweger.rs/wp-content/uploads/2024/04/";
const ct = (n) => n.endsWith(".pdf") ? "application/pdf" : "audio/mpeg";
async function up(file) {
  const r = await fetch(WP + file); if (!r.ok) throw new Error(`dl ${r.status} ${file}`);
  const { error } = await sb.storage.from(BUCKET).upload(PFX + file, Buffer.from(await r.arrayBuffer()), { contentType: ct(file), upsert: true });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(PFX + file).data.publicUrl;
}

const RF = ["richtig", "falsch"]; // R=0, F=1
const ABC = ["a", "b", "c"];      // a=0, b=1, c=2
// part, tip, tačan index
const KEY = [
  // Teil 1 (audio1): naizmenično R/F i a/b/c
  [1,"rf",0],[1,"abc",2],[1,"rf",1],[1,"abc",1],[1,"rf",1],[1,"abc",1],[1,"rf",1],[1,"abc",2],[1,"rf",0],[1,"abc",1],
  // Teil 2 (audio2): a/b/c
  [2,"abc",2],[2,"abc",1],[2,"abc",0],[2,"abc",1],[2,"abc",2],
  // Teil 3 (audio3): R/F
  [3,"rf",0],[3,"rf",0],[3,"rf",1],[3,"rf",0],[3,"rf",1],[3,"rf",1],[3,"rf",0],
  // Teil 4 (audio4): a/b/c
  [4,"abc",2],[4,"abc",2],[4,"abc",1],[4,"abc",2],[4,"abc",0],[4,"abc",2],[4,"abc",1],[4,"abc",2],
];

const { data: course } = await sb.from("courses").select("id").eq("slug", "polozi-goethe-b1").single();
console.log(`Goethe B1: ${course.id} | pitanja: ${KEY.length}`);
if (!APPLY) { console.log("[DRY] --apply za upis (skida PDF + 4 mp3 → Supabase, pravi lekciju + test)."); process.exit(0); }

const url = {};
for (const k of Object.keys(FILES)) { url[k] = await up(FILES[k]); console.log(`  ✓ ${k} → Supabase`); }
const audioByPart = { 1: url.a1, 2: url.a2, 3: url.a3, 4: url.a4 };

// lekcija
let { data: lesson } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", LESSON).maybeSingle();
if (!lesson) {
  const { data: mx } = await sb.from("lessons").select("order_index").eq("course_id", course.id).order("order_index", { ascending: false }).limit(1);
  const oi = (mx?.[0]?.order_index ?? 0) + 1;
  const sections = [
    { type: "badge", module: "Hörverstehen B1" },
    { type: "text", style: "info", content: "Modelltest Hören (Goethe-Zertifikat B1). Pitanja su u PDF-u, audio uz svaki deo u testu ispod. Test ima 4 dela / 30 zadataka." },
    { type: "pdf", url: url.pdf, label: "B1 Hören — pitanja (PDF)" },
  ];
  ({ data: lesson } = await sb.from("lessons").insert({ course_id: course.id, title: LESSON, lesson_type: "text", order_index: oi, sections }).select("id").single());
  console.log(`+ lekcija "${LESSON}" (order ${oi})`);
}

await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", EX);
const { data: ex } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: EX, exercise_type: "quiz", order_index: 0 }).select("id").single();
let firstOfPart = {};
let i = 0;
for (const [part, typ, correct] of KEY) {
  const n = i + 1;
  const items = typ === "rf" ? RF : ABC;
  const label = typ === "rf" ? "richtig oder falsch?" : "Lösung a, b oder c?";
  let q = `<strong>Aufgabe ${n}</strong> — ${label}`;
  if (!firstOfPart[part]) { // prvi u delu → naslov + PDF link
    firstOfPart[part] = true;
    q = `<strong>Teil ${part}</strong> — slušaj audio, pitanja su u <a href="${url.pdf}" target="_blank">📄 PDF-u</a>.<br><br>` + q;
  }
  await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: q, options: { type: "quiz", items },
    correct_answer: String(correct), question_type: "quiz", audio_url: audioByPart[part], order_index: i++,
  });
}
console.log(`✓ "${EX}": ${KEY.length} pitanja (audio po delu, R/F + a/b/c) na lekciji "${LESSON}"`);
