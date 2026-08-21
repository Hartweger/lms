import { describe, it, expect } from "vitest";
import { izaberiNemackiGlas } from "./glas";

/** Onoliko glasa koliko biranje gleda: samo oznaka jezika i ime, radi provere. */
const G = (lang: string, name = lang) => ({ lang, name });

describe("izaberiNemackiGlas", () => {
  it("uzima de-DE i kad u spisku ima drugih nemačkih", () => {
    const izbor = izaberiNemackiGlas([G("en-US"), G("de-AT"), G("de-DE"), G("sr-RS")]);
    expect(izbor).toEqual({ stanje: "ima", glas: G("de-DE") });
  });

  it("bez de-DE uzima bilo koji nemački", () => {
    const izbor = izaberiNemackiGlas([G("en-GB"), G("de-CH")]);
    expect(izbor).toEqual({ stanje: "ima", glas: G("de-CH") });
  });

  it("oznaka jezika se čita i kad je pisana velikim slovima ili sa donjom crtom", () => {
    // Android ume da prijavi „de_DE"; to je isti glas, ne nepoznat jezik.
    expect(izaberiNemackiGlas([G("DE_DE")])).toEqual({ stanje: "ima", glas: G("DE_DE") });
  });

  it("spisak bez nemačkog glasa ne daje nikakav glas", () => {
    expect(izaberiNemackiGlas([G("en-US"), G("sr-RS"), G("hr-HR")])).toEqual({ stanje: "nema" });
  });

  it("den nije nemački samo zato što počinje na de", () => {
    // Zaštita od poklapanja po slovima: gleda se oznaka jezika, ne prefiks teksta.
    expect(izaberiNemackiGlas([G("den-XX")])).toEqual({ stanje: "nema" });
  });

  it("prazan spisak znači da se još ne zna, ne da nemačkog nema", () => {
    // Chrome prvi put vraća prazan niz i tek naknadno javi „voiceschanged".
    expect(izaberiNemackiGlas([])).toEqual({ stanje: "ne-zna-se" });
    expect(izaberiNemackiGlas(null)).toEqual({ stanje: "ne-zna-se" });
    expect(izaberiNemackiGlas(undefined)).toEqual({ stanje: "ne-zna-se" });
  });
});
