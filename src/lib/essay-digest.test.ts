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

  it("match mora biti i po studentu i po kursu (prof za drugi kurs ne vazi)", () => {
    const essays = [e({ id: "e1", userId: "s1", courseId: "cB" })];
    const assignments: Assignment[] = [{ professorId: "p1", studentId: "s1", courseId: "cA" }];
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
});
