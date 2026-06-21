/**
 * Redizajn Willkommen za „Nemački B1.1" — po uzoru na A2.2.
 * Struktura: Uvod → Počni (CTA) → Kako kurs radi → Pomoćni materijali (priručnik PDF + WhatsApp + Materijal Drive) → Šta ćeš naučiti → 7 modula → Saveti.
 * Priručnik = DODATAK (Anina priča na B1, ne prati redosled lekcija).
 *
 * Backup: scripts/willkommen-B1.1-backup.json
 * Run: npx tsx scripts/willkommen-b11-redesign.ts
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

const LESSON_ID = "af4fefa8-55ed-4e30-9e21-a421b7f00a46";
const PDF_URL = "https://drive.google.com/file/d/1ZvNoEPHbdtPzPWiwPGtk21hOzIqVkHwJ/preview";
const COVER_URL = "https://rzmyglynjcygsbicssbt.supabase.co/storage/v1/object/public/blog-media/prirucnici/ana-u-nemackoj-b1-cover.jpg";
const WHATSAPP_URL = "https://chat.whatsapp.com/GHsdfmbeswPCJb70eb0eSs?s=sh&p=i&mlu=4";
const DRIVE_URL = "https://drive.google.com/drive/folders/1sMlcU6zkAVDiU9hwR5xHECGeYy0k4ktj?usp=sharing";

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
        "## Svako može da nauči nemački. Baš svako. Osim onih koji nisu nikada počeli.\n\nDobrodošla/o u **Nemački B1.1**! 👋 Ovo je prvi deo nivoa B1 — zajedno sa B1.2 priprema te za **Goethe-Zertifikat B1**. Kurs prati udžbenik *Schritte International Neu 5*. Ne treba ti nikakva priprema, samo klikni na dugme ispod i kreni. Materijali koji ti mogu pomoći čekaju te niže.",
    },
    { type: "link", linkType: "kviz", href: startHref, label: `▶ Počni prvu lekciju — ${firstReal.title}` },

    {
      type: "text",
      style: "uebung",
      content:
        "## Kako ovaj kurs funkcioniše\n\nSvaka lekcija ima isti ritam — prati ove korake i ne možeš da pogrešiš:\n\n1. **▶ Gledaj video** i ponavljaj naglas za mnom\n2. **📖 Pročitaj objašnjenje** ispod videa (tabele, formule, primeri)\n3. **✏️ Uradi kratke vežbe** (spoileri, kartice, kvizovi)\n4. **🗂 Nauči nove reči na karticama** + AI vežbe (prevod i dijalog) na kraju lekcije\n5. **🧪 Test po modulu** + završni Modelltest na kraju kursa",
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
        "**🎁 Bonus: PDF priručnik „Ana u Nemačkoj — od A2 do B1\"**\n\nPrava mala knjiga (preko 100 strana, 14 poglavlja) koja kroz **Aninu priču** prolazi ceo nivo B1 — gramatiku, malo Landeskunde i pripremu za ispit, sve kroz situacije iz svakodnevnog života. **Ne prati redosled lekcija** — čitaj je kad god želiš, na ekranu ili odštampanu. Prelistaj je odmah ispod 👇",
    },
    { type: "image", url: COVER_URL, alt: "Korice priručnika Ana u Nemačkoj — od A2 do B1", caption: "Priručnik Ana u Nemačkoj — od A2 do B1 (14 poglavlja, preko 100 strana)" },
    { type: "pdf", url: PDF_URL, label: "📄 Otvori priručnik (Ana u Nemačkoj — B1)" },

    {
      type: "text",
      style: "beispiele",
      content:
        "**💬 WhatsApp grupa za B1**\n\nTu pitaš kad ti nešto nije jasno i učiš zajedno sa ostalima. Ne ostaješ sama/sam u učenju.",
    },
    { type: "link", linkType: "external", href: WHATSAPP_URL, label: "💬 Uđi u WhatsApp grupu za B1" },

    {
      type: "text",
      style: "default",
      content:
        "## Šta ćeš naučiti u B1.1?\n\n- **Präteritum** - prošlo vreme za pripovedanje i bajke\n- **Als / wenn** - razlika između ova dva veznika\n- **Plusquamperfekt** - davno prošlo vreme\n- **Relativne rečenice** - opisivanje osoba i stvari\n- **obwohl** - koncesivne rečenice\n- **Passiv sa modalnim glagolima** - šta se mora/sme/može uraditi\n- **Genitiv** - + wegen / trotz\n- **Konjunktiv II** - irealne želje i uslovi\n- **Infinitiv mit zu** - konstrukcije sa zu\n- **Finalsätze** - um...zu / damit\n- **Zweiteilige Konjunktionen** - sowohl...als auch, weder...noch\n- **Priprema za ispit B1** - Schreiben, Sprechen, Leseverstehen\n\n### Kurs ima 7 modula\n\n- **1. Glück im Alltag** — Präteritum, als/wenn, Plusquamperfekt\n- **2. Unterhaltung** — obwohl, Relativpronomen, Gradpartikeln\n- **3. Gesund bleiben** — Passiv + Modalverben, Genitiv\n- **4. Sprachen** — Konjunktiv II, wegen + Genitiv\n- **5. Eine Arbeit finden** — Infinitiv mit zu\n- **6. Dienstleistung** — um...zu / damit, statt / ohne...zu\n- **7. Rund ums Wohnen** — Zweiteilige Konjunktionen, Konj. II Vergangenheit",
    },

    {
      type: "text",
      style: "default",
      content:
        "## Saveti za uspeh\n\n- Uči **redovno** - bolje 20 minuta svaki dan nego 3 sata jednom nedeljno\n- **Ponavljaj** - vrati se na lekcije koje ti nisu jasne\n- Ako imaš pitanja, piši profesorki na **info@hartweger.rs** ili u WhatsApp grupu\n\nSrećno učenje! 🍀",
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

  console.log(`\n✅ Ažurirano B1.1. Stari broj sekcija: ${(lesson.sections ?? []).length} → novi: ${newSections.length}`);
}

main();
