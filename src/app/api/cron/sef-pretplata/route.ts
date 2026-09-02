// src/app/api/cron/sef-pretplata/route.ts
// Obnavlja pretplatu na SEF obaveštenja o promeni statusa fakture.
//
// ZAŠTO SVAKI DAN: SEF-ov `/subscribe` doslovno znači „pretplati me za SLEDEĆI dan".
// Nije jednom pa zauvek. Ako se dan preskoči, tog dana ne stiže nijedno obaveštenje
// i status fakture u našem panelu tiho zastari - izgleda kao da firma nije reagovala,
// a ona jeste.
//
// Uz obnovu, prolaz radi još dve stvari:
//  - osvežava statuse izlaznih faktura koje nisu na završnom statusu (mreža za
//    slučaj da je obaveštenje promaklo)
//  - povlači ulazne fakture sa SEF-a u `sef_purchase_invoices`
//
// Ulazne fakture NE ulaze u troškove same od sebe - čekaju da Nataša izabere
// kategoriju i potvrdi. Dok se to ne desi, izveštaji su netaknuti.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withCronLog } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { obnoviPretplatu, procitajStatus, jeZavrsenStatus, sefPodesen, pregledUlaznihFaktura, izvuciStatus } from "@/lib/sef";
import { uRed, jeZaKnjizenje } from "@/lib/sef-ulazne";
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
  const neuspesno: string[] = [];
  for (const [groupId, f] of poGrupi) {
    const stanje = await procitajStatus(f.sefInvoiceId);
    // Neuspeh se NE prećutkuje. Do 02.09.2026. ovde je stajao goli `continue`, pa je
    // faktura 2026-419 pet dana stajala na „šalje se" dok je cron svakog jutra
    // uredno vraćao 200. Kvar koji se ne vidi je gori od kvara koji vikne.
    if (!stanje.ok) {
      neuspesno.push(`${f.sefInvoiceId}: ${stanje.greska}`);
      continue;
    }
    if (!izvuciStatus(stanje.data) || izvuciStatus(stanje.data) === f.status) continue;
    await admin
      .from("orders")
      .update({
        sef_status: izvuciStatus(stanje.data),
        sef_response: stanje.data as unknown as Json,
      })
      .eq("company_order_group", groupId);
    osvezeno += 1;
  }

  // Ulazne fakture: gleda se unazad 35 dana, jer faktura ume da stigne sa
  // zakašnjenjem, a upsert po `sef_invoice_id` ionako ne pravi duplikate.
  const danas = new Date();
  const od = new Date(danas.getTime() - 35 * 24 * 3600_000);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  let noveUlazne = 0;
  let ulazneGreska: string | null = null;
  const pregled = await pregledUlaznihFaktura(ymd(od), ymd(danas));
  if (!pregled.ok) {
    ulazneGreska = pregled.greska;
  } else {
    const redovi = pregled.data
      .map(uRed)
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .filter((r) => jeZaKnjizenje(r.status));
    if (redovi.length) {
      // `expense_id` i `zanemarena` se NE navode, pa ih upsert ne dira - odluka
      // koju je Nataša već donela ne sme da se poništi sledećim prolazom.
      const { error, count } = await admin
        .from("sef_purchase_invoices")
        .upsert(redovi, { onConflict: "sef_invoice_id", count: "exact" });
      if (error) ulazneGreska = error.message;
      else noveUlazne = count ?? redovi.length;
    }
  }

  // Izvodi koji tiho prestanu da stižu su najgori kvar u ovom lancu: sve izgleda
  // uredno, a troškovi i uplate se ne vide. Izvod stiže radnim danima, pa razmak
  // preko 4 dana (vikend + praznik) znači da nešto ne radi.
  const { data: poslednja } = await admin
    .from("bank_transactions")
    .select("datum")
    .order("datum", { ascending: false })
    .limit(1)
    .maybeSingle();

  let izvodiAlarm: string | null = null;
  if (poslednja?.datum) {
    const dana = Math.floor((Date.now() - new Date(poslednja.datum).getTime()) / 86400000);
    if (dana > 4) {
      izvodiAlarm = `Poslednji izvod je od ${poslednja.datum} (pre ${dana} dana).`;
      Sentry.captureException(new Error(`[izvodi] ${izvodiAlarm} Proveri Apps Script skriptu.`));
    }
  }

  return NextResponse.json({
    ...(izvodiAlarm ? { izvodiAlarm } : {}),
    pretplata: pretplata.ok ? "obnovljena" : `pala: ${pretplata.greska}`,
    proverenoFaktura: poGrupi.size,
    osvezeno,
    ulazne: ulazneGreska ? `pala: ${ulazneGreska}` : noveUlazne,
    ...(neuspesno.length ? { citanjeStatusaPalo: neuspesno } : {}),
  });
}

export const GET = withCronLog("sef-pretplata", cronHandler);
