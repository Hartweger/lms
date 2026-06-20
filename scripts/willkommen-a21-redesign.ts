/**
 * Redizajn Willkommen za „Nemački A2.1" — ista logika kao A1.
 * Struktura: Uvod → Počni (CTA) → Kako kurs radi → Pomoćni materijali (PDF + WhatsApp) → Šta ćeš naučiti → Saveti za uspeh.
 * Izbačeno: Google Drive folder link. Zadržano: „Saveti za uspeh / Srećno učenje!".
 *
 * Backup: scripts/willkommen-A2.1-backup.json
 * Run: npx tsx scripts/willkommen-a21-redesign.ts
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

const LESSON_ID = "324ed5fc-ae37-4cf7-90ff-e9ac93349cd3";
const PDF_URL = "https://drive.google.com/file/d/1_F2GZtlXPgeXvHeSppV21g_j5e_NZYfM/view?usp=sharing";
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
        "## Svako može da nauči nemački. Baš svako. Osim onih koji nisu nikada počeli.\n\nDobrodošla/o u **Nemački A2.1**! 👋 Ovo je prvi deo A2 nivoa — nadovezuješ se na sve iz A1 i proširuješ znanje. Ne treba ti nikakva priprema, samo klikni na dugme ispod i kreni. Materijali koji ti mogu pomoći čekaju te niže.",
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
    { type: "link", linkType: "external", href: PDF_URL, label: "📄 Preuzmi PDF priručnik za A2" },

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
        "## Šta ćeš naučiti u A2.1?\n\n- **Lični podaci** - formulari, bračni status, adresa\n- **Porodica** - širi članovi (bratanac, snaja, zet...)\n- **Perfekt** - ponavljanje i proširenje (nepravilni glagoli)\n- **weil rečenice** - objašnjavanje razloga\n- **Stanovanje** - tipovi stanova, nameštaj, okruženje\n- **Smeće i reciklaža** - Müll u Nemačkoj\n- **Wechselpräpositionen** - predlozi koji menjaju padež\n- **Hrana i restoran** - naručivanje, navike u ishrani\n- **Posao** - prijava za posao, radno vreme, praznici\n- **Refleksivni glagoli** - sich waschen, sich interessieren...\n- **Škola u Nemačkoj** - školski sistem, obrazovanje",
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

  console.log(`\n✅ Ažurirano A2.1. Stari broj sekcija: ${(lesson.sections ?? []).length} → novi: ${newSections.length}`);
}

main();
