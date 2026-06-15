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

// Nekeširan dodatak za chat system prompt. Bez kupona (kupon ide samo na pitanje o ceni).
export function courseUpsellAddon(course: LevelCourse | null): string {
  if (!course) return "";
  return `\n\nKad ovom korisniku preporučuješ kurs (jednom po razgovoru, prirodno posle vežbe), uputi ga baš na: ${course.title} — ${course.price} RSD — ${SITE_URL}/kursevi/${course.slug}. Ne ponavljaj preporuku u istom razgovoru.`;
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
