// Čista logika za cookie saglasnost (Google Consent Mode v2).
// Bez DOM/gtag poziva — to radi CookieBanner. Lako za testiranje (node env).

export const CONSENT_KEY = "cookie-consent";

export type ConsentValue = "granted" | "denied";

const GOOGLE_CONSENT_KEYS = [
  "ad_storage",
  "analytics_storage",
  "ad_user_data",
  "ad_personalization",
] as const;

/** Vraća sačuvanu saglasnost ili null ako nije validno zapisana. */
export function parseConsent(raw: string | null): ConsentValue | null {
  return raw === "granted" || raw === "denied" ? raw : null;
}

/** Mapira izbor u objekat saglasnosti za gtag('consent','update', ...). */
export function consentParams(value: ConsentValue): Record<string, ConsentValue> {
  return Object.fromEntries(GOOGLE_CONSENT_KEYS.map((k) => [k, value]));
}
