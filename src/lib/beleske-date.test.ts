import { describe, it, expect } from "vitest";
import { formatLessonDateShort, formatLessonDateLong } from "./beleske-date";

describe("beleske-date", () => {
  it("formatLessonDateShort - dan.mesec. sa vodećim nulama", () => {
    expect(formatLessonDateShort("2026-09-28")).toBe("28.09.");
    expect(formatLessonDateShort("2026-01-05")).toBe("05.01.");
  });

  it("formatLessonDateLong - dan. naziv meseca godina.", () => {
    expect(formatLessonDateLong("2026-09-28")).toBe("28. septembar 2026.");
    expect(formatLessonDateLong("2026-01-05")).toBe("5. januar 2026.");
  });
});
