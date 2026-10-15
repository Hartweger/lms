// Povlačenje bankovnih izvoda iz Resend sandučeta.
//
// Banka šalje XML izvod pravo na našu adresu za prijem (podešeno u Intesa Biz
// portalu: Virtuelna ekspozitura → Obaveštenja → +Dodaj mejl). Natašin inboks se
// ne dira, a sistem vidi isključivo ono što banka tu pošalje.
//
// ZAŠTO POVLAČENJE, A NE WEBHOOK: Resend čuva primljenu poštu i kad webhook ne
// postoji ili je pao, pa povlačenje gleda unazad i samo sebe krpi. Webhook koji
// jednom promaši ćuti zauvek - a upravo takav tihi prekid je ostavio sistem bez
// ijednog izvoda od 31.08. do 13.10.2026.

import "server-only";
import { Resend } from "resend";

/** Banka; prihvata se i poddomen sa kog stiže pošta. */
const POSILJALAC = /bancaintesa\.rs$/i;

export interface NadjenIzvod {
  ime: string;
  sadrzaj: string;
}

/** Je li ovo XML izvoda? Uz izvod ide i smime.p7s potpis koji nas ne zanima. */
export function jeXmlIzvod(ime: string | null | undefined, tip?: string | null): boolean {
  const n = (ime ?? "").toLowerCase();
  if (n === "smime.p7s") return false;
  if (n.endsWith(".xml")) return true;
  return (tip ?? "").includes("xml");
}

/** Pošiljalac se poredi po adresi, ne po prikazanom imenu - ime se lako lažira. */
export function odBanke(from: string | null | undefined): boolean {
  const m = /<([^>]+)>/.exec(from ?? "");
  const adresa = (m ? m[1] : (from ?? "")).trim().toLowerCase();
  return POSILJALAC.test(adresa);
}

export function resendSanducePodeseno(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * XML izvodi iz poslednjih `koliko` primljenih poruka.
 *
 * Vraća `greska` ako čitanje nije uspelo. Tiho prazan odgovor bi izgledao kao
 * „nema novih izvoda", a to je zabluda koja je već jednom koštala šest nedelja.
 */
export async function povuciIzvodeIzResenda(
  koliko = 100,
): Promise<{ ok: true; izvodi: NadjenIzvod[]; pregledano: number } | { ok: false; greska: string }> {
  const kljuc = process.env.RESEND_API_KEY;
  if (!kljuc) return { ok: false, greska: "RESEND_API_KEY nije postavljen." };

  const resend = new Resend(kljuc);

  const lista = await resend.emails.receiving.list({ limit: Math.min(koliko, 100) });
  if (lista.error) {
    const poruka = lista.error.message ?? String(lista.error);
    // Ključ samo za slanje ne sme da prođe kao „nema pošte".
    const dodatak = /restricted|unauthorized|invalid/i.test(poruka)
      ? " Verovatno je RESEND_API_KEY samo za slanje - za čitanje pošte treba ključ sa punim pristupom."
      : "";
    return { ok: false, greska: `Čitanje sandučeta nije uspelo: ${poruka}${dodatak}` };
  }

  const out: NadjenIzvod[] = [];

  for (const mejl of lista.data?.data ?? []) {
    if (!odBanke(mejl.from)) continue;
    const kandidati = (mejl.attachments ?? []).filter((a) => jeXmlIzvod(a.filename, a.content_type));
    if (kandidati.length === 0) continue;

    // Tek sada se traže linkovi za preuzimanje - oni ističu, pa se uzimaju sveži.
    const prilozi = await resend.emails.receiving.attachments.list({ emailId: mejl.id });
    if (prilozi.error) continue;

    for (const p of prilozi.data?.data ?? []) {
      if (!jeXmlIzvod(p.filename, p.content_type)) continue;
      const res = await fetch(p.download_url);
      if (!res.ok) {
        console.error("[izvodi] prilog se ne preuzima", res.status, p.filename);
        continue;
      }
      out.push({ ime: p.filename ?? "izvod.xml", sadrzaj: await res.text() });
    }
  }

  return { ok: true, izvodi: out, pregledano: lista.data?.data?.length ?? 0 };
}
