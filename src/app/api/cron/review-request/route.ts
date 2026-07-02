// src/app/api/cron/review-request/route.ts
// Zamolnica za utisak (Google forma) aktivnim polaznicima - SVIMA (i ind/grupni, jer ljudi zaborave
// iako im je link u beleškama). Cilj: ≥5 završenih lekcija, aktivan u 14 dana, nalog ≥21 dan,
// nije već zamoljen. Jednom po čoveku. (Na kraju forme je i Google review link za one koji žele.)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReviewRequest } from "@/lib/email";

export const dynamic = "force-dynamic";

const MAX_PER_RUN = 30;
const MIN_LESSONS = 5;
const ACTIVE_DAYS = 14;
// Ne šaljemo pre ovog datuma - platforma se još sleže, čekamo da se stabilizuje (odluka 10.06.2026).
const START_DATE = "2026-06-25T00:00:00Z";

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

  if (testEmail) {
    await sendReviewRequest({ email: testEmail, name: "Test" });
    return NextResponse.json({ test: testEmail, sent: 1 });
  }

  // Napredak: broj završenih + poslednja aktivnost po korisniku
  const progress = await fetchAll(() =>
    admin.from("lesson_progress").select("user_id, completed_at").eq("completed", true)
  ) as { user_id: string; completed_at: string | null }[];
  const stat = new Map<string, { count: number; last: number }>();
  for (const p of progress) {
    const s = stat.get(p.user_id) ?? { count: 0, last: 0 };
    s.count++;
    const t = p.completed_at ? new Date(p.completed_at).getTime() : 0;
    if (t > s.last) s.last = t;
    stat.set(p.user_id, s);
  }

  const activeCutoff = now - ACTIVE_DAYS * 86400000;
  const engaged = [...stat.entries()]
    .filter(([, s]) => s.count >= MIN_LESSONS && s.last >= activeCutoff)
    .map(([uid]) => uid);

  // Isključi samo već zamoljene (ne znamo ko je popunio formu - pratimo koga smo zvali)
  const asked = await fetchAll(() => admin.from("review_requests").select("user_id")) as { user_id: string }[];
  const askedSet = new Set(asked.map((a) => a.user_id));

  // ≥5 završenih lekcija + aktivan u 14 dana već znači „radi neko vreme" - starost naloga ne tražimo
  // (platforma je nova, skoro svi nalozi su mlađi od par nedelja, pa bi to isključilo sve).
  const candidateIds = engaged.filter((uid) => !askedSet.has(uid));
  if (candidateIds.length === 0) return NextResponse.json({ candidates: 0, sent: 0 });

  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, email, full_name, role")
    .in("id", candidateIds.slice(0, 1000));

  const eligible = (profiles ?? []).filter((p) => p.role === "student" && p.email);

  const started = now >= new Date(START_DATE).getTime();
  if (dryRun) return NextResponse.json({ dry: true, totalEligible: eligible.length, wouldSend: Math.min(eligible.length, MAX_PER_RUN), startsOn: START_DATE, started });

  // Dok se platforma ne stabilizuje - cron radi ali ne šalje do START_DATE
  if (!started) return NextResponse.json({ pending: true, startsOn: START_DATE });

  let sent = 0;
  for (const p of eligible.slice(0, MAX_PER_RUN)) {
    await sendReviewRequest({ email: p.email, name: p.full_name ?? "" });
    await admin.from("review_requests").insert({ user_id: p.id });
    sent++;
  }

  return NextResponse.json({ candidates: eligible.length, sent });
}
