// Čiste funkcije za pretplatu na push u browseru (PushPrijava.tsx),
// izdvojene radi testiranja bez browsera.

/**
 * PushManager.subscribe traži applicationServerKey kao bajtove, a VAPID javni
 * ključ stiže kao base64url string iz okruženja.
 */
export function base64UrlUBajtove(base64url: string): Uint8Array<ArrayBuffer> {
  const dopuna = "=".repeat((4 - (base64url.length % 4)) % 4);
  const b64 = (base64url + dopuna).replace(/-/g, "+").replace(/_/g, "/");
  const sirovo = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(sirovo.length));
  for (let i = 0; i < sirovo.length; i++) out[i] = sirovo.charCodeAt(i);
  return out;
}

/**
 * iOS/iPadOS u običnom tabu: Web Push tu ne postoji - radi samo iz aplikacije
 * dodate na početni ekran. Umesto pokvarenog dugmeta prikazuje se uputstvo.
 *
 * iPad od iPadOS 13 šalje Macintosh user agent, pa se razlikuje po tome što
 * Mac nema dodirni ekran (maxTouchPoints === 0).
 */
export function jeIosBezPwa(ua: string, standalone: boolean, maxTouchPoints: number): boolean {
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
  return ios && !standalone;
}
