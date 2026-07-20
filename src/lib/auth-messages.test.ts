import { describe, it, expect } from "vitest";
import { loginErrorMessage, urlGreskaMessage, passwordSaveErrorMessage } from "./auth-messages";

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

describe("passwordSaveErrorMessage", () => {
  it("slaba/procurela lozinka - kaže ŠTA nije u redu, ne 'pokušaj ponovo'", () => {
    const msg = passwordSaveErrorMessage({
      status: 422,
      message: "Password is known to be weak and easy to guess, please choose a different one.",
    });
    expect(msg).toMatch(/lak(a|u)|slab/i);
    expect(msg).not.toMatch(/pokušaj ponovo/i);
  });

  it("ista kao stara lozinka", () => {
    const msg = passwordSaveErrorMessage({
      status: 422,
      message: "New password should be different from the old password.",
    });
    expect(msg).toMatch(/ista|razlikuje/i);
  });

  it("prekratka lozinka", () => {
    const msg = passwordSaveErrorMessage({
      status: 422,
      message: "Password should be at least 6 characters.",
    });
    expect(msg).toMatch(/6/);
  });

  it("istekla sesija (nema sesije) - vodi na novi link", () => {
    const msg = passwordSaveErrorMessage({ status: 400, message: "Auth session missing!" });
    expect(msg).toMatch(/prijav/i);
  });

  it("za 429 vraća poruku o previše pokušaja", () => {
    expect(passwordSaveErrorMessage({ status: 429 })).toContain("Previše pokušaja");
  });

  it("nepoznata greška ima rezervnu poruku", () => {
    expect(passwordSaveErrorMessage({ status: 500, message: "boom" })).toBeTruthy();
  });

  it("za null vraća prazan string", () => {
    expect(passwordSaveErrorMessage(null)).toBe("");
  });
});
