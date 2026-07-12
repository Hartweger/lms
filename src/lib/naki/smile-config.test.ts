import { describe, it, expect } from "vitest";
import { mergeConfig, isPurchaseSignal, extractEmail, DEFAULT_SMILE_CONFIG } from "./smile-config";

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

describe("extractEmail", () => {
  it("nalazi mejl u sred rečenice i normalizuje na mala slova", () => {
    expect(extractEmail("Moj mejl je Ana.Babic@Gmail.com, hvala!")).toBe("ana.babic@gmail.com");
  });
  it("nalazi mejl kad je poruka samo mejl", () => {
    expect(extractEmail("pera@example.rs")).toBe("pera@example.rs");
  });
  it("ne guta tačku na kraju rečenice", () => {
    expect(extractEmail("Evo ga: pera@example.com.")).toBe("pera@example.com");
  });
  it("null kad nema mejla", () => {
    expect(extractEmail("Koliko košta kurs A1?")).toBeNull();
    expect(extractEmail("cena je 100 @ mesec")).toBeNull();
    expect(extractEmail("")).toBeNull();
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
