// Prijem bankovnog izvoda (XML sa info@mail.bancaintesa.rs) koji je Nataša sama učitala.
//
// Telo zahteva je sam XML. Stavke se upisuju u `bank_transactions` i tu STOJE -
// ništa ne ulazi ni u narudžbine ni u troškove dok Nataša ne potvrdi.
//
// Sam upis je u `lib/izvod-upis`, zajedno sa povlačenjem iz pošte: dva puta u istu
// tabelu koja se raziđu daju pogrešan trošak, a to se vidi tek mnogo kasnije.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAdmin } from "@/lib/api-auth";
import { upisiIzvod } from "@/lib/izvod-upis";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const xml = await request.text();
  const ishod = await upisiIzvod(auth.admin, xml);

  if (!ishod.ok) {
    const greska = ishod.greska ?? "Izvod nije upisan.";
    // Nečitljiv XML je Natašina greška u izboru fajla; pali upis je naša.
    const status = greska.startsWith("Upis nije uspeo") ? 500 : 400;
    if (status === 500) {
      console.error("[izvod] upis pao:", greska);
      Sentry.captureException(new Error(`[izvod] ${greska}`));
    }
    return NextResponse.json({ error: greska }, { status });
  }

  return NextResponse.json({
    izvod: ishod.izvod,
    datum: ishod.datum,
    ukupno: ishod.ukupno,
    novih: ishod.novih,
  });
}
