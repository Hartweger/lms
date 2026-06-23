// Dnevni cron: rezime Schreiben-a koji čekaju pregled.
// - eseji čiji (učenik, kurs) ima profesora → mejl tom profesoru
// - eseji bez profesora (samostalni video kursevi) → mejl adminu (Nataši)
// Zaštita: Bearer CRON_SECRET. Test: ?test=mejl (pošalje admin-rezime na taj mejl), ?dry=1 (samo brojevi).
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { groupEssaysForDigest, type DigestEssay, type Assignment } from "@/lib/essay-digest";
import { sendPendingEssaysDigest } from "@/lib/email";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["info@hartweger.rs", "natasa@hartweger.rs"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dry") === "1";
  const testEmail = searchParams.get("test");

  const authHeader = request.headers.get("authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!isCron && !testEmail && !dryRun) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (testEmail && !testEmail.endsWith("@hartweger.rs")) {
    return NextResponse.json({ error: "test mejl mora biti @hartweger.rs" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Pending eseji + lekcija (radi course_id i naslova).
  // Samo 'pending' - status 'reviewed' se zasad ne koristi (nema "sacuvaj bez objave" u UI).
  // NAPOMENA: imena učenika se čitaju ZASEBNO - nema FK veze essay_submissions->user_profiles,
  // pa embed `user_profiles(...)` puca i tiho vraća null (bug: cron je slao 0 rezimea).
  const { data: rows, error: rowsErr } = await admin
    .from("essay_submissions")
    .select("id, user_id, submitted_at, lessons(title, course_id)")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  if (rowsErr) {
    console.error("[cron/eseji-pregled] greška pri čitanju eseja:", rowsErr.message);
    return NextResponse.json({ error: rowsErr.message }, { status: 500 });
  }

  // Imena učenika - zaseban upit (vidi napomenu gore).
  const studentIds = [...new Set((rows ?? []).map((r) => r.user_id as string))];
  const nameById = new Map<string, string>();
  if (studentIds.length > 0) {
    const { data: profs } = await admin
      .from("user_profiles")
      .select("id, full_name")
      .in("id", studentIds);
    for (const p of profs ?? []) nameById.set(p.id as string, (p.full_name as string) ?? "");
  }

  const one = <T,>(x: T | T[] | null | undefined): T | null =>
    Array.isArray(x) ? (x[0] ?? null) : (x ?? null);

  const essays: DigestEssay[] = (rows ?? []).map((r) => {
    const ls = one(r.lessons as unknown) as { title: string | null; course_id: string } | null;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      courseId: (ls?.course_id as string) ?? "",
      studentName: nameById.get(r.user_id as string) || "Učenik",
      lessonTitle: ls?.title ?? "Schreiben",
      submittedAt: r.submitted_at as string,
    };
  });

  // Sve dodele prof↔učenik↔kurs.
  const { data: assignRows } = await admin
    .from("professor_students")
    .select("professor_id, student_id, course_id");
  const assignments: Assignment[] = (assignRows ?? []).map((a) => ({
    professorId: a.professor_id as string,
    studentId: a.student_id as string,
    courseId: a.course_id as string,
  }));

  const { byProfessor, unassigned } = groupEssaysForDigest(essays, assignments);

  if (dryRun) {
    return NextResponse.json({
      dry: true,
      profesori: byProfessor.map((g) => ({ broj: g.essays.length })),
      bezProfa: unassigned.length,
    });
  }

  // Test: pošalji rezime SVIH pending eseja na test mejl (da test pouzdano stigne).
  if (testEmail) {
    await sendPendingEssaysDigest({
      to: testEmail,
      recipientName: "Test",
      essays: essays.map((e) => ({ studentName: e.studentName, lessonTitle: e.lessonTitle, submittedAt: e.submittedAt })),
      forAdmin: true,
    });
    return NextResponse.json({ test: testEmail, ukupno: essays.length, bezProfa: unassigned.length });
  }

  // Profesorima — svakom svoji.
  let poslato = 0;
  for (const grupa of byProfessor) {
    const { data: prof } = await admin
      .from("user_profiles")
      .select("full_name, email")
      .eq("id", grupa.professorId)
      .single();
    if (!prof?.email) continue;
    await sendPendingEssaysDigest({
      to: prof.email,
      recipientName: prof.full_name ?? "",
      essays: grupa.essays.map((e) => ({ studentName: e.studentName, lessonTitle: e.lessonTitle, submittedAt: e.submittedAt })),
      forAdmin: false,
    });
    poslato++;
  }

  // Adminu — eseji bez profa.
  if (unassigned.length > 0) {
    await sendPendingEssaysDigest({
      to: ADMIN_EMAILS,
      recipientName: "Nataša",
      essays: unassigned.map((e) => ({ studentName: e.studentName, lessonTitle: e.lessonTitle, submittedAt: e.submittedAt })),
      forAdmin: true,
    });
    poslato++;
  }

  console.log("[cron/eseji-pregled] poslato rezimea:", poslato, "| profa:", byProfessor.length, "| bez profa:", unassigned.length);
  return NextResponse.json({ ok: true, poslato, profesori: byProfessor.length, bezProfa: unassigned.length });
}
