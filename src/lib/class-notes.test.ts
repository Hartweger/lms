import { describe, it, expect } from "vitest";
import {
  TEXT_SECTIONS,
  emptyNoteContent,
  isSectionEmpty,
  visibleSections,
  noteToPlainText,
  type NoteContent,
} from "./class-notes";

describe("class-notes", () => {
  it("ima šest tekstualnih sekcija u tačnom redosledu", () => {
    expect(TEXT_SECTIONS.map((s) => s.key)).toEqual([
      "tema", "redemittel", "fehler", "grammatik", "hausaufgabe", "lob",
    ]);
  });

  it("prazna beleška ima sve sekcije prazne", () => {
    const c = emptyNoteContent();
    expect(c.wortschatz).toEqual([]);
    for (const s of TEXT_SECTIONS) {
      expect(isSectionEmpty(c[s.key])).toBe(true);
    }
  });

  it("sekcija od samih razmaka i novih redova je prazna", () => {
    expect(isSectionEmpty("   \n\n  ")).toBe(true);
    expect(isSectionEmpty(undefined)).toBe(true);
    expect(isSectionEmpty("Konjunktiv II")).toBe(false);
  });

  it("visibleSections izbacuje prazne sekcije - i naslov i sadržaj", () => {
    const c: NoteContent = {
      ...emptyNoteContent(),
      tema: "Konjunktiv II",
      hausaufgabe: "8 rečenica",
    };
    const vis = visibleSections(c);
    expect(vis.map((s) => s.key)).toEqual(["tema", "hausaufgabe"]);
    expect(vis.find((s) => s.key === "lob")).toBeUndefined();
  });

  it("noteToPlainText spaja samo popunjeno, sa oznakama sekcija", () => {
    const c: NoteContent = {
      ...emptyNoteContent(),
      tema: "Konjunktiv II",
      wortschatz: [{ de: "die Bedingung, -en", sr: "uslov" }],
    };
    const t = noteToPlainText(c);
    expect(t).toContain("TEMA");
    expect(t).toContain("Konjunktiv II");
    expect(t).toContain("die Bedingung, -en = uslov");
    expect(t).not.toContain("LOB");
  });

  it("noteToPlainText - TEMA popunjena: WORTSCHATZ se pojavljuje tačno jednom, posle TEME", () => {
    const c: NoteContent = {
      ...emptyNoteContent(),
      tema: "Konjunktiv II",
      wortschatz: [{ de: "die Bedingung, -en", sr: "uslov" }],
    };
    const t = noteToPlainText(c);
    expect(t.split("WORTSCHATZ").length).toBe(2);
    expect(t.indexOf("TEMA")).toBeLessThan(t.indexOf("WORTSCHATZ"));
  });

  it("noteToPlainText - TEMA prazna: WORTSCHATZ je na početku i pojavljuje se tačno jednom", () => {
    const c: NoteContent = {
      ...emptyNoteContent(),
      wortschatz: [{ de: "die Bedingung, -en", sr: "uslov" }],
      redemittel: "Ich hätte gern...",
    };
    const t = noteToPlainText(c);
    expect(t.split("WORTSCHATZ").length).toBe(2);
    expect(t.startsWith("WORTSCHATZ")).toBe(true);
  });
});
