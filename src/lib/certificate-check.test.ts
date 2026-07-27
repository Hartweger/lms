import { describe, it, expect } from "vitest";
import { isExamLessonTitle, groupExercisesForCertificate } from "./certificate-check";

describe("groupExercisesForCertificate", () => {
  const ex = (exercise_type: string) => ({ id: exercise_type, exercise_type });

  it("Sprechen je ZASEBAN modul, ne quiz i ne Schreiben", () => {
    // Ranije je sprechen upadao u quiz grupu: ko ga preskoči - sertifikat blokiran,
    // ko ga uradi - automatskih 100% jer se snimak javlja kao tačan pre pregleda.
    const g = groupExercisesForCertificate([ex("sprechen")]);
    expect(g.sprechen).toHaveLength(1);
    expect(g.quiz).toHaveLength(0);
    expect(g.essay).toHaveLength(0);
  });

  it("Lesen/Hören idu u quiz, Schreiben u essay", () => {
    const g = groupExercisesForCertificate([ex("quiz"), ex("fill_blank"), ex("essay"), ex("sprechen")]);
    expect(g.quiz.map((e) => e.exercise_type)).toEqual(["quiz", "fill_blank"]);
    expect(g.essay.map((e) => e.exercise_type)).toEqual(["essay"]);
    expect(g.sprechen.map((e) => e.exercise_type)).toEqual(["sprechen"]);
  });

  it("Schreiben i Sprechen se ne slepljuju u jedan modul", () => {
    // Spojen modul bi dozvolio da odličan Schreiben pokrije pao Sprechen.
    const g = groupExercisesForCertificate([ex("essay"), ex("sprechen")]);
    expect(g.essay).toHaveLength(1);
    expect(g.sprechen).toHaveLength(1);
  });
});

describe("isExamLessonTitle", () => {
  it("prepoznaje pravu završnu lekciju (Modelltest / Završni ispit)", () => {
    expect(isExamLessonTitle("Završni ispit B1 - Modelltest 4")).toBe(true);
    expect(isExamLessonTitle("Modelltest 1")).toBe(true);
    expect(isExamLessonTitle("Završni ispit A2")).toBe(true);
    expect(isExamLessonTitle("Završni ispit C1.1")).toBe(true);
  });

  it("NE prepoznaje lekciju B2.2 'Lektion 13 · Abschlusstest' kao završni ispit", () => {
    // Abschlusstest je naziv modulskog testa u B2.2 - ne sme da izda sertifikat za kurs.
    // Zato završni ispit C1.1 nosi naziv „Završni ispit", a ne „Abschlusstest".
    expect(isExamLessonTitle("Lektion 13 · Abschlusstest")).toBe(false);
  });

  it("NE prepoznaje obične lekcije sa Schreiben esejom kao završni ispit", () => {
    // Ovo je bio bug: ocena eseja u običnoj lekciji izdavala sertifikat za ceo kurs.
    expect(isExamLessonTitle("Sind KI-Tools besser als wir?")).toBe(false);
    expect(isExamLessonTitle("Prüfung - Leseverstehen und Schreiben")).toBe(false);
    expect(isExamLessonTitle("Schreiben - KI-Tools")).toBe(false);
    expect(isExamLessonTitle("")).toBe(false);
    expect(isExamLessonTitle(null)).toBe(false);
  });
});
