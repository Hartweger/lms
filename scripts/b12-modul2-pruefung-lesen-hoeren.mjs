/** B1.2 Modul 2 — nova Prüfung lekcija: Lesen (C3 #18, situacije↔anleitung) + Hören (E2 #23, tekst; audio čeka).
 *  Transkribovano tačno iz sveske. Dry-run podrazumevano; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const LESSON_TITLE = "Prüfung - Lesen und Hören";
const QUIZ_TITLE = "Welche Anleitung passt?";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: existing } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", LESSON_TITLE).maybeSingle();
if (existing) { console.log("⚠️ Lekcija već postoji:", existing.id, "— prekidam."); process.exit(1); }

const situationen = "**Situationen**\n\n" +
  "**1.** Maria T. macht ein Praktikum in einem Transportunternehmen und möchte die Telefonnummer einer Kollegin in ihrem Handy speichern.\n" +
  "**2.** Rahim G. möchte eine App zum Deutschlernen auf sein Smartphone laden.\n" +
  "**3.** Jakob W. beschließt, Filme im Internet zu kaufen und auf sein TV-Gerät zu laden.\n" +
  "**4.** Nabeel K. will seine Lampen von unterwegs ein- und ausschalten. Dafür muss er sie mit einer App und dem WLAN verbinden.\n" +
  "**5.** Despina P. möchte eine virtuelle Visitenkarte erstellen, um einem Bekannten ihren Namen und ihre E-Mail-Adresse per Handy zu schicken.";

const anleitungen = "**Bedienungsanleitungen**\n\n" +
  "**A** Stecken Sie das Ladegerät in eine Steckdose. Verbinden Sie dann das Ladegerät und Ihr Telefon mit dem USB-Kabel. Während Ihr Telefon lädt, sehen Sie auf dem Bildschirm ein Symbol für Akku laden. Wenn Ihr Telefon geladen ist, trennen Sie es vom USB-Kabel.\n\n" +
  "**B** Wenn Sie einen neuen Kontakt erstellen möchten, wählen Sie in der Liste Kontakte aus. Tippen Sie dann die Informationen ein. Um den Kontakt zu speichern, tippen Sie auf Speichern.\n\n" +
  "**C** Stecken Sie ein LAN-Kabel in den LAN-Anschluss Ihres Geräts. Wählen Sie die Menü-Taste, die Netzwerk-Taste und die Taste Netzwerk einstellen. Drücken Sie jetzt auf Starten. Nach kurzer Zeit ist Ihr Fernseher mit dem Internet verbunden.\n\n" +
  "**D** Wenn Ihr Gerät nicht mehr reagiert, schließen Sie die App und öffnen Sie sie noch einmal. Wenn das nicht funktioniert, schalten Sie das Gerät aus. Zum Ausschalten drücken Sie den Ein-/Aus-Knopf. Halten Sie den Knopf so lange gedrückt, bis Ihr Gerät ausgeschaltet ist. Schalten Sie Ihr Gerät dann wieder ein.\n\n" +
  "**E** Wählen Sie in der Liste Kontakte aus. Wählen Sie oben in der Kontaktliste Ihren Namen und dann das Symbol mit dem Bleistift aus. Geben Sie Ihre persönlichen Daten ein und tippen Sie anschließend auf Speichern. Nun können Sie Ihre Kontaktdaten versenden oder für andere freigeben.\n\n" +
  "**F** Tippen Sie auf das Wecker-Symbol. Wählen Sie aus, zu welcher Uhrzeit und an welchen Tagen Ihr Gerät Sie wecken soll. Wählen Sie auch aus, wie Ihr Gerät klingeln soll. Tippen Sie dann auf Speichern.\n\n" +
  "**G** Zuerst öffnen Sie den Shop. Dann tippen Sie bei Suche den Namen der App ein. Wählen Sie die gewünschte App aus. Tippen Sie auf Öffnen und anschließend auf Installieren. Wenn die App etwas kostet, tippen Sie auf den Preis. Machen Sie dann weiter wie beschrieben.";

const hoerenIntro = "## Hören\n\nSie hören eine Diskussion und bearbeiten dazu acht Aufgaben. Wer sagt was? Kreuzen Sie an. Sie hören die Diskussion zweimal.\n\n*Der Radiomoderator der Sendung „Eltern diskutieren mit Eltern\" diskutiert mit Annette Karl und Thomas Oehler zum Thema „Smartphones für Kinder - gut oder schlecht?\".*";

const hoerenAussagen = "**Wer sagt was? (Moderator / Frau Karl / Herr Oehler)**\n\n" +
  "**1.** Smartphones gehören inzwischen zum Alltag wie Fahrräder auch. *(Beispiel: Herr Oehler)*\n" +
  "**2.** Smartphones werden erst für Kinder ab zehn Jahren empfohlen.\n" +
  "**3.** Wer nicht lesen und schreiben kann, braucht kein Smartphone.\n" +
  "**4.** Es ist gut, wenn sich Eltern und Kinder immer erreichen können.\n" +
  "**5.** Wie oft das Smartphone genutzt werden darf, entscheiden die Eltern.\n" +
  "**6.** Kinder verbringen täglich mehrere Stunden mit ihrem Smartphone.\n" +
  "**7.** Durch Smartphones können gefährliche Situationen entstehen.\n" +
  "**8.** Bestimmte Apps können Smartphones für Kinder sicherer machen.\n" +
  "**9.** Kinder dürfen auch Dinge ohne das Wissen ihrer Eltern tun.";

const sections = [
  { type: "badge", module: "Modul 2 · Bildung & Gefühle", pruefung: true },
  { type: "text", style: "uebung", content: "## Lesen\n\nLesen Sie die Situationen 1 bis 5 und die Bedienungsanleitungen A bis G. Finden Sie für jede Situation die passende Anleitung. Für eine Situation gibt es keine Anleitung. Schreiben Sie in diesem Fall ein **X**." },
  { type: "text", style: "default", content: situationen },
  { type: "text", style: "default", content: anleitungen },
  { type: "exercise", title: QUIZ_TITLE },
  { type: "text", style: "uebung", content: hoerenIntro },
  { type: "text", style: "default", content: hoerenAussagen },
  { type: "text", style: "info", content: "🎧 *Audio snimak i interaktivno označavanje (ko šta kaže) dodajemo čim stigne mp3 + rešenja.*" },
];

// Lesen rešenja: A=0 B=1 C=2 D=3 E=4 F=5 G=6 X=7
const OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "X (keine Anleitung passt)"];
const Q = [
  { q: "1. Maria T. macht ein Praktikum in einem Transportunternehmen und möchte die Telefonnummer einer Kollegin in ihrem Handy speichern.", a: "1", e: "Lösung: B - neuen Kontakt erstellen und speichern." },
  { q: "2. Rahim G. möchte eine App zum Deutschlernen auf sein Smartphone laden.", a: "6", e: "Lösung: G - App im Shop suchen und installieren." },
  { q: "3. Jakob W. beschließt, Filme im Internet zu kaufen und auf sein TV-Gerät zu laden.", a: "2", e: "Lösung: C - den Fernseher mit dem Internet verbinden." },
  { q: "4. Nabeel K. will seine Lampen von unterwegs ein- und ausschalten. Dafür muss er sie mit einer App und dem WLAN verbinden.", a: "7", e: "Lösung: X - keine Anleitung passt." },
  { q: "5. Despina P. möchte eine virtuelle Visitenkarte erstellen, um einem Bekannten ihren Namen und ihre E-Mail-Adresse per Handy zu schicken.", a: "4", e: "Lösung: E - eigene Kontaktdaten eingeben und versenden/freigeben." },
];

console.log("=== NOVA LEKCIJA ===", LESSON_TITLE);
console.log("Sekcije:", sections.map((s) => s.type).join(", "));
console.log("Lesen quiz:", QUIZ_TITLE, "(5 pitanja)");
Q.forEach((x) => console.log(`   ${x.q.slice(0, 30)}...  → ${OPTIONS[parseInt(x.a)]}`));
console.log("Hören: tekst + 9 tvrdnji (audio/rešenja čekaju)");

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

// insert + smesti odmah posle "Als ob - Konjunktiv II"
const { data: ins, error: e1 } = await sb.from("lessons").insert({
  course_id: course.id, title: LESSON_TITLE, lesson_type: "text", order_index: 9999, content: "", sections,
}).select("id").single();
if (e1) { console.error("insert lesson:", e1.message); process.exit(1); }
const newId = ins.id;

const { data: all } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
const rest = all.filter((l) => l.id !== newId);
const ai = rest.findIndex((l) => l.title === "Als ob - Konjunktiv II");
const seq = [];
for (let i = 0; i < rest.length; i++) { seq.push(rest[i].id); if (i === ai) seq.push(newId); }
for (let i = 0; i < seq.length; i++) await sb.from("lessons").update({ order_index: i }).eq("id", seq[i]);
console.log(`Lekcija ubačena posle "Als ob" (id=${newId}).`);

const { data: ex, error: e2 } = await sb.from("exercises").insert({
  lesson_id: newId, title: QUIZ_TITLE, exercise_type: "quiz", order_index: 1,
}).select("id").single();
if (e2) { console.error("insert quiz ex:", e2.message); process.exit(1); }

let oi = 1;
for (const x of Q) {
  const { error } = await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: x.q, question_type: "quiz", correct_answer: x.a,
    explanation: x.e, order_index: oi++, options: { type: "quiz", items: OPTIONS },
  });
  if (error) { console.error("insert q:", error.message); process.exit(1); }
}
console.log("\nGOTOVO ✓  Lesen Prüfung (5 pitanja) + Hören tekst kreirani.");
