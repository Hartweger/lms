import { describe, it, expect } from "vitest";
import { rasparcaj } from "./isticanje";

const obicno = (tekst: string) => ({ tekst, nemacki: false, vazno: false });
const nemacki = (tekst: string) => ({ tekst, nemacki: true, vazno: false });
const vazno = (tekst: string) => ({ tekst, nemacki: false, vazno: true });

describe("rasparcaj", () => {
  it("prazan tekst daje prazan spisak", () => {
    expect(rasparcaj("")).toEqual([]);
  });

  it("tekst bez ijednog znaka ostaje jedan komad", () => {
    expect(rasparcaj("Ovim rečima kažeš gde se nešto nalazi.")).toEqual([
      obicno("Ovim rečima kažeš gde se nešto nalazi."),
    ]);
  });

  it("sama nemačka reč je jedan nemački komad", () => {
    expect(rasparcaj("`müssen`")).toEqual([nemacki("müssen")]);
  });

  it("nemačka reč usred rečenice deli tekst na tri komada", () => {
    expect(rasparcaj("Zato je `du putzt`, a ne du putzst.")).toEqual([
      obicno("Zato je "),
      nemacki("du putzt"),
      obicno(", a ne du putzst."),
    ]);
  });

  it("samo podebljano je jedan važan komad", () => {
    expect(rasparcaj("**MaRMeladeN**")).toEqual([vazno("MaRMeladeN")]);
  });

  it("oba isticanja u istoj rečenici svako ide na svoje mesto", () => {
    expect(rasparcaj("U akuzativu se menja **samo muški rod**, `der` u `den`.")).toEqual([
      obicno("U akuzativu se menja "),
      vazno("samo muški rod"),
      obicno(", "),
      nemacki("der"),
      obicno(" u "),
      nemacki("den"),
      obicno("."),
    ]);
  });

  it("navodnik unutar podebljanog nosi obe oznake", () => {
    expect(rasparcaj("Zapamti: **posle `in` ide akuzativ**.")).toEqual([
      obicno("Zapamti: "),
      vazno("posle "),
      { tekst: "in", nemacki: true, vazno: true },
      vazno(" ide akuzativ"),
      obicno("."),
    ]);
  });

  it("nezatvoren navodnik ostaje slovo", () => {
    expect(rasparcaj("Ispred imenice stoji `mein i tu je kraj.")).toEqual([
      obicno("Ispred imenice stoji `mein i tu je kraj."),
    ]);
  });

  it("nezatvorene zvezdice ostaju slova", () => {
    expect(rasparcaj("Dativ zapamti preko **MaRMeladeN i to je sve.")).toEqual([
      obicno("Dativ zapamti preko **MaRMeladeN i to je sve."),
    ]);
  });

  it("nezatvoren navodnik ne guta isticanje koje je zatvoreno", () => {
    expect(rasparcaj("**Pazi** na `mein bez para.")).toEqual([
      vazno("Pazi"),
      obicno(" na `mein bez para."),
    ]);
  });

  it("prazno isticanje ne pravi komad bez slova", () => {
    expect(rasparcaj("a****b")).toEqual([obicno("a"), obicno("b")]);
    expect(rasparcaj("a``b")).toEqual([obicno("a"), obicno("b")]);
  });

  it("usamljena zvezdica je običan tekst", () => {
    expect(rasparcaj("2 * 3 je šest")).toEqual([obicno("2 * 3 je šest")]);
  });

  it("dva isticanja jedno do drugog ostaju razdvojena", () => {
    expect(rasparcaj("`der`,`das`")).toEqual([
      nemacki("der"),
      obicno(","),
      nemacki("das"),
    ]);
  });

  it("spojen tekst je uvek jednak polaznom, samo bez znakova para", () => {
    const polazni =
      "Kad pitaš gde je nešto, posle `in` ide dativ. Dativ zapamti preko reči " +
      "**MaRMeladeN**: nastavci idu **m, r, m, n**. `in dem` se skraćuje u `im`.";
    const spojeno = rasparcaj(polazni)
      .map((d) => d.tekst)
      .join("");
    expect(spojeno).toBe(polazni.replace(/`/g, "").replace(/\*\*/g, ""));
  });

  it("ne vraća nijedan prazan komad", () => {
    const svi = rasparcaj("``**``**`a`**b**``");
    expect(svi.every((d) => d.tekst !== "")).toBe(true);
  });
});
