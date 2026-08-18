// src/app/api/cron/nestpay-poll/route.ts
// Brzi prolaz (na 15 minuta): pita banku samo za sveže pending kartične porudžbine.
// Postoji zato što potvrda plaćanja stiže kroz pretraživač kupca i ume da se izgubi -
// vidi objašnjenje u src/lib/reconcile-cards.ts. Do 16.08.2026. jedina provera je bila
// puni prolaz 3x dnevno, pa je naplaćen kupac čekao pristup i po osam sati.
// Sve ostalo (podsetnici, uplatnice, fiskalizacija) ostaje u nestpay-reconcile.
import { NextResponse } from "next/server";
import { withCronLog } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { reconcilePendingCards } from "@/lib/reconcile-cards";

export const dynamic = "force-dynamic";

/** Starije od ovoga hvata puni prolaz - brzi ne troši upite banci na mrtve porudžbine. */
const MAX_AGE_MS = 24 * 3600_000;

async function cronHandler(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { checked, reconciled } = await reconcilePendingCards(admin, {
    nowMs: Date.now(),
    maxAgeMs: MAX_AGE_MS,
  });

  return NextResponse.json({ checked, reconciled });
}

export const GET = withCronLog("nestpay-poll", cronHandler);
