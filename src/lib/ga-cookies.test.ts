import { describe, it, expect } from "vitest";
import { parseGaClientId, parseGaSessionId, gaIdsFromCookieHeader, GA_STREAM_COOKIE } from "./ga-cookies";

describe("parseGaClientId", () => {
  it("izvlači client_id iz standardnog _ga kolačića", () => {
    expect(parseGaClientId("GA1.1.708139520.1750000000")).toBe("708139520.1750000000");
  });

  it("radi i sa GA1.2 (stariji format sa domenom)", () => {
    expect(parseGaClientId("GA1.2.123456789.1699999999")).toBe("123456789.1699999999");
  });

  it("vraća null za prazan/nepostojeći kolačić", () => {
    expect(parseGaClientId(undefined)).toBeNull();
    expect(parseGaClientId(null)).toBeNull();
    expect(parseGaClientId("")).toBeNull();
  });

  it("vraća null za vrednost koja ne liči na GA client id", () => {
    expect(parseGaClientId("nesto-drugo")).toBeNull();
    expect(parseGaClientId("GA1.1.samojedan")).toBeNull();
  });
});

describe("parseGaSessionId", () => {
  it("izvlači session_id iz GS2 formata", () => {
    expect(parseGaSessionId("GS2.1.s1752990000$o12$g1$t1752990500$j0$l0$h0")).toBe("1752990000");
  });

  it("izvlači session_id iz starijeg GS1 formata", () => {
    expect(parseGaSessionId("GS1.1.1752990000.12.1.1752990500.0.0.0")).toBe("1752990000");
  });

  it("vraća null za prazan/nepoznat format", () => {
    expect(parseGaSessionId(undefined)).toBeNull();
    expect(parseGaSessionId(null)).toBeNull();
    expect(parseGaSessionId("")).toBeNull();
    expect(parseGaSessionId("XX9.9.blabla")).toBeNull();
  });
});

describe("gaIdsFromCookieHeader", () => {
  it("izvlači oba ID-ja iz punog Cookie zaglavlja", () => {
    const header =
      "sb-token=xyz; _ga=GA1.1.708139520.1750000000; _ga_MB9DRXVVF6=GS2.1.s1752990000$o12$g1$t1752990500$j0$l0$h0; other=1";
    expect(gaIdsFromCookieHeader(header)).toEqual({
      gaClientId: "708139520.1750000000",
      gaSessionId: "1752990000",
    });
  });

  it("vraća null-ove bez zaglavlja ili bez GA kolačića (nema saglasnosti)", () => {
    expect(gaIdsFromCookieHeader(null)).toEqual({ gaClientId: null, gaSessionId: null });
    expect(gaIdsFromCookieHeader("sb-token=xyz")).toEqual({ gaClientId: null, gaSessionId: null });
  });
});

describe("GA_STREAM_COOKIE", () => {
  it("odgovara measurement ID-ju bez G- prefiksa", () => {
    expect(GA_STREAM_COOKIE).toBe("_ga_MB9DRXVVF6");
  });
});
