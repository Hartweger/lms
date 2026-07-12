import { describe, it, expect } from "vitest";
import {
  personalDailyLimit,
  limitReachedMessage,
  NAKI_ANON_DAILY_LIMIT,
  NAKI_FREE_USER_DAILY_LIMIT,
} from "./limits";

describe("personalDailyLimit", () => {
  it("anoniman korisnik dobija anonimni limit", () => {
    expect(personalDailyLimit({ loggedIn: false, isStudent: false })).toBe(NAKI_ANON_DAILY_LIMIT);
  });
  it("ulogovan bez kursa dobija duplo veći limit", () => {
    expect(personalDailyLimit({ loggedIn: true, isStudent: false })).toBe(
      NAKI_FREE_USER_DAILY_LIMIT
    );
    expect(NAKI_FREE_USER_DAILY_LIMIT).toBeGreaterThan(NAKI_ANON_DAILY_LIMIT);
  });
  it("polaznik (ima kurs) nema lični limit", () => {
    expect(personalDailyLimit({ loggedIn: true, isStudent: true })).toBeNull();
  });
});

describe("limitReachedMessage", () => {
  const course = { slug: "video-kurs-a2", title: "VIDEO kurs A2", price: 8900 };

  it("anonimnom nudi mejl (plan učenja) i besplatan nalog", () => {
    const msg = limitReachedMessage({ loggedIn: false, course: null });
    expect(msg).toContain("plan učenja");
    expect(msg).toContain("hartweger.rs/prijava");
  });

  it("anonimnom sa poznatim nivoom dodaje kurs sa kuponom NAKI10 i cenom sa popustom", () => {
    const msg = limitReachedMessage({ loggedIn: false, course });
    expect(msg).toContain("VIDEO kurs A2");
    expect(msg).toContain("NAKI10");
    expect(msg).toContain("8010"); // 10% popusta na 8900
    expect(msg).toContain("/kursevi/video-kurs-a2");
  });

  it("ulogovanom ne nudi pravljenje naloga", () => {
    const msg = limitReachedMessage({ loggedIn: true, course });
    expect(msg).not.toContain("/prijava");
    expect(msg).toContain("NAKI10");
  });

  it("ne koristi dugačke crte", () => {
    for (const loggedIn of [true, false]) {
      const msg = limitReachedMessage({ loggedIn, course });
      expect(msg).not.toMatch(/[—–]/);
    }
  });
});
