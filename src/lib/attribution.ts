// src/lib/attribution.ts
// Čista logika za order atribuciju (AttributionTracker piše rezultat u hw_attr cookie).
// Prioritet: Google Ads klik (gclid/gbraid/wbraid) > utm parametri > postojeći cookie >
// referrer. Ads auto-tagging ne šalje utm - bez gclid provere plaćen i organski Google
// klik izgledaju isto (oba dolaze sa google.com referrer-a).

export interface AttributionInput {
  search: string;
  referrer: string;
  hasCookie: boolean;
}

export function resolveAttribution(input: AttributionInput): Record<string, string> | null {
  const p = new URLSearchParams(input.search);

  if (p.get("gclid") || p.get("gbraid") || p.get("wbraid")) {
    return {
      source_type: "google_ads",
      utm_source: p.get("utm_source") || "google",
      utm_medium: "cpc",
      utm_campaign: p.get("utm_campaign") || "",
    };
  }

  const utmSource = p.get("utm_source");
  if (utmSource) {
    return {
      source_type: "utm",
      utm_source: utmSource,
      utm_medium: p.get("utm_medium") ?? "",
      utm_campaign: p.get("utm_campaign") ?? "",
    };
  }

  if (input.hasCookie) return null;

  if (!input.referrer) {
    return { source_type: "typein", utm_source: "(direct)", utm_medium: "", utm_campaign: "" };
  }

  let host = "";
  try {
    host = new URL(input.referrer).hostname.replace(/^www\./, "");
  } catch {
    /* ignore */
  }
  if (!host || /hartweger\.rs$/i.test(host)) return null;
  return { source_type: "referral", utm_source: host, utm_medium: "referral", utm_campaign: "" };
}
