// B1.2 — Faza B: dodaj Lesen tekst + pitanja u 4 nove tematske lekcije (#25–28).
// Ubacuje pre završne „AI prevod" napomene. Idempotentno (preskače ako Lesen već postoji).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESEN = {
  "Familie, Generationen und Lebensformen": {
    text: "## Lesen: Familie heute\n\nDie Familie hat sich in den letzten Jahrzehnten stark verändert. Früher lebten oft mehrere Generationen unter einem Dach: Großeltern, Eltern und Kinder. Heute ist das seltener. Viele junge Menschen wohnen in einer Wohngemeinschaft, andere leben allein oder als Paar ohne Kinder. Auch die Zahl der Alleinerziehenden steigt. In vielen Familien teilen sich Mann und Frau die Hausarbeit und die Kindererziehung. Trotzdem bleibt für die meisten Menschen die Familie sehr wichtig – sie gibt Sicherheit und Unterstützung. Wichtig ist heute vor allem, verschiedene Lebensformen zu respektieren.",
    q: [
      { question: "Früher lebten mehrere Generationen oft zusammen.", answer: "Richtig – früher lebten Großeltern, Eltern und Kinder unter einem Dach." },
      { question: "Heute teilen sich Partner nie die Hausarbeit.", answer: "Falsch – in vielen Familien teilen sie sich Hausarbeit und Kindererziehung." },
      { question: "Familie ist den meisten Menschen heute unwichtig.", answer: "Falsch – sie bleibt sehr wichtig (Sicherheit und Unterstützung)." },
    ],
  },
  "Glück, Erfolg und Lebensziele": {
    text: "## Lesen: Was macht uns glücklich?\n\nWas bedeutet Glück? Für viele Menschen heißt Glück, gesund zu sein und gute Beziehungen zu haben. Geld spielt natürlich auch eine Rolle, aber Studien zeigen: Mehr Geld macht nicht automatisch glücklicher. Wichtiger sind oft kleine Dinge im Alltag – Zeit mit Freunden, ein schönes Hobby oder ein Ziel, das man erreichen möchte. Erfolg im Beruf ist für viele ein wichtiges Lebensziel. Doch Erfolg allein reicht nicht: Wer mit sich selbst zufrieden ist, lebt meistens glücklicher. Am Ende muss jeder für sich entscheiden, was im Leben wirklich zählt.",
    q: [
      { question: "Mehr Geld macht laut Studien automatisch glücklicher.", answer: "Falsch – mehr Geld macht nicht automatisch glücklicher." },
      { question: "Gute Beziehungen sind für viele wichtig für das Glück.", answer: "Richtig – Gesundheit und gute Beziehungen sind für viele zentral." },
      { question: "Wer mit sich selbst zufrieden ist, lebt meistens glücklicher.", answer: "Richtig – das steht am Ende des Textes." },
    ],
  },
  "Ehrenamt und gesellschaftliches Engagement": {
    text: "## Lesen: Ehrenamt in Deutschland\n\nIn Deutschland engagieren sich Millionen Menschen ehrenamtlich. Das bedeutet: Sie arbeiten freiwillig und ohne Bezahlung für andere. Manche helfen im Sportverein, andere bei der Feuerwehr, in der Flüchtlingshilfe oder im Umweltschutz. Besonders am Wochenende nehmen viele an Projekten teil. Das Ehrenamt ist wichtig für die Gesellschaft: Ohne diese freiwillige Arbeit würden viele Aufgaben liegen bleiben. Auch für die Helfer selbst hat es Vorteile – sie lernen neue Menschen kennen und tun etwas Sinnvolles. Experten meinen: Junge Menschen sollten sich noch stärker engagieren.",
    q: [
      { question: "Ehrenamtliche Arbeit wird gut bezahlt.", answer: "Falsch – man arbeitet freiwillig und ohne Bezahlung." },
      { question: "Das Ehrenamt ist wichtig für die Gesellschaft.", answer: "Richtig – ohne diese Arbeit würden viele Aufgaben liegen bleiben." },
      { question: "Auch die Helfer selbst haben Vorteile vom Ehrenamt.", answer: "Richtig – sie lernen Menschen kennen und tun etwas Sinnvolles." },
    ],
  },
  "Politik, Rechte und Pflichten": {
    text: "## Lesen: Rechte und Pflichten\n\nIn einer Demokratie hat jeder Bürger Rechte und Pflichten. Zu den wichtigsten Rechten gehört das Wahlrecht: Alle Bürger dürfen bei den Wahlen ihre Stimme abgeben und so die Regierung mitbestimmen. Gleichzeitig haben alle Pflichten – zum Beispiel müssen sie die Gesetze einhalten und Steuern zahlen. Wichtig ist auch, sich über politische Themen zu informieren, bevor man wählt. Der Staat hat ebenfalls Aufgaben: Er unterstützt zum Beispiel Schulen und Bildungsprogramme. Eine Demokratie funktioniert nur, wenn viele Menschen mitmachen und Verantwortung übernehmen.",
    q: [
      { question: "Bei den Wahlen dürfen die Bürger die Regierung mitbestimmen.", answer: "Richtig – das Wahlrecht erlaubt, die Stimme abzugeben." },
      { question: "Bürger haben nur Rechte, keine Pflichten.", answer: "Falsch – sie müssen z. B. Gesetze einhalten und Steuern zahlen." },
      { question: "Der Staat unterstützt Schulen und Bildungsprogramme.", answer: "Richtig – das ist eine Aufgabe des Staates." },
    ],
  },
};

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: lessons } = await sb.from("lessons").select("id, order_index, title, sections").eq("course_id", course.id);

for (const l of lessons) {
  const def = LESEN[l.title];
  if (!def) continue;
  const sections = JSON.parse(JSON.stringify(l.sections || []));
  if (sections.some((s) => (s.content || "").includes("## Lesen:"))) {
    console.log(`#${l.order_index} ${l.title}: Lesen već postoji — preskačem`);
    continue;
  }
  const lesenSections = [
    { type: "text", style: "beispiele", content: def.text },
    { type: "spoiler", title: "Pitanja za čitanje – Richtig oder Falsch?", items: def.q },
  ];
  const closingIdx = sections.findIndex((s) => (s.content || "").includes("Uvežbaj prevod"));
  const at = closingIdx > -1 ? closingIdx : sections.length;
  sections.splice(at, 0, ...lesenSections);
  console.log(`#${l.order_index} ${l.title}: + Lesen tekst + ${def.q.length} pitanja (na poz. ${at})`);
  if (APPLY) {
    const { error } = await sb.from("lessons").update({ sections }).eq("id", l.id);
    console.log(error ? "   ✗ " + error.message : "   ✓ upisano");
  }
}
if (!APPLY) console.log("\nDry-run — pokreni sa --apply za upis.");
