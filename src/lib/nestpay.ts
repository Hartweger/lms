// src/lib/nestpay.ts - NestPay 3D_PAY_HOSTING (Banca Intesa), ver2 hash
import crypto from "node:crypto";

export const NESTPAY = {
  merchantId: process.env.NESTPAY_MERCHANT_ID ?? "",
  storeKey: process.env.NESTPAY_STORE_KEY ?? "",
  username: process.env.NESTPAY_USERNAME ?? "",
  // API korisnik (MC → Add New User, Role = Api User). Ime MORA biti različito od
  // Merchant Administratora, a lozinka mu ne ističe. Banka 21.07.2026: raniji padovi
  // CC5 upita NISU bili IP blokada (NestPay nema IP filter) nego pogrešni kredencijali
  // - za upite se koristi API user, ne merchant admin + store key.
  apiUser: process.env.NESTPAY_API_USER ?? "",
  apiPassword: process.env.NESTPAY_API_PASSWORD ?? "",
  paymentUrl: process.env.NESTPAY_PAYMENT_URL ?? "https://bib.eway2pay.com/fim/est3Dgate",
  apiUrl: process.env.NESTPAY_API_URL ?? "https://bib.eway2pay.com/fim/api",
  currency: process.env.NESTPAY_CURRENCY ?? "941",
};

function sha512Base64(s: string): string {
  return crypto.createHash("sha512").update(s, "utf8").digest("base64");
}

export function requestHash(p: {
  merchantId: string; oid: string; amount: string; okUrl: string;
  failUrl: string; transactionType: string; rnd: string; currency: string; storeKey: string;
}): string {
  // tačan ver2 raspored iz plugina wc-serbian-nestpay v1.2.2 (prazna polja namerna)
  const s = [
    p.merchantId, p.oid, p.amount, p.okUrl, p.failUrl, p.transactionType,
    "", p.rnd, "", "", "", p.currency, p.storeKey,
  ].join("|");
  return sha512Base64(s);
}

export function verifyCallbackHash(params: Record<string, string>, storeKey: string): boolean {
  const hashParams = params.HASHPARAMS;
  const receivedHash = params.HASH;
  if (!hashParams || !receivedHash) return false;
  const values = hashParams.split("|").map((name) => params[name] ?? "");
  const s = values.join("|") + "|" + storeKey;
  const computed = sha512Base64(s);
  // konstantno-vremensko poređenje
  const a = Buffer.from(computed);
  const b = Buffer.from(receivedHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function buildPaymentFields(o: {
  orderNumber: string; amountRsd: number; okUrl: string; failUrl: string;
  email?: string; fullName?: string; country?: string; shopUrl?: string;
}): Record<string, string> {
  const amount = o.amountRsd.toFixed(2); // 2 decimale, tačka
  const rnd = crypto.randomBytes(16).toString("hex");
  const transactionType = "Auth";
  const hash = requestHash({
    merchantId: NESTPAY.merchantId, oid: o.orderNumber, amount,
    okUrl: o.okUrl, failUrl: o.failUrl, transactionType, rnd,
    currency: NESTPAY.currency, storeKey: NESTPAY.storeKey,
  });
  return {
    clientid: NESTPAY.merchantId,
    amount,
    okUrl: o.okUrl,
    failUrl: o.failUrl,
    shopurl: o.shopUrl ?? "",
    trantype: transactionType,
    currency: NESTPAY.currency,
    rnd,
    storetype: "3d_pay_hosting",
    hashAlgorithm: "ver2",
    lang: "sr",
    oid: o.orderNumber,
    encoding: "UTF-8",
    hash,
    // Billing polja (kao stari WP) - pomažu bankin anti-fraud; ne ulaze u hash
    BillToName: o.fullName ?? "",
    BillToCompany: "",
    BillToCountry: o.country ?? "",
    email: o.email ?? "",
  };
}

/** XML za CC5 upit o statusu porudžbine. Izdvojeno da bude testabilno bez mreže. */
export function buildOrderStatusXml(oid: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><CC5Request><Name>${NESTPAY.apiUser}</Name><Password>${NESTPAY.apiPassword}</Password><ClientId>${NESTPAY.merchantId}</ClientId><OrderId>${oid}</OrderId><Extra><ORDERSTATUS>QUERY</ORDERSTATUS></Extra></CC5Request>`;
}

// Hardening: server-to-server provera statusa (CC5Request XML query)
export async function queryTransaction(
  oid: string,
): Promise<{ procReturnCode: string; amount: string; amountRsd: number | null; transStatus: string } | null> {
  if (!NESTPAY.apiUser || !NESTPAY.apiPassword) {
    console.error("[nestpay] queryTransaction: NESTPAY_API_USER/PASSWORD nisu podešeni - upit preskočen");
    return null;
  }
  const xml = buildOrderStatusXml(oid);
  const res = await fetch(NESTPAY.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ DATA: xml }).toString(),
  });
  if (!res.ok) return null;
  return parseOrderStatusResponse(await res.text());
}

/**
 * Čita CC5 odgovor na ORDERSTATUS=QUERY.
 * PAŽNJA: iznos je u `CAPTURE_AMT` (naplaćeno) odnosno `ORIG_TRANS_AMT` (prvobitno).
 * `CHARGE_TYPE_CD` NIJE iznos nego tip transakcije („S" = Sale) - ranija verzija je
 * čitala baš njega i vraćala „S" umesto iznosa (uočeno na produkciji 21.07.2026).
 */
export function parseOrderStatusResponse(
  text: string,
): { procReturnCode: string; amount: string; amountRsd: number | null; transStatus: string } {
  const tag = (name: string) =>
    text.match(new RegExp(`<${name}>([^<]*)</${name}>`, "i"))?.[1]?.trim() ?? "";
  const amount = tag("CAPTURE_AMT") || tag("ORIG_TRANS_AMT");
  return {
    procReturnCode: tag("ProcReturnCode"),
    amount,
    amountRsd: minorUnitsToRsd(amount),
    transStatus: tag("TRANS_STAT"),
  };
}

/**
 * Banka iznos u ORDERSTATUS odgovoru vraća U PARAMA (celobrojno): porudžbina
 * 2026-210 od 27.500,00 RSD vratila je `2750000` (provereno na produkciji 21.07.2026).
 * Ako vrednost ipak stigne sa decimalnom tačkom, uzima se kakva jeste.
 */
export function minorUnitsToRsd(raw: string): number | null {
  if (!raw) return null;
  const normalized = raw.replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return normalized.includes(".") ? n : n / 100;
}
