import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDailyAdminBrief, type DailyBrief } from "@/lib/email";

// Dnevni cron (7:00): jutarnji pregled stanja adminu (Nataši).
// Zamenjuje stari Apps Script "jutarnjeUpozorenjeV2". Zaštita: Bearer CRON_SECRET.
export async function GET(request: NextRequest) {
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
    orderNumber: o.order_number ?? "—",
    ime: o.full_name ?? "",
    total: o.total ?? 0,
    metod: o.payment_method ?? "",
    danaStaro: Math.floor((now.getTime() - new Date(o.created_at).getTime()) / 86400000),
  }));

  // 4) Pristup koji ističe narednih 7 dana.
  const { data: expiring } = await admin
    .from("course_access")
    .select("expires_at, user:user_id(full_name, email), course:course_id(title)")
    .not("expires_at", "is", null)
    .gte("expires_at", now.toISOString())
    .lte("expires_at", plusDays(7).toISOString())
    .order("expires_at", { ascending: true });
  const isticePristup: DailyBrief["isticePristup"] = (expiring ?? []).map((r) => {
    const u = one(r.user as unknown) as { full_name?: string; email?: string } | null;
    const c = one(r.course as unknown) as { title?: string } | null;
    return { ime: u?.full_name || u?.email || "", kurs: c?.title || "", datum: fmtDate(r.expires_at as string) };
  });

  // 5) Individualni paketi — ostao tačno 1 čas.
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
