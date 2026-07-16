import { describe, it, expect } from "vitest";
import { professorsFromVariants, packageTypesFromVariants, resolveVariant, lessonsForVariant, priceTiersFromVariants } from "./individual-pricing";

const V = [
  { id: "v1", professor_id: "p-suzana", package_type: null, price: 23000, paypal_price_eur: null, professor: { id: "p-suzana", full_name: "Suzana Marjanović" } },
  { id: "v2", professor_id: "p-natasa", package_type: null, price: 28000, paypal_price_eur: null, professor: { id: "p-natasa", full_name: "Nataša Hartweger" } },
];
const MP = [
  { id: "m1", professor_id: "p-suzana", package_type: "paket4", price: 14000, paypal_price_eur: null, professor: { id: "p-suzana", full_name: "Suzana Marjanović" } },
  { id: "m2", professor_id: "p-suzana", package_type: "paket8", price: 27500, paypal_price_eur: null, professor: { id: "p-suzana", full_name: "Suzana Marjanović" } },
];

describe("professorsFromVariants", () => {
  it("vraća distinct profesorke", () => {
    expect(professorsFromVariants(V)).toEqual([
      { id: "p-suzana", full_name: "Suzana Marjanović" },
      { id: "p-natasa", full_name: "Nataša Hartweger" },
    ]);
  });
});

describe("packageTypesFromVariants", () => {
  it("po nivou: prazno", () => { expect(packageTypesFromVariants(V)).toEqual([]); });
  it("mesečni: sortirani paketi", () => { expect(packageTypesFromVariants(MP)).toEqual(["paket4", "paket8"]); });
});

describe("resolveVariant", () => {
  it("po nivou: po professorId, packageType null", () => {
    expect(resolveVariant(V, { professorId: "p-natasa", packageType: null })?.price).toBe(28000);
  });
  it("mesečni: po professorId + packageType", () => {
    expect(resolveVariant(MP, { professorId: "p-suzana", packageType: "paket8" })?.price).toBe(27500);
  });
  it("vraća null za nepostojeću kombinaciju", () => {
    expect(resolveVariant(V, { professorId: "p-x", packageType: null })).toBeNull();
  });
});

describe("priceTiersFromVariants", () => {
  it("grupiše profesorke po ceni, rastuće", () => {
    const tiers = priceTiersFromVariants([
      ...V,
      { id: "v3", professor_id: "p-milica", package_type: null, price: 23000, paypal_price_eur: null, professor: { id: "p-milica", full_name: "Milica Vučić" } },
    ]);
    expect(tiers).toEqual([
      { price: 23000, names: ["Suzana Marjanović", "Milica Vučić"] },
      { price: 28000, names: ["Nataša Hartweger"] },
    ]);
  });
  it("mesečni (postoji package_type) → prazno", () => {
    expect(priceTiersFromVariants(MP)).toEqual([]);
  });
  it("bez varijacija → prazno", () => {
    expect(priceTiersFromVariants([])).toEqual([]);
  });
});

describe("lessonsForVariant", () => {
  it("paketX → broj iz tipa", () => { expect(lessonsForVariant({ package_type: "paket8" }, 10)).toBe(8); });
  it("po nivou → included_lessons", () => { expect(lessonsForVariant({ package_type: null }, 10)).toBe(10); });
});
