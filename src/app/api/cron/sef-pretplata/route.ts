// src/app/api/cron/sef-pretplata/route.ts
// Obnavlja pretplatu na SEF obaveštenja o promeni statusa fakture.
//
// ZAŠTO SVAKI DAN: SEF-ov `/subscribe` doslovno znači „pretplati me za SLEDEĆI dan".
// Nije jednom pa zauvek. Ako se dan preskoči, tog dana ne stiže nijedno obaveštenje
// i status fakture u našem panelu tiho zastari - izgleda kao da firma nije reagovala,
// a ona jeste.
//
// Uz obnovu, prolaz osvežava i statuse faktura koje još nisu na završnom statusu -
// mreža za slučaj da je obaveštenje ipak promaklo.
import { NextResponse } from "next/server";
import { withCronLog } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { obnoviPretplatu, procitajStatus, jeZavrsenStatus, sefPodesen } from "@/lib/sef";
import type { Json } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

async function cronHandler(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!sefPodesen()) {
    return NextResponse.json({ preskoceno: "SEF_API_KEY nije postavljen" });
  }

  const pretplata = await obnoviPretplatu();

  const admin = createAdminClient();
  const { data: uToku } = await admin
    .from("orders")
    .select("id, company_order_group, sef_invoice_id, sef_status")
    .not("sef_invoice_id", "is", null);

  // Po grupi jedna faktura, pa se ne pita SEF triput za istu.
  const poGrupi = new Map<string, { sefInvoiceId: string; status: string | null }>();
  for (const o of uToku ?? []) {
    const g = o.company_order_group;
    if (!g || !o.sef_invoice_id || jeZavrsenStatus(o.sef_status)) continue;
    if (!poGrupi.has(g)) poGrupi.set(g, { sefInvoiceId: o.sef_invoice_id, status: o.sef_status });
  }

  let osvezeno = 0;
  for (const [groupId, f] of poGrupi) {
    const stanje = await procitajStatus(f.sefInvoiceId);
    if (!stanje.ok || !stanje.data.status || stanje.data.status === f.status) continue;
    await admin
      .from("orders")
      .update({
        sef_status: stanje.data.status,
        sef_response: stanje.data as unknown as Json,
      })
      .eq("company_order_group", groupId);
    osvezeno += 1;
  }

  return NextResponse.json({
    pretplata: pretplata.ok ? "obnovljena" : `pala: ${pretplata.greska}`,
    proverenoFaktura: poGrupi.size,
    osvezeno,
  });
}

export const GET = withCronLog("sef-pretplata", cronHandler);
