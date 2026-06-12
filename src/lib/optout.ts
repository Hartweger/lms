// Potpisani link za odjavu od funnel/ponudbenih mejlova (bez prijave na platformu).
// Token = HMAC(mejl, CRON_SECRET) — bez tajne niko ne može da generiše odjavu za tuđ mejl.
import { createHmac } from "crypto";
import { SITE_URL } from "@/lib/site-url";

export function odjavaToken(email: string): string {
  const secret = process.env.CRON_SECRET ?? "";
  return createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex").slice(0, 24);
}

export function odjavaUrl(email: string): string {
  const e = email.trim().toLowerCase();
  return `${SITE_URL}/api/odjava?e=${encodeURIComponent(e)}&t=${odjavaToken(e)}`;
}
