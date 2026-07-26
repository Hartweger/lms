import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site-url";

export type LevelCourse = { slug: string; title: string; price: number };

// Slug je statičan (ne menja se); cena se povlači uživo (vidi getLevelCourse).
export const LEVEL_VIDEO_COURSE: Record<string, { slug: string; title: string }> = {
  A1: { slug: "video-kurs-a1", title: "VIDEO kurs A1" },
  A2: { slug: "video-kurs-a2", title: "VIDEO kurs A2" },
  B1: { slug: "video-kurs-b1", title: "VIDEO kurs B1" },
};

// NAKI10 = 10% popusta.
export function couponPrice(price: number): number {
  return Math.round(price * 0.9);
}

// Poslednji pomenuti nivo u skorašnjim korisničkim porukama (lepljiv).
export function stickyLevel(userMessages: string[]): string | null {
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const m = userMessages[i].match(/\b(A1|A2|B1|B2|C1)\b/i);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

/**
 * Nekeširan dodatak za chat system prompt. Bez kupona (kupon ide samo na pitanje o ceni).
 *
 * Formulacija je NAMERNO zapovest, ne uslov. Ranije je stajalo "Kad ovom korisniku
 * preporučuješ kurs, uputi ga baš na X" - to kaže KOJI kurs, ali nikad DA preporuči, pa
 * je kurs pomenut u 4% sesija, dok je blog (formulisan kao zapovest) išao u 38%.
 * Mereno 26.07.2026: nivo prepoznat u 52 od 106 sesija, kurs preporučen u 4.
 *
 * `alreadyRecommended` dolazi iz istorije sesije u bazi, pa se "jednom po razgovoru"
 * ne oslanja na model - kad je preporuka već otišla, dodatka nema.
 */
/** Pre ovoliko korisničkih poruka ne nudimo ništa - prvo neka oseti korist od rada. */
const MIN_PORUKA_ZA_PREPORUKU = 4;

export function courseUpsellAddon(
  course: LevelCourse | null,
  opts: { level: string | null; alreadyRecommended: boolean; userTurns: number }
): string {
  if (opts.alreadyRecommended || !opts.level) return "";
  if (opts.userTurns < MIN_PORUKA_ZA_PREPORUKU) return "";
  // "U ovom odgovoru" umesto "kad se ukaže prilika": opšti nalog model odloži unedogled
  // (mereno 26.07: nivo poznat u 52 sesije, preporuka data u 4).
  const kada = `ZAVRŠI ovaj odgovor jednom kratkom rečenicom u kojoj to preporučiš - toplo, bez pritiska, posle pohvale ako je ima. Prvo normalno odgovori na ono što korisnik radi, pa tek onda preporuka. Samo ovaj put; posle se ne ponavlja.`;
  if (course) {
    return `\n\nPREPORUČI ovom korisniku Natašin kurs: ${course.title} - ${course.price} RSD - ${SITE_URL}/kursevi/${course.slug}. ${kada}`;
  }
  return `\n\nPREPORUČI ovom korisniku Natašinu ponudu kurseva za njegov nivo: ${SITE_URL}/kursevi. ${kada}`;
}

export async function getLevelCourse(
  admin: SupabaseClient,
  level: string | null
): Promise<LevelCourse | null> {
  if (!level) return null;
  const entry = LEVEL_VIDEO_COURSE[level.toUpperCase()];
  if (!entry) return null;
  const { data, error } = await admin
    .from("courses")
    .select("price")
    .eq("slug", entry.slug)
    .maybeSingle();
  if (error || !data || (data as { price: number | null }).price == null) return null;
  return { slug: entry.slug, title: entry.title, price: (data as { price: number }).price };
}
