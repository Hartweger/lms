import { describe, it, expect } from "vitest";
import { toHistory } from "./session-history";

describe("toHistory", () => {
  it("pretvara redove iz baze u istoriju razgovora", () => {
    const out = toHistory([
      { role: "user", message: "zdravo" },
      { role: "assistant", message: "Koji nivo učiš?" },
    ]);
    expect(out).toEqual([
      { role: "user", content: "zdravo" },
      { role: "assistant", content: "Koji nivo učiš?" },
    ]);
  });

  it("izbacuje interne markere koji nisu deo razgovora", () => {
    const out = toHistory([
      { role: "user", message: "zdravo" },
      { role: "assistant", message: "[limit_reached] anon nivo=A1" },
      { role: "assistant", message: "[email_capture] nivo=?" },
      { role: "assistant", message: "Zdravo!" },
    ]);
    expect(out.map((m) => m.content)).toEqual(["zdravo", "Zdravo!"]);
  });

  it("preskače prazne i neispravne redove", () => {
    const out = toHistory([
      { role: "user", message: "  " },
      { role: "sistem", message: "nešto" },
      { role: "user", message: null },
      { role: "user", message: "pitanje" },
    ]);
    expect(out).toEqual([{ role: "user", content: "pitanje" }]);
  });

  it("prazan ulaz daje praznu istoriju", () => {
    expect(toHistory([])).toEqual([]);
    expect(toHistory(null)).toEqual([]);
  });
});
