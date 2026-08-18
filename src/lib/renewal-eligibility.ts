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
 * Kursevi do kojih je polaznik došao PREKINUTOM pretplatom - mesečno plaćanje otkazano
 * pre nego što je serija isplaćena do kraja.
 *
 * Za njih NE važi samoposlužna obnova kuponom OBNOVI50 (odluka Natašina, 18.08.2026):
 * pristup im ne ističe zato što je godina odslušana, nego zato što je plaćanje prekinuto.
 * Ko otkaže posle 1/12 rata platio je 3.199 od 38.388, pa bi mu podsetnik na istek dao
 * isti sadržaj za pola cene - to nije obnova, to je jeftiniji ulaz kroz otkazivanje.
 * Ko je pretplatu isplatio do kraja (`paid_payments >= total_payments`) platio je punu
 * cenu i obnovu zadržava, isto kao jednokratni video kupac.
 *
 * Gleda se IZVOR pristupa, isto kao kod grupnog/individualnog: blokira se samo pristup
 * koji još stoji na porudžbini prekinute pretplate. Ko je posle prekida isti sadržaj
 * kupio zasebno (izvor prepisan na običnu porudžbinu) obnovu zadržava - platio ju je.
 * Naplate 2..N imaju svoj broj porudžbine, ali istu `subscription_id`, pa se hvataju i one.
 */
export async function cancelledSubscriptionCourseIds(
  admin: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const out = new Set<string>();
  if (!userId) return out;

  const { data: access } = await admin
    .from("course_access").select("course_id, source").eq("user_id", userId);
  const rows = (access ?? []) as { course_id: string; source: string | null }[];
  const tokens = [...new Set(
    rows.map((r) => r.source ?? "").filter((s) => s.startsWith("order:")).map((s) => s.slice(6))
  )];
  if (tokens.length === 0) return out;

  const uuids = tokens.filter((t) => UUID.test(t));
  const numbers = tokens.filter((t) => !UUID.test(t));
  const [{ data: byNumber }, { data: byId }] = await Promise.all([
    numbers.length
      ? admin.from("orders").select("id, order_number, subscription_id").in("order_number", numbers)
      : Promise.resolve({ data: [] }),
    uuids.length
      ? admin.from("orders").select("id, order_number, subscription_id").in("id", uuids)
      : Promise.resolve({ data: [] }),
  ]);
  const orders = [...(byNumber ?? []), ...(byId ?? [])] as {
    id: string; order_number: string | null; subscription_id: string | null;
  }[];
  const subIds = [...new Set(orders.map((o) => o.subscription_id).filter(Boolean))] as string[];
  if (subIds.length === 0) return out;

  const { data: subs } = await admin
    .from("subscriptions")
    .select("id, paid_payments, total_payments")
    .in("id", subIds)
    .eq("status", "cancelled");
  const prekinute = new Set(
    ((subs ?? []) as { id: string; paid_payments: number | null; total_payments: number | null }[])
      .filter((s) => (s.paid_payments ?? 0) < (s.total_payments ?? 0))
      .map((s) => s.id)
  );
  if (prekinute.size === 0) return out;

  const prekinutePorudzbine = new Set<string>();
  orders.forEach((o) => {
    if (!o.subscription_id || !prekinute.has(o.subscription_id)) return;
    if (o.order_number) prekinutePorudzbine.add(o.order_number);
    if (o.id) prekinutePorudzbine.add(o.id);
  });

  rows.forEach((r) => {
    const s = r.source ?? "";
    if (s.startsWith("order:") && prekinutePorudzbine.has(s.slice(6))) out.add(r.course_id);
  });

  return out;
}

/**
 * Svi kursevi kojima polaznik NE sme samoposlužno da produži pristup kuponom -50%:
 * ono do čega je došao upisom u grupni/individualni kurs + ono do čega je došao
 * prekinutom pretplatom. Jedna kapija za sva mesta koja nude obnovu (dashboard,
 * „Moj nalog", validacija kupona, checkout).
 */
export async function noCouponRenewalCourseIds(
  admin: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const [upisom, pretplatom] = await Promise.all([
    enrollmentDerivedCourseIds(admin, userId),
    cancelledSubscriptionCourseIds(admin, userId),
  ]);
  pretplatom.forEach((id) => upisom.add(id));
  return upisom;
}

/**
 * Do kada mejlu važi pristup sadržaju PROIZVODA `productCourseId` - ulaz za vremenski
 * prozor kupona obnove (`lib/renewal-window.ts`).
 *
 * `expiresAt: null` uz `owns: true` znači TRAJAN pristup (nijedan red nema istek), ne
 * „ne zna se": takav polaznik nema šta da obnavlja. Kad proizvod pokriva više sadržajnih
 * kurseva (paket A1+A2+B1), meritoran je NAJDALJI istek - obnova ionako produžava sve.
 */
export async function renewalAccessExpiry(
  admin: SupabaseClient,
  email: string,
  productCourseId: string
): Promise<{ owns: boolean; expiresAt: string | null }> {
  const e = (email ?? "").trim().toLowerCase();
  if (!e || !productCourseId) return { owns: false, expiresAt: null };

  const { data: prof } = await admin.from("user_profiles").select("id").eq("email", e).maybeSingle();
  if (!prof) return { owns: false, expiresAt: null };

  const { data: unlocks } = await admin
    .from("course_unlocks").select("content_course_id").eq("purchasable_course_id", productCourseId);
  const ids = [...new Set([productCourseId, ...(unlocks ?? []).map((u) => u.content_course_id as string)])];

  const { data: access } = await admin
    .from("course_access").select("expires_at").eq("user_id", prof.id).in("course_id", ids);
  const rows = (access ?? []) as { expires_at: string | null }[];
  if (rows.length === 0) return { owns: false, expiresAt: null };
  if (rows.some((r) => r.expires_at == null)) return { owns: true, expiresAt: null };

  const najdalji = rows
    .map((r) => r.expires_at as string)
    .reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
  return { owns: true, expiresAt: najdalji };
}

/**
 * Sme li mejl da obnovi PROIZVOD `productCourseId` kuponom (renewal_only, npr. OBNOVI50).
 *
 * Traži bar jedan sadržajni kurs tog proizvoda do kog polaznik NIJE došao kupovinom
 * grupnog/individualnog kursa ni prekinutom pretplatom. Ko je pored grupe kupio i video
 * kurs, obnovu zadržava.
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

  const bezObnove = await noCouponRenewalCourseIds(admin, prof.id as string);
  return owned.some((id) => !bezObnove.has(id));
}
