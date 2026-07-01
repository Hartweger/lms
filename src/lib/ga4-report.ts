// src/lib/ga4-report.ts
// Čitanje GA4 izveštaja (Google Analytics Data API v1beta) bez ikakve eksterne biblioteke.
// Service-account JWT se potpisuje ugrađenim node:crypto i menja za access token.
// Bezbedno: ako kredencijali nisu postavljeni (env), vraća null i izveštaj se šalje bez GA4.
//
// Potrebni env (Vercel):
//   GA4_PROPERTY_ID      numerički property ID (NE measurement ID G-...)
//   GA4_SA_EMAIL         email service naloga (...@...iam.gserviceaccount.com)
//   GA4_SA_PRIVATE_KEY   privatni ključ iz JSON-a (sa \n umesto preloma reda)
//   GA4_CONV_METRIC      opciono: "conversions" (default) ili "keyEvents" za novije property-je
import crypto from "node:crypto";

export type Ga4Weekly = {
  sesije: number;
  korisnici: number;
  pregledi: number;
  konverzije: number;
  prosleSesije: number;
  prosleKorisnici: number;
  proslePregledi: number;
  prosleKonverzije: number;
  izvori: { izvor: string; sesije: number; konverzije: number }[];
};

const b64url = (input: string) => Buffer.from(input).toString("base64url");

// Privatni ključ može stići u raznim (pogrešnim) oblicima iz Vercel env-a:
// ceo JSON, sa navodnicima, sa literalnim \n umesto preloma reda, sa \r. Normalizuj sve.
function normalizePrivateKey(raw: string): string {
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
  // Ako je već ispravan PEM, vrati kako jeste.
  if (k.includes("BEGIN PRIVATE KEY") && k.includes("END PRIVATE KEY")) return k;
  // Inače rekonstruiši PKCS#8 PEM iz golog base64 tela (skini sve markere i razmake).
  const body = k.replace(/-----[^-]*-----/g, "").replace(/\s+/g, "");
  if (/^[A-Za-z0-9+/=]+$/.test(body) && body.length > 100) {
    const wrapped = body.match(/.{1,64}/g)?.join("\n") ?? body;
    return `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----\n`;
  }
  return k;
}

async function getAccessToken(saEmail: string, rawPrivateKey: string): Promise<string | null> {
  const privateKey = normalizePrivateKey(rawPrivateKey);
  // Bezbedna dijagnostika (bez tajne): dužina i oblik ključa posle normalizacije.
  console.log("[ga4] key diag", {
    len: privateKey.length,
    hasBegin: privateKey.includes("BEGIN PRIVATE KEY"),
    hasEnd: privateKey.includes("END PRIVATE KEY"),
    hasRealNewline: privateKey.includes("\n"),
    rawLen: (rawPrivateKey ?? "").length,
  });
  const nowSec = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: saEmail,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSec,
      exp: nowSec + 3600,
    })
  );
  const signingInput = `${header}.${claim}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(signingInput)
    .sign(privateKey)
    .toString("base64url");
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    console.error("[ga4] token error", res.status, await res.text());
    return null;
  }
  const j = (await res.json()) as { access_token?: string };
  return j.access_token ?? null;
}

type GaRow = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };

async function runReport(token: string, propertyId: string, body: unknown): Promise<{ rows?: GaRow[] } | null> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    console.error("[ga4] runReport error", res.status, await res.text());
    return null;
  }
  return res.json();
}

export async function fetchGa4Weekly(): Promise<Ga4Weekly | null> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const saEmail = process.env.GA4_SA_EMAIL;
  const privateKey = process.env.GA4_SA_PRIVATE_KEY;
  if (!propertyId || !saEmail || !privateKey) return null; // tiho preskoči dok kredencijali nisu postavljeni
  const conv = process.env.GA4_CONV_METRIC || "conversions";

  try {
    const token = await getAccessToken(saEmail, privateKey);
    if (!token) return null;

    // 1) Ukupne metrike: poslednjih 7 dana vs prethodnih 7 dana (poređenje preko 2 dateRanges).
    const totals = await runReport(token, propertyId, {
      dateRanges: [
        { startDate: "7daysAgo", endDate: "yesterday" },
        { startDate: "14daysAgo", endDate: "8daysAgo" },
      ],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }, { name: conv }],
    });
    if (!totals) return null;

    const out: Ga4Weekly = {
      sesije: 0, korisnici: 0, pregledi: 0, konverzije: 0,
      prosleSesije: 0, prosleKorisnici: 0, proslePregledi: 0, prosleKonverzije: 0,
      izvori: [],
    };
    for (const r of totals.rows ?? []) {
      const range = r.dimensionValues?.[0]?.value; // "date_range_0" (tekuća) | "date_range_1" (prošla)
      const m = (r.metricValues ?? []).map((x) => Number(x.value || 0));
      if (range === "date_range_0") {
        [out.sesije, out.korisnici, out.pregledi, out.konverzije] = m;
      } else if (range === "date_range_1") {
        [out.prosleSesije, out.prosleKorisnici, out.proslePregledi, out.prosleKonverzije] = m;
      }
    }

    // 2) Top izvori po konverzijama (poslednjih 7 dana).
    const src = await runReport(token, propertyId, {
      dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "sessionSourceMedium" }],
      metrics: [{ name: "sessions" }, { name: conv }],
      orderBys: [{ metric: { metricName: conv }, desc: true }],
      limit: 6,
    });
    out.izvori = (src?.rows ?? []).map((r) => ({
      izvor: r.dimensionValues?.[0]?.value || "(n/a)",
      sesije: Number(r.metricValues?.[0]?.value || 0),
      konverzije: Number(r.metricValues?.[1]?.value || 0),
    }));

    return out;
  } catch (e) {
    console.error("[ga4] fetchGa4Weekly pao:", e);
    return null;
  }
}
