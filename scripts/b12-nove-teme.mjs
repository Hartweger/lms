// B1.2 — Faza A: 4 nove minimalne tematske lekcije (Schritte L8–14).
// Ubacuje ih na poziciju 25–28 (pre Prüfungstraining-a), pomerajući postojeće >=25 za +4.
// Idempotentno: ako naslovi već postoje, ne radi ništa. Dry-run; --apply za upis.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const MODULE = "Schritte teme · L8–14";

const vocab = (rows) => ({ type: "vocabulary", rows });
const cards = (rows) => ({ type: "flashcard", frontLabel: "Nemački", backLabel: "Prevod", items: rows.map(([front, back]) => ({ front, back })) });
const lesson = (title, lektion, introTema, rows) => ({
  title,
  lesson_type: "text",
  content: "",
  vimeo_video_id: null,
  is_free_preview: false,
  sections: [
    { type: "badge", module: MODULE, category: "wortschatz" },
    { type: "text", style: "info", content: `${introTema} (Schritte 6, Lektion ${lektion})` },
    { type: "text", style: "default", content: "## Vokabular" },
    vocab(rows),
    cards(rows),
    { type: "text", style: "default", content: "💬 **Uvežbaj prevod:** otvori vežbu **AI prevod** (ispod lekcije) i prevedi rečenice na ovu temu sa srpskog na nemački." },
  ],
});

const NOVE = [
  lesson(
    "Familie, Generationen und Lebensformen", 8,
    "Tema porodice, generacija i različitih oblika života. Učiš vokabular i fraze da pričaš o porodici, vaspitanju i zajedničkom životu.",
    [
      ["die Wohngemeinschaft (WG)", "stambena zajednica"],
      ["die Kindererziehung", "vaspitanje dece"],
      ["die Hausarbeit", "kućni posao"],
      ["die Lebensform", "oblik života"],
      ["alleinerziehend", "koji sam podiže dete"],
      ["die Generation", "generacija"],
      ["zusammenleben", "živeti zajedno"],
      ["respektieren", "poštovati"],
    ]
  ),
  lesson(
    "Glück, Erfolg und Lebensziele", 11,
    "Tema sreće, uspeha i životnih ciljeva. Učiš da pričaš o tome šta te čini srećnim, o planovima i odlukama.",
    [
      ["das Glück", "sreća"],
      ["der Erfolg", "uspeh"],
      ["das Lebensziel", "životni cilj"],
      ["die Entscheidung", "odluka"],
      ["zufrieden", "zadovoljan"],
      ["träumen von", "sanjati o"],
      ["erreichen", "postići"],
      ["abhängen von", "zavisiti od"],
    ]
  ),
  lesson(
    "Ehrenamt und gesellschaftliches Engagement", 12,
    "Tema volontiranja i angažovanja u društvu. Učiš da pričaš o dobrovoljnom radu, projektima i zaštiti životne sredine.",
    [
      ["das Ehrenamt", "volonterski rad"],
      ["ehrenamtlich", "volonterski"],
      ["sich engagieren für", "angažovati se za"],
      ["der Umweltschutz", "zaštita životne sredine"],
      ["die Gesellschaft", "društvo"],
      ["freiwillig", "dobrovoljno"],
      ["teilnehmen an", "učestvovati u"],
      ["die Spende", "donacija"],
    ]
  ),
  lesson(
    "Politik, Rechte und Pflichten", 13,
    "Tema politike, prava i obaveza. Učiš vokabular o izborima, zakonima i pravima građana.",
    [
      ["das Recht", "pravo"],
      ["die Pflicht", "obaveza"],
      ["die Wahlen", "izbori"],
      ["der Bürger", "građanin"],
      ["das Gesetz", "zakon"],
      ["wählen", "glasati, birati"],
      ["die Regierung", "vlada"],
      ["einhalten", "poštovati (zakon)"],
    ]
  ),
];

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: all } = await sb.from("lessons").select("id, order_index, title").eq("course_id", course.id).order("order_index");
const titles = new Set(all.map((l) => l.title));
const already = NOVE.filter((n) => titles.has(n.title)).map((n) => n.title);
if (already.length) {
  console.log("Već postoje, ne radim ništa:", already.join("; "));
  process.exit(0);
}

const START = 25;
const toShift = all.filter((l) => l.order_index >= START).sort((a, b) => b.order_index - a.order_index);
console.log(`Pomeram ${toShift.length} lekcija (>=${START}) za +4:`);
toShift.forEach((l) => console.log(`   #${l.order_index} → #${l.order_index + 4}  ${l.title}`));
console.log(`\nUbacujem 4 nove teme na ${START}–${START + 3}:`);
NOVE.forEach((n, i) => console.log(`   #${START + i}  ${n.title}  [${n.sections.map((s) => s.type).join(",")}]`));

if (APPLY) {
  for (const l of toShift) {
    const { error } = await sb.from("lessons").update({ order_index: l.order_index + 4 }).eq("id", l.id);
    if (error) { console.log(`✗ shift ${l.title}: ${error.message}`); process.exit(1); }
  }
  for (let i = 0; i < NOVE.length; i++) {
    const { error } = await sb.from("lessons").insert({ course_id: course.id, order_index: START + i, ...NOVE[i] });
    console.log(error ? `✗ insert ${NOVE[i].title}: ${error.message}` : `✓ ${NOVE[i].title}`);
  }
} else {
  console.log("\nDry-run — pokreni sa --apply za upis.");
}
