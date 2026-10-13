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
import { pristupniToken } from "@/lib/google-sa";

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

async function getAccessToken(saEmail: string, rawPrivateKey: string): Promise<string | null> {
  return pristupniToken(
    { saEmail, privateKey: rawPrivateKey, scope: "https://www.googleapis.com/auth/analytics.readonly" },
    "ga4",
  );
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
