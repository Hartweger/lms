import { describe, it, expect } from "vitest";
import { parseConsent, consentParams, CONSENT_KEY } from "./consent";

describe("CONSENT_KEY", () => {
  it("ima stabilnu vrednost", () => expect(CONSENT_KEY).toBe("cookie-consent"));
});

describe("parseConsent", () => {
  it("granted ostaje granted", () => expect(parseConsent("granted")).toBe("granted"));
  it("denied ostaje denied", () => expect(parseConsent("denied")).toBe("denied"));
  it("null za nepoznatu vrednost", () => expect(parseConsent("maybe")).toBeNull());
  it("null za null", () => expect(parseConsent(null)).toBeNull());
  it("null za prazan string", () => expect(parseConsent("")).toBeNull());
});

describe("consentParams", () => {
  it("granted postavlja sve Google ključeve na granted", () =>
    expect(consentParams("granted")).toEqual({
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    }));
  it("denied postavlja sve Google ključeve na denied", () =>
    expect(consentParams("denied")).toEqual({
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    }));
});
