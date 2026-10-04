import { describe, it, expect } from "vitest";
import { buildCrmDraftUserPrompt, CRM_MAIL_MODE } from "./draft-prompt";

const base = { ime: "Melisa", nivo: null, izvor: "kontakt-forma", owned: [], razgovor: "Lid: Kontakt forma - Ja bih online za casove A1." };

describe("CRM AI predlog - mejl režim", () => {
  it("piše Nataša, ne Smile, i ne traži mejl", () => {
    expect(CRM_MAIL_MODE).toContain("Nataša Hartweger šalje lično");
    expect(CRM_MAIL_MODE).toContain("NE traži mejl");
  });

  it("prvo odgovara na svako postavljeno pitanje", () => {
    expect(CRM_MAIL_MODE).toContain("izdvoj SVAKO pitanje");
  });

  it("ne pogađa FIDE za ambasadu - FIDE samo za Švajcarsku", () => {
    expect(CRM_MAIL_MODE).toContain("FIDE je ispit samo za Švajcarsku");
    expect(CRM_MAIL_MODE).toContain("Goethe ili ÖSD");
  });

  it("obavezno pominje otvoren grupni termin i ograničava broj preporuka", () => {
    expect(CRM_MAIL_MODE).toContain("OBAVEZNO ga pomeni");
    expect(CRM_MAIL_MODE).toContain("NAJVIŠE dva kursa");
  });

  it("bez em/en crtice u samom promptu", () => {
    expect(buildCrmDraftUserPrompt(base)).not.toMatch(/[—–]/);
  });

  it("prenosi izvor, razgovor i šta osoba već ima", () => {
    const out = buildCrmDraftUserPrompt({ ...base, owned: ["VIDEO kurs A1"] });
    expect(out).toContain("Izvor kontakta: kontakt-forma");
    expect(out).toContain("Ja bih online za casove A1");
    expect(out).toContain("VEĆ KUPAC - poseduje: VIDEO kurs A1");
  });

  it("bez razgovora traži prvi mejl", () => {
    expect(buildCrmDraftUserPrompt({ ...base, razgovor: "" })).toContain("nema zabeleženog razgovora");
  });
});
