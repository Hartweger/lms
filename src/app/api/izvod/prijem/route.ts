// Prijem bankovnog izvoda od Apps Script skripte iz Natašinog Google naloga.
//
// Zašto zaseban ulaz, a ne /api/admin/izvod: skripta nema admin prijavu. Zato
// tajni ključ u zaglavlju, kao kod cronova.
//
// Šta neko sa ključem najgore može: upisati stavke u `bank_transactions`. Ništa
// odatle ne ulazi ni u narudžbine ni u troškove bez Natašinog klika, pa nema
// puta do novca. Ključ je ipak zaseban od CRON_SECRET-a - deli se sa Google
// nalogom, a cronovi ne treba da dele tajnu ni sa čim spolja.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { procitajIzvod } from "@/lib/izvod-xml";
import type { Json } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const tajna = process.env.IZVOD_SECRET;
  if (!tajna) {
    return NextResponse.json({ error: "IZVOD_SECRET nije postavljen." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${tajna}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const xml = await request.text();
  if (!xml.trim()) {
    return NextResponse.json({ error: "Prazan zahtev." }, { status: 400 });
  }

  let izvod;
  try {
    izvod = procitajIzvod(xml);
  } catch (e) {
    const poruka = e instanceof Error ? e.message : "nečitljiv XML";
    // Neispravan XML je vredan prijave: znači da je banka promenila oblik, a to
    // se inače primeti tek kad izvodi tiho prestanu da stižu.
    Sentry.captureException(new Error(`[izvod-prijem] ${poruka}`));
    return NextResponse.json({ error: `Izvod nije pročitan: ${poruka}` }, { status: 400 });
  }

  const admin = createAdminClient();

  if (izvod.stavke.length === 0) {
    return NextResponse.json({ izvod: izvod.broj, datum: izvod.datum, novih: 0, ukupno: 0 });
  }

  const redovi = izvod.stavke.map((s) => ({
    fitid: s.fitid,
    izvod_broj: izvod.broj,
    racun: izvod.racun,
    smer: s.smer,
    iznos: s.iznos,
    datum: s.datum,
    naziv: s.naziv,
    racun_druge: s.racunDruge,
    svrha: s.svrha,
    sifra: s.sifra,
    poziv_na_broj: s.pozivNaBroj,
    poziv_druge: s.pozivDruge,
    raw: s as unknown as Json,
  }));

  const { data: postojeci } = await admin
    .from("bank_transactions")
    .select("fitid")
    .in("fitid", redovi.map((r) => r.fitid));
  const poznati = new Set((postojeci ?? []).map((p) => p.fitid));

  // `order_id`, `expense_id` i `status` se NE navode - već donete odluke ostaju.
  const { error } = await admin
    .from("bank_transactions")
    .upsert(redovi, { onConflict: "fitid" });

  if (error) {
    Sentry.captureException(new Error(`[izvod-prijem] upis pao: ${error.message}`));
    return NextResponse.json({ error: `Upis nije uspeo: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({
    izvod: izvod.broj,
    datum: izvod.datum,
    ukupno: redovi.length,
    novih: redovi.filter((r) => !poznati.has(r.fitid)).length,
  });
}
