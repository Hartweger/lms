import { NextRequest, NextResponse } from "next/server";
import { withCronLog } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { trebaPaznju } from "@/lib/prof-napredak";
import { sendProfPodsetnik, sendNatasaProfPodsetnikZbirni } from "@/lib/email";

// Ponedeljni cron: svakoj profesorki šalje podsetnik o njenim polaznicima koji
// "traže pažnju" na platformi (crveni: neaktivni >14 dana ili "nije počeo" posle
// grejs-perioda). Zbirni pregled ide Nataši. Zamena za stari LearnDash mejl,
// ali čita NOVE Supabase podatke (lesson_progress).
async function cronHandler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const now = new Date();
  const dryRun = request.nextUrl.searchParams.get("dry") === "1";

  // Profesorke
  const { data: profs } = await admin
    .from("user_profiles")
    .select("id, full_name, email")
    .eq("role", "professor");
  const profList = (profs ?? []).filter((p) => p.email);
  if (profList.length === 0) return NextResponse.json({ ok: true, profesorki: 0, poslato: 0 });
  const profIds = profList.map((p) => p.id);

  // Grupe ovih profesorki + aktivni upisi
  const { data: grps } = await admin
    .from("groups")
    .select("id, professor_id, content_course_id, status")
    .in("professor_id", profIds)
    .in("status", ["otvoren", "u_toku"]);
  const groupById = new Map((grps ?? []).map((g) => [g.id, g]));
  const groupIds = (grps ?? []).map((g) => g.id);

  const { data: ge } = groupIds.length
    ? await admin.from("group_enrollments").select("user_id, group_id").eq("status", "active").in("group_id", groupIds)
    : { data: [] };

  // 1:1 upisi ovih profesorki
  const { data: indEnr } = await admin
    .from("individual_enrollments")
    .select("user_id, professor_id, course_id")
    .in("professor_id", profIds)
    .eq("status", "active");

  // 1:1 kupovni -> sadržaj kurs
  const indPurchasableIds = [...new Set((indEnr ?? []).map((e) => e.course_id))];
  const { data: unlocks } = indPurchasableIds.length
    ? await admin.from("course_unlocks").select("purchasable_course_id, content_course_id").in("purchasable_course_id", indPurchasableIds)
    : { data: [] };
  const purchasableToContent = new Map(
    (unlocks ?? []).map((u) => [u.purchasable_course_id as string, u.content_course_id as string]),
  );

  // Polaznici (imena)
  const userIds = [...new Set([...(ge ?? []).map((e) => e.user_id), ...(indEnr ?? []).map((e) => e.user_id)])];
  if (userIds.length === 0) return NextResponse.json({ ok: true, profesorki: profList.length, poslato: 0 });
  const { data: profiles } = await admin.from("user_profiles").select("id, full_name, email").in("id", userIds);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, (p.full_name as string) || (p.email as string) || "-"]));

  // Pristup platformi: po (user, course) granted_at + najstariji po useru
  const { data: caRows } = await admin.from("course_access").select("user_id, course_id, granted_at").in("user_id", userIds);
  const accessByUserCourse = new Map<string, Map<string, string>>();
  const oldestAccessByUser = new Map<string, string>();
  for (const r of caRows ?? []) {
    const uid = r.user_id as string;
    const g = (r.granted_at as string | null) ?? null;
    const m = accessByUserCourse.get(uid) ?? new Map<string, string>();
    if (g) m.set(r.course_id as string, g);
    accessByUserCourse.set(uid, m);
    if (g) {
      const cur = oldestAccessByUser.get(uid);
      if (!cur || g < cur) oldestAccessByUser.set(uid, g);
    }
  }

  // Lekcije po sadržaj-kursu
  const contentCourseIds = [
    ...new Set([
      ...(grps ?? []).map((g) => g.content_course_id as string | null).filter((c): c is string => !!c),
      ...[...purchasableToContent.values()],
    ]),
  ];
  const { data: allLessons } = contentCourseIds.length
    ? await admin.from("lessons").select("id, course_id").in("course_id", contentCourseIds)
    : { data: [] };
  const lessonsByCourse = new Map<string, Set<string>>();
  for (const l of allLessons ?? []) {
    const set = lessonsByCourse.get(l.course_id as string) ?? new Set<string>();
    set.add(l.id as string);
    lessonsByCourse.set(l.course_id as string, set);
  }

  // Završene lekcije po polazniku
  const { data: allProgress } = await admin
    .from("lesson_progress")
    .select("user_id, lesson_id, completed_at")
    .eq("completed", true)
    .in("user_id", userIds);
  const progressByUser = new Map<string, { lesson_id: string; completed_at: string | null }[]>();
  for (const p of allProgress ?? []) {
    const list = progressByUser.get(p.user_id as string) ?? [];
    list.push({ lesson_id: p.lesson_id as string, completed_at: (p.completed_at as string | null) ?? null });
    progressByUser.set(p.user_id as string, list);
  }

  // Da li polaznik (u datom sadržaj-kursu) "traži pažnju".
  function ocena(userId: string, contentCourseId: string | null): { red: boolean; razlog: string } {
    // Kurs bez platforme (npr. KTZ, mesečni paketi) — nema šta da se prati, nikad crveno.
    if (!contentCourseId) return { red: false, razlog: "" };
    const all = progressByUser.get(userId) ?? [];
    const lessonIds = lessonsByCourse.get(contentCourseId) ?? null;
    const relevant = lessonIds ? all.filter((p) => lessonIds.has(p.lesson_id)) : all;
    const completedCount = relevant.length;
    const lastActivity = relevant.reduce<string | null>(
      (latest, p) => (p.completed_at && (!latest || p.completed_at > latest) ? p.completed_at : latest),
      null,
    );
    const hasPlatform = !!accessByUserCourse.get(userId)?.has(contentCourseId);
    const accessGrantedAt = accessByUserCourse.get(userId)?.get(contentCourseId) ?? oldestAccessByUser.get(userId) ?? null;
    return trebaPaznju({ hasPlatform, completedCount, lastActivity, accessGrantedAt, now });
  }

  // Skupljanje "crvenih" po profesorki (dedup po user_id).
  const crveniPoProf = new Map<string, Map<string, string>>(); // profId -> (userId -> razlog)
  function dodaj(profId: string, userId: string, contentCourseId: string | null) {
    const o = ocena(userId, contentCourseId);
    if (!o.red) return;
    const m = crveniPoProf.get(profId) ?? new Map<string, string>();
    if (!m.has(userId)) m.set(userId, o.razlog);
    crveniPoProf.set(profId, m);
  }

  for (const e of ge ?? []) {
    const g = groupById.get(e.group_id);
    if (!g) continue;
    dodaj(g.professor_id as string, e.user_id as string, (g.content_course_id as string | null) ?? null);
  }
  for (const e of indEnr ?? []) {
    dodaj(e.professor_id as string, e.user_id as string, purchasableToContent.get(e.course_id) ?? null);
  }

  // Slanje (ili samo pregled ako je ?dry=1)
  let poslato = 0;
  const zbirne: { prof: string; broj: number }[] = [];
  const pregled: { prof: string; polaznici: { ime: string; razlog: string }[] }[] = [];
  for (const prof of profList) {
    const m = crveniPoProf.get(prof.id);
    if (!m || m.size === 0) continue;
    const polaznici = [...m.entries()].map(([uid, razlog]) => ({ ime: nameById.get(uid) ?? "-", razlog }));
    polaznici.sort((a, b) => a.ime.localeCompare(b.ime, "sr-Latn"));
    const profIme = (prof.full_name as string) || (prof.email as string);
    if (dryRun) {
      pregled.push({ prof: profIme, polaznici });
    } else {
      await sendProfPodsetnik({ to: prof.email as string, profIme: (prof.full_name as string) || "", polaznici });
      poslato++;
    }
    zbirne.push({ prof: profIme, broj: polaznici.length });
  }

  zbirne.sort((a, b) => b.broj - a.broj);
  if (!dryRun) await sendNatasaProfPodsetnikZbirni({ stavke: zbirne });

  return NextResponse.json({
    ok: true,
    dryRun,
    profesorki: profList.length,
    poslato,
    ukupnoCrvenih: zbirne.reduce((s, x) => s + x.broj, 0),
    ...(dryRun ? { pregled } : {}),
  });
}

export const GET = withCronLog("prof-podsetnik", cronHandler);
