// src/lib/nestpay.ts — NestPay 3D_PAY_HOSTING (Banca Intesa), ver2 hash
import crypto from "node:crypto";

export const NESTPAY = {
  merchantId: process.env.NESTPAY_MERCHANT_ID ?? "",
  storeKey: process.env.NESTPAY_STORE_KEY ?? "",
  username: process.env.NESTPAY_USERNAME ?? "",
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
    // Billing polja (kao stari WP) — pomažu bankin anti-fraud; ne ulaze u hash
    BillToName: o.fullName ?? "",
    BillToCompany: "",
    BillToCountry: o.country ?? "",
    email: o.email ?? "",
  };
}

// Hardening: server-to-server provera statusa (CC5Request XML query)
export async function queryTransaction(oid: string): Promise<{ procReturnCode: string; amount: string } | null> {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><CC5Request><Name>${NESTPAY.username}</Name><Password>${NESTPAY.storeKey}</Password><ClientId>${NESTPAY.merchantId}</ClientId><OrderId>${oid}</OrderId><Extra><ORDERSTATUS>QUERY</ORDERSTATUS></Extra></CC5Request>`;
  const res = await fetch(NESTPAY.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ DATA: xml }).toString(),
  });
  if (!res.ok) return null;
  const text = await res.text();
  const proc = text.match(/<ProcReturnCode>([^<]*)<\/ProcReturnCode>/)?.[1] ?? "";
  const amt = text.match(/<(?:CHARGE_TYPE_CD|Total|amount)>([^<]*)<\//i)?.[1] ?? "";
  return { procReturnCode: proc, amount: amt };
}
