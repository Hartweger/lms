// B1 Hörverstehen — TEKSTUALNI test (prave tvrdnje/opcije + audio po delu). Zamenjuje PDF-ključ verziju.
// Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const EX = "Hörverstehen — Modelltest B1";
const PFX = "kursevi/polozi-goethe-b1/";
const pub = (f) => sb.storage.from("blog-media").getPublicUrl(PFX + f).data.publicUrl;
const AUD = {
  1: pub("2_02_Fit_fuer_Zertifikat_B1_Erwachsene_Simulation_Hoeren_1.mp3"),
  2: pub("2_03_Fit_fuer_Zertifikat_B1_Erwachsene_Simulation_Hoeren_2.mp3"),
  3: pub("2_04_Fit_fuer_Zertifikat_B1_Erwachsene_Simulation_Hoeren_3.mp3"),
  4: pub("2_05_Fit_fuer_Zertifikat_B1_Erwachsene_Simulation_Hoeren_4.mp3"),
};
const RF = ["richtig", "falsch"];
const WER = ["Moderatorin", "Frau Herni", "Herr Jandl"];

// [Teil, pitanje, items, correct]
const Q = [
  // Teil 1 — 5 kratka teksta, 2×
  [1, "Text 1 — Radio Südwest bietet aktuelle Informationen.", RF, 0],
  [1, "Text 1 — Die Sendung …", ["kann man nur im Internet empfangen.", "kommt immer montags.", "bietet viele Nachrichten aus der Region."], 2],
  [1, "Text 2 — Sie hören Informationen aus dem Ausland.", RF, 1],
  [1, "Text 2 — Der Ministerpräsident …", ["ist zurückgetreten.", "hat sich selbst noch nicht geäußert.", "möchte zurücktreten."], 1],
  [1, "Text 3 — Sie hören einen Reisebericht.", RF, 1],
  [1, "Text 3 — An der Nordsee …", ["gibt es Sturm und Gewitter.", "regnet es manchmal.", "ist es heiß."], 1],
  [1, "Text 4 — Der Anruf kommt von einem Restaurant.", RF, 1],
  [1, "Text 4 — Herr Malik …", ["muss den Tisch selbst abholen.", "bekommt einen anderen Tisch.", "muss sechs Wochen auf den Tisch warten."], 2],
  [1, "Text 5 — Die Information ist für alle Fluggäste, die nach Österreich wollen.", RF, 0],
  [1, "Text 5 — Die Fluggäste …", ["können sofort einsteigen.", "mit Kindern dürfen zuerst einsteigen.", "sollen in wenigen Minuten zum Flugsteig gehen."], 1],
  // Teil 2 — Stadtführung München (a/b/c)
  [2, "Wie ist das Wetter?", ["bedeckt", "regnerisch", "sonnig und trocken"], 2],
  [2, "Die Führung beginnt …", ["im Rathaus.", "am Marienplatz.", "auf dem Markt."], 1],
  [2, "Was besichtigen die Teilnehmer nach dem Rathaus?", ["Einen Markt.", "Die Oper.", "Ein Theater."], 0],
  [2, "Das Mittagessen …", ["gibt es auf dem Markt.", "gibt es in einem berühmten Restaurant.", "gibt es in der Maximilianstraße."], 1],
  [2, "Am Nachmittag …", ["bleiben die Teilnehmer im Hotel.", "gibt es kein Programm.", "besichtigen sie auch ein Schloss."], 2],
  // Teil 3 — Gespräch Betriebsausflug (R/F)
  [3, "Der Betriebsausflug war ein großer Erfolg.", RF, 0],
  [3, "Helke war nicht zum ersten Mal am Bodensee.", RF, 0],
  [3, "Es gab für alle Fisch.", RF, 1],
  [3, "Helkes Gruppe kam zu spät zum Mittagessen.", RF, 0],
  [3, "Helke musste nach dem Essen einen Vortrag halten.", RF, 1],
  [3, "Das Abendessen fand auf dem Schiff statt.", RF, 1],
  [3, "Helke glaubt, dass die Arbeit im Büro jetzt einfacher wird.", RF, 0],
  // Teil 4 — Diskussion „Fleisch essen?" — Wer sagt was?
  [4, "Alle Lebensmittel werden sehr genau überprüft. — Wer sagt das?", WER, 2],
  [4, "Auch Gemüse kann schädlich sein.", WER, 2],
  [4, "Schwierigkeiten mit Lebensmitteln kann es immer wieder geben.", WER, 1],
  [4, "Die Tiernahrung wird sehr genau kontrolliert.", WER, 2],
  [4, "1990 gab es viele kranke Kühe.", WER, 0],
  [4, "Niemand kann alles 100%ig garantieren.", WER, 2],
  [4, "Die Haltung von Tieren in großer Zahl ist das Problem.", WER, 1],
  [4, "In Österreich werden alle Betriebe überprüft.", WER, 2],
];

const { data: course } = await sb.from("courses").select("id").eq("slug", "polozi-goethe-b1").single();
const { data: lesson } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", "Hörverstehen – Modelltest B1").single();
console.log(`Hören lekcija: ${lesson.id} | pitanja: ${Q.length}`);
if (!APPLY) { console.log("[DRY] --apply (zamenjuje test pravim opcijama, uklanja PDF sekciju)."); process.exit(0); }

await sb.from("lessons").update({ sections: [
  { type: "badge", module: "Hörverstehen B1" },
  { type: "text", style: "info", content: "Modelltest Hören (Goethe-Zertifikat B1), 4 dela / 30 zadataka. Slušaj audio uz svaki deo i izaberi tačan odgovor." },
]}).eq("id", lesson.id);

await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", EX);
const { data: ex } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: EX, exercise_type: "quiz", order_index: 0 }).select("id").single();
let i = 0;
for (const [part, q, items, correct] of Q) {
  await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: `<strong>Aufgabe ${i + 1}</strong> — ${q}`,
    options: { type: "quiz", items }, correct_answer: String(correct), question_type: "quiz",
    audio_url: AUD[part], order_index: i++,
  });
}
console.log(`✓ "${EX}": ${Q.length} pitanja (prave opcije, audio po delu)`);
