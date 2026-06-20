/**
 * Kreira lekciju „Lesen & Schreiben B1 — Bore-out" u kursu Nemački B1.1 (Modul 3).
 * Teil 1: Leseverstehen (Katjina E-Mail + 6 tvrdnji a–f, R/F). Teil 2: Schreiben (zadatak 24).
 * Tekst DOSLOVNO iz udžbenika. R/F izvedeno iz teksta: a R, b F, c R, d R, e F, f F.
 * Privremeni order_index = 102 (sređuje se reorder-om).
 * Run: npx tsx scripts/create-b11-lesen-schreiben-boreout.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [key, ...v] = line.split("=");
  if (key && v.length > 0) process.env[key.trim()] = v.join("=").trim();
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const B11_COURSE = "b8c765b7-c377-4941-a1f9-ebe39372fe4a";
const TITLE = "Lesen & Schreiben B1 — Bore-out";

const EMAIL =
  "**E-Mail senden**\n\n" +
  "Liebe/r …,\n\n" +
  "bestimmt hast Du Dich schon gefragt, warum Du so lange nichts mehr von mir gehört hast. Es gibt einen Grund: Ich habe mein Leben völlig geändert. Mein Job als Büroangestellte hatte mich nämlich krank gemacht. Immer öfter bekam ich Kopfschmerzen oder Magenbeschwerden. Ich schlief schlecht und hatte auf nichts mehr Lust. Jeden Abend, wenn ich nach Hause kam, fühlte ich mich extrem müde und gestresst. Und das, obwohl ich bei der Arbeit mein Soll immer schaffte. Im Gegenteil, ich hatte oft so wenig zu tun, dass ich neben der Arbeit noch private Dinge erledigte. Ich lief von Arzt zu Arzt, aber keiner fand die Ursache für meine gesundheitlichen Probleme. Schließlich ging ich zu einem Psychologen. Er vermutete, dass es Langeweile war, die mich krank machte. Ich war total überrascht, denn jeder weiß ja, dass Stress krank macht. Aber Langeweile? Bore-out nennt man das, hat der Psychologe mir erklärt. Ich konnte es kaum glauben, denn mein sicherer Job bei der Versicherung schien mir immer genau das Richtige für mich zu sein. Ein stressiger Manager-Job oder der anstrengende Beruf einer Krankenschwester, das wäre alles nichts für mich. Ich habe lange nachgedacht und mich schließlich für ein Sabbatjahr, eine Auszeit, entschieden. Jetzt lebe ich auf einem Bauernhof in den Schweizer Bergen und kümmere mich um Schafe und Kühe. Ich habe gelernt, wie man Käse macht, und helfe bei der Feldarbeit. Die körperliche Arbeit gefällt mir. Ob ich das immer machen möchte, weiß ich noch nicht. Aber eins ist sicher: In meine alte Firma gehe ich nicht zurück.\n\n" +
  "Viele Grüße von Katja";

const sections = [
  { type: "badge", module: "Modul 3", category: "lesen" },

  {
    type: "text",
    style: "info",
    content:
      "Ova lekcija ima dva dela: prvo **Leseverstehen** (pročitaj Katjinu mejl i reši tvrdnje *richtig/falsch*), a zatim **Schreiben** (napiši odgovor Katji). Najpre čitanje, pa pisanje.",
  },

  {
    type: "text",
    style: "default",
    content:
      "## Teil 1 · Leseverstehen\n\n**23 — Lesen Sie den Text und wählen Sie. Sind die Aussagen richtig oder falsch?**",
  },
  { type: "text", style: "beispiele", content: EMAIL },

  {
    type: "spoiler",
    title: "Aussagen a–f — richtig oder falsch? (klikni za rešenje)",
    items: [
      { question: "a) Katjas beruflicher Alltag führte zu gesundheitlichen Problemen.\n\nrichtig / falsch?",
        answer: "richtig — „Mein Job als Büroangestellte hatte mich krank gemacht“ (Kopfschmerzen, Magenbeschwerden)." },
      { question: "b) Sie hatte einen sehr stressigen Job.\n\nrichtig / falsch?",
        answer: "falsch — naprotiv, imala je premalo posla; problem je bila dosada (Langeweile / Bore-out)." },
      { question: "c) Langeweile kann die Ursache für Stress und körperliche Beschwerden sein.\n\nrichtig / falsch?",
        answer: "richtig — psiholog: „es war Langeweile, die mich krank machte“ (Bore-out)." },
      { question: "d) Katja macht jetzt ein Jahr Pause von ihrem Job.\n\nrichtig / falsch?",
        answer: "richtig — odlučila se za „ein Sabbatjahr, eine Auszeit“." },
      { question: "e) Sie macht Urlaub in den Bergen und entspannt sich.\n\nrichtig / falsch?",
        answer: "falsch — ne odmara: fizički radi na farmi (Schafe und Kühe, Käse machen, Feldarbeit)." },
      { question: "f) In einem Jahr will sie wieder bei der Versicherung arbeiten.\n\nrichtig / falsch?",
        answer: "falsch — „In meine alte Firma gehe ich nicht zurück.“" },
    ],
  },

  {
    type: "text",
    style: "default",
    content:
      "## Teil 2 · Schreiben\n\n**24 — Schreiben Sie eine Antwort an Katja.**\n\nAntworten Sie Katja in 23 mit einer E-Mail (etwa 80 Wörter). Schreiben Sie dabei etwas zu den drei folgenden Punkten:",
  },
  {
    type: "text",
    style: "uebung",
    content:
      "- **Beschreiben Sie Ihre Arbeit / Ihr Studium:** Fühlen Sie sich oft gestresst? Oder eher gelangweilt?\n- **Wie gefällt Ihnen Katjas Idee eines Sabbatjahrs?** Haben Sie das auch schon einmal gemacht? Oder würden Sie es gern tun?\n- **Was möchten Sie von Katja außerdem wissen?**",
  },
  {
    type: "text",
    style: "info",
    content:
      "Napiši svoj odgovor (oko **80 reči**), obradi sve **tri tačke**, pa ga pošalji profesorki na **info@hartweger.rs** za proveru.",
  },
];

async function main() {
  const { data: existing } = await supabase
    .from("lessons").select("id").eq("course_id", B11_COURSE).eq("title", TITLE).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("lessons").update({ sections }).eq("id", existing.id);
    if (error) { console.error(error); process.exit(1); }
    console.log(`✅ Sadržaj ažuriran (id=${existing.id}).`);
    return;
  }
  const { data, error } = await supabase
    .from("lessons")
    .insert({ course_id: B11_COURSE, title: TITLE, order_index: 102, lesson_type: "text", is_free_preview: false, sections })
    .select("id").single();
  if (error) { console.error("Greška:", error); process.exit(1); }
  console.log(`✅ Kreirana lekcija „${TITLE}"  id=${data.id}  (privremeni order_index=102)`);
}

main();
