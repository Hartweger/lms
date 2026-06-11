import { createAdminClient } from "@/lib/supabase/admin";
import { buildFinansije, monthKey, type ExpenseRow, type FinOrder } from "@/lib/finansije";
import FinansijeClient from "./FinansijeClient";

export const dynamic = "force-dynamic";

export default async function AdminFinansijePage({
  searchParams,
}: {
  searchParams: Promise<{ godina?: string; mesec?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.godina) || now.getFullYear();
  const mesec = sp.mesec ? Number(sp.mesec) || null : null;

  const admin = createAdminClient();
  const [ordersRes, coursesRes, profsRes, lessonsRes, sessionsRes, expensesRes, indEnrRes, groupsRes, membersRes] =
    await Promise.all([
      admin.from("orders").select("id, user_id, created_at, total, items, payment_status"),
      admin.from("courses").select("id, title, slug, course_type"),
      admin.from("user_profiles").select("id, full_name, honorar_ind, honorar_grp").eq("role", "professor"),
      admin.from("individual_lessons").select("lesson_date, professor_id, enrollment_id"),
      admin.from("group_sessions").select("session_date, professor_id, group_id"),
      admin.from("expenses").select("*").order("expense_date", { ascending: false }),
      admin.from("individual_enrollments").select("id, user_id, professor_id, order_id, course_id, status"),
      admin.from("groups").select("id, level, status, max_seats, professor_id, purchasable_course_id, session_time"),
      admin.from("group_enrollments").select("group_id, user_id, status"),
    ]);

  const allOrders = ordersRes.data ?? [];
  const completed: FinOrder[] = allOrders
    .filter((o) => o.payment_status === "completed")
    .map((o) => ({ id: o.id, user_id: o.user_id, created_at: o.created_at, total: Number(o.total) || 0, items: o.items ?? [] }));
  const pendingTotal = allOrders
    .filter((o) => o.payment_status === "pending" && monthKey(o.created_at).startsWith(`${year}-`))
    .reduce((s, o) => s + (Number(o.total) || 0), 0);

  // Spajanja za čistu funkciju: lekcija → kurs (preko enrollmenta), sesija → kupovni kurs (preko grupe)
  const enrollments = indEnrRes.data ?? [];
  const enrById = new Map(enrollments.map((e) => [e.id, e]));
  const groups = groupsRes.data ?? [];
  const groupById = new Map(groups.map((g) => [g.id, g]));

  const lessons = (lessonsRes.data ?? []).map((l) => ({
    lesson_date: l.lesson_date,
    professor_id: l.professor_id,
    course_id: enrById.get(l.enrollment_id)?.course_id ?? null,
  }));
  const sessions = (sessionsRes.data ?? []).map((s) => ({
    session_date: s.session_date,
    professor_id: s.professor_id,
    group_id: s.group_id,
    course_id: groupById.get(s.group_id)?.purchasable_course_id ?? null,
  }));
  const indProfByOrderId: Record<string, string> = {};
  for (const e of enrollments) if (e.order_id && e.professor_id) indProfByOrderId[e.order_id] = e.professor_id;

  const data = buildFinansije({
    year, mesec,
    nowKey: monthKey(now.toISOString()),
    orders: completed,
    courses: coursesRes.data ?? [],
    professors: profsRes.data ?? [],
    lessons, sessions,
    expenses: (expensesRes.data ?? []) as ExpenseRow[],
    indProfByOrderId,
    indEnrollments: enrollments.map((e) => ({ professor_id: e.professor_id, user_id: e.user_id, status: e.status })),
    groups,
    groupMembers: membersRes.data ?? [],
  });

  const profName: Record<string, string> = Object.fromEntries(
    (profsRes.data ?? []).map((p) => [p.id, p.full_name ?? "—"])
  );
  const courseOptions = (coursesRes.data ?? [])
    .map((c) => ({ id: c.id, title: c.title }))
    .sort((a, b) => a.title.localeCompare(b.title, "sr"));

  return (
    <FinansijeClient
      data={data}
      year={year}
      mesec={mesec}
      pendingTotal={pendingTotal}
      profName={profName}
      expenses={(expensesRes.data ?? []) as ExpenseRow[]}
      courseOptions={courseOptions}
    />
  );
}
