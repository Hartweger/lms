import { describe, it, expect } from "vitest";
import {
  uTihimSatima,
  grupisiPoPrimaocu,
  tekstObavestenja,
  trebaMejl,
  mnozina,
  type PorukaZaObavestenje,
  type Primalac,
} from "./gen2-push";

// Leto (CEST, UTC+2): beogradski sat = UTC + 2.
describe("uTihimSatima - leto", () => {
  it("21:59 nije tiha zona", () => {
    expect(uTihimSatima(new Date("2026-08-08T19:59:00Z"))).toBe(false);
  });

  it("22:01 jeste tiha zona", () => {
    expect(uTihimSatima(new Date("2026-08-08T20:01:00Z"))).toBe(true);
  });

  it("00:30 (preko ponoći) jeste tiha zona", () => {
    expect(uTihimSatima(new Date("2026-08-08T22:30:00Z"))).toBe(true);
  });

  it("06:59 jeste tiha zona", () => {
    expect(uTihimSatima(new Date("2026-08-08T04:59:00Z"))).toBe(true);
  });

  it("07:01 nije tiha zona", () => {
    expect(uTihimSatima(new Date("2026-08-08T05:01:00Z"))).toBe(false);
  });
});

// Zima (CET, UTC+1) - posle prelaza 25.10.2026: beogradski sat = UTC + 1.
describe("uTihimSatima - zima", () => {
  it("21:30 nije tiha zona", () => {
    expect(uTihimSatima(new Date("2026-11-10T20:30:00Z"))).toBe(false);
  });

  it("22:30 jeste tiha zona", () => {
    expect(uTihimSatima(new Date("2026-11-10T21:30:00Z"))).toBe(true);
  });
});

function p(id: string, autor: string, minut: number): PorukaZaObavestenje {
  return {
    id,
    user_id: autor,
    ime: autor === "ana" ? "Ana" : "Mila",
    tekst: `poruka ${id}`,
    created_at: `2026-10-01T10:${String(minut).padStart(2, "0")}:00Z`,
  };
}

function primalac(id: string, push_do: string, last_read_at: string | null = null): Primalac {
  return { user_id: id, push_do, mejl_do: push_do, last_read_at };
}

describe("grupisiPoPrimaocu", () => {
  const poruke = [p("m1", "ana", 5), p("m2", "mila", 7), p("m3", "ana", 9)];

  it("spaja sve nove poruke u jedno obaveštenje po primaocu", () => {
    const out = grupisiPoPrimaocu(poruke, [primalac("jelena", "2026-10-01T10:00:00Z")], "push_do");
    expect(out).toHaveLength(1);
    expect(out[0].poruke.map((x) => x.id)).toEqual(["m1", "m2", "m3"]);
    expect(out[0].najnovija).toBe("2026-10-01T10:09:00Z");
  });

  it("pošiljalac ne dobija svoju poruku", () => {
    const out = grupisiPoPrimaocu(poruke, [primalac("ana", "2026-10-01T10:00:00Z")], "push_do");
    expect(out[0].poruke.map((x) => x.id)).toEqual(["m2"]);
  });

  it("izostavlja poruke starije od vodostaja", () => {
    const out = grupisiPoPrimaocu(poruke, [primalac("jelena", "2026-10-01T10:07:00Z")], "push_do");
    expect(out[0].poruke.map((x) => x.id)).toEqual(["m3"]);
  });

  it("izostavlja poruke koje je primalac već pročitao", () => {
    const out = grupisiPoPrimaocu(
      poruke,
      [primalac("jelena", "2026-10-01T10:00:00Z", "2026-10-01T10:08:00Z")],
      "push_do"
    );
    expect(out[0].poruke.map((x) => x.id)).toEqual(["m3"]);
  });

  it("primalac bez ijedne nove poruke se izostavlja iz rezultata", () => {
    const out = grupisiPoPrimaocu(poruke, [primalac("jelena", "2026-10-01T10:09:00Z")], "push_do");
    expect(out).toEqual([]);
  });

  it("koristi mejl_do kad se traži vodostaj mejla", () => {
    const prima: Primalac = {
      user_id: "jelena",
      push_do: "2026-10-01T10:09:00Z",
      mejl_do: "2026-10-01T10:00:00Z",
      last_read_at: null,
    };
    const out = grupisiPoPrimaocu(poruke, [prima], "mejl_do");
    expect(out[0].poruke).toHaveLength(3);
  });
});

describe("mnozina", () => {
  it("srpski oblici: 1 / 2-4 / 5+", () => {
    expect(mnozina(1, "poruka", "poruke", "poruka")).toBe("poruka");
    expect(mnozina(3, "poruka", "poruke", "poruka")).toBe("poruke");
    expect(mnozina(7, "poruka", "poruke", "poruka")).toBe("poruka");
  });

  it("11-14 idu na oblik za 5+, ne na oblik za 1", () => {
    expect(mnozina(11, "poruka", "poruke", "poruka")).toBe("poruka");
    expect(mnozina(12, "poruka", "poruke", "poruka")).toBe("poruka");
  });

  it("21 ide na oblik za 1, 22 na oblik za 2-4", () => {
    expect(mnozina(21, "poruka", "poruke", "poruka")).toBe("poruka");
    expect(mnozina(22, "poruka", "poruke", "poruka")).toBe("poruke");
  });
});

describe("tekstObavestenja", () => {
  it("jedna poruka: ime i tekst", () => {
    const t = tekstObavestenja([p("m1", "ana", 5)]);
    expect(t.naslov).toBe("Gen II");
    expect(t.telo).toBe("Ana: poruka m1");
  });

  it("više poruka: brojač i poslednja", () => {
    const t = tekstObavestenja([p("m1", "ana", 5), p("m2", "mila", 7), p("m3", "ana", 9)]);
    expect(t.telo).toBe("3 nove poruke - Ana: poruka m3");
  });

  it("skraćuje dugačak tekst", () => {
    const duga = { ...p("m1", "ana", 5), tekst: "x".repeat(200) };
    const t = tekstObavestenja([duga]);
    expect(t.telo.length).toBeLessThanOrEqual(130);
    expect(t.telo.endsWith("…")).toBe(true);
  });
});

describe("trebaMejl", () => {
  const sada = new Date("2026-10-01T10:20:00Z");

  it("poruka stara 9 minuta - još ne", () => {
    expect(trebaMejl([p("m1", "ana", 11)], sada)).toBe(false);
  });

  it("poruka stara 11 minuta - da", () => {
    expect(trebaMejl([p("m1", "ana", 9)], sada)).toBe(true);
  });

  it("prazan spisak - ne", () => {
    expect(trebaMejl([], sada)).toBe(false);
  });
});
