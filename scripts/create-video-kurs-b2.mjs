// Kreira purchasable proizvod "VIDEO kurs B2" (kao video-kurs-a1/a2/b1) + course_unlocks → nemacki-b2-1, nemacki-b2-2.
// NACRT (is_published=false) jer B2.2 sadržaj još nije gotov. Idempotentno. --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const COURSE = {
  title: "VIDEO kurs B2",
  slug: "video-kurs-b2",
  description: "Viši srednji nivo u vašem tempu. Priprema za B2 ispit ili rad i studije u nemačkom govornom području.",
  course_type: "video",
  price: 11600,
  is_published: false, // NACRT — objaviti kad B2.2 bude gotov
  is_purchasable: true,
  paypal_price_eur: 99,
  category: "video",
  marketing_description: `Viši srednji nivo nemačkog jezika — B2 u video formatu.

Na B2 nivou razumete kompleksne tekstove, vodite diskusije, argumentujete i izražavate se precizno i tečno — u svakodnevnim, ali i poslovnim i akademskim situacijama. Kurs pokriva oba podnivoa (B2.1 i B2.2) sa zahtevnom gramatikom, bogatim vokabularom i pripremom za Goethe B2 ispit.

Na platformi vas čekaju interaktivne vežbe — kvizovi, vežbe prevoda (AI), flashcard kartice i audio za svaku reč. Svaki modul ima tekstove za čitanje, gramatička objašnjenja i test razumevanja.

Idealno za one koji rade ili studiraju u nemačkom govornom području ili žele da polože B2 ispit.`,
  features: [
    "Video lekcije (B2.1 + B2.2) sa prof. Natašom Hartweger",
    "Interaktivne vežbe — kvizovi, vežbe prevoda (AI), test razumevanja",
    "Ciljano vežbanje svih veština: Hören, Lesen, Schreiben, Sprechen",
    "AI vežba prevoda — prevodiš rečenice i dobijaš povratnu informaciju",
    "Flashcard kartice za učenje reči (DE↔SR)",
    "Audio za svaku reč — klikni i čuj pravi izgovor",
    "Autentični tekstovi iz udžbenika Vielfalt B2",
    "Priprema za Goethe B2 ispit",
    "Testovi posle svakog modula",
    "Završni ispit na platformi po uzoru na ispite Goethe instituta",
    "Aplikacija za telefon — link dobijaš, instalirate za sekund",
    "Podrška u WhatsApp grupi",
    "Pristup platformi godinu dana",
    "Sertifikat HARTWEGER centra po završetku",
  ],
};

const UNLOCK_CONTENT = ["nemacki-b2-1", "nemacki-b2-2"];

const { data: existing } = await sb.from("courses").select("id").eq("slug", COURSE.slug).maybeSingle();
let courseId = existing?.id;
console.log(existing ? `~ "${COURSE.slug}" već postoji (${courseId})` : `+ kreiraće se "${COURSE.slug}" (NACRT, €${COURSE.price / 100}/${COURSE.paypal_price_eur})`);

const { data: contentRows } = await sb.from("courses").select("id,slug").in("slug", UNLOCK_CONTENT);
console.log("  otključava →", contentRows.map(c => c.slug).join(", "));

if (!APPLY) { console.log("[DRY] --apply za upis."); process.exit(0); }

if (!courseId) {
  const { data: created, error } = await sb.from("courses").insert(COURSE).select("id").single();
  if (error) throw error;
  courseId = created.id;
  console.log("  ✓ kreiran kurs", courseId);
}
for (const c of contentRows) {
  const { error } = await sb.from("course_unlocks").upsert({ purchasable_course_id: courseId, content_course_id: c.id }, { onConflict: "purchasable_course_id,content_course_id", ignoreDuplicates: true });
  if (error) throw error;
  console.log("  ✓ unlock → " + c.slug);
}
console.log("✓ Gotovo (video-kurs-b2 kao NACRT).");
