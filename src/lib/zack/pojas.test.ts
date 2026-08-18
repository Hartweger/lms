import { describe, it, expect } from "vitest";
import { POJASEVI, pojasZaSprat, pocinjePojas, opisSprata, dokleSePopela } from "./pojas";

describe("POJASEVI", () => {
  it("idu redom uvis i prvi počinje od prvog sprata", () => {
    expect(POJASEVI[0].odSprata).toBe(1);
    for (let i = 1; i < POJASEVI.length; i++) {
      expect(POJASEVI[i].odSprata).toBeGreaterThan(POJASEVI[i - 1].odSprata);
    }
  });

  it("svaki pojas ima ime, i veliko i malo, i dopunu za rečenicu", () => {
    for (const pojas of POJASEVI) {
      expect(pojas.ime.length).toBeGreaterThan(0);
      expect(pojas.imeMalo.length).toBeGreaterThan(0);
      expect(pojas.dokle.length).toBeGreaterThan(0);
    }
  });
});

describe("pojasZaSprat", () => {
  it("prvi sprat je podnožje", () => {
    expect(pojasZaSprat(1).ime).toBe("Podnožje");
  });

  it("tlo je podnožje, ne ništa", () => {
    expect(pojasZaSprat(0).ime).toBe("Podnožje");
  });

  it("negativan sprat ne postoji, ali ni tada ne ostaje bez pojasa", () => {
    expect(pojasZaSprat(-3).ime).toBe("Podnožje");
  });

  it("smeće na ulazu pada na podnožje umesto da sruši prikaz", () => {
    expect(pojasZaSprat(Number.NaN).ime).toBe("Podnožje");
    expect(pojasZaSprat(Number.POSITIVE_INFINITY).ime).toBe("Podnožje");
  });

  it("polusprat se ne zaokružuje naviše: 5.9 je još podnožje", () => {
    expect(pojasZaSprat(5.9).ime).toBe("Podnožje");
  });

  it("granica podnožje - stena je između 5. i 6. sprata", () => {
    expect(pojasZaSprat(5).ime).toBe("Podnožje");
    expect(pojasZaSprat(6).ime).toBe("Stena");
  });

  it("granica stena - greben je između 11. i 12. sprata", () => {
    expect(pojasZaSprat(11).ime).toBe("Stena");
    expect(pojasZaSprat(12).ime).toBe("Greben");
  });

  it("granica greben - sneg je između 17. i 18. sprata", () => {
    expect(pojasZaSprat(17).ime).toBe("Greben");
    expect(pojasZaSprat(18).ime).toBe("Sneg");
  });

  it("granica sneg - iznad oblaka je između 24. i 25. sprata", () => {
    expect(pojasZaSprat(24).ime).toBe("Sneg");
    expect(pojasZaSprat(25).ime).toBe("Iznad oblaka");
  });

  it("iznad poslednjeg praga se ostaje u poslednjem pojasu, koliko god se penje", () => {
    expect(pojasZaSprat(60).ime).toBe("Iznad oblaka");
    expect(pojasZaSprat(500).ime).toBe("Iznad oblaka");
  });
});

describe("pocinjePojas", () => {
  it("javlja se tačno na prvom spratu novog pojasa", () => {
    expect(pocinjePojas(6)?.ime).toBe("Stena");
    expect(pocinjePojas(12)?.ime).toBe("Greben");
    expect(pocinjePojas(18)?.ime).toBe("Sneg");
    expect(pocinjePojas(25)?.ime).toBe("Iznad oblaka");
  });

  it("usred pojasa se ne javlja ništa", () => {
    expect(pocinjePojas(7)).toBeNull();
    expect(pocinjePojas(11)).toBeNull();
    expect(pocinjePojas(24)).toBeNull();
    expect(pocinjePojas(60)).toBeNull();
  });

  it("podnožje se ne javlja: odatle se kreće", () => {
    expect(pocinjePojas(1)).toBeNull();
    expect(pocinjePojas(0)).toBeNull();
  });

  it("javlja se jednom po pojasu, a ne na svakom spratu iznad praga", () => {
    const javljanja = [];
    for (let s = 1; s <= 30; s++) {
      const stigla = pocinjePojas(s);
      if (stigla) javljanja.push(s);
    }
    expect(javljanja).toEqual([6, 12, 18, 25]);
  });
});

describe("opisSprata", () => {
  it("stavlja ime pojasa pred broj", () => {
    expect(opisSprata(14)).toBe("greben, 14. sprat");
    expect(opisSprata(3)).toBe("podnožje, 3. sprat");
    expect(opisSprata(27)).toBe("iznad oblaka, 27. sprat");
  });
});

describe("dokleSePopela", () => {
  it("daje rečenicu koja ima i ime i broj", () => {
    expect(dokleSePopela(19)).toBe("do snega, 19. sprat");
    expect(dokleSePopela(1)).toBe("do podnožja, 1. sprat");
    expect(dokleSePopela(30)).toBe("iznad oblaka, 30. sprat");
  });

  it("nikad ne pominje pojas do kog se nije stiglo", () => {
    for (let s = 0; s <= 60; s++) {
      const tekst = dokleSePopela(s);
      const pojas = pojasZaSprat(s);
      for (const drugi of POJASEVI) {
        if (drugi === pojas) continue;
        expect(tekst).not.toContain(drugi.imeMalo);
      }
    }
  });
});
