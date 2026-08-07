import { describe, it, expect } from "vitest";
import { renewalWindowStatus, renewalWindowMessage } from "./renewal-window";

const istice = "2026-08-13T13:34:42Z";
const dan = (s: string) => new Date(s);

describe("renewalWindowStatus", () => {
  it("bez podešenog prozora ne ograničava (ostali kuponi rade kao pre)", () => {
    expect(renewalWindowStatus(istice, dan("2020-01-01T00:00:00Z"), null, null)).toEqual({ ok: true });
    expect(renewalWindowStatus(null, dan("2020-01-01T00:00:00Z"), null, null)).toEqual({ ok: true });
  });

  it("propušta tačno na dan isteka", () => {
    expect(renewalWindowStatus(istice, dan("2026-08-13T13:00:00Z"), 30, 60)).toEqual({ ok: true });
  });

  it("propušta unutar 30 dana pre isteka", () => {
    expect(renewalWindowStatus(istice, dan("2026-07-30T11:00:00Z"), 30, 60)).toEqual({ ok: true });
  });

  it("odbija ranije od 30 dana pre isteka", () => {
    expect(renewalWindowStatus(istice, dan("2026-07-01T00:00:00Z"), 30, 60)).toEqual({
      ok: false,
      reason: "prerano",
      expiresAt: istice,
    });
  });

  it("propušta u roku od 60 dana posle isteka", () => {
    expect(renewalWindowStatus(istice, dan("2026-10-01T00:00:00Z"), 30, 60)).toEqual({ ok: true });
  });

  it("odbija posle 60 dana od isteka", () => {
    expect(renewalWindowStatus(istice, dan("2026-10-20T00:00:00Z"), 30, 60)).toEqual({
      ok: false,
      reason: "kasno",
      expiresAt: istice,
    });
  });

  it("granice su uključive - poslednji sekund pre zatvaranja još važi", () => {
    expect(renewalWindowStatus(istice, dan("2026-10-12T13:34:42Z"), 30, 60)).toEqual({ ok: true });
    expect(renewalWindowStatus(istice, dan("2026-07-14T13:34:42Z"), 30, 60)).toEqual({ ok: true });
  });

  it("trajan pristup (bez isteka) nema šta da obnovi", () => {
    expect(renewalWindowStatus(null, dan("2026-08-01T00:00:00Z"), 30, 60)).toEqual({
      ok: false,
      reason: "bez_isteka",
      expiresAt: null,
    });
  });

  it("samo jedna strana prozora se sme podesiti", () => {
    expect(renewalWindowStatus(istice, dan("2020-01-01T00:00:00Z"), null, 60)).toEqual({ ok: true });
    expect(renewalWindowStatus(istice, dan("2030-01-01T00:00:00Z"), 30, null)).toEqual({ ok: true });
  });
});

describe("renewalWindowMessage", () => {
  it("prerano - kaže do kada pristup važi i da podsetnik stiže sam", () => {
    const m = renewalWindowMessage({ ok: false, reason: "prerano", expiresAt: istice }, 30, 60);
    expect(m).toContain("13. avgust 2026");
    expect(m).toContain("30 dana pre isteka");
  });

  it("kasno - kaže da je rok prošao, bez pretnje gubitkom napretka", () => {
    const m = renewalWindowMessage({ ok: false, reason: "kasno", expiresAt: istice }, 30, 60);
    expect(m).toContain("60 dana");
    expect(m).toContain("napredak");
  });

  it("bez isteka - pristup ne ističe, kod nije potreban", () => {
    const m = renewalWindowMessage({ ok: false, reason: "bez_isteka", expiresAt: null }, 30, 60);
    expect(m).toContain("ne ističe");
  });
});
