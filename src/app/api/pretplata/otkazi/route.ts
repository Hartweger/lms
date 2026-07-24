// src/app/api/pretplata/otkazi/route.ts
// Otkazivanje cele serije kod banke (RECURRINGOPERATION=Cancel, RECORDTYPE=Recurring).
// Uslov banke je da kupac otkazivanje može da zatraži sam - zato ide iz „Moj nalog",
// bez pisanja podršci. Pristup ostaje do kraja plaćenog meseca; ne oduzimamo ga ovde.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildRecurringCancelXml, isRecurringOpApproved, postCc5 } from "@/lib/nestpay-recurring";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { subscriptionId } = await request.json();
  if (!subscriptionId) return NextResponse.json({ error: "Nedostaje subscriptionId" }, { status: 400 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, user_id, recurring_id, status")
    .eq("id", subscriptionId)
    .single();

  // Provera vlasništva: bez nje bi svako ulogovan mogao da otkaže tuđu pretplatu.
  if (!sub || sub.user_id !== user.id) {
    return NextResponse.json({ error: "Pretplata nije pronađena." }, { status: 404 });
  }
  if (sub.status !== "active") return NextResponse.json({ ok: true, vecOtkazana: true });

  const odgovor = await postCc5(buildRecurringCancelXml(sub.recurring_id));
  if (!odgovor || !isRecurringOpApproved(odgovor)) {
    Sentry.captureException(
      new Error(
        `[pretplata] otkazivanje serije ${sub.recurring_id} nije prošlo: ${odgovor?.slice(0, 300) ?? "bez odgovora"}`,
      ),
    );
    return NextResponse.json(
      { error: "Otkazivanje trenutno ne prolazi. Piši nam na info@hartweger.rs i mi ćemo ga odmah rešiti." },
      { status: 502 },
    );
  }

  await admin
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", sub.id);

  return NextResponse.json({ ok: true });
}
