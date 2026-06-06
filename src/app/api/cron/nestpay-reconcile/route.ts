// src/app/api/cron/nestpay-reconcile/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queryTransaction } from "@/lib/nestpay";
import { grantAccessForOrder } from "@/lib/grant-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // starije od 15 min
  const { data: pending } = await admin
    .from("orders").select("id, order_number, total")
    .in("payment_method", ["kartica", "kartica_rate"])
    .eq("payment_status", "pending")
    .lt("created_at", cutoff)
    .limit(50);

  let reconciled = 0;
  for (const o of pending ?? []) {
    const q = await queryTransaction(o.order_number);
    if (q?.procReturnCode === "00") {
      await admin.from("orders").update({ nestpay_status: "charged" }).eq("id", o.id);
      await grantAccessForOrder(o.id);
      reconciled++;
    }
  }
  return NextResponse.json({ checked: pending?.length ?? 0, reconciled });
}
