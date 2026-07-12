import { describe, it, expect } from "vitest";
import { loginErrorMessage, urlGreskaMessage } from "./auth-messages";

describe("urlGreskaMessage", () => {
  it("poruka za istekao/pokvaren mejl login-link", () => {
    expect(urlGreskaMessage("link")).toMatch(/istekao/i);
  });
  it("poruka za neuspešnu magic-link prijavu", () => {
    expect(urlGreskaMessage("auth")).toMatch(/link/i);
  });
  it("nepoznat kod → prazan string (bez banera)", () => {
    expect(urlGreskaMessage("nesto")).toBe("");
    expect(urlGreskaMessage(null)).toBe("");
  });
});

describe("loginErrorMessage", () => {
  it("za pogrešnu/nepostojeću lozinku nudi pravljenje nove (bez pominjanja stare platforme)", () => {
    const msg = loginErrorMessage({ status: 400, message: "Invalid login credentials" });
    expect(msg).toContain("napravi novu");
    expect(msg).not.toMatch(/star(a|oj)/i);
  });

  it("prepoznaje invalid credentials i bez status koda (po poruci)", () => {
    const msg = loginErrorMessage({ message: "Invalid login credentials" });
    expect(msg).toContain("napravi novu");
  });

  it("odbijena captcha (isto status 400) ne sme da se prikaže kao pogrešna lozinka", () => {
    const msg = loginErrorMessage({ status: 400, message: "captcha protection: request disallowed" });
    expect(msg).toContain("Bezbednosna provera");
  });

  it("za 429 vraća poruku o previše pokušaja", () => {
    expect(loginErrorMessage({ status: 429 })).toContain("Previše pokušaja");
  });

  it("za null vraća prazan string", () => {
    expect(loginErrorMessage(null)).toBe("");
  });
});
