import { describe, it, expect } from "vitest";
import { mergeConfig, isPurchaseSignal, DEFAULT_SMILE_CONFIG } from "./smile-config";

describe("mergeConfig", () => {
  it("vraća default kad nema redova", () => {
    expect(mergeConfig([])).toEqual(DEFAULT_SMILE_CONFIG);
  });
  it("prepisuje default vrednostima iz baze", () => {
    const cfg = mergeConfig([
      { key: "nudge", value: "true" },
      { key: "enabled", value: "false" },
    ]);
    expect(cfg.nudge).toBe(true);
    expect(cfg.enabled).toBe(false);
    expect(cfg.coupon).toBe(true); // ostaje default
  });
});

describe("isPurchaseSignal", () => {
  it("hvata ključnu reč", () => {
    expect(isPurchaseSignal("koliko je cena kursa?")).toBe(true);
  });
  it("hvata dugu poruku (>15 reči)", () => {
    expect(isPurchaseSignal("a b c d e f g h i j k l m n o p")).toBe(true);
  });
  it("kratko bez signala = false", () => {
    expect(isPurchaseSignal("zdravo")).toBe(false);
  });
});
