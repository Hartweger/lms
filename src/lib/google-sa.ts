// Google servisni nalog: JWT se potpisuje ugrađenim node:crypto i menja za access token.
// Bez ijedne spoljne biblioteke - `googleapis` paket nam za ovo nije potreban.
//
// Isti nalog koristi i GA4 izveštaj i povlačenje izvoda iz pošte. Za poštu je
// potrebno `subject`: servisni nalog sam po sebi nema sanduče, nego se preko
// delegiranja na nivou domena predstavlja kao korisnik (info@hartweger.rs).

import crypto from "node:crypto";

const b64url = (input: string) => Buffer.from(input).toString("base64url");

/**
 * Privatni ključ ume da stigne u raznim (pogrešnim) oblicima iz Vercel env-a:
 * ceo JSON, pod navodnicima, sa literalnim \n umesto preloma reda, sa \r.
 */
export function normalizujKljuc(raw: string): string {
  let k = (raw ?? "").trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1);
  }
  if (k.startsWith("{")) {
    try {
      const parsed = JSON.parse(k) as { private_key?: string };
      if (parsed.private_key) k = parsed.private_key;
    } catch {
      /* nije JSON, ostavi kako jeste */
    }
  }
  k = k.replace(/\\r/g, "").replace(/\\n/g, "\n").replace(/\r/g, "");
  if (k.includes("BEGIN PRIVATE KEY") && k.includes("END PRIVATE KEY")) return k;
  const body = k.replace(/-----[^-]*-----/g, "").replace(/\s+/g, "");
  if (/^[A-Za-z0-9+/=]+$/.test(body) && body.length > 100) {
    const wrapped = body.match(/.{1,64}/g)?.join("\n") ?? body;
    return `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----\n`;
  }
  return k;
}

export interface TokenZahtev {
  saEmail: string;
  privateKey: string;
  scope: string;
  /** Koga servisni nalog predstavlja (delegiranje na nivou domena). */
  subject?: string;
}

/** Potpisani JWT za razmenu kod Google-a. Izdvojeno zbog testa - potpis se ne šalje nigde. */
export function napraviJwt(z: TokenZahtev, nowSec = Math.floor(Date.now() / 1000)): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: z.saEmail,
      ...(z.subject ? { sub: z.subject } : {}),
      scope: z.scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSec,
      exp: nowSec + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(signingInput)
    .sign(normalizujKljuc(z.privateKey))
    .toString("base64url");
  return `${signingInput}.${signature}`;
}

/** Access token, ili null uz zapis u log - pozivalac odlučuje šta dalje. */
export async function pristupniToken(z: TokenZahtev, oznaka = "google"): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: napraviJwt(z),
    }),
  });
  if (!res.ok) {
    console.error(`[${oznaka}] token error`, res.status, await res.text());
    return null;
  }
  const j = (await res.json()) as { access_token?: string };
  return j.access_token ?? null;
}
