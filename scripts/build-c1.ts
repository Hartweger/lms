/**
 * Sklapa Goethe C1 lekcije iz materijala koji je dala Nataša (video + .pptx prezentacije + Redemittel PDF-ovi).
 * Fajlovi se skidaju sa hartweger.rs i prebacuju na Supabase (da ne puknu kad se ugasi WP).
 * Prezentacije (.pptx) → dugme "Otvori prezentaciju"; Redemittel (.pdf) → pdf blok.
 * Ne dira essay vežbe (zasebni redovi). Run: npx tsx scripts/build-c1.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("="); if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const BUCKET = "blog-media";
const WP = "https://www.hartweger.rs/wp-content/uploads/2025/09/";

const ctFor = (n: string) => n.endsWith(".pdf") ? "application/pdf"
  : n.endsWith(".pptx") ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  : "application/octet-stream";

async function toSupabase(fileName: string): Promise<string> {
  const res = await fetch(WP + fileName);
  if (!res.ok) throw new Error(`download ${res.status}: ${fileName}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const sp = `kursevi/polozi-goethe-c1/${fileName}`;
  const { error } = await sb.storage.from(BUCKET).upload(sp, buf, { contentType: ctFor(fileName), upsert: true });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(sp).data.publicUrl;
}

// po lekciji: videi, prezentacija (.pptx), redemittel (.pdf[])
const PLAN: Record<string, { videos: string[]; pptx?: { file: string; label: string }; pdfs?: { file: string; label: string }[] }> = {
  "Opšte informacije": {
    videos: ["1119815561", "1112911724"],
    pptx: { file: "Opste-informacije-o-ispitu-Gete-C1.pptx", label: "Prezentacija: Opšte informacije o ispitu C1" },
  },
  "LESEN C1": {
    videos: ["1112911134"],
    pptx: { file: "Goethe-Prufung-C1-Lesen-.pptx", label: "Prezentacija: C1 Lesen" },
  },
  "HÖREN C1": {
    videos: ["1113786886"],
    pptx: { file: "Goethe-Prufung-C1-Horen-1.pptx", label: "Prezentacija: C1 Hören" },
  },
  "SCHREIBEN C1": {
    videos: [],
    pptx: { file: "Goethe-Prufung-C1-Schriftlicher-Ausdruck-2.pptx", label: "Prezentacija: C1 Schriftlicher Ausdruck" },
    pdfs: [
      { file: "Redemittel-C1-Schreiben-Teil-1.pdf", label: "Redemittel – Schreiben, Teil 1" },
      { file: "Redemittel-Schreiben-Teil-2.pdf", label: "Redemittel – Schreiben, Teil 2" },
      { file: "Redemittel-Schreiben-Teil-2-1.pdf", label: "Redemittel – Schreiben (dodatno)" },
    ],
  },
  "SPRECHEN C1": {
    videos: [],
    pptx: { file: "Goethe-Prufung-C1-Sprechen.pptx", label: "Prezentacija: C1 Sprechen" },
    pdfs: [{ file: "Redemittel-Sprechen-1.pdf", label: "Redemittel – Sprechen" }],
  },
};

async function run() {
  const { data: course } = await sb.from("courses").select("id").eq("slug", "polozi-goethe-c1").single();
  if (!course) throw new Error("kurs polozi-goethe-c1 ne postoji");
  const { data: lessons } = await sb.from("lessons").select("id,title").eq("course_id", course.id);

  for (const [title, plan] of Object.entries(PLAN)) {
    const lesson = lessons!.find((l) => l.title === title);
    if (!lesson) { console.error(`✗ nema lekcije "${title}"`); continue; }
    const sections: any[] = [{ type: "badge", module: title }];
    for (const v of plan.videos) sections.push({ type: "video", vimeoId: v });
    if (plan.pptx) {
      const url = await toSupabase(plan.pptx.file);
      sections.push({ type: "link", linkType: "pdf", href: url, label: plan.pptx.label });
    }
    for (const p of plan.pdfs || []) {
      const url = await toSupabase(p.file);
      sections.push({ type: "pdf", url, label: p.label });
    }
    const { error } = await sb.from("lessons").update({ sections }).eq("id", lesson.id);
    if (error) { console.error(`✗ ${title}: ${error.message}`); continue; }
    console.log(`✓ ${title}: ${sections.map((s) => s.type).join(", ")}`);
  }
}
run().catch((e) => { console.error(e); process.exit(1); });
