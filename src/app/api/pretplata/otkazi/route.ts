// src/app/api/pretplata/otkazi/route.ts
// Otkazivanje cele serije kod banke (RECURRINGOPERATION=Cancel, RECORDTYPE=Recurring).
// Uslov banke je da kupac otkazivanje može da zatraži sam - zato ide iz „Moj nalog",
// bez pisanja podršci. Pristup ostaje do kraja plaćenog meseca; ne oduzimamo ga ovde.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRecurringCancelXml,
  buildRecurringStatusXml,
  isRecurringOpApproved,
  isSeriesCancelled,
  parseRecurringStatus,
  postCc5,
} from "@/lib/nestpay-recurring";
import { cancelReasonLabel, parseCancelReason } from "@/lib/subscription-cancel-reason";
import { logInteraction, upsertContact } from "@/lib/crm/contacts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { subscriptionId, razlog } = await request.json();
  // Razlog je dobrovoljan: nepoznata ili preskočena vrednost se upisuje kao NULL,
  // nikad ne obara otkazivanje - kupac mora da može da ode i bez odgovora.
  const cancelReason = parseCancelReason(razlog);
  if (!subscriptionId) return NextResponse.json({ error: "Nedostaje subscriptionId" }, { status: 400 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, user_id, recurring_id, status, paid_payments, total_payments, initial_order_id")
    .eq("id", subscriptionId)
    .single();

  // Provera vlasništva: bez nje bi svako ulogovan mogao da otkaže tuđu pretplatu.
  if (!sub || sub.user_id !== user.id) {
    return NextResponse.json({ error: "Pretplata nije pronađena." }, { status: 404 });
  }
  if (sub.status !== "active") return NextResponse.json({ ok: true, vecOtkazana: true });

  const odgovor = await postCc5(buildRecurringCancelXml(sub.recurring_id));
  const sirovo = odgovor?.slice(0, 300) ?? "bez odgovora";

  // Odgovor na Cancel nije jedini izvor istine: 13.08.2026 je banka seriju
  // 26206OfSB24222 stvarno otkazala, a mi smo njen odgovor pročitali kao neuspeh -
  // kupac je dobio poruku „ne prolazi" i pisao podršci, dok je serija već bila mrtva.
  // Zato pre nego što ikome javimo neuspeh, pitamo kako serija STVARNO stoji.
  if (!odgovor || !isRecurringOpApproved(odgovor)) {
    const stanje = await postCc5(buildRecurringStatusXml(sub.recurring_id));
    const charges = stanje ? parseRecurringStatus(stanje).charges : [];

    if (!isSeriesCancelled(charges)) {
      Sentry.captureException(
        new Error(`[pretplata] otkazivanje serije ${sub.recurring_id} nije prošlo: ${sirovo}`),
      );
      return NextResponse.json(
        { error: "Otkazivanje trenutno ne prolazi. Piši nam na info@hartweger.rs i mi ćemo ga odmah rešiti." },
        { status: 502 },
      );
    }

    // Otkazivanje je prošlo uprkos neprepoznatom odgovoru - nastavljamo kao da jeste,
    // ali ostavljamo trag, jer je odgovor banke očigledno oblik koji ne umemo da pročitamo.
    Sentry.captureMessage(
      `[pretplata] serija ${sub.recurring_id} JESTE otkazana, ali odgovor banke nije prepoznat kao odobren: ${sirovo}`,
      "warning",
    );
  }

  await admin
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancel_reason: cancelReason })
    .eq("id", sub.id);

  // Trag u CRM-u: bez njega razlog ostaje samo u analitici, a ne vidi se kod osobe.
  // Best-effort - otkazivanje je kod banke već prošlo i ne sme da padne zbog CRM-a.
  try {
    const { data: prva } = await admin
      .from("orders")
      .select("email, full_name")
      .eq("id", sub.initial_order_id)
      .single();
    if (prva?.email) {
      const contactId = await upsertContact(admin, {
        email: prva.email,
        name: prva.full_name,
        source: "rucno",
        userId: sub.user_id,
      });
      if (contactId) {
        await logInteraction(admin, {
          contactId,
          channel: "sistem",
          direction: "dolazna",
          summary: `Otkazala mesečno plaćanje posle ${sub.paid_payments}/${sub.total_payments} naplata - ${cancelReasonLabel(cancelReason)}`,
          meta: { subscriptionId: sub.id, cancelReason, paidPayments: sub.paid_payments },
        });
      }
    }
  } catch (e) {
    console.error("[pretplata] CRM trag otkazivanja nije upisan:", e);
  }

  return NextResponse.json({ ok: true });
}
