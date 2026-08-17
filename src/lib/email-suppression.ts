// Adrese kojima se NE šalje masovna pošta: ručne odjave (`email_optouts`) + adrese
// koje su se trajno odbile (`email_bounces`).
//
// Zašto: `email_bounces` se do 17.08.2026. samo prikazivao u jutarnjem pregledu, a
// nijedan sender ga nije čitao - pa je 21 adresa sa odbačajem i dalje dobijala levak,
// neke i po četiri puta (`sasemaks2@gmail.con`, `bebili973@gmail.comcom`). Ponovljeni
// odbačaji kvare reputaciju domena, što pogađa isporučivost SVIH mejlova, i onih
// polaznicima. Vidi [[project_dns_cloudflare_mejl_isporucivost]].
import { createAdminClient } from "@/lib/supabase/admin";

export interface BounceRow {
  reason: string | null;
}

/** Pun inboks je privremen - provajder izričito kaže da kasnije može da prođe. */
const PRIVREMENO = /inbox was full/i;
const TVRD = /hard bounce/i;

/**
 * Da li je adresa trajno neisporučiva.
 *
 * - Jedan „hard bounce" je dovoljan: Resend za njega sam preporučuje uklanjanje.
 * - Dva ili više odbačaja koji nisu „pun inboks" znače da adresa ne postoji - tu spadaju
 *   tipfeleri u domenu („gmail.comcom"), koje provajder prijavi kao „general bounce".
 * - Pun inboks se NE broji ni koliko god puta se ponovio: iza njega stoji živ čovek.
 */
export function isPermanentBounce(rows: BounceRow[]): boolean {
  if (rows.some((r) => TVRD.test(r.reason ?? ""))) return true;
  return rows.filter((r) => !PRIVREMENO.test(r.reason ?? "")).length >= 2;
}

/**
 * Adrese iz `emails` kojima se ne sme slati masovna pošta (mala slova).
 * Za listu kandidata u cron-u - jedan upit umesto jednog po adresi.
 */
export async function suppressedEmails(emails: string[]): Promise<Set<string>> {
  const lista = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const out = new Set<string>();
  if (lista.length === 0) return out;

  const admin = createAdminClient();
  const [optouts, bounces] = await Promise.all([
    admin.from("email_optouts").select("email").in("email", lista),
    admin.from("email_bounces").select("email, reason").eq("event", "bounced").in("email", lista),
  ]);

  // Greška upita NE sme da zaustavi slanje - propuštena adresa je manja šteta od
  // tihog gašenja cele kampanje. Zato se greška loguje, a lista ostaje prazna.
  if (optouts.error) console.error("[suppression] email_optouts:", optouts.error.message);
  if (bounces.error) console.error("[suppression] email_bounces:", bounces.error.message);

  for (const o of optouts.data ?? []) out.add(String(o.email).toLowerCase());

  const poAdresi = new Map<string, BounceRow[]>();
  for (const b of bounces.data ?? []) {
    const em = String(b.email).toLowerCase();
    poAdresi.set(em, [...(poAdresi.get(em) ?? []), { reason: b.reason }]);
  }
  for (const [em, rows] of poAdresi) if (isPermanentBounce(rows)) out.add(em);

  return out;
}

/** Ista provera za jednu adresu. */
export async function isSuppressed(email: string): Promise<boolean> {
  const s = await suppressedEmails([email]);
  return s.has(email.trim().toLowerCase());
}
