import { describe, it, expect } from "vitest";
import { collapseDigits, spellNumbers } from "./german-numbers";
import { checkAnswer } from "@/components/exercises/TypingExercise";
import { scoreSpoken } from "@/components/exercises/SpeakExercise";

describe("brojevi u vežbama", () => {
  it("collapseDigits spaja reči-cifre i grupe cifara", () => {
    expect(collapseDigits("ist null sechs neun 123 456")).toBe("ist 069123456");
    expect(collapseDigits("ist 069123456")).toBe("ist 069123456");
  });
  it("broj sa vodećom nulom se čita cifru po cifru", () => {
    expect(spellNumbers("ist 0176").replace(/\s+/g, " ").trim()).toBe("ist null eins sieben sechs");
    expect(spellNumbers("32")).toBe("zweiunddreißig");
  });

  const tel = "Meine Telefonnummer ist 069 123 456.";
  it("kucanje: telefon bez razmaka, sa razmacima i rečima je tačno", () => {
    expect(checkAnswer("Meine Telefonnummer ist 069123456.", tel)).toBe(true);
    expect(checkAnswer("Meine Telefonnummer ist 069 123 456", tel)).toBe(true);
    expect(checkAnswer("Meine Telefonnummer ist null sechs neun eins zwei drei vier fünf sechs", tel)).toBe(true);
    expect(checkAnswer("Meine Telefonnummer ist null sechs neun eins zwei drei vier fuenf sechs", tel)).toBe(true);
    expect(checkAnswer("Ich bin fünfundzwanzig.", "Ich bin 25.")).toBe(true);
  });
  it("kucanje: pogrešan broj je i dalje netačan", () => {
    expect(checkAnswer("Meine Telefonnummer ist 069123457", tel)).toBe(false);
    expect(checkAnswer("Meine Telefonnummer ist 69 123 456", tel)).toBe(false);
  });

  it("govor: prepoznato '0176' za 'null eins sieben sechs' je tačno", () => {
    const exp = "Meine Telefonnummer ist null eins sieben sechs.";
    expect(scoreSpoken("meine Telefonnummer ist 0176", exp).score).toBe(1);
    expect(scoreSpoken("meine Telefonnummer ist 01 76", exp, true).score).toBe(1);
  });
  it("govor: celi brojevi i dalje rade", () => {
    expect(scoreSpoken("ich bin 32 Jahre alt", "Ich bin zweiunddreißig Jahre alt.").score).toBe(1);
  });
});
