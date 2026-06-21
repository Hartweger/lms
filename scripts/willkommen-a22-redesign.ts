/**
 * Redizajn Willkommen za „Nemački A2.2" — ista logika kao A2.1.
 * Struktura: Uvod → Počni (CTA) → Kako kurs radi → Pomoćni materijali (PDF + WhatsApp) → Šta ćeš naučiti → Saveti za uspeh.
 * Izbačeno: Quizlet link + Quizlet red iz „Saveta", Google Drive folder link.
 *
 * Backup: scripts/willkommen-A2.2-backup.json
 * Run: npx tsx scripts/willkommen-a22-redesign.ts
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

const LESSON_ID = "70d4d91d-c05e-49ed-ba13-b03250de960a";
const PDF_URL = "https://drive.google.com/file/d/1_F2GZtlXPgeXvHeSppV21g_j5e_NZYfM/preview";
const COVER_URL = "https://rzmyglynjcygsbicssbt.supabase.co/storage/v1/object/public/blog-media/prirucnici/ana-u-nemackoj-a2-cover.jpg";
const WHATSAPP_URL = "https://chat.whatsapp.com/GkIMxGTD20xIATm1GlBT56?mode=gi_t";

async function main() {
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id, title, course_id, sections")
    .eq("id", LESSON_ID)
    .single();
  if (error || !lesson) {
    console.error("Ne mogu da učitam lekciju:", error);
    process.exit(1);
  }

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

  const newSections = [
    { type: "badge", module: "Uvod" },

    {
      type: "text",
      style: "default",
      content:
        "## Svako može da nauči nemački. Baš svako. Osim onih koji nisu nikada počeli.\n\nDobrodošla/o u **Nemački A2.2**! 👋 Ovo je drugi deo A2 nivoa — posle ovog kursa spremna si za **Goethe-Zertifikat A2** ispit. Ne treba ti nikakva priprema, samo klikni na dugme ispod i kreni. Materijali koji ti mogu pomoći čekaju te niže.",
    },
    { type: "link", linkType: "kviz", href: startHref, label: `▶ Počni prvu lekciju — ${firstReal.title}` },

    {
      type: "text",
      style: "uebung",
      content:
        "## Kako ovaj kurs funkcioniše\n\nSvaka lekcija ima isti ritam — prati ova 4 koraka i ne možeš da pogrešiš:\n\n1. **▶ Gledaj video** i ponavljaj naglas za mnom\n2. **📖 Pročitaj objašnjenje** ispod videa\n3. **✏️ Uradi kratke vežbe** (spoileri, kartice, kvizovi)\n4. **🗂 Nauči nove reči na karticama** + AI vežbe na kraju lekcije",
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
        "**📄 PDF priručnik za A2** *(nije obavezno)*\n\nPriručnik prati sadržaj kursa. Prelistaj ga i uči uz njegovu pomoć kad želiš nešto na miru da pročitaš ili odštampaš. Nije uslov da kreneš.",
    },
    { type: "image", url: COVER_URL, alt: "Korice priručnika Ana u Nemačkoj — od A1 do A2", caption: "Priručnik Ana u Nemačkoj — od A1 do A2" },
    { type: "pdf", url: PDF_URL, label: "📄 Otvori PDF priručnik za A2" },

    {
      type: "text",
      style: "beispiele",
      content:
        "**💬 WhatsApp grupa A2**\n\nTu pitaš kad ti nešto nije jasno i učiš zajedno sa ostalima. Ne ostaješ sama/sam u učenju.",
    },
    { type: "link", linkType: "external", href: WHATSAPP_URL, label: "💬 Uđi u WhatsApp grupu A2" },

    {
      type: "text",
      style: "default",
      content:
        "## Šta ćeš naučiti u A2.2?\n\n- **Konjunktiv II** - kako da izraziš želje (hätte, wäre, würde, könnte)\n- **trotzdem** - kako da kažeš \"ipak\"\n- **Dialoge führen** - predlozi, dogovaranje termina, reagovanje\n- **Deklinacija prideva** - nastavci prideva sa svim članovima\n- **Pasiv** - kako reći \"nešto se radi\"\n- **Komparacija** - poređenje (veći, manji, najbolji)\n- **Reisen und Verkehr** - putovanja, karte, prevoz\n- **Bank und Geld** - račun, bankomat, transakcije\n- **Schreiben** - pisanje mejlova i kratkih poruka",
    },

    {
      type: "text",
      style: "default",
      content:
        "## Saveti za uspeh\n\n- Uči **redovno** - bolje 20 minuta svaki dan nego 3 sata jednom nedeljno\n- **Ponavljaj** - vrati se na lekcije koje ti nisu jasne\n- Ako imaš pitanja, piši profesorki na **info@hartweger.rs**\n\nSrećno učenje!",
    },
  ];

  const { error: updErr } = await supabase
    .from("lessons")
    .update({ sections: newSections })
    .eq("id", LESSON_ID);
  if (updErr) {
    console.error("Greška pri upisu:", updErr);
    process.exit(1);
  }

  console.log(`\n✅ Ažurirano A2.2. Stari broj sekcija: ${(lesson.sections ?? []).length} → novi: ${newSections.length}`);
}

main();
