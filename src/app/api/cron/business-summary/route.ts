import { NextRequest, NextResponse } from "next/server";
import { withCronLog } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { nivoForSlug } from "@/lib/course-nivo";
import { fetchGa4Weekly } from "@/lib/ga4-report";
import { sendWeeklyBusinessSummary, type WeeklySummary } from "@/lib/email";

// Nedeljni cron (ponedeljkom): poslovni rezime adminu iz ŽIVE Supabase baze.
// Zamenjuje stari marketinški Apps Script koji je čitao iz ručnog Google Sheet-a.
// Zaštita: Bearer CRON_SECRET. `?dry=1` vraća JSON bez slanja mejla.
type SupaAdmin = ReturnType<typeof createAdminClient>;

// Skup user_id-eva koji imaju bar jedan red u lesson_progress (= krenuli su).
// Pejdžuje da ne udari u PostgREST cap od 1000 redova i tiho podbroji.
async function usersWithProgress(admin: SupaAdmin, userIds: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  const chunkSize = 150;
  const page = 1000;
  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    let from = 0;
    for (;;) {
      const { data } = await admin
        .from("lesson_progress")
        .select("user_id")
        .in("user_id", chunk)
        .range(from, from + page - 1);
      const rows = (data ?? []) as { user_id: string }[];
      for (const r of rows) found.add(r.user_id);
      if (rows.length < page) break;
      from += page;
    }
  }
  return found;
}

