// Prijem bankovnog izvoda (XML sa info@mail.bancaintesa.rs).
//
// Telo zahteva je sam XML. Stavke se upisuju u `bank_transactions` i tu STOJE -
// ništa ne ulazi ni u narudžbine ni u troškove dok Nataša ne potvrdi.
//
// Isti izvod sme da se pošalje više puta: `fitid` je bankin jedinstven broj
// transakcije, pa upsert ne pravi duplikate. Zato ni ponovno slanje iz e-bankinga
// ne može da pokvari podatke.
//
// Ne dira već donete odluke: `order_id`, `expense_id` i `status` se ne navode u
// upsertu, pa ostaju kakvi jesu.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAdmin } from "@/lib/api-auth";
import { procitajIzvod } from "@/lib/izvod-xml";
import type { Json } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  const xml = await request.text();
  if (!xml.trim()) {
    return NextResponse.json({ error: "Prazan zahtev - očekuje se XML izvoda." }, { status: 400 });
  }

  let izvod;
  try {
    izvod = procitajIzvod(xml);
  } catch (e) {
    const poruka = e instanceof Error ? e.message : "nečitljiv XML";
    return NextResponse.json({ error: `Izvod nije pročitan: ${poruka}` }, { status: 400 });
  }

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

  // Koliko ih je već poznato - da odgovor kaže šta je STVARNO novo.
  const { data: postojeci } = await admin
    .from("bank_transactions")
    .select("fitid")
    .in("fitid", redovi.map((r) => r.fitid));
  const poznati = new Set((postojeci ?? []).map((p) => p.fitid));

  const { error } = await admin
    .from("bank_transactions")
    .upsert(redovi, { onConflict: "fitid" });

  if (error) {
    console.error("[izvod] upis pao:", error);
    Sentry.captureException(new Error(`[izvod] upis pao: ${error.message}`));
    return NextResponse.json({ error: `Upis nije uspeo: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({
    izvod: izvod.broj,
    datum: izvod.datum,
    ukupno: redovi.length,
    novih: redovi.filter((r) => !poznati.has(r.fitid)).length,
  });
}
