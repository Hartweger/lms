// src/lib/ga-cookies.ts
// Parsiranje GA4 kolačića (_ga i _ga_<stream>) u client_id / session_id za
// Measurement Protocol. Kolačići postoje SAMO ako je posetilac dao saglasnost
// (Consent Mode v2: analytics_storage granted) - bez saglasnosti funkcije
// vraćaju null i MP pada nazad na order.id (kanal ostaje Unassigned).

/** Ime kolačića GA4 stream-a (measurement ID bez "G-" prefiksa). */
export const GA_STREAM_COOKIE = "_ga_MB9DRXVVF6";

/** "_ga=GA1.1.708139520.1750000000" → "708139520.1750000000" */
export function parseGaClientId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/^GA\d+\.\d+\.(\d+\.\d+)$/);
  return m ? m[1] : null;
}

/**
 * Session ID iz stream kolačića:
 *  - GS2 format: "GS2.1.s1752990000$o12$..." → "1752990000"
 *  - GS1 format: "GS1.1.1752990000.12.1...."  → "1752990000"
 */
export function parseGaSessionId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const gs2 = raw.match(/^GS\d+\.\d+\.s(\d+)\$/);
  if (gs2) return gs2[1];
  const gs1 = raw.match(/^GS\d+\.\d+\.(\d+)\./);
  return gs1 ? gs1[1] : null;
}

/** Izvuče GA client_id i session_id iz Cookie zaglavlja HTTP zahteva. */
export function gaIdsFromCookieHeader(
  header: string | null | undefined,
): { gaClientId: string | null; gaSessionId: string | null } {
  if (!header) return { gaClientId: null, gaSessionId: null };
  const jar = new Map<string, string>();
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    jar.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
  }
  return {
    gaClientId: parseGaClientId(jar.get("_ga")),
    gaSessionId: parseGaSessionId(jar.get(GA_STREAM_COOKIE)),
  };
}
