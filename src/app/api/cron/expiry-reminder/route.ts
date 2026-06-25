// src/app/api/cron/expiry-reminder/route.ts
// Podsetnik ~15 dana pre isteka pristupa + poziv na obnovu (kupon OBNOVI50).
// Cilja sav pristup sa istekom u narednih 15 dana. Isključuje individualne mesečne pakete
// (category="mesecni" = ind paket 4/8/12 - nemaju godišnji platformski pristup).
// U praksi istek imaju samo VIDEO (samostalni) kursevi, uključujući VIDEO FSP i FIDE.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendExpiryReminder } from "@/lib/email";

export const dynamic = "force-dynamic";

const MAX_PER_RUN = 30;
const WINDOW_DAYS = 15;

// Kursevi koji NE dobijaju podsetnik o isteku/obnovi, iako imaju expires_at u course_access.
// "kurs-konverzacije" = stari migrirani LearnDash konverzacijski (živi grupni kurs) - nema
// platformsku obnovu ni važeći kupon; obnova = upis u novi živi termin, ne "obnovi 50%".
const EXCLUDED_SLUGS = new Set(["kurs-konverzacije", "konverzacijski-b1-sadrzaj"]);

type Row = Record<string, unknown>;
async function fetchAll(build: () => { range: (a: number, b: number) => PromiseLike<{ data: Row[] | null }> }): Promise<Row[]> {
  const out: Row[] = [];
  let o = 0;
  for (;;) {
    const { data } = await build().range(o, o + 999);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < 1000) break;
    o += 1000;
  }
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get("test");
  const dryRun = searchParams.get("dry") === "1";

  const admin = createAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const windowIso = new Date(now + WINDOW_DAYS * 86400000).toISOString();

  const { data: courses } = await admin.from("courses").select("id, title, slug, category");
  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));
  const excluded = new Set(
    (courses ?? [])
      .filter((c) => c.category === "mesecni" || EXCLUDED_SLUGS.has(c.slug))
      .map((c) => c.id)
  );

  // TEST režim: pošalji jedan probni na dati mejl
  if (testEmail) {
    const sample = (courses ?? []).find((c) => c.slug === "kurs-nemackog-jezika-a1-1") ?? (courses ?? [])[0];
    await sendExpiryReminder({
      email: testEmail,
      name: "Test",
      courseTitle: sample?.title ?? "Nemački A1.1",
      courseSlug: sample?.slug ?? "kurs-nemackog-jezika-a1-1",
      expiresAt: windowIso,
      withCoupon: searchParams.get("nocoupon") !== "1",
    });
    return NextResponse.json({ test: testEmail, withCoupon: searchParams.get("nocoupon") !== "1", sent: 1 });
  }

  // Pristup koji ističe u narednih WINDOW_DAYS dana (i još nije istekao).
  // Dva izvora: VIDEO (course_access) + INDIVIDUALNI (individual_enrollments).
  // Grupni se NE obrađuje ovde - nema istek po polazniku (vezan za kraj kohorte).
  const videoAccess = await fetchAll(() =>
    admin
      .from("course_access")
      .select("user_id, course_id, expires_at")
      .not("expires_at", "is", null)
      .gte("expires_at", nowIso)
      .lte("expires_at", windowIso)
  ) as { user_id: string; course_id: string; expires_at: string }[];

  const indEnroll = await fetchAll(() =>
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
  const indUsers = await fetchAll(() => admin.from("individual_enrollments").select("user_id").eq("status", "active")) as { user_id: string }[];
  const grpUsers = await fetchAll(() => admin.from("group_enrollments").select("user_id").eq("status", "active")) as { user_id: string }[];
  const noCouponUsers = new Set([...indUsers, ...grpUsers].map((u) => u.user_id));

  // Već poslati (dedup po user+course+expires_at)
  const already = await fetchAll(() => admin.from("expiry_reminders").select("user_id, course_id, expires_at")) as {
    user_id: string; course_id: string; expires_at: string;
  }[];
  const sentSet = new Set(already.map((s) => `${s.user_id}|${s.course_id}|${s.expires_at}`));

  const eligible = access.filter((a) => {
    const c = courseMap.get(a.course_id);
    if (!c || !c.slug) return false;          // bez kursa/slug-a nema linka
    if (excluded.has(a.course_id)) return false; // ind mesečni paketi 4/8/12
    return !sentSet.has(`${a.user_id}|${a.course_id}|${a.expires_at}`);
  });

  if (dryRun) return NextResponse.json({ dry: true, totalEligible: eligible.length, wouldSend: Math.min(eligible.length, MAX_PER_RUN) });

  const batch = eligible.slice(0, MAX_PER_RUN);
  if (batch.length === 0) return NextResponse.json({ candidates: 0, sent: 0 });

  const ids = [...new Set(batch.map((a) => a.user_id))];
  const { data: profiles } = await admin.from("user_profiles").select("id, email, full_name").in("id", ids);
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
      expiresAt: a.expires_at,
      withCoupon: !noCouponUsers.has(a.user_id),
    });
    await admin.from("expiry_reminders").insert({ user_id: a.user_id, course_id: a.course_id, expires_at: a.expires_at });
    sent++;
  }

  return NextResponse.json({ candidates: batch.length, sent });
}
