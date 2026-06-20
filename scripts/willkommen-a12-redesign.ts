/**
 * Redizajn Willkommen za „Nemački A1.2" — ista logika kao A1.1.
 * Struktura: Uvod → Počni (CTA) → Kako kurs radi → Pomoćni materijali (PDF + WhatsApp) → Šta ćeš naučiti.
 * Izbačeno: Quizlet link, Google Drive folder link.
 *
 * Backup: scripts/willkommen-A1.2-backup.json (napravljen sa willkommen-find-dump.ts "A1.2")
 * Run: npx tsx scripts/willkommen-a12-redesign.ts
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

const LESSON_ID = "fd45eb3c-0ba4-4410-92ee-b5a883c1493c";
// PDF i WhatsApp su isti kao A1.1 (priručnik za ceo A1, grupa A1)
const PDF_URL = "https://drive.google.com/file/d/1dd29RtYvHX_JeZ45THujNf_FmHOATVbD/view?usp=sharing";
const WHATSAPP_URL = "https://chat.whatsapp.com/FFthWnle8F7H1i0H9nS6S8?mode=gi_t";

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
        "## Svako može da nauči nemački. Baš svako. Osim onih koji nisu nikada počeli.\n\nDobrodošla/o u **Nemački A1.2**! 👋 Ovo je nastavak A1.1 — ideš dalje ka ispitu A1. Ne treba ti nikakva priprema, samo klikni na dugme ispod i kreni. Materijali koji ti mogu pomoći čekaju te niže.",
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
        "**📄 PDF priručnik za ceo A1** *(nije obavezno)*\n\nPriručnik prati sadržaj kursa (pokriva A1.1 i A1.2). Prelistaj ga i uči uz njegovu pomoć kad želiš nešto na miru da pročitaš ili odštampaš. Nije uslov da kreneš.",
    },
    { type: "link", linkType: "external", href: PDF_URL, label: "📄 Preuzmi PDF priručnik" },

    {
      type: "text",
      style: "beispiele",
      content:
        "**💬 WhatsApp grupa A1**\n\nIsta grupa kao na A1.1 — tu pitaš kad ti nešto nije jasno i učiš zajedno sa ostalima. Ne ostaješ sama/sam u učenju.",
    },
    { type: "link", linkType: "external", href: WHATSAPP_URL, label: "💬 Uđi u WhatsApp grupu A1" },

    {
      type: "text",
      style: "default",
      content:
        "## Šta ćeš naučiti u A1.2?\n\n- Zanimanja i kako reći čime se baviš\n- Prošlo vreme sa *hatte* i *war*\n- Imperativ — kako davati uputstva\n- Modalni glagoli — können, müssen, dürfen, sollen, wollen, mögen\n- Delovi tela i kako reći šta te boli\n- Dativ sa predlozima (mit, zu, in, bei, nach)\n- Odeća (Kleidung)\n- Pisanje mejlova i upita\n- ADUSO veznici\n- Priprema za ispit A1",
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

  console.log(`\n✅ Ažurirano A1.2. Stari broj sekcija: ${(lesson.sections ?? []).length} → novi: ${newSections.length}`);
}

main();
