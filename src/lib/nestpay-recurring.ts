// src/lib/nestpay-recurring.ts
// CC5 upiti nad recurring serijom. Banka šalje callback SAMO za inicijalnu naplatu
// (potvrđeno testom i mejlom banke 21.07.2026), pa naplate 2..N saznajemo upitom.
// Odgovor nosi po naplati sufiksirana polja: ORD_ID_n, TRANS_STAT_n, CAPTURE_AMT_n,
// PLANNED_START_DTTM_n.
import { NESTPAY, minorUnitsToRsd } from "@/lib/nestpay";

/**
 * Okruženje banke. `test` postoji da bismo dohvatanje rata i otkazivanje uvežbali nad
 * test serijom PRE puštanja uživo - produkcioni podaci se pri tome ne diraju.
 */
export type NestpayEnv = "prod" | "test";

export function envConfig(env: NestpayEnv) {
  return env === "test"
    ? {
        user: process.env.NESTPAY_TEST_API_USER ?? "",
        password: process.env.NESTPAY_TEST_API_PASSWORD ?? "",
        merchantId: process.env.NESTPAY_TEST_MERCHANT_ID ?? "",
        apiUrl: process.env.NESTPAY_TEST_API_URL ?? "https://testsecurepay.eway2pay.com/fim/api",
      }
    : {
        user: NESTPAY.apiUser,
        password: NESTPAY.apiPassword,
        merchantId: NESTPAY.merchantId,
        apiUrl: NESTPAY.apiUrl,
      };
}

function credentials(env: NestpayEnv): string {
  const c = envConfig(env);
  return `<Name>${c.user}</Name><Password>${c.password}</Password><ClientId>${c.merchantId}</ClientId>`;
}

export function buildRecurringStatusXml(recurringId: string, env: NestpayEnv = "prod"): string {
  return `<?xml version="1.0" encoding="UTF-8"?><CC5Request>${credentials(env)}<Extra><RECURRINGID>${recurringId}</RECURRINGID><ORDERSTATUS>QUERY</ORDERSTATUS></Extra></CC5Request>`;
}

export function buildRecurringCancelXml(recurringId: string, env: NestpayEnv = "prod"): string {
  return `<?xml version="1.0" encoding="UTF-8"?><CC5Request>${credentials(env)}<Extra><RECURRINGOPERATION>Cancel</RECURRINGOPERATION><RECORDTYPE>Recurring</RECORDTYPE><RECORDID>${recurringId}</RECORDID></Extra></CC5Request>`;
}

export interface RecurringCharge {
  installmentNo: number;
  oid: string;
  transStat: string;
  /** null dok naplata nije realizovana */
  amountRsd: number | null;
  plannedAt: string;
  succeeded: boolean;
}

/**
 * TRANS_STAT: dokumentacija pominje samo `PN` (na čekanju); uspela produkcijska
 * prodaja vraća `S`. Zato se uspeh ceni po tome da naplata NIJE na čekanju i da
 * postoji naplaćen iznos - a ne po spisku „dobrih" oznaka koji ne znamo ceo.
 */
export function parseRecurringStatus(text: string): { count: number; charges: RecurringCharge[] } {
  const tag = (name: string) =>
    text.match(new RegExp(`<${name}>([^<]*)</${name}>`, "i"))?.[1]?.trim() ?? "";

  const count = Number(tag("RECURRINGCOUNT")) || 0;
  const charges: RecurringCharge[] = [];

  for (let n = 1; n <= Math.max(count, 0); n++) {
    const oid = tag(`ORD_ID_${n}`);
    if (!oid) continue;
    const transStat = tag(`TRANS_STAT_${n}`).toUpperCase();
    const amountRsd = minorUnitsToRsd(tag(`CAPTURE_AMT_${n}`));
    charges.push({
      installmentNo: n,
      oid,
      transStat,
      amountRsd,
      plannedAt: tag(`PLANNED_START_DTTM_${n}`),
      succeeded: transStat !== "PN" && amountRsd !== null && amountRsd > 0,
    });
  }
  return { count, charges };
}

export function isCancelApproved(text: string): boolean {
  const response = text.match(/<Response>([^<]*)<\/Response>/i)?.[1]?.trim() ?? "";
  const proc = text.match(/<ProcReturnCode>([^<]*)<\/ProcReturnCode>/i)?.[1]?.trim() ?? "";
  return response.toLowerCase() === "approved" || proc === "00";
}

/** Šalje CC5 zahtev i vraća sirov odgovor (null na mrežnu grešku). */
export async function postCc5(xml: string, env: NestpayEnv = "prod"): Promise<string | null> {
  const c = envConfig(env);
  if (!c.user || !c.password) {
    console.error(`[nestpay-recurring] API kredencijali za okruženje ${env} nisu podešeni`);
    return null;
  }
  const res = await fetch(c.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ DATA: xml }).toString(),
  });
  if (!res.ok) return null;
  return res.text();
}
