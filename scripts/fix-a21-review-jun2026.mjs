/**
 * A2.1 — ispravke po komentarima profesorke (jun 2026).
 *
 * Pokriva: pravopis/umlaute u testovima (Modul 3, Modul 5), srpske kvačice
 * (lekcija #28 Ausbildung, #18 spoiler naslov), obraćanje "ti" + bezrodno
 * (#0 Willkommen, #27 Schulsystem, #24 Prevedi rečenice), Schreiben zadaci
 * koji nisu imali polje za pisanje (Modul 2 z11, Modul 3 z9), znak zabrane
 * pušenja (Modul 5 z9), i naslov "Zavrsni ispit" → "Završni ispit".
 *
 * SAFETY: dry-run je podrazumevano. Bez --apply ništa se ne upisuje.
 *   node scripts/fix-a21-review-jun2026.mjs           # dry-run
 *   node scripts/fix-a21-review-jun2026.mjs --apply    # upiši u bazu
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const COURSE_SLUG = "nemacki-a2-1";
let changes = 0;
const log = (m) => console.log(m);

const { data: course } = await sb.from("courses").select("id").eq("slug", COURSE_SLUG).single();
const { data: lessons } = await sb.from("lessons").select("id, order_index, title, sections").eq("course_id", course.id).order("order_index");
const byIdx = Object.fromEntries(lessons.map((l) => [l.order_index, l]));
const lessonIds = lessons.map((l) => l.id);
const { data: exercises } = await sb.from("exercises").select("id, lesson_id, title").in("lesson_id", lessonIds);

// ───────────────────────── helpers ─────────────────────────
function diffStr(label, before, after) {
  if (before === after) return false;
  log(`\n  ✏️  ${label}`);
  log(`     - ${JSON.stringify(before).slice(0, 160)}`);
  log(`     + ${JSON.stringify(after).slice(0, 160)}`);
  changes++;
  return true;
}

async function updateLessonSections(orderIdx, mutate) {
  const lesson = byIdx[orderIdx];
  if (!lesson) { log(`  ⚠️  lekcija #${orderIdx} nije nađena`); return; }
  const before = JSON.stringify(lesson.sections);
  const sections = JSON.parse(before);
  mutate(sections);
  const after = JSON.stringify(sections);
  if (before === after) { log(`  (#${orderIdx} ${lesson.title}: bez promene)`); return; }
  if (APPLY) {
    const { error } = await sb.from("lessons").update({ sections }).eq("id", lesson.id);
    if (error) { log(`  ❌ #${orderIdx}: ${error.message}`); return; }
  }
  log(`  ${APPLY ? "✅ upisano" : "DRY"} → #${orderIdx} ${lesson.title}`);
}

function exId(title) {
  const e = exercises.find((x) => x.title === title);
  if (!e) { log(`  ⚠️  vežba "${title}" nije nađena`); return null; }
  return e.id;
}

async function patchQuestion(exTitle, orderIndex, patch) {
  const id = exId(exTitle);
  if (!id) return;
  const { data: qs } = await sb.from("exercise_questions").select("id, order_index, question, options, correct_answer").eq("exercise_id", id).eq("order_index", orderIndex);
  const q = qs?.[0];
  if (!q) { log(`  ⚠️  ${exTitle} q[order=${orderIndex}] nije nađeno`); return; }
  const update = patch(q);
  if (!update || Object.keys(update).length === 0) { log(`  (${exTitle} q${orderIndex + 1}: bez promene)`); return; }
  if (APPLY) {
    const { error } = await sb.from("exercise_questions").update(update).eq("id", q.id);
    if (error) { log(`  ❌ ${exTitle} q${orderIndex + 1}: ${error.message}`); return; }
  }
  log(`  ${APPLY ? "✅ upisano" : "DRY"} → ${exTitle} q${orderIndex + 1}`);
}

// ═══════════════════════ 1. OBRAĆANJE (#0, #27, #24) ═══════════════════════
log("\n══ 1. Obraćanje → 'ti' + bezrodno ══");

await updateLessonSections(0, (secs) => {
  for (const s of secs) {
    if (s.type !== "text" || !s.content) continue;
    let c = s.content;
    c = c.replace("Preuzmite ga i koristite uz lekcije", "Preuzmi ga i koristi uz lekcije");
    c = c.replace(
      "Pridružite se našoj WhatsApp grupi gde možete da postavljate pitanja, delite iskustva i vežbate nemački sa drugim učenicima",
      "Pridruži se našoj WhatsApp grupi gde možeš da postavljaš pitanja, deliš iskustva i vežbaš nemački sa drugim učenicima"
    );
    diffStr("#0 text", s.content, c);
    s.content = c;
  }
});

await updateLessonSections(27, (secs) => {
  for (const s of secs) {
    if (s.type !== "text" || !s.content) continue;
    const c = s.content.replace("Vaše dete možda mora da ponavlja razred?", "Tvoje dete možda mora da ponavlja razred?");
    diffStr("#27 text", s.content, c);
    s.content = c;
  }
});

// #24 "Htela sam da putujem u Italiju." — order_index nije fiksan, traži po tekstu
{
  const lesson24 = byIdx[24];
  const ex = exercises.find((x) => x.lesson_id === lesson24.id && x.title === "Prevedi rečenice");
  if (ex) {
    const { data: qs } = await sb.from("exercise_questions").select("id, order_index, question").eq("exercise_id", ex.id);
    const q = (qs || []).find((x) => /Htela sam da putujem u Italiju/.test(x.question));
    if (q) {
      const after = q.question.replace("Htela sam da putujem u Italiju.", "Hteo/la sam da putujem u Italiju.");
      if (diffStr(`#24 Prevedi rečenice q${q.order_index + 1}`, q.question, after) && APPLY) {
        await sb.from("exercise_questions").update({ question: after }).eq("id", q.id);
      }
    } else log("  (#24 Htela: rečenica nije nađena)");
  }
}

// ═══════════════════════ 2. PRAVOPIS / KVAČICE (lekcije) ═══════════════════════
log("\n══ 2. Pravopis u lekcijama (#18, #28) ══");

// #18 spoiler naslov: "Razumevanje tekšta" → "Razumevanje teksta"
await updateLessonSections(18, (secs) => {
  for (const s of secs) {
    if (s.type === "spoiler" && s.title) {
      const after = s.title.replace("tekšta", "teksta");
      diffStr("#18 spoiler title", s.title, after);
      s.title = after;
    }
  }
});

// #28 Ausbildung — srpske kvačice (samo srpski tekst, NE nemačke termine)
const SR28 = [
  ["vazan", "važan"],
  ["se uci i u školi", "se uči i u školi"],
  ["traje obicno", "traje obično"],
  ["Obicno 2 do 3.5", "Obično 2 do 3.5"],
  ["skraceno", "skraćeno"],
  ["preduzece", "preduzeće"],
];
await updateLessonSections(28, (secs) => {
  const walk = (node) => {
    if (typeof node === "string") return node;
    return node;
  };
  void walk;
  // jednostavno: serijalizuj sekciju, zameni, deserijalizuj — bezbedno jer su tokeni jedinstveni
  for (let i = 0; i < secs.length; i++) {
    let raw = JSON.stringify(secs[i]);
    let changed = raw;
    for (const [a, b] of SR28) changed = changed.split(a).join(b);
    if (changed !== raw) {
      diffStr(`#28 [${secs[i].type}]`, raw, changed);
      secs[i] = JSON.parse(changed);
    }
  }
});

// ═══════════════════════ 3. TESTOVI — pravopis/umlauti ═══════════════════════
log("\n══ 3. Testovi — umlauti / kvačice ══");

// Test Modul 5
await patchQuestion("Test Modul 5", 1, (q) => ({ question: q.question.replace("im Cafe", "im Café") })); // q2
await patchQuestion("Test Modul 5", 3, (q) => ({ question: q.question.replace("fur den Tanzsport", "für den Tanzsport") })); // q4
await patchQuestion("Test Modul 5", 2, (q) => { // q3 svadjati
  const o = JSON.parse(JSON.stringify(q.options));
  for (const it of o.items) if (it.sr === "svadjati se") it.sr = "svađati se";
  return { options: o };
});
await patchQuestion("Test Modul 5", 4, (q) => { // q5 uber/fur/erzahlen
  const o = JSON.parse(JSON.stringify(q.options));
  for (const it of o.items) {
    if (it.sr === "uber") it.sr = "über";
    if (it.sr === "fur") it.sr = "für";
    if (it.de === "erzahlen") it.de = "erzählen";
  }
  return { options: o };
});

// Test Modul 3 q2 — žemička → zemička
await patchQuestion("Test Modul 3", 1, (q) => {
  const o = JSON.parse(JSON.stringify(q.options));
  for (const it of o.items) if (it.sr === "žemička") it.sr = "zemička";
  return { options: o };
});

// ═══════════════════════ 4. SCHREIBEN — polje za pisanje ═══════════════════════
log("\n══ 4. Schreiben zadaci → polje za pisanje (Modul 2 z11, Modul 3 z9) ══");
// options:null → {type:"essay"} ruta na EssayExercise (writing field + dugme Završi)
await patchQuestion("Test Modul 2", 10, (q) => (q.options ? null : { options: { type: "essay" } }));
await patchQuestion("Test Modul 3", 8, (q) => (q.options ? null : { options: { type: "essay" } }));

// ═══════════════════════ 5. MODUL 5 z9 — znak zabrane pušenja ═══════════════════════
log("\n══ 5. Modul 5 z9 — znak zabrane pušenja ══");
await patchQuestion("Test Modul 5", 8, (q) => {
  const after = 'Hier darf man nicht ______.<br><span style="font-size:64px;display:inline-block;margin-top:8px">🚭</span>';
  return after === q.question ? null : { question: after };
});

// ═══════════════════════ 6. Naslov "Zavrsni ispit" → "Završni ispit" ═══════════════════════
log("\n══ 6. Naslov završnog ispita ══");
{
  const ex = exercises.find((x) => x.title === "Zavrsni ispit A2.1");
  if (ex) {
    log(`  ${APPLY ? "✅ upisano" : "DRY"} → "Zavrsni ispit A2.1" → "Završni ispit A2.1"`);
    changes++;
    if (APPLY) await sb.from("exercises").update({ title: "Završni ispit A2.1" }).eq("id", ex.id);
  } else log('  (vežba "Zavrsni ispit A2.1" nije nađena)');
}

log(`\n${"═".repeat(50)}`);
log(APPLY ? `✅ GOTOVO — ${changes} promena upisano.` : `DRY-RUN — ${changes} promena bi bilo upisano. Pokreni sa --apply.`);
