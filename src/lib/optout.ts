// Potpisani link za odjavu od funnel/ponudbenih mejlova (bez prijave na platformu).
// Token = HMAC(mejl, CRON_SECRET) - bez tajne niko ne može da generiše odjavu za tuđ mejl.
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

/**
 * List-Unsubscribe header-i za masovne/promotivne mejlove (Gmail/Yahoo to traže od 2024).
 * One-Click (RFC 8058): Gmail POST-uje na odjavaUrl → /api/odjava POST tiho odjavi.
 * Koristiti SAMO za jednog primaoca (string), ne za admin liste.
 */
export function listUnsubscribeHeaders(email: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${odjavaUrl(email)}>, <mailto:info@hartweger.rs?subject=Odjava>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
