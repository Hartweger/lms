// Ručno povlačenje bankovnih izvoda iz pošte - isti posao koji cron radi ujutru.
//
// Postoji zato što „stiže mi na mejl" nije isto što i „ušlo je u sistem". Izvodi
// su stizali svakodnevno od 01.09. do 13.10.2026, a u bazi nije bio nijedan.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { povuciIzvodeIzPoste } from "@/lib/gmail-izvodi";
import { upisiIzvod } from "@/lib/izvod-upis";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Koliko dana unazad se gleda. Gmail ionako prazni Smeće posle 30 dana. */
const DANA = 30;

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const posta = await povuciIzvodeIzPoste(DANA);
  if (!posta.ok) return NextResponse.json({ error: posta.greska }, { status: 502 });

  let novih = 0;
  const izvodi: number[] = [];
  const greske: string[] = [];

  for (const f of posta.xml) {
    const ishod = await upisiIzvod(auth.admin, f.sadrzaj);
    if (!ishod.ok) {
      greske.push(`${f.ime}: ${ishod.greska}`);
      continue;
    }
    novih += ishod.novih;
    if (ishod.izvod != null && ishod.novih > 0) izvodi.push(ishod.izvod);
  }

  return NextResponse.json({
    stiglo: posta.xml.length,
    novih,
    izvodi: izvodi.sort((a, b) => a - b),
    dana: DANA,
    ...(greske.length ? { greske } : {}),
  });
}
