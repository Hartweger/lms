import { describe, it, expect } from "vitest";
import {
  TEXT_SECTIONS,
  emptyNoteContent,
  isSectionEmpty,
  visibleSections,
  noteToPlainText,
  notePreview,
  sanitizeNoteContent,
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

  it("notePreview - prvi neprazan red TEME, bez markdown-lite oznaka", () => {
    const c: NoteContent = { ...emptyNoteContent(), tema: "\n\n**Konjunktiv II** i modalni glagoli\ndrugi red" };
    expect(notePreview(c)).toBe("Konjunktiv II i modalni glagoli");
  });

  it("notePreview - TEMA prazna ili od samih razmaka vraća null, ne prazan string", () => {
    expect(notePreview(emptyNoteContent())).toBeNull();
    expect(notePreview({ ...emptyNoteContent(), tema: "   " })).toBeNull();
  });

  it("notePreview - skraćuje predugačak prvi red", () => {
    const dugo = "a".repeat(200);
    const preview = notePreview({ ...emptyNoteContent(), tema: dugo });
    expect(preview).not.toBeNull();
    expect(preview!.length).toBe(140);
    expect(preview!.endsWith("…")).toBe(true);
  });

  it("sanitizeNoteContent - odbacuje neispravne tipove umesto da pukne", () => {
    const c = sanitizeNoteContent({ tema: 42, wortschatz: "nije niz", lob: "   ", hausaufgabe: "8 rečenica" });
    expect(c.tema).toBeUndefined();
    expect(c.wortschatz).toEqual([]);
    expect(isSectionEmpty(c.lob)).toBe(true);
    expect(c.hausaufgabe).toBe("8 rečenica");
  });

  it("sanitizeNoteContent - null/undefined ulaz daje praznu belešku", () => {
    expect(sanitizeNoteContent(null)).toEqual(emptyNoteContent());
    expect(sanitizeNoteContent(undefined)).toEqual(emptyNoteContent());
  });

  it("sanitizeNoteContent - čisti wortschatz redove sa nedostajućim poljima na prazan string", () => {
    const c = sanitizeNoteContent({ wortschatz: [{ de: "Haus" }, { sr: "kuća" }, {}] });
    expect(c.wortschatz).toEqual([
      { de: "Haus", sr: "" },
      { de: "", sr: "kuća" },
      { de: "", sr: "" },
    ]);
  });
});
