import { describe, it, expect } from "vitest";
import { imaRodniOblik, izaberiPrepis, NEUTRALIZE_PROMPT } from "./gender-guard";

describe("imaRodniOblik", () => {
  // Stvarni odgovori sa produkcije (23.08.2026) i iz analize 05.06-23.08.
  it.each([
    "što si već tačno uradio",
    "Bravo, uspeo si!",
    "Odlično si to napisala!",
    "Da li si razumeo pitanje?",
    "Kako bi rekao da si na kasi?",
    "Šta bi napisala u mejlu?",
    "Vidim da si siguran u padeže",
    "Spremna si za ispit!",
  ])("prepoznaje rodni oblik: %s", (t) => {
    expect(imaRodniOblik(t)).toBe(true);
  });

  it.each([
    "Odlično rešeno!",
    "Tačno je, samo jedna sitnica.",
    "Kako to glasi na nemačkom?",
    "U tvojoj rečenici nedostaje član.",
    "Ich habe das Buch gelesen.",
    // Rod NaKI-ja ili trećeg lica nije obraćanje korisniku.
    "Ja sam NaKI, Natašin AI asistent.",
    "Doslovno bi bilo drugačije.",
  ])("ćuti kad roda nema: %s", (t) => {
    expect(imaRodniOblik(t)).toBe(false);
  });

  it("ne puca na našim slovima (č, š, ž u participu)", () => {
    expect(imaRodniOblik("Lepo si to izgovorio")).toBe(true);
    expect(imaRodniOblik("Naučila si brzo")).toBe(true);
  });
});

describe("izaberiPrepis", () => {
  const original = "Bravo, uspeo si! Samo jedna sitnica: **der Tisch** je muški rod, pa ide den.";

  it("uzima prepis kad je rod stvarno sklonjen", () => {
    const prepis = "Bravo, odlično rešeno! Samo jedna sitnica: **der Tisch** je muški rod, pa ide den.";
    expect(izaberiPrepis(original, prepis)).toBe(prepis);
  });

  it("zadržava original kad je rod opet procurio", () => {
    expect(izaberiPrepis(original, "Bravo, dobro si uradio! Ostalo je isto.")).toBe(original);
  });

  it("zadržava original kad prepis nije stigao", () => {
    expect(izaberiPrepis(original, null)).toBe(original);
    expect(izaberiPrepis(original, "   ")).toBe(original);
  });

  // Drugi prolaz ume da rezimira umesto da prepiše - tada je original bolji.
  it("zadržava original kad je prepis prepolovljen", () => {
    expect(izaberiPrepis(original, "Bravo!")).toBe(original);
  });
});

describe("NEUTRALIZE_PROMPT", () => {
  it("zabranjuje kosu crtu (uradio/la) i traži samo tekst", () => {
    expect(NEUTRALIZE_PROMPT).toMatch(/uradio\/la/);
    expect(NEUTRALIZE_PROMPT).toMatch(/Vrati samo prepisan tekst/);
  });
  it("sam ne sadrži dugu crticu koju bi model imitirao", () => {
    expect(NEUTRALIZE_PROMPT).not.toMatch(/[—–]/);
  });
});
