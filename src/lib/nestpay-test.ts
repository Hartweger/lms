// src/lib/nestpay-test.ts - NestPay TEST okruženje (recurring proba, jul 2026).
// IZOLOVANO od produkcijskog checkouta: sve ide na testni gateway sa posebnim
// merchant/store key parom (NESTPAY_TEST_*). Recurring polja NE ulaze u hash
// (potvrđeno od banke, mejl 20.07.2026).
import crypto from "node:crypto";
import { requestHash } from "@/lib/nestpay";

export const NESTPAY_TEST = {
  merchantId: process.env.NESTPAY_TEST_MERCHANT_ID ?? "",
  storeKey: process.env.NESTPAY_TEST_STORE_KEY ?? "",
  paymentUrl:
    process.env.NESTPAY_TEST_PAYMENT_URL ??
    "https://testsecurepay.eway2pay.com/fim/est3Dgate",
  currency: "941",
};

export function buildRecurringTestFields(o: {
  oid: string;
  amountRsd: number;
  okUrl: string;
  failUrl: string;
  /** ukupan broj naplata u seriji (prva + ponovljene) */
  recurringPaymentNumber: number;
  /** D/W/M/Y */
  recurringFrequencyUnit: "D" | "W" | "M" | "Y";
  /** na svakih koliko jedinica */
  recurringFrequency: number;
}): Record<string, string> {
  const amount = o.amountRsd.toFixed(2);
  const rnd = crypto.randomBytes(16).toString("hex");
  const transactionType = "Auth";
  const hash = requestHash({
    merchantId: NESTPAY_TEST.merchantId, oid: o.oid, amount,
    okUrl: o.okUrl, failUrl: o.failUrl, transactionType, rnd,
    currency: NESTPAY_TEST.currency, storeKey: NESTPAY_TEST.storeKey,
  });
  return {
    clientid: NESTPAY_TEST.merchantId,
    amount,
    okUrl: o.okUrl,
    failUrl: o.failUrl,
    trantype: transactionType,
    currency: NESTPAY_TEST.currency,
    rnd,
    storetype: "3d_pay_hosting",
    hashAlgorithm: "ver2",
    lang: "sr",
    oid: o.oid,
    encoding: "UTF-8",
    hash,
    RecurringPaymentNumber: String(o.recurringPaymentNumber),
    RecurringFrequencyUnit: o.recurringFrequencyUnit,
    RecurringFrequency: String(o.recurringFrequency),
  };
}
