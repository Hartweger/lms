import { describe, it, expect } from "vitest";
import { parseQuizlet } from "./quizlet-parse";

const sample = [
  "Guten Morgen\tDobro jutro!",
  "Gute Nacht\t",                 // prazan prevod
  "Hallo\tZdravo/Ćao",            // više prevoda
  "sagen\treći, kazati",          // više prevoda zarezom
].join("\n");

describe("parseQuizlet", () => {
  const r = parseQuizlet(sample);
  it("preskače kartice bez prevoda, ali ih prijavi", () => {
    expect(r.cards.find((c) => c.front === "Gute Nacht")).toBeUndefined();
    expect(r.skipped).toContain("Gute Nacht");
  });
  it("front/back se pravilno razdvajaju po tabu", () => {
    expect(r.cards[0]).toMatchObject({ front: "Guten Morgen", back: "Dobro jutro!" });
  });
  it("više prevoda (/) → spojeno sa |", () => {
    expect(r.cards.find((c) => c.front === "Hallo")!.back).toBe("Zdravo|Ćao");
  });
  it("više prevoda (zarez) → spojeno sa |", () => {
    expect(r.cards.find((c) => c.front === "sagen")!.back).toBe("reći|kazati");
  });
});
