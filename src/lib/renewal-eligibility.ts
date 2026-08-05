import type { SupabaseClient } from "@supabase/supabase-js";

/** Kategorije proizvoda čija se kupovina ne obnavlja samoposlužno, kuponom. */
const ENROLLMENT_CATEGORIES = new Set(["grupni", "individualni", "mesecni"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Kursevi do kojih je polaznik došao kupovinom GRUPNOG ili INDIVIDUALNOG kursa.
 *
 * Za njih NE važi samoposlužna obnova kuponom OBNOVI50 (odluka Natašina, 04.08.2026):
 * grupni proizvod se prodaje po POLUNIVOU („grupni-kurs-...-a1-1" = 19.600), a video
 * proizvod pokriva CEO nivo („video-kurs-a1" = 11.600, otključava i „nemacki-a1-1" i
 * „nemacki-a1-2"). Sa −50% bi polaznik grupnog A1.1 za 5.800 dobio i sadržaj A1.2 koji
 * nikad nije platio. Za njih je obnova dogovor sa profesorkom, pa im i mejl o isteku ide
 * bez kupona (`expiry-reminder`, `noCouponUsers`).
 *
 * Gleda se IZVOR pristupa (`course_access.source`), ne to da li je polaznik trenutno u
 * grupi. Razlika je bitna: dosta polaznika koji su sada u grupi ima i stariji, plaćen
 * video pristup sa WP-a („wp-migration-…"). Njima obnova ostaje - platili su video kurs.
 * Nepoznat izvor (migracije, ručni unos, prazno) se zato tumači u korist polaznika.
 */
export async function enrollmentDerivedCourseIds(
  admin: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const out = new Set<string>();
  if (!userId) return out;

  const { data: access } = await admin
    .from("course_access").select("course_id, source").eq("user_id", userId);
  const rows = (access ?? []) as { course_id: string; source: string | null }[];
  if (rows.length === 0) return out;

  // Ručni upis u grupu ne prolazi kroz porudžbinu - prepoznaje se po izvoru.
  rows.forEach((r) => { if ((r.source ?? "").startsWith("grupa")) out.add(r.course_id); });

  // Ostalo se odlučuje po porudžbini iz koje je pristup dat: `order:{order_number|id}`.
  const tokens = [...new Set(
    rows.map((r) => r.source ?? "").filter((s) => s.startsWith("order:")).map((s) => s.slice(6))
  )];
  if (tokens.length === 0) return out;

  const uuids = tokens.filter((t) => UUID.test(t));
  const numbers = tokens.filter((t) => !UUID.test(t));
  const [{ data: byNumber }, { data: byId }] = await Promise.all([
    numbers.length
      ? admin.from("orders").select("id, order_number, items").in("order_number", numbers)
      : Promise.resolve({ data: [] }),
    uuids.length
      ? admin.from("orders").select("id, order_number, items").in("id", uuids)
      : Promise.resolve({ data: [] }),
  ]);
  const orders = [...(byNumber ?? []), ...(byId ?? [])] as {
    id: string; order_number: string | null; items: { course_slug?: string }[] | null;
  }[];
  if (orders.length === 0) return out;

  const slugs = [...new Set(orders.flatMap((o) => (o.items ?? []).map((i) => i.course_slug).filter(Boolean)))] as string[];
  const { data: courses } = slugs.length
    ? await admin.from("courses").select("slug, category").in("slug", slugs)
    : { data: [] };
  const categoryBySlug = new Map(
    ((courses ?? []) as { slug: string; category: string | null }[]).map((c) => [c.slug, c.category])
  );

  const enrollmentOrders = new Set<string>();
  orders.forEach((o) => {
    const isEnrollment = (o.items ?? []).some(
      (i) => i.course_slug && ENROLLMENT_CATEGORIES.has(categoryBySlug.get(i.course_slug) ?? "")
    );
    if (!isEnrollment) return;
    if (o.order_number) enrollmentOrders.add(o.order_number);
    if (o.id) enrollmentOrders.add(o.id);
  });

  rows.forEach((r) => {
    const s = r.source ?? "";
    if (s.startsWith("order:") && enrollmentOrders.has(s.slice(6))) out.add(r.course_id);
  });

  return out;
}

/**
 * Sme li mejl da obnovi PROIZVOD `productCourseId` kuponom (renewal_only, npr. OBNOVI50).
 *
 * Traži bar jedan sadržajni kurs tog proizvoda do kog polaznik NIJE došao kupovinom
 * grupnog ili individualnog kursa. Ko je pored grupe kupio i video kurs, obnovu zadržava.
 * Vlasništvo se i dalje proverava zasebno (`emailOwnsCourse`) - ovo je dodatna kapija.
 */
export async function emailCanRenewWithCoupon(
  admin: SupabaseClient,
  email: string,
  productCourseId: string
): Promise<boolean> {
  const e = (email ?? "").trim().toLowerCase();
  if (!e || !productCourseId) return false;

  const { data: prof } = await admin.from("user_profiles").select("id").eq("email", e).maybeSingle();
  if (!prof) return false;

  // Proizvod ≠ sadržaj: pristup se upisuje na sadržajne kurseve iz `course_unlocks`.
  // Sam proizvod ostaje u listi zbog kurseva koji su sami sebi proizvod (FSP, Položi FIDE).
  const { data: unlocks } = await admin
    .from("course_unlocks").select("content_course_id").eq("purchasable_course_id", productCourseId);
  const ids = [...new Set([productCourseId, ...(unlocks ?? []).map((u) => u.content_course_id as string)])];

  const { data: access } = await admin
    .from("course_access").select("course_id").eq("user_id", prof.id).in("course_id", ids);
  const owned = (access ?? []).map((a) => a.course_id as string);
  if (owned.length === 0) return false;

  const derived = await enrollmentDerivedCourseIds(admin, prof.id as string);
  return owned.some((id) => !derived.has(id));
}
