// src/lib/first-lesson.test.ts
import { describe, it, expect } from "vitest";
import { pickFirstLesson, type LessonLite } from "./first-lesson";

const L = (id: string, course_id: string, order_index: number | null): LessonLite =>
  ({ id, title: `Lekcija ${id}`, course_id, order_index });

describe("pickFirstLesson", () => {
  it("bira lekciju sa najmanjim order_index prvog kursa koji ima lekcije", () => {
    const lessons = [L("b", "k1", 2), L("a", "k1", 1), L("c", "k2", 0)];
    expect(pickFirstLesson(lessons, ["k1", "k2"])).toEqual({ id: "a", title: "Lekcija a" });
  });
  it("preskače kurs bez lekcija (paket/1:1) i uzima sledeći", () => {
    const lessons = [L("x", "k2", 5)];
    expect(pickFirstLesson(lessons, ["k1", "k2"])).toEqual({ id: "x", title: "Lekcija x" });
  });
  it("null order_index tretira kao 0", () => {
    const lessons = [L("n", "k1", null), L("m", "k1", 1)];
    expect(pickFirstLesson(lessons, ["k1"])).toEqual({ id: "n", title: "Lekcija n" });
  });
  it("vraća null kad nijedan kurs nema lekcije", () => {
    expect(pickFirstLesson([], ["k1"])).toBeNull();
    expect(pickFirstLesson([L("a", "drugi", 0)], ["k1"])).toBeNull();
  });
});
