import { describe, it, expect } from "vitest";
import { groupEssaysForDigest, essaysOverdue, type DigestEssay, type Assignment } from "./essay-digest";

const e = (over: Partial<DigestEssay> = {}): DigestEssay => ({
  id: "e1", userId: "s1", courseId: "c1",
  studentName: "Ana", lessonTitle: "Schreiben Teil 1",
  submittedAt: "2026-06-10T08:00:00Z", ...over,
});

describe("groupEssaysForDigest", () => {
  it("eseje sa dodeljenim profom grupise po professorId", () => {
    const essays = [e({ id: "e1", userId: "s1", courseId: "c1" }), e({ id: "e2", userId: "s1", courseId: "c1" })];
    const assignments: Assignment[] = [{ professorId: "p1", studentId: "s1", courseId: "c1" }];
    const r = groupEssaysForDigest(essays, assignments);
    expect(r.unassigned).toHaveLength(0);
    expect(r.byProfessor).toHaveLength(1);
    expect(r.byProfessor[0]).toMatchObject({ professorId: "p1" });
    expect(r.byProfessor[0].essays.map((x) => x.id)).toEqual(["e1", "e2"]);
  });

  it("esej bez reda u professor_students ide u unassigned", () => {
    const essays = [e({ id: "e1", userId: "s9", courseId: "c1" })];
    const r = groupEssaysForDigest(essays, []);
    expect(r.byProfessor).toHaveLength(0);
    expect(r.unassigned.map((x) => x.id)).toEqual(["e1"]);
  });

  it("tačan (učenik, kurs) ima prednost nad fallback-om kad učenik ima više profa", () => {
    // s1 ima p1 za cA i p2 za cB; esej u cB mora ići p2 (tačan match), ne p1.
    const essays = [e({ id: "e1", userId: "s1", courseId: "cB" })];
    const assignments: Assignment[] = [
      { professorId: "p1", studentId: "s1", courseId: "cA" },
      { professorId: "p2", studentId: "s1", courseId: "cB" },
    ];
    const r = groupEssaysForDigest(essays, assignments);
    expect(r.unassigned).toHaveLength(0);
    expect(r.byProfessor).toHaveLength(1);
    expect(r.byProfessor[0]).toMatchObject({ professorId: "p2" });
  });

  it("grupni učenik: prof je upisan pod grupnim kursom, lekcija pripada sadržajnom kursu -> ide profu", () => {
    // professor_students.course_id = grupni proizvod; lesson.course_id = sadržajni kurs. Ne poklapaju se,
    // ali učenik ima tačno jednog profa -> rezime ide tom profu (kao i panel).
    const essays = [e({ id: "e1", userId: "s1", courseId: "nemacki-b12" })];
    const assignments: Assignment[] = [{ professorId: "p1", studentId: "s1", courseId: "grupni-b12" }];
    const r = groupEssaysForDigest(essays, assignments);
    expect(r.unassigned).toHaveLength(0);
    expect(r.byProfessor).toHaveLength(1);
    expect(r.byProfessor[0]).toMatchObject({ professorId: "p1" });
    expect(r.byProfessor[0].essays.map((x) => x.id)).toEqual(["e1"]);
  });

  it("više profa a nijedan ne odgovara kursu (dvosmisleno) -> unassigned", () => {
    const essays = [e({ id: "e1", userId: "s1", courseId: "cX" })];
    const assignments: Assignment[] = [
      { professorId: "p1", studentId: "s1", courseId: "cA" },
      { professorId: "p2", studentId: "s1", courseId: "cB" },
    ];
    const r = groupEssaysForDigest(essays, assignments);
    expect(r.unassigned.map((x) => x.id)).toEqual(["e1"]);
    expect(r.byProfessor).toHaveLength(0);
  });
});

describe("essaysOverdue", () => {
  const now = new Date("2026-06-13T05:00:00Z").getTime();
  it("vraca eseje starije od N dana", () => {
    const essays = [
      e({ id: "old", submittedAt: "2026-06-09T05:00:00Z" }), // 4 dana
      e({ id: "new", submittedAt: "2026-06-12T05:00:00Z" }), // 1 dan
    ];
    const r = essaysOverdue(essays, now, 3);
    expect(r.map((x) => x.id)).toEqual(["old"]);
  });

  it("esej star tačno N dana se računa kao zakasneli", () => {
    const r = essaysOverdue([e({ id: "exact", submittedAt: "2026-06-10T05:00:00Z" })], now, 3);
    expect(r.map((x) => x.id)).toEqual(["exact"]);
  });
});
