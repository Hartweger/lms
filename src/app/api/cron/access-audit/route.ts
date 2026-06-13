import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAccessAuditEmail } from "@/lib/email";

// Nedeljni cron (ponedeljak 7:30): „pristup bez kupovine".
// Svaki regularan grant (order/grupa/migracija/webhook) od 13.06.2026. ostavlja `source` tag.
// course_access bez source-a upisan POSLE tog datuma = sumnjivo (npr. bug u mapiranju proizvoda) → mejl Nataši.
// Stari (pre-cutover) grantovi imaju source=null legitimno i NAMERNO se ignorišu.
// Zaštita: Bearer CRON_SECRET.
const CUTOFF = "2026-06-14T00:00:00Z";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const fmtDate = (v: string | Date) =>
    new Date(v).toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" });

  const { data: flagged, error } = await admin
    .from("course_access")
    .select("granted_at, user_id, course_id")
    .is("source", null)
    .gte("granted_at", CUTOFF)
    .order("granted_at", { ascending: false });

  if (error) {
    console.error("[cron/access-audit] query pao:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!flagged || flagged.length === 0) {
    console.log("[cron/access-audit] čisto - nema grantova bez source-a");
    return NextResponse.json({ ok: true, flagged: 0 });
  }

  // Eksplicitni lookup-ovi (course_access.user_id gleda na auth.users - nema PostgREST embed ka user_profiles).
  const userIds = [...new Set(flagged.map((r) => r.user_id))];
  const courseIds = [...new Set(flagged.map((r) => r.course_id))];
  const { data: profs } = await admin.from("user_profiles").select("id, full_name, email").in("id", userIds);
  const { data: courses } = await admin.from("courses").select("id, title").in("id", courseIds);
  const P = new Map((profs ?? []).map((p) => [p.id, p]));
  const C = new Map((courses ?? []).map((c) => [c.id, c.title]));

  const rows = flagged.map((r) => {
    const p = P.get(r.user_id);
    return {
      ime: p?.full_name || p?.email || r.user_id,
      email: p?.email || "",
      kurs: C.get(r.course_id) || r.course_id,
      datum: fmtDate(r.granted_at as string),
    };
  });

  await sendAccessAuditEmail(rows);
  console.warn(`[cron/access-audit] ${rows.length} grantova bez opravdanja - mejl poslat`);
  return NextResponse.json({ ok: true, flagged: rows.length });
}
