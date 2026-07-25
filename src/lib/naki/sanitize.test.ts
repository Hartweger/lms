import { describe, it, expect } from "vitest";
import { sanitizeReply } from "./sanitize";

describe("sanitizeReply", () => {
  it("zamenjuje dugu crticu (em dash) običnom", () => {
    expect(sanitizeReply("Perfekt — haben + Partizip")).toBe("Perfekt - haben + Partizip");
  });

  it("zamenjuje en dash običnom crticom", () => {
    expect(sanitizeReply("A1 – A2")).toBe("A1 - A2");
  });

  it("prebacuje ćirilicu u latinicu", () => {
    expect(sanitizeReply("Здраво, добро јутро!")).toBe("Zdravo, dobro jutro!");
  });

  it("prebacuje srpske digrafe lj, nj, dž", () => {
    expect(sanitizeReply("љубав њега џак")).toBe("ljubav njega džak");
  });

  it("čuva veliko slovo kod digrafa na početku reči", () => {
    expect(sanitizeReply("Њемачка")).toBe("Njemačka");
  });

  it("piše digraf velikim slovima kad je cela reč velika", () => {
    expect(sanitizeReply("ЊЕМАЧКА")).toBe("NJEMAČKA");
  });

  it("ne dira nemačke umlaute i ß", () => {
    expect(sanitizeReply("Ich heiße Müller, schön!")).toBe("Ich heiße Müller, schön!");
  });

  it("ne dira već ispravan latinični tekst", () => {
    const t = "Nataša kaže: der Tisch je muški rod.";
    expect(sanitizeReply(t)).toBe(t);
  });

  it("radi sa praznim i nedefinisanim ulazom", () => {
    expect(sanitizeReply("")).toBe("");
  });
});
