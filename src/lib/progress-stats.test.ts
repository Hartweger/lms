import { describe, it, expect } from "vitest";
import { computeCourseProgress } from "./progress-stats";

describe("computeCourseProgress", () => {
  const lessons = [
    { id: "l1", course_id: "A" },
    { id: "l2", course_id: "A" },
    { id: "l3", course_id: "A" },
    { id: "l4", course_id: "A" }, // kurs A ima 4 lekcije
    { id: "x1", course_id: "B" }, // kurs B ima 1 lekciju
  ];
  const access = [
    { user_id: "u1", course_id: "A" },
    { user_id: "u2", course_id: "A" },
    { user_id: "u3", course_id: "A" },
    { user_id: "u4", course_id: "A" }, // 4 upisana na A
    { user_id: "u1", course_id: "A" }, // duplikat pristupa — ne sme da se broji dvaput
  ];
  const progress = [
    // u1 završio sve 4 (completed)
    { user_id: "u1", lesson_id: "l1" }, { user_id: "u1", lesson_id: "l2" },
    { user_id: "u1", lesson_id: "l3" }, { user_id: "u1", lesson_id: "l4" },
    // u2 završio 2 od 4 (u toku, 50%)
    { user_id: "u2", lesson_id: "l1" }, { user_id: "u2", lesson_id: "l2" },
    // u3 ništa (nije počeo)
    // u4 završio 1 od 4 (25%)
    { user_id: "u4", lesson_id: "l1" },
    // šum: napredak na kursu bez upisanih / nepostojeća lekcija
    { user_id: "u9", lesson_id: "neznam" },
  ];

  const A = computeCourseProgress(lessons, access, progress).find((c) => c.courseId === "A")!;

  it("broji jedinstvene upisane (duplikat pristupa se ne duplira)", () => expect(A.enrolled).toBe(4));
  it("totalLessons je broj lekcija kursa", () => expect(A.totalLessons).toBe(4));
  it("notStarted = oni sa 0 završenih", () => expect(A.notStarted).toBe(1));
  it("completed = oni koji su završili sve", () => expect(A.completed).toBe(1));
  it("inProgress = između 1 i total-1", () => expect(A.inProgress).toBe(2));
  it("prosečan napredak = (100+50+0+25)/4 = 44%", () => expect(A.avgProgressPct).toBe(44));
  it("stopa završavanja = 1/4 = 25%", () => expect(A.completionRatePct).toBe(25));

  it("kurs B nema upisanih → izostavljen", () =>
    expect(computeCourseProgress(lessons, access, progress).some((c) => c.courseId === "B")).toBe(false));
});
