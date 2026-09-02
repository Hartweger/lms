// src/app/api/sef/webhook/route.ts
// Adresa koja se upisuje u SEF panel, polje „URL za primanje notifikacija o
// izlaznim fakturama".
//
// NAČELO: telu zahteva se NE veruje. Ovo je javna adresa - bilo ko može da pošalje
// POST i tvrdi da je faktura odbijena. Iz tela se uzima SAMO identifikator, a pravi
// status se pita SEF-a. Isto pravilo kao kod kartica: istina se traži od izvora.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { procitajStatus, sefPodesen, izvuciStatus } from "@/lib/sef";
import type { Json } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sefPodesen()) {
    return NextResponse.json({ ok: true, preskoceno: "SEF nije podešen" });
  }

  let telo: { salesInvoiceId?: number | string } | null = null;
  try {
    telo = await request.json();
  } catch {
    // Nevažeće telo nije razlog za grešku prema SEF-u - inače bi pokušavao ponovo
    // u krug. Prijavljuje se i završava.
    Sentry.captureException(new Error("[sef-webhook] telo nije JSON"));
    return NextResponse.json({ ok: true });
  }

  const sefInvoiceId = telo?.salesInvoiceId != null ? String(telo.salesInvoiceId) : null;
  if (!sefInvoiceId) {
    return NextResponse.json({ ok: true, preskoceno: "bez salesInvoiceId" });
  }

  const admin = createAdminClient();
  const { data: nase } = await admin
    .from("orders")
    .select("company_order_group")
    .eq("sef_invoice_id", sefInvoiceId)
    .limit(1)
    .maybeSingle();

  // Obaveštenje za fakturu koju nismo mi poslali (ručno kucana u SEF panelu) -
  // nije greška, samo nemamo šta da upišemo.
  if (!nase?.company_order_group) {
    return NextResponse.json({ ok: true, preskoceno: "faktura nije naša" });
  }

  const stanje = await procitajStatus(sefInvoiceId);
  if (!stanje.ok) {
    // SEF trenutno ne odgovara. Ne upisujemo ništa; dnevni cron će je pokupiti.
    return NextResponse.json({ ok: true, odlozeno: true });
  }

  await admin
    .from("orders")
    .update({
      sef_status: izvuciStatus(stanje.data) ?? "Unknown",
      sef_response: stanje.data as unknown as Json,
    })
    .eq("company_order_group", nase.company_order_group);

  return NextResponse.json({ ok: true, status: izvuciStatus(stanje.data) });
}
