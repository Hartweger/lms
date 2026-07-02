// src/lib/login-link.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { createLoginLinkToken, verifyLoginLinkToken, isSafeNext } from "./login-link";

const DAY = 86400000;
const T0 = 1_750_000_000_000; // fiksna referentna tačka

beforeAll(() => {
  process.env.LOGIN_LINK_SECRET = "test-secret-za-vitest";
});

describe("isSafeNext", () => {
  it("prihvata relativne putanje", () => {
    expect(isSafeNext("/lekcija/abc")).toBe(true);
    expect(isSafeNext("/dashboard")).toBe(true);
    expect(isSafeNext("/kupovina/hvala/x?status=ok")).toBe(true);
  });
  it("odbija open-redirect oblike", () => {
    expect(isSafeNext("//zli.example")).toBe(false);
    expect(isSafeNext("https://zli.example")).toBe(false);
    expect(isSafeNext("javascript:alert(1)")).toBe(false);
    expect(isSafeNext("/putanja\\..")).toBe(false);
    expect(isSafeNext("")).toBe(false);
  });
});

describe("createLoginLinkToken + verifyLoginLinkToken", () => {
  it("okrugli put: potpiše pa verifikuje email i next", () => {
    const t = createLoginLinkToken({ email: "Kupac@Example.com", next: "/lekcija/l1" }, T0);
    const v = verifyLoginLinkToken(t, T0 + DAY);
    expect(v).toEqual({ email: "kupac@example.com", next: "/lekcija/l1" });
  });
  it("token je višekratan unutar roka", () => {
    const t = createLoginLinkToken({ email: "a@b.rs", next: "/lekcija/l1" }, T0);
    expect(verifyLoginLinkToken(t, T0 + DAY)).not.toBeNull();
    expect(verifyLoginLinkToken(t, T0 + 2 * DAY)).not.toBeNull();
  });
  it("ističe posle 7 dana (default)", () => {
    const t = createLoginLinkToken({ email: "a@b.rs", next: "/x" }, T0);
    expect(verifyLoginLinkToken(t, T0 + 7 * DAY - 1)).not.toBeNull();
    expect(verifyLoginLinkToken(t, T0 + 7 * DAY + 1)).toBeNull();
  });
  it("poštuje expiresInDays", () => {
    const t = createLoginLinkToken({ email: "a@b.rs", next: "/x", expiresInDays: 1 }, T0);
    expect(verifyLoginLinkToken(t, T0 + DAY + 1)).toBeNull();
  });
  it("odbija falsifikovan potpis i pokvaren format", () => {
    const t = createLoginLinkToken({ email: "a@b.rs", next: "/x" }, T0);
    const [body] = t.split(".");
    expect(verifyLoginLinkToken(`${body}.AAAA`, T0)).toBeNull();
    expect(verifyLoginLinkToken("nije-token", T0)).toBeNull();
    expect(verifyLoginLinkToken("", T0)).toBeNull();
    // izmenjen payload uz stari potpis
    const drugi = createLoginLinkToken({ email: "napadac@zli.rs", next: "/x" }, T0);
    const [, sig] = t.split(".");
    const [tudjBody] = drugi.split(".");
    expect(verifyLoginLinkToken(`${tudjBody}.${sig}`, T0)).toBeNull();
  });
  it("nesiguran next se normalizuje na /dashboard pri kreiranju", () => {
    const t = createLoginLinkToken({ email: "a@b.rs", next: "https://zli.example" }, T0);
    expect(verifyLoginLinkToken(t, T0)?.next).toBe("/dashboard");
  });
});
