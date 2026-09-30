import { describe, it, expect } from "vitest";
import { deriveWordsetItems, wordsetSetKey, wordsetTitle } from "./wordset-derive";

describe("wordset-derive", () => {
  it("pravi kartice iz redova, čuva redosled", () => {
    const items = deriveWordsetItems([
      { de: "die Bedingung, -en", sr: "uslov" },
      { de: "verzichten auf", sr: "odreći se čega" },
    ]);
    expect(items).toEqual([
      { idx: 0, front: "die Bedingung, -en", back: "uslov" },
      { idx: 1, front: "verzichten auf", back: "odreći se čega" },
    ]);
  });

  it("izbacuje redove kojima fali strana", () => {
    const items = deriveWordsetItems([
      { de: "gelassen", sr: "smiren" },
      { de: "", sr: "nešto" },
      { de: "der Aufwand", sr: "   " },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].front).toBe("gelassen");
  });

  it("skida HTML iz reči - <mark> se nikad ne sme videti na kartici", () => {
    const items = deriveWordsetItems([
      { de: "<mark>einmal am Tag</mark>", sr: "jednom dnevno" },
    ]);
    expect(items[0].front).toBe("einmal am Tag");
  });

  it("skida markdown-lite oznake koje profesorka slučajno zalepi", () => {
    const items = deriveWordsetItems([{ de: "**gelassen**", sr: "==smiren==" }]);
    expect(items[0]).toEqual({ idx: 0, front: "gelassen", back: "smiren" });
  });

  it("spaja duplikate unutar istog seta (bez obzira na velika slova), ne duplira identičan prevod", () => {
    const items = deriveWordsetItems([
      { de: "gelassen", sr: "smiren" },
      { de: "Gelassen", sr: "smiren" },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].back).toBe("smiren"); // ne "smiren|smiren"
  });

  it("indeksi su uzastopni posle izbacivanja", () => {
    const items = deriveWordsetItems([
      { de: "", sr: "" },
      { de: "a", sr: "b" },
      { de: "c", sr: "d" },
    ]);
    expect(items.map((i) => i.idx)).toEqual([0, 1]);
  });

  it("set_key nosi prefiks sw_ i id seta", () => {
    expect(wordsetSetKey("11111111-2222-3333-4444-555555555555"))
      .toBe("sw_11111111-2222-3333-4444-555555555555");
  });

  it("naslov seta je 'Termin N - reči', a bez broja samo datum", () => {
    expect(wordsetTitle(7, "2026-10-02")).toBe("Termin 7 - reči");
    expect(wordsetTitle(null, "2026-10-02")).toBe("Reči - 2.10.2026.");
  });

  it("ugnežđene oznake ne smeju ostaviti smeće ni pući", () => {
    // Naivan regex "**([^*]+)**" ne pogađa ugnežđeno **a *b* c** (nema para ** posle
    // jednostrukog *), pa ostavi zvezdice na kartici. Nelenji (.+?) to rešava jer sme
    // da pojede i unutrašnje zvezdice dok traži par. <mark> bez zatvaranja je i dalje
    // ispravan HTML tag (ima ">"), pa ga tag-regex briše. Nezatvoreno "==zwei" (bez
    // druge "==") NEMA par, pa ostaje nedirnuto - baš kao pravi tekst u rečniku
    // (v. test niže) koji ima pojedinačne znake.
    const items = deriveWordsetItems([
      { de: "**a *b* c**", sr: "x" },
      { de: "<mark>eins", sr: "y" },
      { de: "==zwei", sr: "z" },
    ]);
    expect(items.map((i) => i.front)).toEqual(["a b c", "eins", "==zwei"]);
  });

  it("ne dira pojedinačnu zvezdicu i znak jednakosti iz pravih setova", () => {
    // Prave vrednosti iz scripts/flashcards/*.json - jedan znak, ne markdown par.
    // Ako se * i = ikad počnu brisati bezuslovno (umesto samo u paru), ovo puca.
    const items = deriveWordsetItems([
      // scripts/flashcards/b1-1-modul-5.json:106
      { de: "das Gendersternchen", sr: "zvezdica za Gendern (*)" },
      // scripts/flashcards/a2-2-ispit-a2.json:9
      { de: "Ahnung", sr: "predstava (keine Ahnung = nemam pojma)" },
      // scripts/flashcards/a2-2-ispit-a2.json:22
      { de: "Bescheid", sr: "obaveštenje (Bescheid sagen = javiti)" },
    ]);
    expect(items.map((i) => i.back)).toEqual([
      "zvezdica za Gendern (*)",
      "predstava (keine Ahnung = nemam pojma)",
      "obaveštenje (Bescheid sagen = javiti)",
    ]);
  });

  it("isti nemački front sa RAZLIČITIM prevodom - spaja ih sa | (konvencija iz flashcard-types)", () => {
    const items = deriveWordsetItems([
      { de: "die Bedingung", sr: "uslov" },
      { de: "die Bedingung", sr: "drugi prevod" },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ idx: 0, front: "die Bedingung", back: "uslov|drugi prevod" });
  });

  it("wordsetTitle radi za jednocifrene dane i mesece", () => {
    expect(wordsetTitle(null, "2026-01-05")).toBe("Reči - 5.1.2026.");
  });
});
