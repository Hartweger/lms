// src/lib/partner-coupon.test.ts
// Testira samo validaciju unosa kupona saradnika (parseKuponInput).
// Upis (insertPartnerCoupon) traži Supabase klijent, pa se ovde ne dira.
import { describe, it, expect } from "vitest";
import { parseKuponInput } from "@/lib/partner-coupon";

const osnovni = { code: "ANA", percent: 10, courseId: "kurs-1", expiresDate: "" };

describe("parseKuponInput", () => {
  it("čisti razmake i diže kod na velika slova", () => {
    const r = parseKuponInput({ ...osnovni, code: " ana " });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.code).toBe("ANA");
  });

  it("odbija prekratak kod", () => {
    const r = parseKuponInput({ ...osnovni, code: "A" });
    expect(r.ok).toBe(false);
  });

  it("odbija kod sa razmakom u sredini", () => {
    const r = parseKuponInput({ ...osnovni, code: "ANA IG" });
    expect(r.ok).toBe(false);
  });

  it("odbija popust 0", () => {
    const r = parseKuponInput({ ...osnovni, percent: 0 });
    expect(r.ok).toBe(false);
  });

  it("odbija popust 101", () => {
    const r = parseKuponInput({ ...osnovni, percent: 101 });
    expect(r.ok).toBe(false);
  });

  it("odbija prazan proizvod", () => {
    const r = parseKuponInput({ ...osnovni, courseId: "  " });
    expect(r.ok).toBe(false);
  });

  it("odbija datum u našem formatu 29.9.2026", () => {
    const r = parseKuponInput({ ...osnovni, expiresDate: "29.9.2026" });
    expect(r.ok).toBe(false);
  });

  it("prazan datum znači bez roka (null)", () => {
    const r = parseKuponInput({ ...osnovni, expiresDate: "" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.expiresDate).toBeNull();
  });

  it("prima ispravan datum YYYY-MM-DD", () => {
    const r = parseKuponInput({ ...osnovni, expiresDate: "2026-09-29" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.expiresDate).toBe("2026-09-29");
  });
});
