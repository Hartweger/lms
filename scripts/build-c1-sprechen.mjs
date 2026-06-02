// C1 Sprechen sadržaj → lekcija "SPRECHEN C1": Teil 1 Vortrag (2 teme) + Teil 2 Diskussion + Susanne audio.
// Čuva postojeći video + prezentaciju (dugme). Susanne.mp3 → Supabase. Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const BUCKET = "blog-media";

const TEIL1 = [
  "Teil 1 — Vortrag halten (circa 5–7 Minuten)", "",
  "Wählen Sie EIN Thema. Halten Sie einen kurzen Vortrag; Ihre Gesprächspartner stellen anschließend Fragen.", "",
  "Thema 1: Soziale Pflichtzeit",
  "Sollten Schulabgänger vor Ausbildung/Studium eine soziale Pflichtzeit absolvieren?",
  "– Nennen Sie ein Beispiel für eine Tätigkeit im Rahmen der sozialen Pflichtzeit.",
  "– Argumentieren Sie für oder gegen eine soziale Pflichtzeit.",
  "– Erklären Sie, welche Alternativen es für junge Leute gibt.",
  "– Machen Sie einen Vorschlag gegen den Fachkräftemangel im sozialen Bereich.", "",
  "Thema 2: Klarnamenpflicht in sozialen Netzwerken",
  "Ist eine Klarnamenpflicht in sozialen Netzwerken angebracht?",
  "– Geben Sie ein Beispiel für eine Situation, in der man sich unter dem eigenen Namen anmelden muss.",
  "– Erörtern Sie Vor- und Nachteile der Verwendung des richtigen Namens.",
  "– Beschreiben Sie die Situation in Ihrem Heimatland oder einem anderen Land.",
  "– Schließen Sie mit einem Ausblick für die Zukunft.", "",
  "Gehen Sie auf alle vier Punkte ein und strukturieren Sie Ihren Vortrag klar.",
].join("\n");

const TEIL2 = [
  "Teil 2 — Diskussion führen (circa 5 Minuten)", "",
  "Sie treffen eine Kollegin/einen Kollegen. Eine gemeinsame Freundin lebt sehr gesund und will nicht länger hohe Krankenversicherungsbeiträge zahlen. Sie diskutieren über:", "",
  "Individuelle Gesundheitstarife — Sollen Krankenkassen eine gesunde Lebensweise finanziell belohnen?", "",
  "– Was halten Sie von individuellen Gesundheitstarifen?",
  "– Begründen Sie Ihre Haltung.",
  "– Gehen Sie auf die Situation in Ihrem Heimatland (oder einem anderen Land) ein.",
  "– Einigen Sie sich auf Argumente für ein Gespräch mit Ihrer Freundin.", "",
  "Hören Sie, was Ihre Gesprächspartnerin (Susanne) sagt:",
].join("\n");

const { data: course } = await sb.from("courses").select("id").eq("slug", "polozi-goethe-c1").single();
const { data: lesson } = await sb.from("lessons").select("id,sections").eq("course_id", course.id).eq("title", "SPRECHEN C1").single();
console.log(`SPRECHEN C1 lekcija: ${lesson.id}`);

// zadrži postojeći video + prezentaciju (link), odbaci stari tekst/audio Sprechen sadržaj
const keep = (lesson.sections || []).filter((s) => s.type === "badge" || s.type === "video" || s.type === "link");
if (!APPLY) { console.log("[DRY] zadržao bih:", keep.map((s) => s.type).join(", "), "+ dodajem Teil1/Teil2/audio. --apply za upis."); process.exit(0); }

const res = await fetch("https://www.hartweger.rs/wp-content/uploads/2025/09/Susanne.mp3");
if (!res.ok) throw new Error("Susanne.mp3 download " + res.status);
const sp = "kursevi/polozi-goethe-c1/Susanne.mp3";
await sb.storage.from(BUCKET).upload(sp, Buffer.from(await res.arrayBuffer()), { contentType: "audio/mpeg", upsert: true });
const audioUrl = sb.storage.from(BUCKET).getPublicUrl(sp).data.publicUrl;

const sections = [
  ...keep,
  { type: "text", style: "uebung", content: TEIL1 },
  { type: "text", style: "uebung", content: TEIL2 },
  { type: "audio", url: audioUrl, label: "Ihre Gesprächspartnerin (Susanne)" },
];
const { error } = await sb.from("lessons").update({ sections }).eq("id", lesson.id);
if (error) { console.log("ERR:", error.message); process.exit(1); }
console.log("✓ SPRECHEN C1 sekcije:", sections.map((s) => s.type).join(", "), "| Susanne audio → Supabase");
