// Obogaćuje A2.2 lekciju "Wohin fährt Tim?" iz transkripta videa (Tim/Lara):
// Wohin (Akk) vs Wo (Dativ) za destinacije — ans Meer / in die Berge / auf die
// Insel / ins Meer / auf den Berg / in den Wald. Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const ID = "dd94d4fa-2755-443c-83a6-91af79cfab53"; // Wohin fährt Tim?
const MARKER = "Razumevanje — Wohin fährt Tim?";

const SECTIONS = [
  { type: "text", style: "default", content: "## Razumevanje — Wohin fährt Tim?\n\nTim i Lara objašnjavaju zašto kažemo *ans Meer* ali *in die Berge*. Pogledaj video, pa odgovori:" },
  { type: "spoiler", title: "Pitanja uz dijalog", items: [
    { question: "Warum sagt man „ans Meer“, aber „in die Berge“?", answer: "Zum Meer fährt man AN die Küste (an + Akk). In die Berge fährt man hinein — also IN die Berge / ins Gebirge (in + Akk)." },
    { question: "Unterschied: „ans Meer fahren“ und „ins Meer gehen“?", answer: "Ans Meer fahren = ići na obalu (an die Küste). Ins Meer gehen = ući u vodu, npr. da plivaš (in + Akk)." },
    { question: "Wie sagt man, wenn man auf einen Berg geht?", answer: "auf einen Berg steigen / klettern (auf + Akk)." },
    { question: "Wie kommt man auf eine Insel?", answer: "mit einem Schiff — „Ich fahre auf eine Insel.“" },
    { question: "Tim ist schon dort (Insel). Wo ist er?", answer: "auf der Insel (Wo? → Dativ)." },
  ] },
  { type: "text", style: "default", content: "## Wohin? (Akkusativ) vs. Wo? (Dativ)" },
  { type: "table", headers: ["Mesto", "Wohin? — kuda (Akk)", "Wo? — gde (Dativ)"], rows: [
    ["More / obala", "<mark>ans Meer</mark> / an die Küste", "am Meer / an der Küste"],
    ["Planine", "<mark>in die Berge</mark>", "in den Bergen"],
    ["Planinski masiv", "<mark>ins Gebirge</mark>", "im Gebirge"],
    ["Ostrvo", "<mark>auf die Insel</mark>", "auf der Insel"],
    ["U more (plivati)", "<mark>ins Meer</mark>", "im Meer"],
    ["Vrh planine", "<mark>auf den Berg</mark>", "auf dem Berg"],
    ["Šuma", "<mark>in den Wald</mark>", "im Wald"],
  ] },
  { type: "text", style: "uebung", content: "## Wohin fährt Tim? — redosled iz videa\n\n*Tim fährt **an die Küste** → **in die Berge** → **auf die Insel** → geht **ins Meer** → geht **ins Gebirge** → klettert **auf den Berg** → geht zurück **ins Hotel**.*" },
  { type: "spoiler", title: "Mini-vežba: koji predlog? (an / in / auf + Akkusativ)", items: [
    { question: "Im Sommer fahre ich gern ______ Meer.", answer: "ans Meer" },
    { question: "Im Winter fahren wir ______ Berge zum Skifahren.", answer: "in die Berge" },
    { question: "Mit dem Schiff fahren wir ______ Insel.", answer: "auf die Insel" },
    { question: "Es ist heiß — ich gehe ______ Meer und schwimme.", answer: "ins Meer" },
    { question: "Wir steigen ______ Berg und genießen die Aussicht.", answer: "auf den Berg" },
    { question: "Am Wochenende gehe ich gern ______ Wald spazieren.", answer: "in den Wald" },
  ] },
  { type: "flashcard", items: [
    { front: "ans Meer fahren", back: "ići na more (na obalu)" },
    { front: "in die Berge / ins Gebirge", back: "u planine" },
    { front: "auf eine Insel fahren", back: "na ostrvo" },
    { front: "ins Meer gehen", back: "ući u more (plivati)" },
    { front: "auf einen Berg steigen", back: "popeti se na planinu" },
    { front: "in den Wald gehen", back: "ići u šumu" },
    { front: "Wohin? → Akkusativ", back: "kuda (kretanje) → akuzativ" },
  ] },
];

const { data: l } = await sb.from("lessons").select("title, sections").eq("id", ID).single();
const secs = l.sections || [];
if (JSON.stringify(secs).includes(MARKER)) {
  console.log(`"${l.title}" — već obogaćeno, preskačem`);
} else {
  console.log(`"${l.title}" — dodajem ${SECTIONS.length} sekcija`);
  if (APPLY) {
    const { error } = await sb.from("lessons").update({ sections: [...secs, ...SECTIONS] }).eq("id", ID);
    console.log(error ? `  ERROR: ${error.message}` : `  ✓ upisano (${secs.length + SECTIONS.length} sekcija ukupno)`);
  } else console.log("  (dry-run)");
}
