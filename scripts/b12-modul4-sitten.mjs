/** B1.2 Modul 4 — "Andere Sitten und Bräuche": samo tekst (Sally/Mohd/María) + vokabular + kartice IZ teksta.
 *  Transkribovano tačno, bez zadataka. Dry-run; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TITLE = "Andere Sitten und Bräuche";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: ex0 } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", TITLE).maybeSingle();
if (ex0) { console.log("⚠️ Lekcija već postoji:", ex0.id); process.exit(1); }

const sally = "**Sally:** „Ich finde es fantastisch, so viel Urlaub zu haben! Zuerst wusste ich gar nicht, was ich mit den vielen Urlaubstagen anfangen soll. Aber daran gewöhnt man sich natürlich sehr schnell! Mit dem Du und Sie hatte ich anfangs auch so meine Probleme. Es gibt offenbar genaue Regeln, wer wen wann duzen darf. Ich fürchte, das habe ich immer noch nicht 100%ig verstanden. Die Deutschen sind auf jeden Fall viel direkter und sagen immer, was sie denken - ohne Angst, jemanden zu beleidigen. Das ist zwar ehrlich, aber auch nicht besonders diplomatisch. Das kann man als Ausländer schnell missverstehen.\n\nVorbildlich an Deutschland finde ich, dass man hier insgesamt viel Wert auf eine gesunde Life-Work-Balance legt. Denn davon profitieren letzten Endes auch die Unternehmen, weil ihre Mitarbeiter motivierter sind und engagiert arbeiten.\n\nEine Sache fand ich absolut gewöhnungsbedürftig, nämlich die Ladenöffnungszeiten! In den ersten Wochen musste ich abends häufig Fastfood essen, weil ich lange gearbeitet habe und dann regelmäßig den Ladenschluss verpasst hatte.“";

const mohd = "**Mohd:** „Bevor ich hierher kam, hatte ich natürlich schon gehört, dass Deutsche, Österreicher und Schweizer sehr pünktlich sein sollen. Aber das dann im Arbeitsalltag selbst zu erleben, war eine große Umstellung für mich. Nicht nur Termine für Besprechungen und Konferenzen, sondern sogar Verabredungen zum Mittagessen oder zum Kaffee müssen genauestens eingehalten werden. Diese Pünktlichkeit erfordert sehr viel Disziplin. Ich muss mich wirklich jeden Tag aufs Neue bemühen, pünktlich zu Terminen zu erscheinen. Ich denke, der Umgang mit Zeit hängt sehr stark vom Herkunftsland und von der jeweiligen Kultur ab. Es ist sehr schwer, dieses Zeitverständnis, mit dem man aufgewachsen ist, in einem fremden Land abzulegen. Auch die Kleiderordnung war ungewohnt für mich. Bei uns zu Hause herrscht ein tropisches Klima. Da wäre es sehr unpraktisch, in Anzug und Krawatte im Büro zu sitzen, wie es hier üblich ist.“";

const maria = "**María:** „Ich musste mich erst daran gewöhnen, so viel im Voraus zu planen. Alles wird hier ganz genau festgelegt, egal, ob es sich um ein Projekt, ein Mittagessen oder um Urlaub handelt. In meiner Firma gibt es auch für alles Mögliche Regeln, Listen und Formulare. Das erscheint mir etwas übertrieben. In meiner ersten Woche im Büro war ich echt geschockt, weil ich meine Urlaubswünsche für das ganze Jahr eintragen sollte. Wie kann ich denn im Januar schon wissen, ob ich im Oktober vielleicht verreisen will?!\n\nDie Kleiderordnung in der Firma ist so ähnlich wie bei uns. Im Büro trägt man Anzug oder Kostüm. Nur in der Freizeit ist es anders. Die Frauen hier kleiden sich meistens nicht so elegant und sie wirken insgesamt sportlicher. Eine Sache finde ich immer noch ein bisschen merkwürdig: Wenn ich Geburtstag habe oder es etwas anderes zu feiern gibt, dann muss ich das hier im Büro alles selbst organisieren. Bei mir zu Hause ist das umgekehrt, da machen das meine Kollegen für mich. Das finde ich eigentlich viel schöner.“";

// vokabular IZVUČEN iz teksta
const VOC = [
  ["sich gewöhnen an + Akk", "navići se na"],
  ["gewöhnungsbedürftig", "na šta se treba navići"],
  ["beleidigen", "uvrediti"],
  ["missverstehen", "pogrešno razumeti"],
  ["vorbildlich", "uzoran, primeran"],
  ["engagiert", "predan, angažovan"],
  ["die Pünktlichkeit", "tačnost (na vreme)"],
  ["die Umstellung, -en", "prilagođavanje, promena"],
  ["einhalten", "ispoštovati (dogovor, rok)"],
  ["erfordern", "zahtevati, iziskivati"],
  ["sich bemühen", "truditi se"],
  ["das Herkunftsland", "zemlja porekla"],
  ["die Kleiderordnung", "pravila oblačenja (dress code)"],
  ["üblich", "uobičajeno"],
  ["im Voraus", "unapred"],
  ["festlegen", "odrediti, utvrditi"],
  ["übertrieben", "preterano"],
  ["merkwürdig", "čudno"],
];

const sections = [
  { type: "badge", module: "Modul 4", category: "lesen" },
  { type: "text", style: "info", content: "## Andere Sitten und Bräuche\n\nDrei Menschen aus dem Ausland erzählen, was ihnen im Arbeitsalltag in Deutschland, Österreich und der Schweiz aufgefallen ist." },
  { type: "text", style: "default", content: sally },
  { type: "text", style: "default", content: mohd },
  { type: "text", style: "default", content: maria },
  { type: "vocabulary", rows: VOC.map(([de, sr]) => [de, sr]) },
  { type: "flashcard", items: VOC.map(([de, sr]) => ({ front: de, back: sr })) },
];

console.log("=== NOVA LEKCIJA ===", TITLE);
console.log("Sekcije:", sections.map((s) => s.type).join(", "));
console.log("Vokabular/kartice (iz teksta):", VOC.length, "reči");

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

const { data: ins, error: e1 } = await sb.from("lessons").insert({ course_id: course.id, title: TITLE, lesson_type: "text", order_index: 9999, content: "", sections }).select("id").single();
if (e1) { console.error("insert:", e1.message); process.exit(1); }
const LID = ins.id;
// smesti pre "Prüfung - Lesen und Hören (Modul 4)"
const { data: all } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
const rest = all.filter((l) => l.id !== LID);
const pi = rest.findIndex((l) => l.title === "Prüfung - Lesen und Hören (Modul 4)");
const seq = [];
for (let i = 0; i < rest.length; i++) { if (i === pi) seq.push(LID); seq.push(rest[i].id); }
for (let i = 0; i < seq.length; i++) await sb.from("lessons").update({ order_index: i }).eq("id", seq[i]);
console.log(`\nGOTOVO ✓  Lekcija (id=${LID}) u Modulu 4 pre Prüfung. Samo tekst + vokabular + kartice.`);
