import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planForSlug, unlockedSlugsAfter } from "@/lib/subscription-plans";

type ProfRef = { full_name: string | null; calendar_url?: string | null };
type CourseRef = { title: string | null; slug: string | null };

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  // Grupni: aktivni upis -> grupa -> sledeci termin
  const { data: enrolls } = await admin
    .from("group_enrollments")
    .select("group_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  const groupIds = (enrolls ?? []).map((e) => e.group_id as string);
  let groups: Array<{
    id: string;
    level: string | null;
    session_time: string | null;
    meet_link: string | null;
    nextSession: string | null;
    professor: string | null;
  }> = [];

  if (groupIds.length) {
    const { data: groupRows } = await admin
      .from("groups")
      .select("id, level, session_time, meet_link, professor:professor_id(full_name)")
      .in("id", groupIds);
    const { data: sessions } = await admin
      .from("group_sessions")
      .select("group_id, session_date")
      .in("group_id", groupIds)
      .gte("session_date", today)
      .eq("cancelled", false)
      .order("session_date", { ascending: true });

    groups = (groupRows ?? []).map((g) => {
      const next = (sessions ?? []).find((s) => s.group_id === g.id);
      const prof = one<ProfRef>(g.professor as ProfRef | ProfRef[] | null);
      return {
        id: g.id as string,
        level: (g.level as string) ?? null,
        session_time: (g.session_time as string) ?? null,
        meet_link: (g.meet_link as string) ?? null,
        nextSession: (next?.session_date as string) ?? null,
        professor: prof?.full_name ?? null,
      };
    });
  }

  // 1:1 paketi (preko admina radi jednog izvora; filtrirano po user.id)
  const { data: indiv } = await admin
    .from("individual_enrollments")
    .select("id, package_lessons, lessons_used, status, expires_at, professor:professor_id(full_name, calendar_url), course:course_id(title, slug)")
    .eq("user_id", user.id)
    .in("status", ["active", "completed"]);

  const individual = (indiv ?? []).map((e) => {
    const prof = one<ProfRef>(e.professor as ProfRef | ProfRef[] | null);
    const course = one<CourseRef>(e.course as CourseRef | CourseRef[] | null);
    return {
      id: e.id as string,
      title: course?.title ?? "Individualni 1:1",
      packageLessons: e.package_lessons as number,
      lessonsUsed: e.lessons_used as number,
      status: e.status as string,
      expiresAt: (e.expires_at as string) ?? null,
      professor: prof?.full_name ?? null,
      calendarUrl: prof?.calendar_url ?? null,
    };
  });

  // Mesečno plaćanje: prikaz stanja serije i osnova za dugme „Otkaži".
  const { data: subs } = await admin
    .from("subscriptions")
    .select("id, status, amount, paid_payments, total_payments, next_charge_at, course:course_id(title, slug)")
    .eq("user_id", user.id)
    .in("status", ["active", "cancelled"])
    .order("created_at", { ascending: false });

  const subscriptions = await Promise.all(
    (subs ?? []).map(async (s) => {
      const course = one<CourseRef>(s.course as CourseRef | CourseRef[] | null);
      const plan = course?.slug ? planForSlug(course.slug) : null;
      const otvoreni = plan ? unlockedSlugsAfter(plan, s.paid_payments as number) : [];
      const sledeciNivo = plan?.unlocks.find((u) => u.installment > (s.paid_payments as number)) ?? null;

      // Dokle važi pristup: najdalji istek među otvorenim kursevima te pretplate.
      const { data: pristup } = await admin
        .from("course_access")
        .select("expires_at, course:course_id(slug)")
        .eq("user_id", user.id);
      const doKada = (pristup ?? [])
        .filter((p) => otvoreni.includes(one<{ slug: string }>(p.course as never)?.slug ?? ""))
        .map((p) => p.expires_at as string)
        .sort()
        .pop() ?? null;

      return {
        id: s.id as string,
        status: s.status as string,
        title: course?.title ?? "Kurs",
        amount: Number(s.amount),
        paidPayments: s.paid_payments as number,
        totalPayments: s.total_payments as number,
        nextChargeAt: (s.next_charge_at as string) ?? null,
        accessUntil: doKada,
        unlockedCount: otvoreni.length,
        nextUnlockAt: sledeciNivo?.installment ?? null,
      };
    }),
  );

  return NextResponse.json({ groups, individual, subscriptions });
}
