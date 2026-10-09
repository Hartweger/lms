import { describe, it, expect } from "vitest";
import { zaObavestiti, kljuc, type Lid, type OtvorenaGrupa } from "./interes-obavestenje";

const DANAS = "2026-10-09";

const lid = (contactId: string, nivo: string, email = `${contactId}@test.rs`): Lid =>
  ({ contactId, email, ime: "Ana", nivo });

const grupa = (id: string, level: string, startDate: string): OtvorenaGrupa =>
  ({ id, level, startDate });

describe("zaObavestiti", () => {
  it("javlja lidu čiji je nivo dobio termin", () => {
    const r = zaObavestiti([lid("c1", "B2.1")], [grupa("g1", "B2.1", "2026-10-20")], new Set(), DANAS);
    expect(r).toHaveLength(1);
    expect(r[0].grupa.id).toBe("g1");
  });

  it("ćuti kad za taj nivo nema otvorene grupe", () => {
    expect(zaObavestiti([lid("c1", "C1.1")], [grupa("g1", "B2.1", "2026-10-20")], new Set(), DANAS)).toEqual([]);
  });

  it("preskače grupu koja je već počela", () => {
    expect(zaObavestiti([lid("c1", "B2.1")], [grupa("g1", "B2.1", "2026-10-08")], new Set(), DANAS)).toEqual([]);
  });

  it("javlja za grupu koja kreće baš danas", () => {
    expect(zaObavestiti([lid("c1", "B2.1")], [grupa("g1", "B2.1", DANAS)], new Set(), DANAS)).toHaveLength(1);
  });

  it("bira najraniju grupu nivoa, ne sve", () => {
    const r = zaObavestiti(
      [lid("c1", "A1.2")],
      [grupa("kasnija", "A1.2", "2026-11-03"), grupa("ranija", "A1.2", "2026-10-20")],
      new Set(), DANAS,
    );
    expect(r).toHaveLength(1);
    expect(r[0].grupa.id).toBe("ranija");
  });

  it("ne šalje dvaput za isti par lid+grupa", () => {
    const vec = new Set([kljuc("c1", "g1")]);
    expect(zaObavestiti([lid("c1", "B2.1")], [grupa("g1", "B2.1", "2026-10-20")], vec, DANAS)).toEqual([]);
  });

  it("posle obaveštenja za jednu grupu javlja za sledeću novu", () => {
    const vec = new Set([kljuc("c1", "stara")]);
    const r = zaObavestiti(
      [lid("c1", "B2.1")],
      [grupa("stara", "B2.1", "2026-10-20"), grupa("nova", "B2.1", "2026-12-01")],
      vec, DANAS,
    );
    expect(r).toHaveLength(1);
    expect(r[0].grupa.id).toBe("nova");
  });

  it("čovek koji čeka dva nivoa dobija jedan mejl - za onaj koji kreće pre", () => {
    const r = zaObavestiti(
      [lid("c1", "B1.1", "ana@test.rs"), lid("c1", "B2.1", "ana@test.rs")],
      [grupa("b11", "B1.1", "2026-11-16"), grupa("b21", "B2.1", "2026-10-20")],
      new Set(), DANAS,
    );
    expect(r).toHaveLength(1);
    expect(r[0].grupa.id).toBe("b21");
  });

  it("isti mejl upisan dvaput ne daje dva obaveštenja", () => {
    const r = zaObavestiti(
      [lid("c1", "A1.1", "Ana@Test.rs"), lid("c2", "A1.1", "ana@test.rs")],
      [grupa("g1", "A1.1", "2026-10-19")],
      new Set(), DANAS,
    );
    expect(r).toHaveLength(1);
    expect(r[0].lid.email).toBe("ana@test.rs");
  });

  it("preskače neispravan mejl", () => {
    expect(zaObavestiti([lid("c1", "A1.1", "bez-majmuna")], [grupa("g1", "A1.1", "2026-10-19")], new Set(), DANAS)).toEqual([]);
  });
});
