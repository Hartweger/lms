// B2.1 — Leseverstehen testovi za tematske lekcije Modula 1 i 3. Idempotentno. --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3729f3f5-2582-44ff-bb10-c4cc2ab5676b";

const CTX_LEBEN = `**Veränderungen wagen**

**Jakob (Pädagoge):** lebte in der Großstadt, sehnte sich nach Ruhe und Natur, wohnt jetzt auf einem Hausboot am Wasser.
**Anja (Surflehrerin):** war Bürokauffrau, fühlte sich eingesperrt, gründete eine Surfschule und kündigte; ihre finanzielle Situation ist jetzt unsicherer.
**Marcel (Unternehmensberater):** machte schnell Karriere, hatte einen Unfall als Wendepunkt, nahm ein Jahr Pause und meditierte, sagt jetzt auch mal „Nein".`;

const CTX_MIG = `**Zwischen den Kulturen**

**William (67):** lebt in den USA und erforscht seine Familiengeschichte; sein Urgroßvater emigrierte 1893.
**Zeliha (49):** in Deutschland geboren; ihre Eltern kamen als Gastarbeiter.
**Jaro (33):** floh 1994 vor dem Krieg aus Bosnien; kehrte nach dem Krieg zurück.
**Ruth (80):** floh 1943 vor den Nationalsozialisten nach Israel.
**Oksana (36):** kam als Spätaussiedlerin aus Russland nach Deutschland.
**Ronny (38):** hat Fernweh, lebte in vielen Ländern, ließ sich in Thailand nieder.`;

const CTX_ESS = `**Welcher Typ sind Sie beim Essen?**

**Der Genießer:** träumt von einem 6-Gänge-Menü; Qualität und Genuss sind wichtig.
**Der Frustesser:** isst besonders viel, wenn er gestresst, müde oder traurig ist.
**Der Zweckesser:** Essen ist egal – Hauptsache satt; erledigt es am liebsten nebenbei.
**Der Gesundesser:** kontrolliert genau Kalorien und Nährstoffe, ernährt sich sehr bewusst.`;

const CTX_LENA = `**Extrem unter Kontrolle – Lena auf Expedition**

Lena klettert in 4000 Metern Höhe. Die Kälte ist beißend, ihr Herz-Kreislauf-System arbeitet auf Hochtouren. Der Pfad ist steil und glitschig; Griffkraft, Koordination und Gleichgewichtssinn entscheiden über Sicherheit. Als ein Windstoß sie fast aus dem Gleichgewicht bringt, kontrolliert sie mit Angstmanagement ihre mentale Stärke. Ihre Ernährung hat sie genau geplant: Kohlenhydrate geben Energie, Proteine helfen bei der Regeneration, Mineralien und Elektrolyte verhindern Krämpfe. Mit Disziplin erreicht sie schließlich den Gipfel.`;

const TESTS = [
  {
    title: "Das Leben neu gestalten – Vielfalt B2.1", exTitle: "Test: Veränderungen – Leseverstehen",
    context: CTX_LEBEN, items: ["Jakob", "Anja", "Marcel"],
    Q: [
      ["Wer wohnt heute auf einem Hausboot am Wasser?", 0],
      ["Wer war früher Bürokauffrau und gründete eine Surfschule?", 1],
      ["Bei wem war ein Unfall der entscheidende Wendepunkt?", 2],
      ["Wer nahm ein Jahr Pause und begann zu meditieren?", 2],
      ["Wessen finanzielle Situation ist heute unsicherer?", 1],
      ["Wer sehnte sich nach Ruhe und Natur?", 0],
    ],
  },
  {
    title: "Migration", exTitle: "Test: Migration – Leseverstehen",
    context: CTX_MIG, items: ["William", "Zeliha", "Jaro", "Ruth", "Oksana", "Ronny"],
    Q: [
      ["Wer erforscht in den USA seine Familiengeschichte?", 0],
      ["Wessen Eltern kamen als Gastarbeiter nach Deutschland?", 1],
      ["Wer floh 1994 vor dem Krieg aus Bosnien?", 2],
      ["Wer floh 1943 vor den Nationalsozialisten nach Israel?", 3],
      ["Wer kam als Spätaussiedlerin aus Russland?", 4],
      ["Wer hat Fernweh und lebt jetzt in Thailand?", 5],
    ],
  },
  {
    title: "Alles unter Kontrolle? – Ernährung", exTitle: "Test: Esstypen – Leseverstehen",
    context: CTX_ESS, items: ["Der Genießer", "Der Frustesser", "Der Zweckesser", "Der Gesundesser"],
    Q: [
      ["Wer isst besonders viel, wenn er gestresst oder traurig ist?", 1],
      ["Für wen sind Qualität und Genuss beim Essen wichtig?", 0],
      ["Wem ist egal, was er isst – Hauptsache satt?", 2],
      ["Wer kontrolliert genau Kalorien und Nährstoffe?", 3],
      ["Wer träumt von einem 6-Gänge-Menü?", 0],
      ["Wer erledigt das Essen am liebsten nebenbei?", 2],
    ],
  },
  {
    title: "Extrem unter Kontrolle – Lena auf Expedition", exTitle: "Test: Lena – Leseverstehen",
    context: CTX_LENA, items: ["richtig", "falsch"],
    Q: [
      ["Lena klettert in großer Höhe (4000 Meter).", 0],
      ["Das Wetter auf der Expedition ist warm.", 1],
      ["Lena hat ihre Ernährung für den Aufstieg genau geplant.", 0],
      ["Kohlenhydrate geben ihr Energie für den Aufstieg.", 0],
      ["Lena hatte während der Expedition überhaupt keine Angst.", 1],
      ["Am Ende erreicht Lena den Gipfel.", 0],
    ],
  },
];

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b2-1").single();
for (const T of TESTS) {
  const { data: l } = await sb.from("lessons").select("id").eq("course_id", CID).eq("title", T.title).maybeSingle();
  if (!l) { console.error(`✗ "${T.title}" ne postoji`); continue; }
  console.log(`~ "${T.title}": ${T.Q.length} pit.`);
  if (!APPLY) continue;
  await sb.from("exercises").delete().eq("lesson_id", l.id).eq("title", T.exTitle);
  const { data: ex } = await sb.from("exercises").insert({ lesson_id: l.id, title: T.exTitle, exercise_type: "quiz", order_index: 0 }).select("id").single();
  let i = 0;
  for (const [q, c] of T.Q) {
    const ctitle = (T.context.match(/\*\*(.+?)\*\*/) || [, "Lesetext"])[1];
    await sb.from("exercise_questions").insert({ exercise_id: ex.id, question: q, options: { type: "quiz", items: T.items, context: { type: "text", title: ctitle, content: T.context } }, correct_answer: String(c), question_type: "quiz", order_index: i++ });
  }
}
console.log(APPLY ? "✓ Gotovo (testovi M1+M3)" : "[DRY] --apply za upis.");
