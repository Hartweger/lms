import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;
  const { data: groups } = await admin.from("groups")
    .select("*, professor:professor_id(full_name), content_course:content_course_id(slug,title)")
    .order("start_date", { ascending: false });
  const { data: enr } = await admin.from("group_enrollments").select("group_id").eq("status", "active");
  const counts: Record<string, number> = {};
  (enr || []).forEach((e) => { counts[e.group_id] = (counts[e.group_id] || 0) + 1; });
  const withCounts = (groups || []).map((g) => ({ ...g, enrolled: counts[g.id] || 0 }));
  return NextResponse.json({ groups: withCounts });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;
  const body = await req.json();
  const { data, error } = await admin.from("groups").insert({
    content_course_id: body.content_course_id || null,
    purchasable_course_id: body.purchasable_course_id || null,
    level: body.level,
    type: body.type || "grupni",
    professor_id: body.professor_id || null,
    status: body.status || "planiran",
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    duration_weeks: body.duration_weeks ?? null,
    sessions_count: body.sessions_count ?? null,
    days: body.days || [],
    session_time: body.session_time || null,
    min_seats: body.min_seats ?? 3,
    max_seats: body.max_seats ?? 6,
    price: body.price ?? null,
    notes: body.notes || null,
    manual_enrolled: body.manual_enrolled ?? null,
    source: "rucni-unos-2026-06",
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
