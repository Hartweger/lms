// src/app/api/cron/review-recert/route.ts
// Ponovni ask za recenziju posle NOVOG sertifikata (položen ispit). Google link je prvi.
// Pravila: okidač = sertifikat izdat u zadnja 3 dana; min 60 dana od prošlog ask-a.
// (Namerno BEZ "skip ako je popunio formu" - obim je mali, 60-dnevni razmak je dovoljan.)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReviewRequestRecert } from "@/lib/email";

export const dynamic = "force-dynamic";

const MAX_PER_RUN = 20;
const CERT_WINDOW_DAYS = 3;  // koliko unazad gledamo nove sertifikate
const MIN_GAP_DAYS = 60;     // min razmak od prošlog ask-a istom čoveku

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get("test");
  const dryRun = searchParams.get("dry") === "1";

  const admin = createAdminClient();
  const now = Date.now();

  if (testEmail) {
    await sendReviewRequestRecert({ email: testEmail, name: "Test" });
    return NextResponse.json({ test: testEmail, sent: 1 });
  }

  // 1) Sertifikati izdati u zadnjih CERT_WINDOW_DAYS dana -> kandidati (po korisniku)
  const certCutoff = new Date(now - CERT_WINDOW_DAYS * 86400000).toISOString();
  const { data: certs } = await admin
    .from("certificates")
    .select("user_id, issued_at")
    .gte("issued_at", certCutoff);
  const userIds = [...new Set((certs ?? []).map((c) => c.user_id as string))];
  if (userIds.length === 0) return NextResponse.json({ candidates: 0, sent: 0 });

  // 2) Profili kandidata (samo studenti sa mejlom)
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, email, full_name, role")
    .in("id", userIds);
  const eligibleProfiles = (profiles ?? []).filter((p) => p.role === "student" && p.email);

  // 3) Prošli ask-ovi (za 60-dnevni razmak)
  const { data: asked } = await admin
    .from("review_requests")
    .select("user_id, sent_at")
    .in("user_id", userIds);
  const lastAsk = new Map<string, number>();
  for (const a of asked ?? []) {
    const t = a.sent_at ? new Date(a.sent_at as string).getTime() : 0;
    const prev = lastAsk.get(a.user_id as string) ?? 0;
    if (t > prev) lastAsk.set(a.user_id as string, t);
  }
  const gapCutoff = now - MIN_GAP_DAYS * 86400000;

  // 4) Filtriraj: nije pitan u zadnjih 60 dana
  const toSend = eligibleProfiles.filter((p) => (lastAsk.get(p.id as string) ?? 0) < gapCutoff);

  if (dryRun) {
    return NextResponse.json({
      dry: true,
      certKandidata: userIds.length,
      studentiSaMejlom: eligibleProfiles.length,
      zaSlanje: Math.min(toSend.length, MAX_PER_RUN),
      imena: toSend.slice(0, MAX_PER_RUN).map((p) => p.full_name),
    });
  }

  let sent = 0;
  for (const p of toSend.slice(0, MAX_PER_RUN)) {
    await sendReviewRequestRecert({ email: p.email as string, name: (p.full_name as string) ?? "" });
    await admin.from("review_requests").insert({ user_id: p.id });
    sent++;
  }

  return NextResponse.json({ candidates: toSend.length, sent });
}
