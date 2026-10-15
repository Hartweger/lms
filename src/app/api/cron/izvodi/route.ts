// src/app/api/cron/izvodi/route.ts
// Jutarnje povlačenje bankovnih izvoda.
//
// Banka nema API - izvod stiže samo kao XML prilog u mejlu. Zato je u Intesa Biz
// portalu dodata naša adresa za prijem, pa banka šalje izvod i nama, pored Nataše.
// Njen inboks se ne dira, a sistem vidi isključivo poštu banke.
//
// ZAŠTO SVAKI DAN, A NE SAMO NA KLIK: prvi pokušaj automatizacije (Apps Script u
// Natašinom nalogu) nikad nije ni podešen, pa šest nedelja nijedan izvod nije ušao
// u sistem iako su mejlovi stizali. Ovaj prolaz gleda celo sanduče, pa propušten
// dan sam sebe pokrpi na sledećem prolazu.
//
// Stavke SAMO ulaze u `bank_transactions` i tu stoje. Ništa ne ulazi u narudžbine
// ni u troškove dok Nataša ne potvrdi.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withCronLog } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { povuciIzvodeIzResenda, resendSanducePodeseno } from "@/lib/resend-izvodi";
import { upisiIzvod } from "@/lib/izvod-upis";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function cronHandler(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!resendSanducePodeseno()) {
    return NextResponse.json({ preskoceno: "sanduče za prijem nije podešeno" });
  }

  const posta = await povuciIzvodeIzResenda();
  if (!posta.ok) {
    // Tiha greška je ovde najgora moguća: izgleda kao „nema novih izvoda".
    Sentry.captureException(new Error(`[izvodi] povlačenje nije uspelo: ${posta.greska}`));
    return NextResponse.json({ error: posta.greska }, { status: 502 });
  }

  const admin = createAdminClient();
  let novih = 0;
  const izvodi: number[] = [];
  const greske: string[] = [];

  for (const f of posta.izvodi) {
    const ishod = await upisiIzvod(admin, f.sadrzaj);
    if (!ishod.ok) {
      greske.push(`${f.ime}: ${ishod.greska}`);
      continue;
    }
    novih += ishod.novih;
    if (ishod.izvod != null && ishod.novih > 0) izvodi.push(ishod.izvod);
  }

  if (greske.length) {
    Sentry.captureException(new Error(`[izvodi] ${greske.length} izvoda nije upisano: ${greske.join(" ; ")}`));
  }

  return NextResponse.json({ stiglo: posta.izvodi.length, novih, izvodi: izvodi.sort((a, b) => a - b) });
}

export const GET = withCronLog("izvodi", cronHandler);
