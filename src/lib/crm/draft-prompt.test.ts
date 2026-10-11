import { describe, it, expect } from "vitest";
import { buildCrmDraftUserPrompt, CRM_MAIL_MODE, kupacUpozorenje } from "./draft-prompt";

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

describe("CRM AI predlog - zaštita kad je osoba već platila", () => {
  const kupac = { kupio: "11. oktobra 2026 (narudžbina 2026-646)", sta: "Individualni kurs B2.1" };

  it("upozorenje je na samom početku, pre mejl-režima, sa onim što je kupljeno i kada", () => {
    const out = buildCrmDraftUserPrompt({ ...base, kupac });
    expect(out.startsWith("!!! UPOZORENJE - OSOBA JE VEĆ PLATILA !!!")).toBe(true);
    expect(out.indexOf("UPOZORENJE")).toBeLessThan(out.indexOf("REŽIM ZA OVAJ ZADATAK"));
    expect(out).toContain("Individualni kurs B2.1");
    expect(out).toContain("11. oktobra 2026 (narudžbina 2026-646)");
  });

  it("zabranjuje ponudu kurseva i ima prednost nad obaveznom preporukom grupnog termina", () => {
    const out = buildCrmDraftUserPrompt({ ...base, kupac });
    expect(out).toContain("NE nudi kurseve, cene ni linkove za kupovinu");
    expect(out).toContain("prednost nad pravilima 3 i 4");
    expect(out).toContain("postojećem polazniku");
  });

  it("bez kupca nema upozorenja (null i izostavljeno polje)", () => {
    expect(buildCrmDraftUserPrompt({ ...base, kupac: null })).not.toContain("UPOZORENJE");
    expect(buildCrmDraftUserPrompt(base)).not.toContain("UPOZORENJE");
    expect(buildCrmDraftUserPrompt({ ...base, kupac: null }).startsWith("REŽIM ZA OVAJ ZADATAK")).toBe(true);
  });

  it("mejl-režim i telo prompta su isti sa upozorenjem i bez njega (ton se ne dira)", () => {
    const bez = buildCrmDraftUserPrompt({ ...base, kupac: null });
    const sa = buildCrmDraftUserPrompt({ ...base, kupac });
    expect(sa.endsWith(bez)).toBe(true);
  });

  it("upozorenje nema em/en crtice", () => {
    expect(kupacUpozorenje(kupac)).not.toMatch(/[—–]/);
  });
});

