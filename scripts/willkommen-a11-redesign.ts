/**
 * Redizajn Willkommen A1.1 lekcije — jasnija struktura.
 * Struktura: Uvod → Počni (CTA) → Kako kurs radi → Pomoćni materijali (PDF + WhatsApp) → Ceo put kursa.
 * Izbačeno: Quizlet link, Google Drive folder link.
 *
 * Backup: scripts/willkommen-a11-backup.json (pokreni willkommen-a11-dump.ts pre ovoga)
 * Run: npx tsx scripts/willkommen-a11-redesign.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [key, ...v] = line.split("=");
  if (key && v.length > 0) process.env[key.trim()] = v.join("=").trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LESSON_ID = "734aca58-2063-463b-9b19-a458c9ce126f";
const PDF_URL = "https://drive.google.com/file/d/1dd29RtYvHX_JeZ45THujNf_FmHOATVbD/preview";
const COVER_URL = "https://rzmyglynjcygsbicssbt.supabase.co/storage/v1/object/public/blog-media/prirucnici/ana-u-nemackoj-a1-cover.jpg";
const WHATSAPP_URL = "https://chat.whatsapp.com/FFthWnle8F7H1i0H9nS6S8?mode=gi_t";

const MODUL_ROWS: string[][] = [
  ["<mark>Modul 1</mark>", "Pozdravi, pitanja, dijalozi, alfabet", "2-5"],
  ["<mark>Modul 2</mark>", "Porodica, kako si, brojevi, prezent", "6-9"],
  ["<mark>Modul 3</mark>", "Hrana, cene, restoran", "10-12"],
  ["<mark>Modul 4</mark>", "Stan, nameštaj, oglasi", "13-15"],
  ["<mark>Modul 5</mark>", "Razdvojni prefiksi, vreme, raspored, dnevni tok", "16-20"],
  ["<mark>Modul 6</mark>", "Vreme (meteo), akuzativ, hobiji, ja/nein/doch", "21-25"],
  ["<mark>Modul 7</mark>", "Modalni glagoli, perfekat", "26-29"],
];

async function main() {
  // 1) Učitaj trenutnu lekciju (provera + course_id)
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id, title, course_id, order_index, sections")
    .eq("id", LESSON_ID)
    .single();
  if (error || !lesson) {
    console.error("Ne mogu da učitam lekciju:", error);
    process.exit(1);
  }

  // 2) Nađi prvu pravu lekciju posle Willkommen (za „Počni" dugme)
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", lesson.course_id)
    .order("order_index");
  const idx = (lessons ?? []).findIndex((l) => l.id === LESSON_ID);
  const firstReal = (lessons ?? [])[idx + 1];
  if (!firstReal) {
    console.error("Ne mogu da nađem prvu lekciju posle Willkommen.");
    process.exit(1);
  }
  const startHref = `/lekcija/${firstReal.id}`;
  console.log(`Prva lekcija (CTA): „${firstReal.title}" → ${startHref}`);

  // 3) Nova struktura blokova
  const newSections = [
    { type: "badge", module: "Uvod" },

    {
      type: "text",
      style: "default",
      content:
        "## Svako može da nauči nemački. Baš svako. Osim onih koji nisu nikada počeli.\n\nDobrodošla/o u **Nemački A1.1**! 👋 Ne treba ti nikakva priprema ni materijal unapred — samo klikni na dugme ispod i kreni. Materijali koji ti mogu pomoći čekaju te niže.",
    },
    { type: "link", linkType: "kviz", href: startHref, label: `▶ Počni prvu lekciju — ${firstReal.title}` },

    {
      type: "text",
      style: "uebung",
      content:
        "## Kako ovaj kurs funkcioniše\n\nSvaka lekcija ima isti ritam — prati ova 4 koraka i ne možeš da pogrešiš:\n\n1. **▶ Gledaj video** i ponavljaj naglas za mnom\n2. **📖 Pročitaj objašnjenje** ispod videa\n3. **✏️ Uradi kratke vežbe** (klikni za rešenje)\n4. **🗂 Nauči nove reči na karticama** na kraju lekcije\n\n**Najvažnije pravilo:** bolje 15 minuta svaki dan nego 3 sata jednom nedeljno.",
    },

    {
      type: "text",
      style: "default",
      content:
        "## Pomoćni materijali\n\nOvo nije obavezno za početak — srž učenja su **video lekcije i kartice**. Ali evo šta ti može pomoći usput:",
    },
    {
      type: "text",
      style: "info",
      content:
        "**📄 PDF priručnik** *(nije obavezno)*\n\nPriručnik prati sadržaj kursa. Prelistaj ga i uči uz njegovu pomoć kad želiš nešto na miru da pročitaš ili odštampaš. Nije uslov da kreneš.",
    },
    { type: "image", url: COVER_URL, alt: "Korice priručnika Ana u Nemačkoj — od nule do A1", caption: "Priručnik Ana u Nemačkoj — Od nule do A1 ispita" },
    { type: "pdf", url: PDF_URL, label: "📄 Otvori PDF priručnik za A1" },

    {
      type: "text",
      style: "beispiele",
      content:
        "**💬 WhatsApp grupa A1**\n\nTu pitaš kad ti nešto nije jasno i učiš zajedno sa ostalima. Ne ostaješ sama/sam u učenju.",
    },
    { type: "link", linkType: "external", href: WHATSAPP_URL, label: "💬 Uđi u WhatsApp grupu A1" },

    {
      type: "text",
      style: "default",
      content:
        "## Ceo put kursa\n\nKurs A1.1 ima **7 modula** (lekcije 2–29). Evo cele mape — ne moraš ništa da pamtiš, samo da znaš kuda ideš:",
    },
    { type: "table", headers: ["Modul", "Tema", "Lekcije"], rows: MODUL_ROWS },
  ];

  // 4) Upiši
  const { error: updErr } = await supabase
    .from("lessons")
    .update({ sections: newSections })
    .eq("id", LESSON_ID);
  if (updErr) {
    console.error("Greška pri upisu:", updErr);
    process.exit(1);
  }

  console.log(`\n✅ Ažurirano. Stari broj sekcija: ${(lesson.sections ?? []).length} → novi: ${newSections.length}`);
  console.log("Nova struktura:");
  for (const [i, s] of newSections.entries()) {
    const tag = (s as { style?: string; linkType?: string }).style || (s as { linkType?: string }).linkType || "";
    console.log(`  ${i}: ${s.type}${tag ? " ("+tag+")" : ""}`);
  }
}

main();
