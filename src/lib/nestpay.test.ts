// src/lib/nestpay.test.ts
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { requestHash, verifyCallbackHash, buildPaymentFields } from "./nestpay";

const STORE_KEY = "TEST_STORE_KEY";

// nezavisna referentna implementacija (ista formula kao plugin)
function refHash(s: string): string {
  return crypto.createHash("sha512").update(s, "utf8").digest("base64");
}

describe("requestHash (ver2)", () => {
  it("slaže polja tačnim redosledom i formulom", () => {
    const out = requestHash({
      merchantId: "M1",
      oid: "2026-001",
      amount: "37000.00",
      okUrl: "https://x/ok",
      failUrl: "https://x/fail",
      transactionType: "Auth",
      rnd: "RND123",
      currency: "941",
      storeKey: STORE_KEY,
    });
    const expected = refHash(
      "M1|2026-001|37000.00|https://x/ok|https://x/fail|Auth||RND123||||941|" + STORE_KEY
    );
    expect(out).toBe(expected);
  });
});

describe("verifyCallbackHash", () => {
  it("prihvata validan potpis po HASHPARAMS", () => {
    const params: Record<string, string> = {
      clientid: "M1", oid: "2026-001", AuthCode: "A1", ProcReturnCode: "00",
      Response: "Approved", HASHPARAMS: "clientid|oid|AuthCode|ProcReturnCode|Response",
    };
    const toHash = ["M1", "2026-001", "A1", "00", "Approved"].join("|") + "|" + STORE_KEY;
    params.HASH = refHash(toHash);
    expect(verifyCallbackHash(params, STORE_KEY)).toBe(true);
  });

  it("odbija pogrešan potpis", () => {
    const params: Record<string, string> = {
      clientid: "M1", oid: "2026-001", HASHPARAMS: "clientid|oid", HASH: "wrong",
    };
    expect(verifyCallbackHash(params, STORE_KEY)).toBe(false);
  });
});

describe("buildPaymentFields", () => {
  it("postavlja obavezna NestPay polja", () => {
    const f = buildPaymentFields({
      orderNumber: "2026-001", amountRsd: 37000,
      okUrl: "https://x/ok", failUrl: "https://x/fail",
      email: "a@b.rs", fullName: "Ana Anic",
    });
    expect(f.storetype).toBe("3d_pay_hosting");
    expect(f.hashAlgorithm).toBe("ver2");
    expect(f.currency).toBe("941");
    expect(f.trantype).toBe("Auth");
    expect(f.amount).toBe("37000.00");
    expect(f.oid).toBe("2026-001");
    expect(typeof f.hash).toBe("string");
    expect(f.hash.length).toBeGreaterThan(20);
  });
});
