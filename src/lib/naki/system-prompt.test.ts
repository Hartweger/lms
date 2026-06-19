import { describe, it, expect } from "vitest";
import { conversationMemoryAddon } from "./system-prompt";

describe("conversationMemoryAddon", () => {
  it("ubacuje zapamćeni nivo i zabranjuje ponovno pitanje", () => {
    const out = conversationMemoryAddon(["zdravo", "ucim B1"], "B1");
    expect(out).toContain("nivo B1");
    expect(out).toContain('NE pitaj ponovo "koji nivo"');
  });

  it("prazno kad nema ni nivoa ni imena", () => {
    expect(conversationMemoryAddon(["daj mi vežbu"], null)).toBe("");
  });

  it("hvata ime iz 'ich heiße' i normalizuje veliko slovo", () => {
    const out = conversationMemoryAddon(["Ich heiße marija"], null);
    expect(out).toContain("Korisnik se zove Marija");
    expect(out).toContain("DOSLEDNO isti gramatički rod");
  });

  it("hvata ime iz 'zovem se'", () => {
    expect(conversationMemoryAddon(["zovem se Aleksandra"], "A1")).toContain("Aleksandra");
  });

  it("ne hvata lažno ime iz 'ja sam umorna'", () => {
    const out = conversationMemoryAddon(["ja sam umorna danas"], null);
    expect(out).toBe("");
  });
});
