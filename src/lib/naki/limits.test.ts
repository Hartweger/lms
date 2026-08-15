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

  it("anonimnom nudi mejl (plan učenja), bez upućivanja na pravljenje naloga", () => {
    const msg = limitReachedMessage({ loggedIn: false, course: null });
    expect(msg).toContain("plan učenja");
    // /prijava nema registraciju - slanje anonimnih tamo je ćorsokak
    expect(msg).not.toContain("/prijava");
  });

  it("anonimnom sa poznatim nivoom dodaje kurs sa kuponom NAKI10 i cenom sa popustom", () => {
    const msg = limitReachedMessage({ loggedIn: false, course });
    expect(msg).toContain("VIDEO kurs A2");
    expect(msg).toContain("NAKI10");
    expect(msg).toContain("8.010"); // 10% popusta na 8.900
    expect(msg).toContain("/kursevi/video-kurs-a2");
  });

  it("ulogovanom ne nudi pravljenje naloga", () => {
    const msg = limitReachedMessage({ loggedIn: true, course });
    expect(msg).not.toContain("/prijava");
    expect(msg).toContain("NAKI10");
  });

  // Ovo je jedini pravi argument u tom trenutku: čovek traži još razgovora.
  it("uvek kaže da polaznici nemaju dnevni limit", () => {
    for (const loggedIn of [true, false]) {
      for (const c of [course, null]) {
        expect(limitReachedMessage({ loggedIn, course: c })).toContain("bez dnevnog limita");
      }
    }
  });

  // 89% limit-događaja nema poznat nivo - bez ovoga ponude nema ni u jednom.
  it("bez poznatog nivoa i dalje nudi katalog i besplatan test nivoa", () => {
    for (const loggedIn of [true, false]) {
      const msg = limitReachedMessage({ loggedIn, course: null });
      expect(msg).toContain("/kursevi");
      expect(msg).toContain("/besplatno-testiranje");
    }
  });

  it("kaže koliko poruka je potrošeno i da sutra stižu nove", () => {
    expect(limitReachedMessage({ loggedIn: false, course: null })).toContain(
      String(NAKI_ANON_DAILY_LIMIT)
    );
    expect(limitReachedMessage({ loggedIn: true, course: null })).toContain(
      String(NAKI_FREE_USER_DAILY_LIMIT)
    );
  });

  it("cene su formatirane sa tačkom, nikad sa zarezom", () => {
    const msg = limitReachedMessage({ loggedIn: false, course: { ...course, price: 11600 } });
    expect(msg).toContain("11.600");
    expect(msg).not.toMatch(/\d,\d/);
  });

  it("ne koristi dugačke crte", () => {
    for (const loggedIn of [true, false]) {
      const msg = limitReachedMessage({ loggedIn, course });
      expect(msg).not.toMatch(/[—–]/);
    }
  });
});
