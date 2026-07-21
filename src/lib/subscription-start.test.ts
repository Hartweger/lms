import { describe, it, expect } from "vitest";
import { recurringIdFromCallback } from "./subscription-start";

describe("recurringIdFromCallback", () => {
  it("čita EXTRA.RECURRINGID (tako stiže u callbacku, provereno 20.07.2026)", () => {
    expect(recurringIdFromCallback({ "EXTRA.RECURRINGID": "26201OnlA13974" })).toBe("26201OnlA13974");
  });

  it("podnosi i varijantu bez prefiksa", () => {
    expect(recurringIdFromCallback({ RECURRINGID: "X1" })).toBe("X1");
  });

  it("bez polja vraća null", () => {
    expect(recurringIdFromCallback({ oid: "2026-300" })).toBeNull();
  });
});
