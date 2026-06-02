// C1 Hörverstehen test → lekcija "HÖREN C1". 4 dela, 30 zadataka. Audio mp3 → Supabase.
// Dry-run default; --apply. Idempotentno.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const EX_TITLE = "Hörverstehen — Modelltest C1";
const WP = "https://www.hartweger.rs/wp-content/uploads/2025/09/";
const BUCKET = "blog-media";

async function mp3ToSupabase(file) {
  const res = await fetch(WP + file);
  if (!res.ok) throw new Error(`download ${res.status}: ${file}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const sp = `kursevi/polozi-goethe-c1/${file}`;
  const { error } = await sb.storage.from(BUCKET).upload(sp, buf, { contentType: "audio/mpeg", upsert: true });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(sp).data.publicUrl;
}

const PODCAST = ["a) Podcast 1 – O-Ton aus dem Paradies", "b) Podcast 2 – Tausende Schritte", "c) Podcast 3 – Nachhaltiger Tourismus"];
const STIMMT = ["a) stimmt", "b) stimmt nicht", "c) dazu wird nichts gesagt"];
const q = (n, txt, head = "") => `${head}<strong>${n}.</strong> ${txt}`;
const H1 = "<strong>Hörverstehen Teil 1</strong> — Radiosendung über Podcasts (1×). Zu welchem Podcast passt die Aussage? (Beispiel 0: Podcast 2)<br><br>";
const H2 = "<strong>Teil 2</strong> — Radiointerview (2×). stimmt / stimmt nicht / dazu wird nichts gesagt.<br><br>";
const H3 = "<strong>Teil 3</strong> — Gespräch über Fachkräftemangel (in Abschnitten). Wähle die richtige Lösung.<br><br>";
const H4 = "<strong>Teil 4</strong> — Vortrag über die Pockenimpfung (2×). Wähle die richtige Lösung.<br><br>";

// audio se popunjava posle uploada
const QS = [
  // Teil 1 (audio 1) a=0 b=1 c=2
  { p: 1, q: q(1, "Der Podcast wirft einen Blick auf die europäische Alltagsgeschichte.", H1), items: PODCAST, c: "2" },
  { p: 1, q: q(2, "Die Bedeutungslosigkeit des Menschen gegenüber der Natur wird geschildert."), items: PODCAST, c: "1" },
  { p: 1, q: q(3, "Der Podcast erzählt die Geschichte von Urlaubsparadiesen."), items: PODCAST, c: "2" },
  { p: 1, q: q(4, "Der Podcast enthält die Schilderungen vieler Menschen."), items: PODCAST, c: "0" },
  { p: 1, q: q(5, "Der Podcast setzt sich mit den Auswirkungen des Breitentourismus auseinander."), items: PODCAST, c: "2" },
  { p: 1, q: q(6, "Viele Blickwinkel auf ein Traumziel zeigen die Zerbrechlichkeit der Welt."), items: PODCAST, c: "0" },
  // Teil 2 (audio 2)
  { p: 2, q: q(7, "Dr. Frentzen zieht Pro- und Contra-Argumente beim Thema obligatorischer Sozialdienst.", H2), items: STIMMT, c: "0" },
  { p: 2, q: q(8, "Im Grundgesetz gibt es schwer zu überwindende Hindernisse für obligatorische Sozialdienste."), items: STIMMT, c: "0" },
  { p: 2, q: q(9, "Der Gesetzgeber möchte das Grundgesetz in Kürze ändern."), items: STIMMT, c: "2" },
  { p: 2, q: q(10, "Der Moderator glaubt, dass der Wehrdienst niemals hätte abgeschafft werden sollen."), items: STIMMT, c: "1" },
  { p: 2, q: q(11, "Dr. Frentzen sagt, dass verpflichtende soziale Einsätze überzeugende Gründe haben müssen."), items: STIMMT, c: "0" },
  { p: 2, q: q(12, "Dr. Frentzen gibt einen vollständigen Überblick über geeignete Berufsgruppen."), items: STIMMT, c: "1" },
  { p: 2, q: q(13, "Das soziale Jahr sollte auch außerhalb Deutschlands ermöglicht werden."), items: STIMMT, c: "0" },
  { p: 2, q: q(14, "Ein soziales Jahr könnte als Orientierung für die spätere Berufswahl dienen."), items: STIMMT, c: "0" },
  { p: 2, q: q(15, "Viele Menschen mit Behinderung interessieren sich für ihre Arbeit und sind hochmotiviert."), items: STIMMT, c: "2" },
  // Teil 3 (audio 3) a=0 b=1 c=2
  { p: 3, q: q(16, "Der Fachkräftemangel könnte dazu führen, dass …", H3), items: ["a) im Gesundheitswesen zu wenig Personal zur Verfügung steht.", "b) Lastwagenfahrer nicht mehr genügend Ware bekommen.", "c) viele Supermärkte aus Mangel an Waren schließen."], c: "0" },
  { p: 3, q: q(17, "Herr Osterholz …"), items: ["a) beklagt den Mangel an Fachkräften mit Schwerpunkt Naturwissenschaften.", "b) erwähnt die Klage der Unternehmen über fehlende Fachkräfte im MINT-Bereich.", "c) sieht das Hauptproblem bei klassischen Ausbildungsberufen."], c: "1" },
  { p: 3, q: q(18, "Studierende der MINT-Fächer …"), items: ["a) können den demografischen Wandel nicht ausgleichen.", "b) können die Aufgaben älterer Arbeitskräfte schnell übernehmen.", "c) sollen Fachkräfte schon während des Studiums unterstützen."], c: "0" },
  { p: 3, q: q(19, "Frau Ebner-Perotti …"), items: ["a) glaubt nicht, dass es nur eine richtige Lösung gibt.", "b) sieht in der Zuwanderung den besten Lösungsansatz.", "c) spricht sich gegen Entscheidungen aus der Politik aus."], c: "0" },
  { p: 3, q: q(20, "Herr Osterholz …"), items: ["a) erkennt im Spracherwerb eine zwingende Voraussetzung.", "b) möchte Zuwanderer nur mit ausreichenden Sprachkenntnissen einreisen lassen.", "c) sieht in der Zuwanderung eine unproblematische Lösung."], c: "0" },
  { p: 3, q: q(21, "Frau Ebner-Perotti …"), items: ["a) befürchtet sinkende Löhne durch billige Arbeitskräfte.", "b) fordert, die Abwerbung junger Menschen zu stoppen.", "c) sieht die Abwanderung von Fachkräften problematisch."], c: "2" },
  { p: 3, q: q(22, "Herr Osterholz warnt vor …"), items: ["a) steigenden Lohnkosten.", "b) Streit mit südeuropäischen Ländern.", "c) zu hohen Qualitätsstandards bei der Ausbildung."], c: "0" },
  { p: 3, q: q(23, "Für Frau Ebner-Perotti sind …"), items: ["a) faire Bezahlung und passende Sozialleistungen wichtig.", "b) Forschungen zur Vereinbarkeit von Familie und Beruf wünschenswert.", "c) kostenlose Kinderbetreuungsangebote in den Betrieben notwendig."], c: "0" },
  // Teil 4 (audio 4) a=0 b=1 c=2
  { p: 4, q: q(24, "Was weiß man über die Geschichte der Pocken?", H4), items: ["a) Die Krankheit gibt es so lange wie die Menschheit.", "b) Sie wird schon seit Jahrhunderten erforscht.", "c) Schon vor Jahrhunderten gab es in China Impfmaßnahmen."], c: "2" },
  { p: 4, q: q(25, "Bei der Vakzination …"), items: ["a) entsteht ein zweifacher Impfschutz gegen die Pocken.", "b) schützt man sich durch Infektion mit einem harmlosen Erreger.", "c) wird die Gefahr einer Kuhpocken-Infektion verringert."], c: "1" },
  { p: 4, q: q(26, "Im 18. Jahrhundert hatten mehrere Ärzte …"), items: ["a) die Immunisierung durch eine Infektion mit Kuhpocken erkannt.", "b) einen Impfstoff entwickelt und nach dem Wort für „Kuh“ benannt.", "c) Kühe zum Schutz vor Kuhpocken geimpft."], c: "0" },
  { p: 4, q: q(27, "1874 wurde im Deutschen Reich die Impfpflicht eingeführt, weil …"), items: ["a) andere Staaten sie bereits erfolgreich getestet hatten.", "b) Bayern sie schon 70 Jahre früher eingeführt hatte.", "c) es kurz zuvor zu einer Pocken-Epidemie gekommen war."], c: "2" },
  { p: 4, q: q(28, "Welche Argumente brachten Impfgegner vor?"), items: ["a) Die Impfung ist ein Eingriff Gottes in die Natur.", "b) Durch die Impfung kann es zu gesundheitlichen Schäden kommen.", "c) Nach der Impfung verwandeln sich Menschen in Kühe."], c: "1" },
  { p: 4, q: q(29, "Die Aktivitäten der Impfgegner führten dazu, dass …"), items: ["a) die Pockenimpfung als riskanteste Impfung galt.", "b) die Vorteile der Impfung übersehen wurden.", "c) sich weniger Menschen impfen lassen wollten."], c: "2" },
  { p: 4, q: q(30, "Die Pockenerreger …"), items: ["a) sind heute fast ausgerottet.", "b) sind weiterhin für die Erprobung neuer Impfstoffe wichtig.", "c) werden noch heute zu wissenschaftlichen Zwecken gelagert."], c: "2" },
];

const { data: course } = await sb.from("courses").select("id").eq("slug", "polozi-goethe-c1").single();
const { data: lesson } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", "HÖREN C1").single();
console.log(`HÖREN C1 lekcija: ${lesson.id} | pitanja: ${QS.length}`);
if (!APPLY) { console.log("[DRY] dodaj --apply za upis (skida 4 mp3 → Supabase)."); process.exit(0); }

const AUDIO = {};
for (const p of [1, 2, 3, 4]) {
  AUDIO[p] = await mp3ToSupabase(`0${p}_Pruef_Expr_Goethe_C1_Hoeren_${p}.mp3`);
  console.log(`  ✓ audio Teil ${p} → Supabase`);
}

await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", EX_TITLE);
const { data: ex, error: exErr } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: EX_TITLE, exercise_type: "quiz", order_index: 0 }).select("id").single();
if (exErr) { console.log("ERR ex:", exErr.message); process.exit(1); }
let i = 0;
for (const item of QS) {
  const { error } = await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: item.q, options: { type: "quiz", items: item.items },
    correct_answer: item.c, question_type: "quiz", audio_url: AUDIO[item.p], order_index: i++,
  });
  if (error) { console.log("ERR q", i, error.message); process.exit(1); }
}
console.log(`✓ "${EX_TITLE}": ${QS.length} pitanja na HÖREN C1 (audio sa Supabase)`);
