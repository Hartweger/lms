// src/app/api/cron/activation/route.ts
// Aktivacioni nudge: polaznik dobio pristup ali nije otvorio nijednu lekciju → mejl da započne.
// Cilja NATIVE (ne-migrirane), pristup star 1-30 dana, bez ijedne završene lekcije, jednom po čoveku.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendActivationNudge } from "@/lib/email";

export const dynamic = "force-dynamic";

const MAX_PER_RUN = 40; // Resend free kvota (100/dan) - ostavi prostora drugim mejlovima

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
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get("test");
  const dryRun = searchParams.get("dry") === "1";

  const admin = createAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  // TEST režim: pošalji jedan probni nudge na dati mejl (prva lekcija A1.1), bez diranja pravih kandidata.
  if (testEmail) {
    const { data: lesson } = await admin
      .from("lessons")
      .select("id, title, course_id, courses:course_id(title)")
      .order("order_index")
      .limit(1)
      .single();
    const course = lesson?.courses as unknown as { title: string } | null;
    await sendActivationNudge({
      email: testEmail,
      name: "Test",
      courseTitle: course?.title ?? "Nemački A1.1",
      lessonId: lesson?.id ?? null,
      lessonTitle: lesson?.title ?? null,
    });
    return NextResponse.json({ test: testEmail, sent: 1 });
  }
  const minAge = new Date(now - 1 * 86400000).toISOString();   // pristup stariji od 24h (cron dnevno u 10 UTC → nudge stiže 24-48h od kupovine)
  const maxAge = new Date(now - 30 * 86400000).toISOString();  // ali ne stariji od 30 dana

  // Lekcije po kursu (prva lekcija = najmanji order_index)
  const lessons = await fetchAll(() => admin.from("lessons").select("id, course_id, title, order_index"));
  const firstLesson = new Map<string, { id: string; title: string }>();
  const byCourse = new Map<string, { id: string; title: string; order_index: number }[]>();
  for (const l of lessons as { id: string; course_id: string; title: string; order_index: number }[]) {
    const arr = byCourse.get(l.course_id) ?? [];
    arr.push({ id: l.id, title: l.title, order_index: l.order_index ?? 0 });
    byCourse.set(l.course_id, arr);
  }
  for (const [cid, arr] of byCourse) {
    arr.sort((a, b) => a.order_index - b.order_index);
    firstLesson.set(cid, { id: arr[0].id, title: arr[0].title });
  }

  // Već nudgovani + oni koji su BAR jednom nešto završili (= već počeli)
  const nudged = await fetchAll(() => admin.from("activation_nudges").select("user_id"));
  const nudgedSet = new Set((nudged as { user_id: string }[]).map((n) => n.user_id));
  const started = await fetchAll(() => admin.from("lesson_progress").select("user_id").eq("completed", true));
  const startedSet = new Set((started as { user_id: string }[]).map((s) => s.user_id));

  // Native aktivan pristup, granted 3-30 dana
  const access = await fetchAll(() =>
    admin
      .from("course_access")
      .select("user_id, course_id, source, granted_at")
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .lte("granted_at", minAge)
      .gte("granted_at", maxAge)
  );

  // Po korisniku izaberi PRVI kurs koji ima lekcije
  const userCourse = new Map<string, string>();
  for (const a of access as { user_id: string; course_id: string; source: string | null }[]) {
    if (String(a.source ?? "").startsWith("wp-migration")) continue; // samo native
    if (nudgedSet.has(a.user_id) || startedSet.has(a.user_id)) continue;
    if (!firstLesson.has(a.course_id)) continue; // kurs bez lekcija (paket/1:1) - preskoči
    if (!userCourse.has(a.user_id)) userCourse.set(a.user_id, a.course_id);
  }

  const totalEligible = userCourse.size;
  const candidates = [...userCourse.entries()].slice(0, MAX_PER_RUN);
  if (dryRun) return NextResponse.json({ dry: true, totalEligible, wouldSend: candidates.length });
  if (candidates.length === 0) return NextResponse.json({ candidates: 0, sent: 0 });

  // Profili (email/ime) za kandidate
  const ids = candidates.map(([uid]) => uid);
  const { data: profiles } = await admin.from("user_profiles").select("id, email, full_name").in("id", ids);
  const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Naslovi kurseva
  const courseIds = [...new Set(candidates.map(([, cid]) => cid))];
  const { data: courses } = await admin.from("courses").select("id, title").in("id", courseIds);
  const titleMap = new Map((courses ?? []).map((c) => [c.id, c.title as string]));

  let sent = 0;
  for (const [uid, cid] of candidates) {
    const prof = profMap.get(uid);
    if (!prof?.email) continue;
    const fl = firstLesson.get(cid) ?? null;
    await sendActivationNudge({
      email: prof.email,
      name: prof.full_name ?? "",
      courseTitle: titleMap.get(cid) ?? "kurs",
      lessonId: fl?.id ?? null,
      lessonTitle: fl?.title ?? null,
    });
    await admin.from("activation_nudges").insert({ user_id: uid });
    sent++;
  }

  return NextResponse.json({ candidates: candidates.length, sent });
}
