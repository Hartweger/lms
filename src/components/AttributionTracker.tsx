"use client";

import { useEffect } from "react";

// Order attribution (last-touch): hvata izvor posete u first-party cookie `hw_attr`.
// utm_* iz URL-a imaju prioritet (prepisuju cookie); ako nema utm-a a cookie je prazan,
// izvodi izvor iz document.referrer. Funkcionalno (atribucija porudžbine), bez trećih strana.
const COOKIE = "hw_attr";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 dana

function writeCookie(val: Record<string, string>) {
  try {
    document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(val))}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax`;
  } catch { /* ignore */ }
}

function hasCookie() {
  return typeof document !== "undefined" && document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=`));
}

export default function AttributionTracker() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const utmSource = p.get("utm_source");
      if (utmSource) {
        // utm prisutan → last-touch, prepiši
        writeCookie({
          source_type: "utm",
          utm_source: utmSource,
          utm_medium: p.get("utm_medium") ?? "",
          utm_campaign: p.get("utm_campaign") ?? "",
        });
        return;
      }
      if (hasCookie()) return; // već imamo izvor iz ranije posete

      // bez utm-a i bez cookie-ja → izvedi iz referrer-a
      const ref = document.referrer || "";
      if (!ref) {
        writeCookie({ source_type: "typein", utm_source: "(direct)", utm_medium: "", utm_campaign: "" });
        return;
      }
      let host = "";
      try { host = new URL(ref).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
      // sa našeg domena (interno) → ne tretiraj kao izvor; ostavi prazno (sledeća prava poseta hvata)
      if (!host || /hartweger\.rs$/i.test(host)) return;
      writeCookie({ source_type: "referral", utm_source: host, utm_medium: "referral", utm_campaign: "" });
    } catch { /* ignore */ }
  }, []);

  return null;
}
