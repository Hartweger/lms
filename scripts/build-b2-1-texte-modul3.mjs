// B2.1 — Lesetexte MODUL 3 (L8 Esstypen → Ernährung; L9 innere Uhr → Tagesrhythmus).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3729f3f5-2582-44ff-bb10-c4cc2ab5676b";
const MARK = "## 📖";

const L8 = `${MARK} Lesetext: Welcher Typ sind Sie beim Essen?

„Man ist, was man isst", sagt ein Sprichwort, und man könnte ergänzen: „Man ist, wie man isst." Nur wer seine Essgewohnheiten kennt, kann sie verändern. Finden Sie heraus, zu welchem Esstyp Sie gehören.

**Der Genießer:** Ein 6-Gänge-Menü ist Ihr Traum! Sie widmen Ihren Mahlzeiten nicht nur Zeit, sondern auch viel Aufmerksamkeit. Essen heißt für Sie genießen. Dabei spielt die Qualität des Essens eine große Rolle. Sie sind neugierig auf neue Rezepte und Restaurants – das sind Ihre Lieblingsthemen!

**Der Frustesser:** Wenn Sie gestresst, müde, wütend oder traurig sind, essen Sie besonders viel – manchmal eine ganze Tafel Schokolade! Sie glauben, dass Sie sich danach besser fühlen. Mit Essen können Sie sich in einer Krise kurzfristig trösten.

**Der Zweckesser:** Essen ist Ihnen nicht besonders wichtig und macht Ihnen auch keinen Spaß. Am liebsten ist es Ihnen, wenn Sie die Nahrungsaufnahme nebenbei erledigen können. Was Sie dann essen, ist Ihnen eigentlich egal. Ein Burger oder Pommes? Hauptsache, Sie werden satt.

**Der Gesundesser:** Sie achten streng darauf, sich bewusst zu ernähren, und wissen genau, was Ihrem Körper guttut. Kalorien und Nährstoffe: Sie haben beim Essen alles unter Kontrolle. Sie können kaum akzeptieren, dass andere Menschen nicht so viel Obst und Gemüse essen.

*(Quelle: Vielfalt B2.1, Hueber Verlag)*`;

const L9 = `${MARK} Lesetext: Nobelpreis für die „innere Uhr"

Der Nobelpreis für Medizin ging 2017 an Jeffrey Hall, Michael Rosbash und Michael Young aus den USA. Sie fanden heraus, dass der menschliche Körper genetisch auf einen 24-Stunden-Rhythmus eingestellt ist. Diese innere Uhr hat entscheidenden Einfluss auf den menschlichen Körper: Sie bestimmt, wann jemand aufwacht oder müde wird.

Doch nicht für jeden Menschen ist der 24-Stunden-Rhythmus gleich. Das ist auch der Grund, warum es unterschiedliche Schlaftypen gibt: Frühaufsteher, Langschläfer und – dazwischen – die Normaltypen. Je nach Typ sind Menschen zu unterschiedlichen Tageszeiten besonders leistungsfähig.

**Tageslicht und die innere Uhr:** Der Tagesrhythmus liegt in den Genen. Bei einigen Menschen ist er zeitlich etwas versetzt, was zu Problemen im Alltag führen kann. Helfen kann der gezielte Einsatz von Licht: Morgens sollte man viel helles, blaues Licht aufnehmen – es signalisiert dem Gehirn, dass es wach werden soll. Abends hilft schwaches, rötliches Licht dabei, müde zu werden. Wer nachts arbeitet oder mit starken Zeitverschiebungen leben muss (zum Beispiel als Flugpersonal auf langen Flügen), lebt auf Dauer nicht gesund.

*(Quelle: Vielfalt B2.1, Hueber Verlag)*`;

const ITEMS = [
  ["Alles unter Kontrolle? – Ernährung", L8],
  ["So tickt unsere innere Uhr! – Tagesrhythmus", L9],
];

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b2-1").single();
for (const [title, text] of ITEMS) {
  const { data: lesson } = await sb.from("lessons").select("id,sections").eq("course_id", CID).eq("title", title).maybeSingle();
  if (!lesson) { console.error(`✗ "${title}" ne postoji`); continue; }
  const existing = Array.isArray(lesson.sections) ? lesson.sections : [];
  const had = existing.some((s) => s.type === "text" && typeof s.content === "string" && s.content.startsWith(MARK));
  console.log(`${had ? "~" : "+"} "${title}": Lesetext ${had ? "(zamena)" : "(dodavanje)"} (${text.length} zn)`);
  if (!APPLY) continue;
  const base = existing.filter((s) => !(s.type === "text" && typeof s.content === "string" && s.content.startsWith(MARK)));
  // ubaci posle badge/videa, pre gramatike(📘)/flashcard/vocabulary
  let idx = base.findIndex((s) => s.type === "flashcard" || s.type === "vocabulary" || (s.type === "text" && typeof s.content === "string" && s.content.startsWith("## 📘")));
  if (idx === -1) idx = base.length;
  base.splice(idx, 0, { type: "text", content: text, style: "beispiele" });
  await sb.from("lessons").update({ sections: base }).eq("id", lesson.id);
}
console.log(APPLY ? "✓ Gotovo (Modul 3 Lesetexte)" : "[DRY] --apply za upis.");
