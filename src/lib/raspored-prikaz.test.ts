import { describe, expect, it } from "vitest";
import { LEVEL_ORDER, formatPrice, getNivoKey, nivoColors } from "./raspored-prikaz";

describe("raspored-prikaz", () => {
  it("getNivoKey vadi nivo iz oznake grupe", () => {
    expect(getNivoKey("A1.1")).toBe("A1");
    expect(getNivoKey("b2.2")).toBe("B2");
  });
  it("formatPrice koristi tačku kao separator hiljada", () => {
    expect(formatPrice(19600)).toBe("19.600");
  });
  it("boja definisana za svaki CEFR nivo", () => {
    LEVEL_ORDER.forEach((l) => expect(nivoColors[l]).toBeDefined());
  });
});
