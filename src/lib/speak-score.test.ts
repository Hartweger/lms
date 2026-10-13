import { it, expect } from "vitest";
import { scoreSpoken } from "@/components/exercises/SpeakExercise";
it("€ i vreme se ne kažnjavaju (prijava Preise 13.10)", () => {
  const r = scoreSpoken("was kostet das das kostet 3 €", "Was kostet das? Das kostet drei Euro.");
  expect(r.differences.every(d=>d.status==="correct")).toBe(true);
  const u = scoreSpoken("der kurs beginnt um 9:00", "Der Kurs beginnt um neun Uhr.");
  expect(u.differences.every(d=>d.status==="correct")).toBe(true);
  const y = scoreSpoken("ich bin 1990 in belgrad geboren", "Ich bin 1990 in Belgrad geboren.");
  expect(y.score).toBe(1);
});
