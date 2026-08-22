import { describe, expect, it } from "vitest";
import { datumSlovima } from "./datum";

describe("datumSlovima", () => {
  it("mesec ide u genitivu, kao u rečenici „do 15. septembra\"", () => {
    expect(datumSlovima("2026-09-15T00:00:00+02:00")).toBe("15. septembra 2026");
  });

  it("ponoć po Beogradu ne sklizne na prethodni dan (u UTC-u je to 22h dan ranije)", () => {
    expect(datumSlovima("2026-09-15T00:00:00+02:00")).toContain("15.");
    expect(datumSlovima("2026-01-01T00:00:00+01:00")).toBe("1. januara 2026");
  });

  it("decembar i januar ne mešaju godinu", () => {
    expect(datumSlovima("2026-12-31T23:00:00+01:00")).toBe("31. decembra 2026");
  });

  it("pokvaren datum ne ruši mejl", () => {
    expect(datumSlovima("nije-datum")).toBe("");
  });
});
