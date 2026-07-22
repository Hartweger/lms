"use client";

import { useEffect } from "react";
import { resolveAttribution } from "@/lib/attribution";

// Order attribution: hvata izvor posete u first-party cookie `hw_attr`.
// Logika (Google Ads klik > utm > postojeći cookie > referrer) je u lib/attribution.ts.
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
      const result = resolveAttribution({
        search: window.location.search,
        referrer: document.referrer || "",
        hasCookie: hasCookie(),
      });
      if (result) writeCookie(result);
    } catch { /* ignore */ }
  }, []);

  return null;
}
