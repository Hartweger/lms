import { describe, it, expect } from "vitest";
import { remainingLessons, computeLessonStatus } from "./individual-lessons";

describe("remainingLessons", () => {
  it("računa preostale", () => { expect(remainingLessons(3, 7)).toBe(4); });
  it("ne ide ispod 0", () => { expect(remainingLessons(9, 7)).toBe(0); });
});

describe("computeLessonStatus", () => {
  it("active dok ima preostalih", () => { expect(computeLessonStatus(6, 7)).toBe("active"); });
  it("completed kad je potrošeno", () => { expect(computeLessonStatus(7, 7)).toBe("completed"); });
  it("completed i kad pređe", () => { expect(computeLessonStatus(8, 7)).toBe("completed"); });
  it("active za paket 0 (bez definisanog broja)", () => { expect(computeLessonStatus(0, 0)).toBe("active"); });
});
