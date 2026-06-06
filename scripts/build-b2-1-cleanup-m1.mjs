// B2.1 — čišćenje Modula 1: "Das Leben" (ukloni suvišan link, Lesetext ispod videa)
// i "WIEN" (Lesetext na vrh, čisti naslovi, bez suvišnog "test"). Čuva audio/pdf/link/flashcard/vocab. --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3729f3f5-2582-44ff-bb10-c4cc2ab5676b";

async function getL(title) {
  const { data } = await sb.from("lessons").select("id,sections").eq("course_id", CID).eq("title", title).single();
  return data;
}
const find = (secs, pred) => secs.find(pred);
const set = async (id, sections) => { if (APPLY) { const { error } = await sb.from("lessons").update({ sections }).eq("id", id); if (error) throw error; } };

// ---- Das Leben neu gestalten ----
{
  const l = await getL("Das Leben neu gestalten – Vielfalt B2.1");
  const s = l.sections;
  const badge = find(s, x => x.type === "badge");
  const video = find(s, x => x.type === "video");
  const lese = find(s, x => x.type === "text" && x.content?.startsWith("## 📖"));
  const audio = find(s, x => x.type === "audio");
  const quizlet = find(s, x => x.type === "link" && x.linkType === "quizlet");
  const fc = find(s, x => x.type === "flashcard");
  const voc = find(s, x => x.type === "vocabulary");
  const next = [
    badge, video, lese,
    { type: "text", content: "**Den Text anhören:** Höre den Lesetext und folge mit." },
    audio,
    { type: "text", content: "**Wortschatz üben:** Übe die wichtigsten Wörter dieser Lektion." },
    quizlet, fc, voc,
  ].filter(Boolean);
  console.log(`Das Leben: ${s.length} → ${next.length} sekcija (uklonjen suvišan Drive link, Lesetext ispod videa)`);
  await set(l.id, next);
}

// ---- WIEN ----
{
  const l = await getL("WIEN");
  const s = l.sections;
  const badge = find(s, x => x.type === "badge");
  const lese = find(s, x => x.type === "text" && x.content?.startsWith("## 📖"));
  const pdf = find(s, x => x.type === "pdf");
  const audio = find(s, x => x.type === "audio");
  const quizlet = find(s, x => x.type === "link" && x.linkType === "quizlet");
  const fc = find(s, x => x.type === "flashcard");
  const voc = find(s, x => x.type === "vocabulary");
  const next = [
    badge, lese,
    { type: "text", content: "**Höraufgabe: „In Wien zu Hause“**\n\nLies zuerst den Text (PDF) aufmerksam durch und höre dann den Audiotext. Jemand erzählt von den ersten Tagen in Wien – mit allen Eindrücken und Herausforderungen." },
    pdf, audio,
    { type: "text", content: "**Kulturelle Tipps – Wien mit Humor erleben**\n\nDie Kultur einer Stadt lernt man nicht nur in Büchern kennen – auch auf Instagram! Schau dir den Account [@biancaolivia](https://www.instagram.com/biancaolivia/) an – sie zeigt mit viel Witz und Ironie, wie Wiener:innen ticken. Ihre Kurzvideos spielen mit typischen **Stereotypen aus dem Wiener Alltag** – von der U-Bahn bis zum Kaffeehaus." },
    { type: "text", content: "**Wortschatz üben:** Übe und wiederhole die wichtigsten Wörter aus der Lektion." },
    quizlet, fc, voc,
  ].filter(Boolean);
  console.log(`WIEN: ${s.length} → ${next.length} sekcija (Lesetext na vrh, čisti naslovi, uklonjen suvišan "test")`);
  await set(l.id, next);
}
console.log(APPLY ? "✓ Očišćeno." : "[DRY] --apply za upis.");
