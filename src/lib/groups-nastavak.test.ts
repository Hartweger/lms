import { describe, it, expect } from "vitest";
import { izaberiSledecu, novaGrupaZaPonovnuPonudu } from "./groups-nastavak";

const MILICA = "prof-milica";
const MARIJA = "prof-marija";

const marijaB11 = { id: "g-marija", level: "B1.1", status: "otvoren", start_date: "2026-09-19", created_at: "2026-07-28T10:00:00Z", professor_id: MARIJA };
const milicaB11 = { id: "g-milica", level: "B1.1", status: "otvoren", start_date: "2026-09-28", created_at: "2026-09-22T06:00:00Z", professor_id: MILICA };

const a22 = { id: "g-a22", end_date: "2026-09-23", professor_id: MILICA, offer_sent_at: "2026-09-16T08:30:00Z", offer_resent_at: null };

describe("izaberiSledecu", () => {
  it("prednost ima grupa iste profesorke i kad kreće kasnije", () => {
    expect(izaberiSledecu([marijaB11, milicaB11], MILICA)?.id).toBe("g-milica");
  });
  it("bez iste profesorke bira najraniji start", () => {
    expect(izaberiSledecu([milicaB11, marijaB11], "prof-x")?.id).toBe("g-marija");
    expect(izaberiSledecu([milicaB11, marijaB11], null)?.id).toBe("g-marija");
  });
  it("ignoriše grupe koje nisu otvorene", () => {
    expect(izaberiSledecu([{ ...milicaB11, status: "u_toku" }], MILICA)).toBeNull();
  });
});

describe("novaGrupaZaPonovnuPonudu", () => {
  it("slučaj 22.09: nova Miličina B1.1 otvorena posle ponude → ponovna ponuda", () => {
    expect(novaGrupaZaPonovnuPonudu(a22, [marijaB11, milicaB11], "2026-09-22")?.id).toBe("g-milica");
  });
  it("ne šalje ako je nova grupa druge profesorke", () => {
    const tudja = { ...milicaB11, professor_id: MARIJA };
    expect(novaGrupaZaPonovnuPonudu(a22, [marijaB11, tudja], "2026-09-22")).toBeNull();
  });
  it("ne šalje ako je grupa postojala PRE prve ponude (već je bila ponuđena)", () => {
    const stara = { ...milicaB11, created_at: "2026-09-10T00:00:00Z" };
    expect(novaGrupaZaPonovnuPonudu(a22, [stara], "2026-09-22")).toBeNull();
  });
  it("ne šalje dvaput", () => {
    expect(novaGrupaZaPonovnuPonudu({ ...a22, offer_resent_at: "2026-09-22T09:00:00Z" }, [milicaB11], "2026-09-23")).toBeNull();
  });
  it("ne šalje pre prve ponude", () => {
    expect(novaGrupaZaPonovnuPonudu({ ...a22, offer_sent_at: null }, [milicaB11], "2026-09-22")).toBeNull();
  });
  it("ne šalje kad je od kraja grupe prošlo više od dve nedelje", () => {
    expect(novaGrupaZaPonovnuPonudu(a22, [{ ...milicaB11, start_date: "2026-10-20", created_at: "2026-10-10T00:00:00Z" }], "2026-10-10")).toBeNull();
    expect(novaGrupaZaPonovnuPonudu(a22, [milicaB11], "2026-10-07")?.id).toBe("g-milica");
  });
  it("ne šalje za grupu koja kreće više od nedelju dana pre kraja tekuće", () => {
    const prerana = { ...milicaB11, start_date: "2026-09-10", created_at: "2026-09-17T00:00:00Z" };
    expect(novaGrupaZaPonovnuPonudu(a22, [prerana], "2026-09-22")).toBeNull();
  });
  it("bez profesorke na tekućoj grupi nema ponovne ponude", () => {
    expect(novaGrupaZaPonovnuPonudu({ ...a22, professor_id: null }, [milicaB11], "2026-09-22")).toBeNull();
  });
});
