import { describe, it, expect } from "vitest";
import { isExamLessonTitle } from "./certificate-check";

describe("isExamLessonTitle", () => {
  it("prepoznaje pravu završnu lekciju (Modelltest / Završni ispit)", () => {
    expect(isExamLessonTitle("Završni ispit B1 - Modelltest 4")).toBe(true);
    expect(isExamLessonTitle("Modelltest 1")).toBe(true);
    expect(isExamLessonTitle("Završni ispit A2")).toBe(true);
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