async function cronHandler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dry = new URL(request.url).searchParams.get("dry") === "1";
  const admin = createAdminClient();

  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 86400000);
  const prevStart = new Date(now.getTime() - 14 * 86400000);
  const start30 = new Date(now.getTime() - 30 * 86400000);
  const in15 = new Date(now.getTime() + 15 * 86400000);
  const fmtDate = (v: string | Date) =>
    new Date(v).toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" });

  // ---- 1) PRIHOD (naplaćene porudžbine ove i prošle nedelje) ----
  const { data: weekOrders } = await admin
    .from("orders")
    .select("total, payment_method, coupon_code")
    .eq("payment_status", "completed")
    .gte("created_at", weekStart.toISOString());
  const { data: prevOrders } = await admin
    .from("orders")
    .select("total")
    .eq("payment_status", "completed")
    .gte("created_at", prevStart.toISOString())
    .lt("created_at", weekStart.toISOString());

  const wOrders = (weekOrders ?? []) as { total: number | null; payment_method: string | null; coupon_code: string | null }[];
  const pOrders = (prevOrders ?? []) as { total: number | null }[];

  const metMap = new Map<string, { broj: number; iznos: number }>();
  for (const o of wOrders) {
    const k = o.payment_method || "ostalo";
    const cur = metMap.get(k) ?? { broj: 0, iznos: 0 };
    cur.broj += 1;
    cur.iznos += o.total ?? 0;
    metMap.set(k, cur);
  }
  const prihod: WeeklySummary["prihod"] = {
    iznos: wOrders.reduce((s, o) => s + (o.total ?? 0), 0),
    broj: wOrders.length,
    prosleIznos: pOrders.reduce((s, o) => s + (o.total ?? 0), 0),
    prosleBroj: pOrders.length,
    poMetodu: [...metMap.entries()]
      .map(([metod, v]) => ({ metod, ...v }))
      .sort((a, b) => b.iznos - a.iznos),
  };

  // ---- 2) AKTIVACIJA ----
  // course_access nema FK embed (PGRST200) → odvojeni upiti, kao u jutarnji-pregled.
  const { data: acc7 } = await admin
    .from("course_access")
    .select("user_id, course_id, granted_at")
    .gte("granted_at", weekStart.toISOString());
  const { data: acc30 } = await admin
    .from("course_access")
    .select("user_id")
    .gte("granted_at", start30.toISOString());
  const acc7Rows = (acc7 ?? []) as { user_id: string; course_id: string; granted_at: string }[];
  const users7 = [...new Set(acc7Rows.map((r) => r.user_id))];
  const users30 = [...new Set(((acc30 ?? []) as { user_id: string }[]).map((r) => r.user_id))];
  const started = await usersWithProgress(admin, [...new Set([...users7, ...users30])]);
  const aktivacija: WeeklySummary["aktivacija"] = {
    noviPristup: users7.length,
    odNjihKrenulo: users7.filter((u) => started.has(u)).length,
    zaglavljeni30: users30.filter((u) => !started.has(u)).length,
  };

  // ---- 3) NOVI UPISI po nivou/tipu ----
  const upisMap = new Map<string, number>(); // ključ: `${nivo}||${tip}`
  const bump = (nivo: string, tip: string, n = 1) => {
    const k = `${nivo}||${tip}`;
    upisMap.set(k, (upisMap.get(k) ?? 0) + n);
  };

  // Video (course_access ove nedelje) → naziv kursa kao nivo
  const acc7CourseIds = [...new Set(acc7Rows.map((r) => r.course_id))];
  const { data: acc7Courses } = acc7CourseIds.length
    ? await admin.from("courses").select("id, title, course_type, slug").in("id", acc7CourseIds)
    : { data: [] as { id: string; title?: string; course_type?: string; slug?: string }[] };
  const courseMap = new Map((acc7Courses ?? []).map((c) => [c.id, c]));
  for (const r of acc7Rows) {
    const c = courseMap.get(r.course_id);
    const nivo = (c?.slug && nivoForSlug(c.slug)) || c?.title || "Kurs";
    bump(nivo, "Video", 1);
  }

  // Grupni (group_enrollments ove nedelje)
  const { data: grpEnr } = await admin
    .from("group_enrollments")
    .select("group_id, status, enrolled_at")
    .eq("status", "active")
    .gte("enrolled_at", weekStart.toISOString());
  const grpRows = (grpEnr ?? []) as { group_id: string }[];
  const grpIds = [...new Set(grpRows.map((r) => r.group_id))];
  const { data: grpData } = grpIds.length
    ? await admin.from("groups").select("id, level").in("id", grpIds)
    : { data: [] as { id: string; level?: string }[] };
  const grpLevelMap = new Map((grpData ?? []).map((g) => [g.id, g.level]));
  for (const r of grpRows) bump(grpLevelMap.get(r.group_id) || "Grupa", "Grupni", 1);

  // Individualni 1:1 (individual_enrollments ove nedelje)
  const { data: indEnr } = await admin
    .from("individual_enrollments")
    .select("course_id, created_at")
    .gte("created_at", weekStart.toISOString());
  const indRows = (indEnr ?? []) as { course_id: string }[];
  const indCourseIds = [...new Set(indRows.map((r) => r.course_id))];
  const { data: indCourses } = indCourseIds.length
    ? await admin.from("courses").select("id, title, slug").in("id", indCourseIds)
    : { data: [] as { id: string; title?: string; slug?: string }[] };
  const indCourseMap = new Map((indCourses ?? []).map((c) => [c.id, c]));
  for (const r of indRows) {
    const c = indCourseMap.get(r.course_id);
    const nivo = (c?.slug && nivoForSlug(c.slug)) || c?.title || "Kurs";
    bump(nivo, "1:1", 1);
  }

  const upisi: WeeklySummary["upisi"] = [...upisMap.entries()]
    .map(([k, broj]) => {
      const [nivo, tip] = k.split("||");
      return { nivo, tip, broj };
    })
    .sort((a, b) => b.broj - a.broj);
  const upisiUkupno = upisi.reduce((s, u) => s + u.broj, 0);

  // ---- 4) ISTEK & OBNOVE ----
  const { data: expiring } = await admin
    .from("course_access")
    .select("user_id, course_id, expires_at")
    .not("expires_at", "is", null)
    .gte("expires_at", now.toISOString())
    .lte("expires_at", in15.toISOString())
    .order("expires_at", { ascending: true });
  const expRows = (expiring ?? []) as { user_id: string; course_id: string; expires_at: string }[];
  const expUserIds = [...new Set(expRows.map((r) => r.user_id))];
  const expCourseIds = [...new Set(expRows.map((r) => r.course_id))];
  const { data: expProfiles } = expUserIds.length
    ? await admin.from("user_profiles").select("id, full_name, email").in("id", expUserIds)
    : { data: [] as { id: string; full_name?: string; email?: string }[] };
  const { data: expCourses } = expCourseIds.length
    ? await admin.from("courses").select("id, title").in("id", expCourseIds)
    : { data: [] as { id: string; title?: string }[] };
  const expProfMap = new Map((expProfiles ?? []).map((p) => [p.id, p]));
  const expCourseMap = new Map((expCourses ?? []).map((c) => [c.id, c]));
  const istekStavke = expRows.slice(0, 8).map((r) => {
    const u = expProfMap.get(r.user_id);
    const c = expCourseMap.get(r.course_id);
    return { ime: u?.full_name || u?.email || "", kurs: c?.title || "", datum: fmtDate(r.expires_at) };
  });
  const obnovi50 = wOrders.filter((o) => (o.coupon_code || "").toUpperCase() === "OBNOVI50").length;
  const istek: WeeklySummary["istek"] = {
    brojNarednih15: expRows.length,
    obnovi50OveNedelje: obnovi50,
    stavke: istekStavke,
  };

  // ---- 5) ODBIJENE KARTICE ----
  const { data: failed } = await admin
    .from("orders")
    .select("full_name, total, created_at, nestpay_status")
    .eq("nestpay_status", "failed")
    .gte("created_at", weekStart.toISOString())
    .order("created_at", { ascending: false });
  const failedRows = (failed ?? []) as { full_name: string | null; total: number | null; created_at: string }[];
  const declined: WeeklySummary["declined"] = {
    broj: failedRows.length,
    stavke: failedRows.slice(0, 8).map((o) => ({
      ime: o.full_name || "",
      iznos: o.total ?? 0,
      datum: fmtDate(o.created_at),
    })),
  };

  // ---- 6) SAOBRAĆAJ (GA4) — null ako kredencijali nisu postavljeni ----
  const ga4 = await fetchGa4Weekly();

  const summary: WeeklySummary = {
    odDatum: fmtDate(weekStart),
    doDatum: fmtDate(now),
    prihod,
    aktivacija,
    upisi,
    upisiUkupno,
    istek,
    declined,
    ga4,
  };

  if (dry) {
    return NextResponse.json({ ok: true, dryRun: true, summary });
  }

  await sendWeeklyBusinessSummary(summary);
  console.log("[cron/business-summary] poslat nedeljni izveštaj", {
    prihod: summary.prihod.iznos,
    upisi: summary.upisiUkupno,
    zaglavljeni: summary.aktivacija.zaglavljeni30,
    declined: summary.declined.broj,
  });
  return NextResponse.json({
    ok: true,
    prihod: summary.prihod.iznos,
    porudzbine: summary.prihod.broj,
    upisi: summary.upisiUkupno,
    zaglavljeni: summary.aktivacija.zaglavljeni30,
    istice15: summary.istek.brojNarednih15,
    declined: summary.declined.broj,
    ga4: ga4 ? "ok" : "preskočeno (nema kredencijala)",
  });
}

export const GET = withCronLog("business-summary", cronHandler);
