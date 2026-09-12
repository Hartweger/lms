import { describe, it, expect } from "vitest";
import { krajDanaBeograd } from "./belgrade-date";

describe("krajDanaBeograd", () => {
  it("letnje vreme (CEST) daje +02:00", () => {
    expect(krajDanaBeograd("2026-09-29")).toBe("2026-09-29T23:59:59+02:00");
  });
  it("zimsko vreme (CET) daje +01:00", () => {
    expect(krajDanaBeograd("2026-12-01")).toBe("2026-12-01T23:59:59+01:00");
  });
  it("odbija loš format", () => {
    expect(() => krajDanaBeograd("29.9.2026")).toThrow();
  });
});
