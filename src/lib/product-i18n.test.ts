import { describe, it, expect } from "vitest";
import { productStrings, checkoutStrings, formatMoney, type Lang } from "./product-i18n";

describe("product-i18n", () => {
  it("vraća engleske stringove za en", () => {
    const t = productStrings("en");
    expect(t.categoryLabel).toBe("Monthly package");
    expect(t.featuresTitle).toBe("What's included");
    expect(t.priceCurrency).toBe("EUR");
  });

  it("vraća srpske stringove za sr", () => {
    const t = productStrings("sr");
    expect(t.featuresTitle).toBe("Šta uključuje paket?");
    expect(t.priceCurrency).toBe("RSD");
  });

  it("checkout stringovi po jeziku", () => {
    expect(checkoutStrings("en").title).toBe("Checkout");
    expect(checkoutStrings("sr").title).toBe("Kupovina");
    expect(checkoutStrings("en").packageLabels.paket4).toBe("4 sessions");
  });

  it("formatMoney EUR i RSD", () => {
    expect(formatMoney(150, "EUR")).toBe("150 €");
    expect(formatMoney(17500, "RSD")).toBe("17.500 din");
  });

  it("nepoznat lang pada na sr", () => {
    expect(productStrings("xx" as Lang).priceCurrency).toBe("RSD");
  });
});
