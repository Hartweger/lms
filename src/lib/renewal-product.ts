import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sadržajni kurs → proizvod kojim se pristup obnavlja.
 *
 * Pristup se u `course_access` vodi na SADRŽAJNI kurs („nemacki-a1-1"), a taj kurs
 * nije u prodaji (`is_purchasable=false`) - prodaje se proizvod („video-kurs-a1")
 * koji ga otključava preko `course_unlocks`. Link „Obnovi −50%" na sadržajni slug
 * zato pada na 404 (`/kupovina/[slug]` traži `is_purchasable=true`).
 *
 * Uzimaju se samo samoposlužni proizvodi (video/paket): grupni i individualni se
 * ne obnavljaju klikom, za njih je obnova dogovor sa profesorkom.
 */
const SELF_SERVE_CATEGORIES = new Set(["video", "paket"]);

interface CourseRow {
  id: string;
  slug: string;
  category: string | null;
  is_purchasable: boolean;
}

/** Vraća mapu contentCourseId → slug proizvoda za obnovu. Kurs bez proizvoda se izostavlja. */
export async function renewalProductSlugs(
  admin: SupabaseClient,
  contentCourseIds: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const ids = [...new Set(contentCourseIds.filter(Boolean))];
  if (ids.length === 0) return out;

  // RLS: `course_unlocks` nije čitljiv za anon/student - mora admin klijent, inače
  // upit tiho vrati 0 redova i dugme nestane svima.
  const { data: unlocks } = await admin
    .from("course_unlocks")
    .select("purchasable_course_id, content_course_id")
    .in("content_course_id", ids);

  const productIds = (unlocks ?? []).map((u) => u.purchasable_course_id as string);
  const { data: courses } = await admin
    .from("courses")
    .select("id, slug, category, is_purchasable")
    .in("id", [...new Set([...ids, ...productIds])]);
  const byId = new Map<string, CourseRow>((courses ?? []).map((c) => [c.id as string, c as CourseRow]));

  const usable = (c: CourseRow | undefined): c is CourseRow =>
    !!c && c.is_purchasable && SELF_SERVE_CATEGORIES.has(c.category ?? "");

  for (const id of ids) {
    const candidates = (unlocks ?? [])
      .filter((u) => u.content_course_id === id)
      .map((u) => byId.get(u.purchasable_course_id as string))
      .filter(usable);
    // „video" ima prednost nad „paket": obnavlja se tačno taj nivo, ne skuplji paket.
    const best =
      candidates.find((c) => c.category === "video") ??
      candidates[0] ??
      // Kurs koji je sam svoj proizvod (npr. FSP, Položi FIDE) - bez unlocks reda.
      (usable(byId.get(id)) ? byId.get(id) : undefined);
    if (best) out.set(id, best.slug);
  }
  return out;
}

/** Isto, za jedan kurs. Vraća null ako proizvod za obnovu ne postoji. */
export async function renewalProductSlug(
  admin: SupabaseClient,
  contentCourseId: string
): Promise<string | null> {
  const map = await renewalProductSlugs(admin, [contentCourseId]);
  return map.get(contentCourseId) ?? null;
}
