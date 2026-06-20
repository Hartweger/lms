import { describe, it, expect } from "vitest";
import { computeCouponDiscount, isTermPackage } from "./coupon-discount";

describe("computeCouponDiscount", () => {
  it("fiksni popust skida tačan iznos", () => {
    expect(computeCouponDiscount("fixed", 5960, 20500)).toEqual({
      discount: 5960,
      finalPrice: 14540,
    });
  });

  it("fiksni popust se clampuje na cenu (nikad negativno)", () => {
    expect(computeCouponDiscount("fixed", 9000, 5000)).toEqual({
      discount: 5000,
      finalPrice: 0,
    });
  });

  it("procentualni popust računa procenat (zaokruženo)", () => {
    expect(computeCouponDiscount("percent", 10, 23000)).toEqual({
      discount: 2300,
      finalPrice: 20700,
    });
  });

  it("nepoznat tip tretira kao procenat (kompatibilnost)", () => {
    expect(computeCouponDiscount("", 10, 1000)).toEqual({
      discount: 100,
      finalPrice: 900,
    });
  });
});

describe("isTermPackage", () => {
  it("prihvata pakete od 4/8/12 termina", () => {
    expect(isTermPackage("paket4")).toBe(true);
    expect(isTermPackage("paket8")).toBe(true);
    expect(isTermPackage("paket12")).toBe(true);
  });

  it("odbija mesečne, null i nepoznate pakete", () => {
    expect(isTermPackage(null)).toBe(false);
    expect(isTermPackage(undefined)).toBe(false);
    expect(isTermPackage("")).toBe(false);
    expect(isTermPackage("mesecni")).toBe(false);
    expect(isTermPackage("paket6")).toBe(false);
  });
});
