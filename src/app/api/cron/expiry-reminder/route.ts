// src/app/api/cron/expiry-reminder/route.ts
// Podsetnik ~15 dana pre isteka pristupa + poziv na obnovu (kupon OBNOVI50).
// Cilja sav pristup sa istekom u narednih 15 dana. Isključuje individualne mesečne pakete
// (category="mesecni" = ind paket 4/8/12 - nemaju godišnji platformski pristup).
// U praksi istek imaju samo VIDEO (samostalni) kursevi, uključujući VIDEO FSP i FIDE.
import { NextResponse } from "next/server";
import { withCronLog, must } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendExpiryReminder } from "@/lib/email";
import { renewalProductSlugs } from "@/lib/renewal-product";

export const dynamic = "force-dynamic";

const MAX_PER_RUN = 30;
const WINDOW_DAYS = 15;

// Kursevi koji NE dobijaju podsetnik o isteku/obnovi, iako imaju expires_at u course_access.
// "kurs-konverzacije" = stari migrirani LearnDash konverzacijski (živi grupni kurs) - nema
// platformsku obnovu ni važeći kupon; obnova = upis u novi živi termin, ne "obnovi 50%".
const EXCLUDED_SLUGS = new Set(["kurs-konverzacije", "konverzacijski-b1-sadrzaj"]);

type Row = Record<string, unknown>;
async function fetchAll(
  label: string,
  build: () => { range: (a: number, b: number) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }> }
): Promise<Row[]> {
  const out: Row[] = [];
  let o = 0;
  for (;;) {
    // Greška upita mora da obori cron (must) - tiho prazna lista bi značila pogrešne kandidate.
    const data = must(await build().range(o, o + 999), label);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < 1000) break;
    o += 1000;
  }
  return out;
}

