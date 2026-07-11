import { describe, it, expect } from "vitest";
import { examItemsOf, examCorrectIndexOf, canRenderGroupedExam } from "./grouped-exam";

describe("examItemsOf", () => {
  it("čita novi format { items: [...] }", () => {
    expect(examItemsOf({ type: "quiz", items: ["a", "b", "c"] }, "1")).toEqual(["a", "b", "c"]);
  });

  it("čita novi format sa context i items", () => {
    expect(examItemsOf({ context: { title: "Tekst", type: "text" }, items: ["Richtig", "Falsch"] }, "0")).toEqual(["Richtig", "Falsch"]);
  });

  it("prihvata stari format - goli niz stringova", () => {
    expect(examItemsOf(["im Büro", "zu Hause", "im Café"], "zu Hause")).toEqual(["im Büro", "zu Hause", "im Café"]);
  });

  it("prihvata stari format - JSON string niza", () => {
    expect(examItemsOf('["ja","nein"]', "ja")).toEqual(["ja", "nein"]);
  });

  it("null options + correct_answer true/false → Richtig/Falsch", () => {
    expect(examItemsOf(null, "true")).toEqual(["Richtig", "Falsch"]);
    expect(examItemsOf(null, "false")).toEqual(["Richtig", "Falsch"]);
    expect(examItemsOf(null, "TRUE")).toEqual(["Richtig", "Falsch"]);
  });

  it("objekat sa context bez items + true/false → Richtig/Falsch", () => {
    expect(examItemsOf({ context: { title: "Hören Teil 1", type: "audio" } }, "false")).toEqual(["Richtig", "Falsch"]);
  });

  it("bez opcija i bez true/false → prazan niz", () => {
    expect(examItemsOf(null, "slobodan odgovor")).toEqual([]);
    expect(examItemsOf(null, null)).toEqual([]);
    expect(examItemsOf({ context: { title: "x", type: "text" } }, "3")).toEqual([]);
  });
});

describe("examCorrectIndexOf", () => {
  it("novi format - broj kao indeks", () => {
    expect(examCorrectIndexOf("2", ["a", "b", "c"])).toBe(2);
    expect(examCorrectIndexOf("0", ["a", "b"])).toBe(0);
  });

  it("true/false → indeks Richtig/Falsch", () => {
    expect(examCorrectIndexOf("true", ["Richtig", "Falsch"])).toBe(0);
    expect(examCorrectIndexOf("false", ["Richtig", "Falsch"])).toBe(1);
  });

  it("stari format - poređenje po vrednosti", () => {
    expect(examCorrectIndexOf("zu Hause", ["im Büro", "zu Hause", "im Café"])).toBe(1);
  });

  it("vrednost sa razmacima i drugim velikim slovima", () => {
    expect(examCorrectIndexOf(" Falsch ", ["Richtig", "Falsch"])).toBe(1);
  });

  it("nepostojeća vrednost → -1 (ništa nije obeleženo kao tačno)", () => {
    expect(examCorrectIndexOf("xyz", ["a", "b"])).toBe(-1);
    expect(examCorrectIndexOf(null, ["a", "b"])).toBe(-1);
  });
});

describe("canRenderGroupedExam", () => {
  const q = (options: unknown, correct_answer: string, audio_url: string | null = null) =>
    ({ options, correct_answer, audio_url }) as never;

  it("true kad sva pitanja imaju opcije (novi format)", () => {
    expect(canRenderGroupedExam([
      q({ context: { title: "T", type: "text" }, items: ["a", "b"] }, "0"),
      q({ context: { title: "T", type: "text" }, items: ["a", "b"] }, "1"),
    ])).toBe(true);
  });

  it("true za stari Richtig/Falsch format (null options, audio)", () => {
    expect(canRenderGroupedExam([
      q(null, "true", "https://x/a.mp3"),
      q(null, "false", "https://x/a.mp3"),
    ])).toBe(true);
  });

  it("false kad neko pitanje nema nijednu opciju za prikaz", () => {
    expect(canRenderGroupedExam([
      q({ context: { title: "T", type: "text" }, items: ["a", "b"] }, "0"),
      q({ context: { title: "T", type: "text" } }, "slobodan tekst"),
    ])).toBe(false);
  });
});
