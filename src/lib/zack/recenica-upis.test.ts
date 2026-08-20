import { describe, it, expect } from "vitest";
import { pripremiRecenice } from "./recenica-upis";

/** Reči lekcije kakve ruta pročita iz baze: de → id. */
const reciLekcije = new Map([
  ["kommen", "id-kommen"],
  ["Serbien", "id-serbien"],
  ["wohnen", "id-wohnen"],
]);

const red = (delovi: Partial<Record<string, unknown>> = {}) => ({
  de: "Ich komme aus Serbien.",
  sr: "Dolazim iz Srbije.",
  praznina: "komme",
  distraktori: ["kommst", "kommt", "kommen"],
  glavna: "kommen",
  samoDopuna: false,
  ...delovi,
});

describe("pripremiRecenice", () => {
  it("ispravan spisak prolazi i dobija redne brojeve i rec_id", () => {
    const ishod = pripremiRecenice([red()], reciLekcije);
    expect(ishod).toEqual({
      ok: true,
      recenice: [
        {
          redni_broj: 1,
          de: "Ich komme aus Serbien.",
          sr: "Dolazim iz Srbije.",
          praznina: "komme",
          distraktori: ["kommst", "kommt", "kommen"],
          rec_id: "id-kommen",
          samo_dopuna: false,
        },
      ],
    });
  });

  it("odbija prazninu koja se ne javlja tačno jednom", () => {
    const ishod = pripremiRecenice([red({ de: "Komm, komm her!", praznina: "komm" })], reciLekcije);
    expect(ishod.ok).toBe(false);
    if (!ishod.ok) expect(ishod.greska).toContain("tačno jednom");
  });

  it("odbija distraktor jednak praznini", () => {
    const ishod = pripremiRecenice(
      [red({ distraktori: ["komme", "kommt", "kommen"] })],
      reciLekcije
    );
    expect(ishod.ok).toBe(false);
  });

  it("odbija duplirane distraktore i pogrešan broj distraktora", () => {
    expect(pripremiRecenice([red({ distraktori: ["kommst", "kommst", "kommt"] })], reciLekcije).ok).toBe(false);
    expect(pripremiRecenice([red({ distraktori: ["kommst", "kommt"] })], reciLekcije).ok).toBe(false);
  });

  it("odbija glavnu reč koja nije reč te lekcije", () => {
    const ishod = pripremiRecenice([red({ glavna: "essen" })], reciLekcije);
    expect(ishod.ok).toBe(false);
    if (!ishod.ok) expect(ishod.greska).toContain("essen");
  });

  it("rečenica sa više od 6 pločica se sama označi samo_dopuna", () => {
    const ishod = pripremiRecenice(
      [red({ de: "Ich wohne ganz oben im Haus im fünften Stock.", praznina: "wohne", glavna: "wohnen" })],
      reciLekcije
    );
    expect(ishod.ok).toBe(true);
    if (ishod.ok) expect(ishod.recenice[0].samo_dopuna).toBe(true);
  });

  it("odbija dupliranu rečenicu, sa brojem reda", () => {
    const ishod = pripremiRecenice([red(), red()], reciLekcije);
    expect(ishod.ok).toBe(false);
    if (!ishod.ok) expect(ishod.greska).toContain("2");
  });

  // Nataša lepi iz tabele, pa isti tekst ume da stigne sa dva razmaka u sredini.
  // `normalizujDe` sažima razmake, pa to mora da se prepozna kao ista rečenica,
  // inače bi dete dva puta dobilo isto pitanje.
  it("odbija rečenicu koja se od ranije razlikuje samo po razmacima", () => {
    const ishod = pripremiRecenice([red(), red({ de: "Ich  komme   aus Serbien." })], reciLekcije);
    expect(ishod.ok).toBe(false);
    if (!ishod.ok) {
      expect(ishod.greska).toContain("Rečenica broj 2");
      expect(ishod.greska).toContain("pod brojem 1");
    }
  });

  it("odbija prazan spisak", () => {
    expect(pripremiRecenice([], reciLekcije).ok).toBe(false);
  });
});