async function cronHandler(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get("test");
  const dryRun = searchParams.get("dry") === "1";

  const admin = createAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const windowIso = new Date(now + WINDOW_DAYS * 86400000).toISOString();

  const courses = must(await admin.from("courses").select("id, title, slug, category"), "courses");
  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));
  const excluded = new Set(
    (courses ?? [])
      .filter((c) => c.category === "mesecni" || EXCLUDED_SLUGS.has(c.slug))
      .map((c) => c.id)
  );

  // TEST režim: pošalji jedan probni na dati mejl
  if (testEmail) {
    const sample = (courses ?? []).find((c) => c.slug === "nemacki-a1-1") ?? (courses ?? [])[0];
    const testRenew = sample ? (await renewalProductSlugs(admin, [sample.id])).get(sample.id) ?? null : null;
    const { data: testKupon } = await admin
      .from("coupons").select("renewal_days_after").eq("code", "OBNOVI50").maybeSingle();
    await sendExpiryReminder({
      email: testEmail,
      name: "Test",
      courseTitle: sample?.title ?? "Nemački A1.1",
      courseSlug: sample?.slug ?? "nemacki-a1-1",
      renewSlug: testRenew,
      expiresAt: windowIso,
      withCoupon: searchParams.get("nocoupon") !== "1",
      couponDaysAfter: testKupon?.renewal_days_after ?? null,
    });
    return NextResponse.json({ test: testEmail, withCoupon: searchParams.get("nocoupon") !== "1", sent: 1 });
  }

  // Pristup koji ističe u narednih WINDOW_DAYS dana (i još nije istekao).
  // Dva izvora: VIDEO (course_access) + INDIVIDUALNI (individual_enrollments).
  // Grupni se NE obrađuje ovde - nema istek po polazniku (vezan za kraj kohorte).
  const videoAccess = await fetchAll("course_access", () =>
    admin
      .from("course_access")
      .select("user_id, course_id, expires_at")
      .not("expires_at", "is", null)
      .gte("expires_at", nowIso)
      .lte("expires_at", windowIso)
  ) as { user_id: string; course_id: string; expires_at: string }[];

  const indEnroll = await fetchAll("individual_enrollments", () =>
    admin
      .from("individual_enrollments")
      .select("user_id, course_id, expires_at")
      .eq("status", "active")
      .not("expires_at", "is", null)
      .gte("expires_at", nowIso)
      .lte("expires_at", windowIso)
  ) as { user_id: string; course_id: string; expires_at: string }[];

  const access = [...videoAccess, ...indEnroll];

  // Ko dobija mejl BEZ kupona: individualni i grupni polaznici (za njih obnova = sledeći nivo sa
  // profesorom, ne „obnovi isti kurs 50%"). Video kupci → SA kuponom OBNOVI50.
  const indUsers = await fetchAll("individual_enrollments active", () => admin.from("individual_enrollments").select("user_id").eq("status", "active")) as { user_id: string }[];
  const grpUsers = await fetchAll("group_enrollments", () => admin.from("group_enrollments").select("user_id").eq("status", "active")) as { user_id: string }[];
  const noCouponUsers = new Set([...indUsers, ...grpUsers].map((u) => u.user_id));

  // Već poslati (dedup po user+course+expires_at)
  const already = await fetchAll("expiry_reminders", () => admin.from("expiry_reminders").select("user_id, course_id, expires_at")) as {
    user_id: string; course_id: string; expires_at: string;
  }[];
  const sentSet = new Set(already.map((s) => `${s.user_id}|${s.course_id}|${s.expires_at}`));

  const kandidati = access.filter((a) => {
    const c = courseMap.get(a.course_id);
    if (!c || !c.slug) return false;          // bez kursa/slug-a nema linka
    if (excluded.has(a.course_id)) return false; // ind mesečni paketi 4/8/12
    return !sentSet.has(`${a.user_id}|${a.course_id}|${a.expires_at}`);
  });

  // Dugme „Obnovi pristup" mora da vodi na PROIZVOD - sadržajni slug („nemacki-a1-1")
  // nije u prodaji i /kupovina/{slug} na njega vraća 404.
  const renewSlugs = await renewalProductSlugs(admin, kandidati.map((a) => a.course_id));

  // Kurs bez proizvoda za samostalnu obnovu (konverzacijski, „Položi Goethe B2", C1.1)
  // NE dobija podsetnik uopšte - nema šta da se ponudi, a mejl o isteku bez izlaza samo
  // uznemirava. Odluka Natašina, 29.07.2026. Grupni/individualni ovo ne pogađa: njihov
  // sadržajni kurs ima video proizvod, pa i dalje dobijaju info-verziju bez kupona.
  const bezObnove = kandidati.filter((a) => !renewSlugs.has(a.course_id));
  const eligible = kandidati.filter((a) => renewSlugs.has(a.course_id));
  if (bezObnove.length > 0) {
    console.log(`[expiry] preskočeno ${bezObnove.length} - kurs nema proizvod za obnovu: ${[...new Set(bezObnove.map((a) => courseMap.get(a.course_id)?.slug))].join(", ")}`);
  }

  if (dryRun) {
    return NextResponse.json({
      dry: true, totalEligible: eligible.length,
      wouldSend: Math.min(eligible.length, MAX_PER_RUN),
      skippedNoProduct: bezObnove.length,
    });
  }

  const batch = eligible.slice(0, MAX_PER_RUN);
  if (batch.length === 0) return NextResponse.json({ candidates: 0, sent: 0, skippedNoProduct: bezObnove.length });

  // Rok kupona se čita iz baze, ne prepisuje u mejl - da tekst ne odluta od pravila
  // koje checkout stvarno primenjuje (lib/renewal-window.ts).
  const { data: obnoviKupon } = await admin
    .from("coupons").select("renewal_days_after").eq("code", "OBNOVI50").maybeSingle();
  const couponDaysAfter = obnoviKupon?.renewal_days_after ?? null;

  const ids = [...new Set(batch.map((a) => a.user_id))];
  const profiles = must(await admin.from("user_profiles").select("id, email, full_name").in("id", ids), "user_profiles");
  const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  let sent = 0;
  for (const a of batch) {
    const prof = profMap.get(a.user_id);
    const course = courseMap.get(a.course_id);
    if (!prof?.email || !course) continue;
    await sendExpiryReminder({
      email: prof.email,
      name: prof.full_name ?? "",
      courseTitle: course.title,
      courseSlug: course.slug,
      renewSlug: renewSlugs.get(a.course_id) ?? null,
      expiresAt: a.expires_at,
      withCoupon: !noCouponUsers.has(a.user_id),
      couponDaysAfter,
    });
    // Pad upisa mora da obori cron: bez dedup zapisa bi isti čovek sutra dobio dupli podsetnik.
    must(
      await admin.from("expiry_reminders").insert({ user_id: a.user_id, course_id: a.course_id, expires_at: a.expires_at }),
      "expiry_reminders insert"
    );
    sent++;
  }

  return NextResponse.json({ candidates: batch.length, sent, skippedNoProduct: bezObnove.length });
}

export const GET = withCronLog("expiry-reminder", cronHandler);
