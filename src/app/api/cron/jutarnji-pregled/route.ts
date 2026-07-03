import { NextRequest, NextResponse } from "next/server";
import { withCronLog } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDailyAdminBrief, type DailyBrief } from "@/lib/email";

// Dnevni cron (7:00): jutarnji pregled stanja adminu (Nataši).
// Zamenjuje stari Apps Script "jutarnjeUpozorenjeV2". Zaštita: Bearer CRON_SECRET.
async function cronHandler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const one = <T,>(x: T | T[] | null | undefined): T | null =>
    Array.isArray(x) ? (x[0] ?? null) : (x ?? null);

  const now = new Date();
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const startYday = new Date(startToday); startYday.setDate(startYday.getDate() - 1);
  const plusDays = (d: number) => { const x = new Date(startToday); x.setDate(x.getDate() + d); return x; };
  const fmtDate = (v: string | Date) =>
    new Date(v).toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" });

  const todayDate = startToday.toISOString().slice(0, 10);
  const in14Date = plusDays(14).toISOString().slice(0, 10);

  // 1) Narudžbine kreirane juče (broj + naplaćeni iznos).
  const { data: yOrders } = await admin
    .from("orders")
    .select("total, payment_status")
    .gte("created_at", startYday.toISOString())
    .lt("created_at", startToday.toISOString());
  const noveNarudzbine = {
    broj: yOrders?.length ?? 0,
    iznos: (yOrders ?? [])
      .filter((o) => o.payment_status === "completed")
      .reduce((s, o) => s + (o.total ?? 0), 0),
  };

  // 2) Podsetnici za neaktivnost poslati juče.
  const { count: neaktivnostPoslato } = await admin
    .from("inactivity_reminders")
    .select("*", { count: "exact", head: true })
    .gte("sent_at", startYday.toISOString());

  // 3) Neplaćene (pending) narudžbine.
  const { data: pending } = await admin
    .from("orders")
    .select("order_number, full_name, total, payment_method, created_at")
    .eq("payment_status", "pending")
    .order("created_at", { ascending: true });
  const neplacene: DailyBrief["neplacene"] = (pending ?? []).map((o) => ({
    orderNumber: o.order_number ?? "-",
    ime: o.full_name ?? "",
    total: o.total ?? 0,
    metod: o.payment_method ?? "",
    danaStaro: Math.floor((now.getTime() - new Date(o.created_at).getTime()) / 86400000),
  }));

  // 4) Pristup koji ističe narednih 7 dana.
  // NB: course_access nema FK veze ka user_profiles/courses u PostgREST schema cache-u,
  // pa embed select (`user:user_id(...)`) puca (PGRST200) i tiho vraća 0. Zato odvojeni upiti.
  const { data: expiring } = await admin
    .from("course_access")
    .select("user_id, course_id, expires_at")
    .not("expires_at", "is", null)
    .gte("expires_at", now.toISOString())
    .lte("expires_at", plusDays(7).toISOString())
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
  const isticePristup: DailyBrief["isticePristup"] = expRows.map((r) => {
    const u = expProfMap.get(r.user_id);
    const c = expCourseMap.get(r.course_id);
    return { ime: u?.full_name || u?.email || "", kurs: c?.title || "", datum: fmtDate(r.expires_at) };
  });

  // 5) Individualni paketi - ostao tačno 1 čas.
  const { data: indEnr } = await admin
    .from("individual_enrollments")
    .select("package_lessons, lessons_used, user:user_id(full_name), professor:professor_id(full_name), course:course_id(title)")
    .eq("status", "active");
  const indOstao1: DailyBrief["indOstao1"] = (indEnr ?? [])
    .filter((r) => (r.package_lessons ?? 0) - (r.lessons_used ?? 0) === 1)
    .map((r) => {
      const u = one(r.user as unknown) as { full_name?: string } | null;
      const p = one(r.professor as unknown) as { full_name?: string } | null;
      const c = one(r.course as unknown) as { title?: string } | null;
      return { ime: u?.full_name || "", profesorka: p?.full_name || "", kurs: c?.title || "" };
    });

  // 6) Grupe koje se završavaju narednih 14 dana (+ broj aktivnih polaznika).
  const { data: groups } = await admin
    .from("groups")
    .select("id, level, end_date, professor:professor_id(full_name)")
    .in("status", ["otvoren", "u_toku"])
    .not("end_date", "is", null)
    .gte("end_date", todayDate)
    .lte("end_date", in14Date)
    .order("end_date", { ascending: true });
  const grupeKraj: DailyBrief["grupeKraj"] = [];
  for (const g of groups ?? []) {
    const { count } = await admin
      .from("group_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("group_id", g.id)
      .eq("status", "active");
    const p = one(g.professor as unknown) as { full_name?: string } | null;
    grupeKraj.push({
      nivo: g.level ?? "",
      profesorka: p?.full_name || "",
      endDate: fmtDate(g.end_date as string),
      brojPolaznika: count ?? 0,
    });
  }

  // 7) Odbijeni mejlovi / spam prijave u poslednja 24h (Resend webhook → email_bounces).
  const { data: bounceRows } = await admin
    .from("email_bounces")
    .select("email, event, reason, created_at")
    .gte("created_at", startYday.toISOString())
    .order("created_at", { ascending: false });
  const bounces: DailyBrief["bounces"] = (bounceRows ?? []).map((b) => ({
    email: b.email,
    tip: b.event === "complained" ? "spam prijava" : "odbijen",
    razlog: b.reason ?? "",
  }));

  const brief: DailyBrief = {
    datum: fmtDate(startToday),
    noveNarudzbine,
    neaktivnostPoslato: neaktivnostPoslato ?? 0,
    neplacene,
    isticePristup,
    indOstao1,
    grupeKraj,
    bounces,
  };

  await sendDailyAdminBrief(brief);

  console.log("[cron/jutarnji-pregled] poslat pregled", {
    nove: brief.noveNarudzbine.broj,
    neplacene: brief.neplacene.length,
    istice: brief.isticePristup.length,
    ind1: brief.indOstao1.length,
    grupe: brief.grupeKraj.length,
  });
  return NextResponse.json({
    ok: true,
    nove: brief.noveNarudzbine.broj,
    neplacene: brief.neplacene.length,
    istice: brief.isticePristup.length,
    ind1: brief.indOstao1.length,
    grupe: brief.grupeKraj.length,
  });
}

export const GET = withCronLog("jutarnji-pregled", cronHandler);
