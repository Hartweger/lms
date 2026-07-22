// src/app/api/cron/subscriptions-poll/route.ts
// Banka NE šalje callback za rate 2..N (dokazano test serijom 21.07.2026), pa ih
// dohvatamo sami: jednom dnevno pitamo status cele serije i svaku novu uspelu
// naplatu pretvaramo u porudžbinu (pristup + fiskalni račun + mejl). Palu naplatu
// (D/ERR) ponovo iniciramo pomeranjem STARTDATE - max 30 puta, 1x dnevno.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withCronLog } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildRecurringStatusXml, parseRecurringStatus, postCc5 } from "@/lib/nestpay-recurring";
import { chargesToProcess, maybeRetryFailedCharge, processCharge } from "@/lib/subscription-charges";

export const dynamic = "force-dynamic";

async function cronHandler(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("subscriptions")
    .select(
      "id, user_id, recurring_id, base_oid, amount, total_payments, paid_payments, initial_order_id, retry_oid, retry_count, retry_planned_for",
    )
    .eq("status", "active")
    .limit(200);

  let obradjeno = 0;
  let zavrsenih = 0;
  let ponovoInicirano = 0;

  for (const sub of subs ?? []) {
    const xml = await postCc5(buildRecurringStatusXml(sub.recurring_id));
    if (!xml) {
      Sentry.captureException(new Error(`[pretplata] upit banci pao za seriju ${sub.recurring_id}`));
      continue;
    }

    const { charges } = parseRecurringStatus(xml);
    const { data: postojeci } = await admin
      .from("orders")
      .select("nestpay_oid")
      .eq("subscription_id", sub.id)
      .not("nestpay_oid", "is", null);

    const zaObradu = chargesToProcess(
      charges,
      (postojeci ?? []).map((o) => o.nestpay_oid as string),
    );
    for (const charge of zaObradu) {
      if (await processCharge(sub, charge)) obradjeno++;
    }

    // Pala naplata (D/ERR): zakaži ponovni pokušaj za sutra (banka: max 30, 1x dnevno).
    if ((await maybeRetryFailedCharge(sub, charges)) === "retry") ponovoInicirano++;

    const uspelih = charges.filter((c) => c.succeeded).length;
    const sledeca = charges.find((c) => !c.succeeded && !c.failed)?.plannedAt ?? null;
    const gotova = uspelih >= sub.total_payments;
    if (gotova) zavrsenih++;

    await admin
      .from("subscriptions")
      .update({
        last_polled_at: new Date().toISOString(),
        next_charge_at: sledeca ? new Date(sledeca.replace(" ", "T")).toISOString() : null,
        status: gotova ? "completed" : "active",
      })
      .eq("id", sub.id);
  }

  return NextResponse.json({
    ok: true,
    pretplata: (subs ?? []).length,
    obradjenoRata: obradjeno,
    ponovoInicirano,
    zavrsenih,
  });
}

export const GET = withCronLog("subscriptions-poll", cronHandler);
