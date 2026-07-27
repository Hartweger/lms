import { describe, it, expect } from "vitest";
import { buildNakiBrief } from "./naki-brief";

const u = (sessionId: string, message: string) => ({ sessionId, role: "user", message });
const a = (sessionId: string, message: string) => ({ sessionId, role: "assistant", message });

describe("buildNakiBrief", () => {
  it("broji sesije i korisničke poruke", () => {
    const b = buildNakiBrief({
      poruke: [u("s1", "zdravo"), a("s1", "Zdravo!"), u("s1", "još nešto"), u("s2", "hej")],
      noviMejlovi: 0,
    });
    expect(b.sesija).toBe(2);
    expect(b.porukaKorisnika).toBe(3);
  });

  it("meri u koliko je sesija otišla ponuda kursa", () => {
    const b = buildNakiBrief({
      poruke: [
        a("s1", "Bravo! Pogledaj https://www.hartweger.rs/kursevi/video-kurs-a2"),
        a("s2", "Tačno!"),
        a("s3", "Evo /kursevi za tvoj nivo"),
        a("s4", "Vežbamo dalje"),
      ],
      noviMejlovi: 0,
    });
    expect(b.ponudaKursa).toBe(2);
    expect(b.ponudaProcenat).toBe(50);
  });

  // Ovo je glavni alarm: posle popravke pamćenja sesije mora biti 0.
  it("hvata sesije u kojima je isto pitanje postavljeno dvaput", () => {
    const b = buildNakiBrief({
      poruke: [
        a("s1", "Koji nivo učiš? I kako da ti se obraćam - u muškom ili ženskom rodu?"),
        a("s1", "Koji nivo učiš?"),
        a("s2", "Koji nivo učiš?"),
        a("s3", "kako da ti se obraćam - u muškom ili ženskom rodu?"),
        a("s3", "A kako da ti se obraćam?"),
      ],
      noviMejlovi: 0,
    });
    expect(b.ponovljenoPitanje).toBe(2);
  });

  it("broji pohvale i žalbe", () => {
    const b = buildNakiBrief({
      poruke: [
        u("s1", "hvala puno!"),
        u("s1", "bravo, super si"),
        u("s2", "ovo je pogrešno"),
        u("s3", "ne razumeš me"),
      ],
      noviMejlovi: 0,
    });
    expect(b.pohvale).toBe(2);
    expect(b.zalbe).toBe(2);
  });

  it("odnos je null kad nema nijedne žalbe - da se ne deli nulom", () => {
    const b = buildNakiBrief({ poruke: [u("s1", "hvala!")], noviMejlovi: 0 });
    expect(b.odnos).toBeNull();
  });

  // Na jednom danu je žalbi malo (26.07: 8 pohvala, 0 žalbi), pa odnos od 1-2 žalbe
  // ne znači ništa. Bez ovoga bi alarm zvonio na šum.
  it("odnos je null dok žalbi ima premalo da nešto znače", () => {
    const malo = buildNakiBrief({
      poruke: [u("s1", "hvala"), u("s1", "pogrešno"), u("s2", "ne valja")],
      noviMejlovi: 0,
    });
    expect(malo.zalbe).toBe(2);
    expect(malo.odnos).toBeNull();
  });

  it("odnos se računa od tri žalbe naviše", () => {
    const b = buildNakiBrief({
      poruke: [
        u("s1", "hvala"),
        u("s1", "super"),
        u("s2", "bravo"),
        u("s3", "pogrešno"),
        u("s3", "ne valja"),
        u("s4", "ne razumeš"),
      ],
      noviMejlovi: 0,
    });
    expect(b.odnos).toBe(1);
  });

  it("računa stopu hvatanja mejla po sesiji", () => {
    const b = buildNakiBrief({
      poruke: [u("s1", "a"), u("s2", "b"), u("s3", "c"), u("s4", "d")],
      noviMejlovi: 1,
    });
    expect(b.stopaHvatanja).toBe(25);
  });

  it("broji limit-događaje i ne meša ih u obične poruke", () => {
    const b = buildNakiBrief({
      poruke: [a("s1", "[limit_reached] anon nivo=A1"), a("s2", "Zdravo!")],
      noviMejlovi: 0,
    });
    expect(b.limitDogadjaja).toBe(1);
  });

  it("prazan dan ne puca", () => {
    const b = buildNakiBrief({ poruke: [], noviMejlovi: 0 });
    expect(b.sesija).toBe(0);
    expect(b.ponudaProcenat).toBe(0);
    expect(b.stopaHvatanja).toBe(0);
    expect(b.odnos).toBeNull();
  });
});
