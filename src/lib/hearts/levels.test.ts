// src/lib/hearts/levels.test.ts
import { describe, it, expect } from "vitest";
import { levelFromHearts, progressToNext } from "./levels";

describe("levelFromHearts", () => {
  it("nivo 1 za 0 srca", () => expect(levelFromHearts(0)).toBe(1));
  it("nivo 1 do praga", () => expect(levelFromHearts(99)).toBe(1));
  it("nivo 2 na 100", () => expect(levelFromHearts(100)).toBe(2));
  it("nivo 5 na 700", () => expect(levelFromHearts(700)).toBe(5));
  it("nivo 6 na 1000", () => expect(levelFromHearts(1000)).toBe(6));
  it("posle tabele +350 po nivou", () => expect(levelFromHearts(1350)).toBe(7));
});

describe("progressToNext", () => {
  it("na 150 srca: nivo 2, treba još 100 do nivoa 3", () => {
    expect(progressToNext(150)).toEqual({ level: 2, into: 50, span: 150, toNext: 100, percent: 33, nextLevel: 3 });
  });
  it("na 0 srca: nivo 1, 0%", () => {
    expect(progressToNext(0)).toEqual({ level: 1, into: 0, span: 100, toNext: 100, percent: 0, nextLevel: 2 });
  });
  it("procenat se zaokružuje na dole (ne pre vremena 100%)", () => {
    expect(progressToNext(1349).percent).toBe(99);
  });
});
