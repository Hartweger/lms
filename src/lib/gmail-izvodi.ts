// Povlačenje bankovnih izvoda iz pošte, isto kao što se fakture povlače sa SEF-a.
//
// ZAŠTO POVLAČENJE, A NE PROSLEĐIVANJE: povlačenje gleda unazad. Ako cron ne radi
// nedelju dana, sledeći prolaz pokupi svih sedam izvoda. Prosleđivanje koje jednom
// pukne ćuti zauvek - a upravo zbog takvog tihog prekida izvodi nisu stizali od
// 31.08. do 13.10.2026.
//
// OGRANIČENJE NAMERNO: traži se isključivo pošiljalac banke i isključivo XML prilog.
// Servisni nalog ima pravo čitanja cele pošte na domenu, pa ovaj modul sam sebe
// sužava na ono što mu treba.
//
// Pretraga uključuje i Smeće (`in:anywhere`): izvodi se brišu posle čitanja, a
// Gmail ih drži još 30 dana. Starije od toga se ne mogu vratiti ni odavde.

import "server-only";
import { pristupniToken } from "@/lib/google-sa";

const POSILJALAC = "info@mail.bancaintesa.rs";
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

export interface GmailPrilog {
  messageId: string;
  attachmentId: string;
  filename: string;
}

/** Gmail upit: samo banka, samo prilozi, zadati broj dana unazad, i Smeće. */
export function upit(dana: number): string {
  return `from:${POSILJALAC} has:attachment newer_than:${dana}d in:anywhere`;
}

/** Je li ovo XML izvoda? Uz prilog ide i smime.p7s potpis koji nas ne zanima. */
export function jeXmlPrilog(p: { filename?: string; mimeType?: string }): boolean {
  const ime = (p.filename ?? "").toLowerCase();
  if (ime.endsWith(".xml")) return true;
  return ime !== "smime.p7s" && (p.mimeType ?? "").includes("xml");
}

type Deo = { filename?: string; mimeType?: string; body?: { attachmentId?: string }; parts?: Deo[] };

/** Prilozi iz Gmail strukture poruke - delovi umeju da budu ugnežđeni. */
export function xmlPrilozi(messageId: string, payload: Deo | undefined): GmailPrilog[] {
  const out: GmailPrilog[] = [];
  const obidji = (d: Deo | undefined) => {
    if (!d) return;
    if (d.body?.attachmentId && jeXmlPrilog(d)) {
      out.push({ messageId, attachmentId: d.body.attachmentId, filename: d.filename ?? "izvod.xml" });
    }
    for (const p of d.parts ?? []) obidji(p);
  };
  obidji(payload);
  return out;
}

export function gmailPodesen(): boolean {
  return Boolean(process.env.GA4_SA_EMAIL && process.env.GA4_SA_PRIVATE_KEY && process.env.GMAIL_SANDUCE);
}

async function token(): Promise<string | null> {
  const saEmail = process.env.GA4_SA_EMAIL;
  const privateKey = process.env.GA4_SA_PRIVATE_KEY;
  const subject = process.env.GMAIL_SANDUCE;
  if (!saEmail || !privateKey || !subject) return null;
  return pristupniToken({ saEmail, privateKey, scope: SCOPE, subject }, "gmail");
}

async function zovi<T>(t: string, putanja: string): Promise<T | null> {
  const res = await fetch(`${API}${putanja}`, { headers: { Authorization: `Bearer ${t}` } });
  if (!res.ok) {
    console.error("[gmail] greška", res.status, putanja, (await res.text()).slice(0, 300));
    return null;
  }
  return (await res.json()) as T;
}

/**
 * Sadržaj svih XML izvoda iz poslednjih `dana` dana.
 * Vraća i `greska` ako pristup nije uspeo - tiho prazan odgovor bi izgledao kao
 * „nema ničega", a to je upravo zabluda koja nas je koštala šest nedelja.
 */
export async function povuciIzvodeIzPoste(
  dana: number,
): Promise<{ ok: true; xml: { ime: string; sadrzaj: string }[] } | { ok: false; greska: string }> {
  if (!gmailPodesen()) {
    return { ok: false, greska: "Pristup pošti nije podešen (GMAIL_SANDUCE ili ključ servisnog naloga)." };
  }
  const t = await token();
  if (!t) return { ok: false, greska: "Google nije izdao token - proveri delegiranje za gmail.readonly." };

  const lista = await zovi<{ messages?: { id: string }[] }>(
    t,
    `/messages?maxResults=100&includeSpamTrash=true&q=${encodeURIComponent(upit(dana))}`,
  );
  if (!lista) return { ok: false, greska: "Pretraga pošte nije uspela." };

  const out: { ime: string; sadrzaj: string }[] = [];
  for (const m of lista.messages ?? []) {
    const poruka = await zovi<{ payload?: Deo }>(t, `/messages/${m.id}?format=full`);
    if (!poruka) continue;
    for (const p of xmlPrilozi(m.id, poruka.payload)) {
      const prilog = await zovi<{ data?: string }>(t, `/messages/${p.messageId}/attachments/${p.attachmentId}`);
      if (!prilog?.data) continue;
      out.push({ ime: p.filename, sadrzaj: Buffer.from(prilog.data, "base64url").toString("utf8") });
    }
  }
  return { ok: true, xml: out };
}
