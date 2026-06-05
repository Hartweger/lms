// B2.1 — restrukturiranje kao A1: Willkommen → Modul 1 → … → Modul 4 → Ispit/Dodatno.
// Grupisanje ide preko badge.module (uzastopne lekcije sa istim badge.module = jedan modul).
// Postavlja order_index + badge.module svakoj lekciji; kreira Willkommen. Idempotentno. Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const COURSE_SLUG = "nemacki-b2-1";
const CID = "3729f3f5-2582-44ff-bb10-c4cc2ab5676b";

// Redosled + modul (badge.module). Willkommen se kreira ako ne postoji.
const SEQ = [
  ["Willkommen", "Willkommen"],
  // Modul 1 — Wo sind Sie zu Hause?
  ["Das Leben neu gestalten – Vielfalt B2.1", "Modul 1"],
  ["Nomen mit Präpositionen", "Modul 1"],
  ["Wortstellung mit Dativ und Akkusativ", "Modul 1"],
  ["Migration", "Modul 1"],
  ["Modalverben durch die Zeit", "Modul 1"],
  ["WIEN", "Modul 1"],
  ["Kausale Verbindungen", "Modul 1"],
  ["EXTRA Prüfung (Modul 1)", "Modul 1"],
  // Modul 2 — Verantwortung
  ["Erwartungen in der Familie B2.1", "Modul 2"],
  ["Das eigene Profil schärfen", "Modul 2"],
  ["Wortstellung im Mittelfeld", "Modul 2"],
  ["TeKaMoLo", "Modul 2"],
  ["Berufliche Kompetenzen", "Modul 2"],
  ["Zweiteilige Konnektoren", "Modul 2"],
  ["EXTRA Prüfung (Modul 2)", "Modul 2"],
  // Modul 3 — Was können Sie gut?
  ["Extrem unter Kontrolle – Lena auf Expedition", "Modul 3"],
  ["Finalsätze", "Modul 3"],
  ["Alles unter Kontrolle? – Ernährung", "Modul 3"],
  ["Alternativen zu Passiv", "Modul 3"],
  ["So tickt unsere innere Uhr! – Tagesrhythmus", "Modul 3"],
  // Modul 4 — Was ist für Sie Mut?
  ["Erfolg und Scheitern im Beruf", "Modul 4"],
  ["Minimalismus", "Modul 4"],
  ["Nachbarschaft 2.0", "Modul 4"],
  // Ispit i dodatno
  ["BONUS: RADIONICA Priprema, POSAO, Start", "Ispit i dodatno"],
  ["EXTRA Video", "Ispit i dodatno"],
  ["Primeri ispita za deo Leseverstehen", "Ispit i dodatno"],
  ["Primeri ispita za deo Hörverstehen", "Ispit i dodatno"],
  ["Primer ispita za deo Schreiben", "Ispit i dodatno"],
  ["Završni test B2.1", "Ispit i dodatno"],
];

const WILLKOMMEN_SECTIONS = [
  { type: "badge", module: "Willkommen" },
  { type: "text", style: "info", content: `## Willkommen zum B2-Kurs! 🎉

Herzlich willkommen zu deinem **B2.1-Kurs**! Wir freuen uns, dich auf deinem Weg zu besseren Deutschkenntnissen zu begleiten.

Der Kurs ist in **4 Module** mit je drei Lektionen aufgeteilt. In jeder Lektion findest du **Videos, Lesetexte, Wortschatz, Grammatik und Übungen**. Am Ende wartet ein **Abschlusstest**.

Unten findest du das wichtigste Material, das wir während des Kurses verwenden.

Viel Erfolg und Spaß beim Lernen! 💪` },
  { type: "link", linkType: "external", href: "https://drive.google.com/file/d/1or2K5Qxq8miFfgyvi2WcpcJS00ZzceCG/view", label: "Vielfalt B2.1 – Kurs- und Arbeitsbuch (PDF)" },
];

const setBadge = (sections, mod) => {
  const secs = Array.isArray(sections) ? [...sections] : [];
  const bi = secs.findIndex((s) => s.type === "badge");
  if (bi >= 0) secs[bi] = { ...secs[bi], module: mod };
  else secs.unshift({ type: "badge", module: mod });
  return secs;
};

const { data: all } = await sb.from("lessons").select("id,title,order_index,sections").eq("course_id", CID);
const byTitle = new Map(all.map((l) => [l.title, l]));

let order = 1;
const seqTitles = new Set();
for (const [title, mod] of SEQ) {
  seqTitles.add(title);
  let lesson = byTitle.get(title);
  if (!lesson && title === "Willkommen") {
    console.log(`+ NOVA: Willkommen (order ${order}, ${mod})`);
    if (APPLY) {
      const { error } = await sb.from("lessons").insert({ course_id: CID, title: "Willkommen", order_index: order, lesson_type: "text", sections: WILLKOMMEN_SECTIONS });
      if (error) throw error;
    }
    order++; continue;
  }
  if (!lesson) { console.error(`✗ "${title}" ne postoji — preskačem`); continue; }
  console.log(`~ ${String(order).padStart(2)}  [${mod}]  ${title}`);
  if (APPLY) {
    const secs = setBadge(lesson.sections, mod);
    const { error } = await sb.from("lessons").update({ order_index: order, sections: secs }).eq("id", lesson.id);
    if (error) throw error;
  }
  order++;
}

// Lekcije van sekvence (npr. placeholder "Lekcija") → na kraj
for (const l of all) {
  if (seqTitles.has(l.title)) continue;
  console.log(`! van sekvence → kraj (order ${order}): "${l.title}"`);
  if (APPLY) { await sb.from("lessons").update({ order_index: order }).eq("id", l.id); }
  order++;
}
console.log(APPLY ? "\n✓ Restrukturirano." : "\n[DRY] Pokreni sa --apply za upis.");
