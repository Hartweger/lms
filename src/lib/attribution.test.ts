import { describe, it, expect } from "vitest";
import { resolveAttribution } from "./attribution";

const noCookie = { hasCookie: false };
const saCookie = { hasCookie: true };

describe("resolveAttribution - gclid (Google Ads)", () => {
  it("gclid → google_ads/cpc, prepisuje i postojeći cookie (last-touch)", () =>
    expect(resolveAttribution({ search: "?gclid=abc123", referrer: "https://www.google.com/", ...saCookie })).toEqual({
      source_type: "google_ads",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "",
    }));
  it("gbraid (iOS varijanta) → google_ads", () =>
    expect(resolveAttribution({ search: "?gbraid=xyz", referrer: "", ...noCookie })?.source_type).toBe("google_ads"));
  it("wbraid (iOS varijanta) → google_ads", () =>
    expect(resolveAttribution({ search: "?wbraid=xyz", referrer: "", ...noCookie })?.source_type).toBe("google_ads"));
  it("gclid + utm parametri → google_ads ali čuva utm_source/campaign vrednosti", () =>
    expect(
      resolveAttribution({ search: "?gclid=a&utm_source=google&utm_campaign=srbija-search", referrer: "", ...noCookie }),
    ).toEqual({
      source_type: "google_ads",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "srbija-search",
    }));
});

describe("resolveAttribution - postojeće ponašanje (bez regresije)", () => {
  it("utm_source bez gclid → utm, prepisuje cookie", () =>
    expect(resolveAttribution({ search: "?utm_source=ig&utm_medium=social&utm_campaign=leto", referrer: "", ...saCookie })).toEqual({
      source_type: "utm",
      utm_source: "ig",
      utm_medium: "social",
      utm_campaign: "leto",
    }));
  it("bez utm/gclid a cookie postoji → null (ne piše)", () =>
    expect(resolveAttribution({ search: "", referrer: "https://www.google.com/", ...saCookie })).toBeNull());
  it("bez referrer-a → typein/(direct)", () =>
    expect(resolveAttribution({ search: "", referrer: "", ...noCookie })).toEqual({
      source_type: "typein",
      utm_source: "(direct)",
      utm_medium: "",
      utm_campaign: "",
    }));
  it("google referrer bez gclid → referral google.com (organska pretraga)", () =>
    expect(resolveAttribution({ search: "", referrer: "https://www.google.com/", ...noCookie })).toEqual({
      source_type: "referral",
      utm_source: "google.com",
      utm_medium: "referral",
      utm_campaign: "",
    }));
  it("interni referrer (hartweger.rs) → null", () =>
    expect(resolveAttribution({ search: "", referrer: "https://kurs.hartweger.rs/kursevi", ...noCookie })).toBeNull());
  it("neispravan referrer URL → null", () =>
    expect(resolveAttribution({ search: "", referrer: "nije-url", ...noCookie })).toBeNull());
});
