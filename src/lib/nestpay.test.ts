// src/lib/nestpay.test.ts
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { requestHash, verifyCallbackHash, buildPaymentFields, buildOrderStatusXml, parseOrderStatusResponse, minorUnitsToRsd } from "./nestpay";

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

describe("buildOrderStatusXml", () => {
  it("pravi CC5 upit sa ORDERSTATUS=QUERY za dati oid", () => {
    const xml = buildOrderStatusXml("2026-210");
    expect(xml).toContain("<OrderId>2026-210</OrderId>");
    expect(xml).toContain("<ORDERSTATUS>QUERY</ORDERSTATUS>");
    expect(xml).toContain("<CC5Request>");
  });

  it("koristi API korisnika (Name/Password), ne store key", () => {
    // U testu su env varijable prazne; bitno je da su to BAŠ ta dva polja,
    // jer je slanje store key-a kao lozinke bio uzrok padova upita do 21.07.2026.
    const xml = buildOrderStatusXml("X");
    expect(xml).toMatch(/<Name>[^<]*<\/Name><Password>[^<]*<\/Password>/);
  });
});

describe("parseOrderStatusResponse", () => {
  // Skraćen, ali veran uzorak odgovora banke (redosled tagova kao u priručniku).
  const xml = `<?xml version="1.0" encoding="ISO-8859-9"?><CC5Response>
    <ProcReturnCode>00</ProcReturnCode><Response>Approved</Response>
    <OrderId>2026-210</OrderId><TransId>26201OnlB13975</TransId>
    <Extra><CHARGE_TYPE_CD>S</CHARGE_TYPE_CD><ORIG_TRANS_AMT>27500</ORIG_TRANS_AMT>
    <TRANS_STAT>C</TRANS_STAT><CAPTURE_AMT>27500</CAPTURE_AMT></Extra></CC5Response>`;

  it("čita kod odgovora, iznos i status transakcije", () => {
    const r = parseOrderStatusResponse(xml);
    expect(r.procReturnCode).toBe("00");
    expect(r.amount).toBe("27500");
    expect(r.transStatus).toBe("C");
  });

  it("NE vraća CHARGE_TYPE_CD kao iznos (regresija od 21.07.2026: vraćalo 'S')", () => {
    expect(parseOrderStatusResponse(xml).amount).not.toBe("S");
  });

  it("pada nazad na ORIG_TRANS_AMT kad CAPTURE_AMT ne postoji", () => {
    const bezCapture = `<CC5Response><ProcReturnCode>00</ProcReturnCode>
      <Extra><CHARGE_TYPE_CD>S</CHARGE_TYPE_CD><ORIG_TRANS_AMT>14000</ORIG_TRANS_AMT></Extra></CC5Response>`;
    expect(parseOrderStatusResponse(bezCapture).amount).toBe("14000");
  });
});

describe("minorUnitsToRsd", () => {
  it("celobrojnu vrednost tumači kao pare (provereno na produkciji 21.07.2026)", () => {
    expect(minorUnitsToRsd("2750000")).toBe(27500);
    expect(minorUnitsToRsd("319900")).toBe(3199);
  });

  it("vrednost sa decimalom uzima kakva jeste", () => {
    expect(minorUnitsToRsd("27500.00")).toBe(27500);
    expect(minorUnitsToRsd("3199,50")).toBe(3199.5);
  });

  it("prazno ili neispravno daje null", () => {
    expect(minorUnitsToRsd("")).toBeNull();
    expect(minorUnitsToRsd("S")).toBeNull();
  });
});

describe("buildPaymentFields - mesečno plaćanje", () => {
  const osnovno = {
    orderNumber: "2026-300",
    amountRsd: 3199,
    okUrl: "https://x/cb",
    failUrl: "https://x/cb",
  };

  it("bez recurring parametra ne šalje recurring polja", () => {
    const f = buildPaymentFields(osnovno);
    expect(f.RecurringPaymentNumber).toBeUndefined();
    expect(f.RecurringFrequencyUnit).toBeUndefined();
  });

  it("sa recurring parametrom šalje tri polja (mesečno, 12 naplata)", () => {
    const f = buildPaymentFields({ ...osnovno, recurring: { totalPayments: 12 } });
    expect(f.RecurringPaymentNumber).toBe("12");
    expect(f.RecurringFrequencyUnit).toBe("M");
    expect(f.RecurringFrequency).toBe("1");
  });

  it("potpis ostaje ispravan - recurring polja ne ulaze u hash", () => {
    // Hash se računa iz osnovnih polja; recurring polja se samo dodaju uz formu
    // (potvrda banke 20.07.2026), pa potpis mora da bude isti kao da ih nema.
    const f = buildPaymentFields({ ...osnovno, recurring: { totalPayments: 12 } });
    const ocekivan = requestHash({
      merchantId: f.clientid, oid: f.oid, amount: f.amount,
      okUrl: f.okUrl, failUrl: f.failUrl, transactionType: f.trantype,
      rnd: f.rnd, currency: f.currency, storeKey: process.env.NESTPAY_STORE_KEY ?? "",
    });
    expect(f.hash).toBe(ocekivan);
  });
});
