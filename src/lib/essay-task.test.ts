import { describe, it, expect } from "vitest";
import { pickSubmissionQuestions } from "./essay-task";

describe("pickSubmissionQuestions", () => {
  it("u test vežbi bira essay pitanje, ne prvo kviz pitanje (bag: Danica 30.07.2026)", () => {
    const rows = [
      { exercise_id: "ex1", question: "Das Wohnzimmer ist sehr ______.", options: { type: "quiz" } },
      { exercise_id: "ex1", question: "Spoji tipove stanovanja:", options: { type: "match_pairs" } },
      { exercise_id: "ex1", question: "Schreiben - Teil 1 (SMS)\n\nSchreibe eine SMS an Peter.", options: { type: "essay", maxPoints: 5 } },
    ];
    const { taskByEx } = pickSubmissionQuestions(rows);
    expect(taskByEx["ex1"]).toContain("Schreiben - Teil 1");
  });

  it("prepoznaje speak i listen_write kao pitanja koja proizvode predaju", () => {
    const rows = [
      { exercise_id: "ex1", question: "Kviz pitanje", options: { type: "quiz" } },
      { exercise_id: "ex1", question: "Sprich über dein Zimmer.", options: { type: "speak" } },
      { exercise_id: "ex2", question: "Kviz pitanje", options: { type: "quiz" } },
      { exercise_id: "ex2", question: "Höre zu und schreibe.", options: { type: "listen_write" } },
    ];
    const { taskByEx } = pickSubmissionQuestions(rows);
    expect(taskByEx["ex1"]).toBe("Sprich über dein Zimmer.");
    expect(taskByEx["ex2"]).toBe("Höre zu und schreibe.");
  });

  it("samostalna essay vežba sa jednim pitanjem radi kao i do sada", () => {
    const rows = [
      { exercise_id: "ex1", question: "Schreibe deine Meinung im Forum.", options: { type: "essay", maxPoints: 10 } },
    ];
    const { taskByEx, maxByEx } = pickSubmissionQuestions(rows);
    expect(taskByEx["ex1"]).toBe("Schreibe deine Meinung im Forum.");
    expect(maxByEx["ex1"]).toBe(10);
  });

  it("maxPoints uzima sa essay pitanja, ne sa prvog pitanja u vežbi", () => {
    const rows = [
      { exercise_id: "ex1", question: "Kviz", options: { type: "quiz", maxPoints: 1 } },
      { exercise_id: "ex1", question: "Essay", options: { type: "essay", maxPoints: 8 } },
    ];
    const { maxByEx } = pickSubmissionQuestions(rows);
    expect(maxByEx["ex1"]).toBe(8);
  });

  it("bez essay pitanja pada na prvo pitanje (stara logika) i default 5 bodova", () => {
    const rows = [
      { exercise_id: "ex1", question: "Prvo pitanje", options: { type: "quiz" } },
      { exercise_id: "ex1", question: "Drugo pitanje", options: { type: "quiz" } },
    ];
    const { taskByEx, maxByEx } = pickSubmissionQuestions(rows);
    expect(taskByEx["ex1"]).toBe("Prvo pitanje");
    expect(maxByEx["ex1"]).toBe(5);
  });

  it("podnosi options kao dvostruko enkodiran JSON string", () => {
    const rows = [
      { exercise_id: "ex1", question: "Kviz", options: JSON.stringify({ type: "quiz" }) },
      { exercise_id: "ex1", question: "Essay", options: JSON.stringify({ type: "essay", maxPoints: 6 }) },
    ];
    const { taskByEx, maxByEx } = pickSubmissionQuestions(rows);
    expect(taskByEx["ex1"]).toBe("Essay");
    expect(maxByEx["ex1"]).toBe(6);
  });

  it("podnosi null options i null question", () => {
    const rows = [
      { exercise_id: "ex1", question: null, options: null },
      { exercise_id: "ex1", question: "Pitanje", options: null },
    ];
    const { taskByEx, maxByEx } = pickSubmissionQuestions(rows);
    expect(taskByEx["ex1"]).toBe("Pitanje");
    expect(maxByEx["ex1"]).toBe(5);
  });
});
