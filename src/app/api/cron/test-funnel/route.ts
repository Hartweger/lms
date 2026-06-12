// src/app/api/cron/test-funnel/route.ts
// Testiranje-funnel: follow-up ponude posle testa znanja (zamena za Apps Script skenirajTestiranje).
// Mejl #1 (rezultat) šalje MailerLite automacija "Einstufungstest - rezultat" odmah po testu —
// ovde idu samo #2 (15 dana), #3 (30 dana) i #4 (45 dana posle testa).
// Stop: čim osoba kupi bilo šta (orders completed, WC istorija u poslednjih godinu dana, ili ima pristup kursu).
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTestFunnelEmail } from "@/lib/email";
import { grupniSlugForNivo, individualniSlugForNivo } from "@/lib/course-nivo";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const MAX_PER_RUN = 20; // Resend kvota (100/dan) — ostavi prostora drugim mejlovima
const FUNNEL_START = "2026-05-25"; // od kada MailerLite šalje rezultat (mejl #1); starije testove ne diramo
const MAX_TEST_AGE_DAYS = 75; // test stariji od ovoga je hladan lead — ne šaljemo
const INTERVAL_DANA = 15; // #2 na +15d, #3 na +30d, #4 na +45d od testa
const MIN_GAP_DANA = 10; // minimalan razmak između dva funnel mejla istoj osobi

function urlsForNivo(rawNivo: string) {
  const nivo = rawNivo === "C1+" ? "C1.1" : rawNivo;
  const grupniSlug = grupniSlugForNivo(nivo);
  const indSlug = individualniSlugForNivo(nivo);
  return {
    grupniUrl: grupniSlug ? `${SITE_URL}/kursevi/${grupniSlug}` : null,
    individualniUrl: indSlug ? `${SITE_URL}/kursevi/${indSlug}` : null,
    kurseviUrl: `${SITE_URL}/kursevi`,
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get("test");
  const dryRun = searchParams.get("dry") === "1";

  // TEST režim: probni mejl #2 (nivo A2.1) na dati mejl, bez diranja pravih kandidata.
  if (testEmail) {
    await sendTestFunnelEmail(testEmail, {
      name: "Test",
      nivo: "A2.1",
      emailNumber: 2,
      ...urlsForNivo("A2.1"),
    });
    return NextResponse.json({ test: testEmail, sent: 1 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  const minCreated = new Date(now - MAX_TEST_AGE_DAYS * 86400000).toISOString();
  const start = FUNNEL_START > minCreated.slice(0, 10) ? FUNNEL_START : minCreated;

  // Najnoviji test po mejlu, u funnel prozoru.
  const { data: tests } = await admin
    .from("placement_test_results")
    .select("email, recommended_level, created_at")
    .not("email", "is", null)
    .gte("created_at", start)
    .order("created_at", { ascending: false });
  const latest = new Map<string, { nivo: string; createdAt: string }>();
  for (const t of tests ?? []) {
    const em = String(t.email).trim().toLowerCase();
    if (!em || latest.has(em)) continue;
    latest.set(em, { nivo: t.recommended_level, createdAt: t.created_at });
  }
  if (latest.size === 0) return NextResponse.json({ candidates: 0, sent: 0 });

  const emails = [...latest.keys()];

  // Već poslati funnel mejlovi.
  const { data: sentRows } = await admin
    .from("test_funnel_emails")
    .select("email, email_number, sent_at")
    .in("email", emails);
  const sentByEmail = new Map<string, { maxNumber: number; lastSentAt: number }>();
  for (const r of sentRows ?? []) {
    const cur = sentByEmail.get(r.email) ?? { maxNumber: 1, lastSentAt: 0 };
    cur.maxNumber = Math.max(cur.maxNumber, r.email_number);
    cur.lastSentAt = Math.max(cur.lastSentAt, new Date(r.sent_at).getTime());
    sentByEmail.set(r.email, cur);
  }

  // Stop-uslovi: kupio na novom sajtu, kupio na starom (godinu dana), ili već ima pristup kursu.
  const kupili = new Set<string>();
  const { data: paidOrders } = await admin
    .from("orders")
    .select("email")
    .eq("payment_status", "completed")
    .in("email", emails);
  for (const o of paidOrders ?? []) kupili.add(String(o.email).toLowerCase());

  const yearAgo = new Date(now - 365 * 86400000).toISOString();
  const { data: wcOrders } = await admin
    .from("wc_orders")
    .select("customer_email")
    .in("status", ["completed", "processing"])
    .gte("date_created", yearAgo)
    .in("customer_email", emails);
  for (const o of wcOrders ?? []) kupili.add(String(o.customer_email).toLowerCase());

  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, email, full_name")
    .in("email", emails);
  const profileByEmail = new Map((profiles ?? []).map((p) => [String(p.email).toLowerCase(), p]));
  const profileIds = (profiles ?? []).map((p) => p.id);
  if (profileIds.length > 0) {
    const { data: access } = await admin
      .from("course_access")
      .select("user_id")
      .in("user_id", profileIds);
    const withAccess = new Set((access ?? []).map((a) => a.user_id));
    for (const [em, p] of profileByEmail) if (withAccess.has(p.id)) kupili.add(em);
  }

  // Kandidati: sledeći mejl čiji je rok prošao, uz minimalan razmak od prethodnog.
  type Kandidat = { email: string; nivo: string; emailNumber: 2 | 3 | 4 };
  const candidates: Kandidat[] = [];
  for (const [em, info] of latest) {
    if (kupili.has(em)) continue;
    const sent = sentByEmail.get(em) ?? { maxNumber: 1, lastSentAt: 0 };
    const nextNumber = sent.maxNumber + 1;
    if (nextNumber > 4) continue;
    const daysSinceTest = (now - new Date(info.createdAt).getTime()) / 86400000;
    if (daysSinceTest < (nextNumber - 1) * INTERVAL_DANA) continue;
    if (sent.lastSentAt && (now - sent.lastSentAt) / 86400000 < MIN_GAP_DANA) continue;
    candidates.push({ email: em, nivo: info.nivo, emailNumber: nextNumber as 2 | 3 | 4 });
  }

  const batch = candidates.slice(0, MAX_PER_RUN);
  if (dryRun) {
    return NextResponse.json({
      dry: true,
      totalEligible: candidates.length,
      wouldSend: batch.map((c) => ({ email: c.email, nivo: c.nivo, n: c.emailNumber })),
    });
  }

  let sent = 0;
  for (const c of batch) {
    const prof = profileByEmail.get(c.email);
    await sendTestFunnelEmail(c.email, {
      name: prof?.full_name ?? "",
      nivo: c.nivo,
      emailNumber: c.emailNumber,
      ...urlsForNivo(c.nivo),
    });
    await admin
      .from("test_funnel_emails")
      .insert({ email: c.email, nivo: c.nivo, email_number: c.emailNumber });
    sent++;
  }

  console.log("[cron/test-funnel] kandidata:", candidates.length, "poslato:", sent);
  return NextResponse.json({ candidates: candidates.length, sent });
}
