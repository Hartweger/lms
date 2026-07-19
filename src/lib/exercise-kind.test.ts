import { describe, it, expect } from "vitest";
import { exerciseKindBadge, isTestExercise } from "./exercise-kind";

describe("exerciseKindBadge", () => {
  it("test naslov daje Test bedž", () => {
    expect(exerciseKindBadge("Zwischentest: Modul 3")).toEqual({ test: true, label: "🎯 Test" });
  });
  it("običan naslov daje Vežba bedž", () => {
    expect(exerciseKindBadge("Prevedi rečenice")).toEqual({ test: false, label: "✏️ Vežba" });
  });
  it("Milioner daje Igra bedž iako naslov sadrži 'Modul'", () => {
    expect(exerciseKindBadge("Milioner: Modul 1")).toEqual({ test: false, label: "🎮 Igra" });
  });
  it("Milioner nije test ni u ispitnom kursu", () => {
    expect(isTestExercise("Milioner: Modul 1", "Goethe A1 priprema")).toBe(false);
  });
});
