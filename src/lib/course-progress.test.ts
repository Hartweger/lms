import { describe, it, expect } from "vitest";
import { computeCoursesProgress } from "./course-progress";

const L = (id: string, courseId: string, i: number, title = `Lekcija ${i}`) =>
  ({ id, course_id: courseId, order_index: i, title });

describe("computeCoursesProgress", () => {
  it("računa napredak po kursu iz batch podataka (bez mešanja kurseva)", () => {
    const courses = [{ id: "c1" }, { id: "c2" }];
    const lessons = [L("a", "c1", 1), L("b", "c1", 2), L("c", "c1", 3), L("x", "c2", 1)];
    const progress = [
      { lesson_id: "a", completed_at: "2026-07-01T10:00:00Z" },
      { lesson_id: "x", completed_at: "2026-07-02T10:00:00Z" },
    ];

    const [c1, c2] = computeCoursesProgress(courses, lessons, progress);

    expect(c1.totalLessons).toBe(3);
    expect(c1.completedLessons).toBe(1);
    expect(c1.progress).toBe(33);
    expect(c2.totalLessons).toBe(1);
    expect(c2.progress).toBe(100);
  });

  it("trenutna lekcija = prva nezavršena po order_index", () => {
    const lessons = [L("a", "c1", 1), L("b", "c1", 2), L("c", "c1", 3)];
    const progress = [{ lesson_id: "a", completed_at: "2026-07-01T10:00:00Z" }];

    const [c1] = computeCoursesProgress([{ id: "c1" }], lessons, progress);

    expect(c1.currentLessonId).toBe("b");
    expect(c1.currentLessonTitle).toBe("Lekcija 2");
  });

  it("sve završeno → trenutna je poslednja lekcija", () => {
    const lessons = [L("a", "c1", 1), L("b", "c1", 2)];
    const progress = [
      { lesson_id: "a", completed_at: "2026-07-01T10:00:00Z" },
      { lesson_id: "b", completed_at: "2026-07-02T10:00:00Z" },
    ];

    const [c1] = computeCoursesProgress([{ id: "c1" }], lessons, progress);

    expect(c1.progress).toBe(100);
    expect(c1.currentLessonId).toBe("b");
  });

  it("lastActivityAt = najskoriji completed_at tog kursa", () => {
    const lessons = [L("a", "c1", 1), L("b", "c1", 2), L("x", "c2", 1)];
    const progress = [
      { lesson_id: "a", completed_at: "2026-07-01T10:00:00Z" },
      { lesson_id: "b", completed_at: "2026-07-03T10:00:00Z" },
      { lesson_id: "x", completed_at: "2026-07-05T10:00:00Z" },
    ];

    const [c1] = computeCoursesProgress([{ id: "c1" }, { id: "c2" }], lessons, progress);

    expect(c1.lastActivityAt).toBe("2026-07-03T10:00:00Z");
  });

  it("kurs bez lekcija → 0% i bez trenutne lekcije", () => {
    const [c1] = computeCoursesProgress([{ id: "c1" }], [], []);
    expect(c1.progress).toBe(0);
    expect(c1.totalLessons).toBe(0);
    expect(c1.currentLessonId).toBeNull();
    expect(c1.lastActivityAt).toBeNull();
  });

  it("lekcije van redosleda se sortiraju po order_index unutar kursa", () => {
    const lessons = [L("c", "c1", 3), L("a", "c1", 1), L("b", "c1", 2)];
    const [c1] = computeCoursesProgress([{ id: "c1" }], lessons, []);
    expect(c1.currentLessonId).toBe("a");
  });
});
