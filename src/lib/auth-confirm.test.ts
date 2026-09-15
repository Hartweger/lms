import { describe, it, expect } from "vitest";
import { isOtpType, safeNext, needsClick, potvrdaUrl, potvrdaTekst } from "./auth-confirm";

describe("safeNext", () => {
  it("prazno/null → /dashboard", () => {
    expect(safeNext(null)).toBe("/dashboard");
    expect(safeNext(undefined)).toBe("/dashboard");
    expect(safeNext("")).toBe("/dashboard");
  });
  it("relativna putanja sa query-jem prolazi (hvala posle plaćanja)", () => {
    expect(safeNext("/kupovina/hvala/abc?status=ok")).toBe("/kupovina/hvala/abc?status=ok");
    expect(safeNext("/profil")).toBe("/profil");
  });
  it("open-redirect na tuđi domen se odbija", () => {
    expect(safeNext("https://zlo.rs/x")).toBe("/dashboard");
    expect(safeNext("//zlo.rs/x")).toBe("/dashboard");
    expect(safeNext("/\\zlo.rs")).toBe("/dashboard");
    expect(safeNext("javascript:alert(1)")).toBe("/dashboard");
  });
});

describe("isOtpType", () => {
  it("prihvata Supabase tipove, odbija ostalo", () => {
    expect(isOtpType("magiclink")).toBe(true);
    expect(isOtpType("recovery")).toBe(true);
    expect(isOtpType("nesto")).toBe(false);
    expect(isOtpType(null)).toBe(false);
  });
});

describe("needsClick", () => {
  it("link iz mejla (bez auto) traži klik; serverski auto=1 ne", () => {
    expect(needsClick(null)).toBe(true);
    expect(needsClick("0")).toBe(true);
    expect(needsClick("1")).toBe(false);
  });
});

describe("potvrdaUrl", () => {
  it("prenosi token, tip i next URL-enkodovano", () => {
    const url = potvrdaUrl({ token_hash: "abc", type: "magiclink", next: "/kupovina/hvala/1?status=ok" });
    expect(url.startsWith("/auth/potvrda?")).toBe(true);
    const q = new URLSearchParams(url.split("?")[1]);
    expect(q.get("token_hash")).toBe("abc");
    expect(q.get("type")).toBe("magiclink");
    expect(q.get("next")).toBe("/kupovina/hvala/1?status=ok");
  });
});

describe("potvrdaTekst", () => {
  it("recovery vodi ka lozinki, ostalo ka prijavi", () => {
    expect(potvrdaTekst("recovery").dugme).toMatch(/lozink/i);
    expect(potvrdaTekst("magiclink").dugme).toBe("Prijavi me");
  });
});
