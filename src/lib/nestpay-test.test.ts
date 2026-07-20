// src/lib/nestpay-test.test.ts
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { buildRecurringTestFields, NESTPAY_TEST } from "./nestpay-test";

function refHash(s: string): string {
  return crypto.createHash("sha512").update(s, "utf8").digest("base64");
}

describe("buildRecurringTestFields", () => {
  const base = {
    oid: "RECTEST-1",
    amountRsd: 100,
    okUrl: "https://x/cb",
    failUrl: "https://x/cb",
    recurringPaymentNumber: 3,
    recurringFrequencyUnit: "D" as const,
    recurringFrequency: 1,
  };

  it("dodaje tačno tri recurring polja iz bankinog uputstva", () => {
    const f = buildRecurringTestFields(base);
    expect(f.RecurringPaymentNumber).toBe("3");
    expect(f.RecurringFrequencyUnit).toBe("D");
    expect(f.RecurringFrequency).toBe("1");
  });

  it("recurring polja NE ulaze u hash (ver2 formula ostaje ista)", () => {
    const f = buildRecurringTestFields(base);
    const expected = refHash(
      [
        NESTPAY_TEST.merchantId, "RECTEST-1", "100.00", "https://x/cb",
        "https://x/cb", "Auth", "", f.rnd, "", "", "", "941",
        NESTPAY_TEST.storeKey,
      ].join("|"),
    );
    expect(f.hash).toBe(expected);
  });

  it("iznos formatira na 2 decimale sa tačkom", () => {
    const f = buildRecurringTestFields({ ...base, amountRsd: 123.5 });
    expect(f.amount).toBe("123.50");
  });
});
