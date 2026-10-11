import { describe, it, expect } from "vitest";
import { jeMigracioniOstatak, jeAktivanKupac, fazaPosleSignala, pocetnaFaza, opisKupca } from "./customer-status";

const NOW = new Date("2026-09-22T10:00:00Z").getTime();
const buduce = "2026-10-07T12:00:00Z";
const proslo = "2026-09-01T12:00:00Z";

describe("jeMigracioniOstatak", () => {
  it("ld-migracija, gramatika-migracija i pilot su ostatak", () => {
    expect(jeMigracioniOstatak("ld-migracija-2026-07")).toBe(true);
    expect(jeMigracioniOstatak("gramatika-migracija-2026-07")).toBe(true);
    expect(jeMigracioniOstatak("pilot-2026-05-24 (istek po WP kupovini)")).toBe(true);
  });
  it("kupovine na platformi i WP kupovine NISU ostatak", () => {
    expect(jeMigracioniOstatak("order:2026-548")).toBe(false);
    expect(jeMigracioniOstatak("wp-migration-2026-06")).toBe(false);
    expect(jeMigracioniOstatak("grupa-rucni-unos")).toBe(false);
    expect(jeMigracioniOstatak(null)).toBe(false);
    expect(jeMigracioniOstatak("")).toBe(false);
  });
});

describe("jeAktivanKupac", () => {
  it("važeći pristup iz porudžbine = kupac", () => {
    expect(jeAktivanKupac([{ expires_at: buduce, source: "order:2026-1" }], NOW)).toBe(true);
    expect(jeAktivanKupac([{ expires_at: null, source: null }], NOW)).toBe(true);
  });
  it("istekao pristup = nije kupac", () => {
    expect(jeAktivanKupac([{ expires_at: proslo, source: "order:2026-1" }], NOW)).toBe(false);
  });
  it("jedini važeći pristup je ostatak migracije = NIJE kupac (slučaj Milica Živanović)", () => {
    expect(jeAktivanKupac([{ expires_at: buduce, source: "ld-migracija-2026-07" }], NOW)).toBe(false);
  });
  it("ostatak migracije + prava kupovina = kupac", () => {
    expect(jeAktivanKupac([
      { expires_at: buduce, source: "ld-migracija-2026-07" },
      { expires_at: buduce, source: "order:2026-2" },
    ], NOW)).toBe(true);
  });
  it("prazno = nije kupac", () => {
    expect(jeAktivanKupac([], NOW)).toBe(false);
    expect(jeAktivanKupac(null, NOW)).toBe(false);
  });
});

describe("fazaPosleSignala", () => {
  it("lid koji je postao aktivan kupac ide u upisan", () => {
    expect(fazaPosleSignala("nov", true, "naki")).toBe("upisan");
    expect(fazaPosleSignala("kontaktiran", true, "smile")).toBe("upisan");
  });
  it("lid koji nije kupac ostaje u svojoj fazi", () => {
    expect(fazaPosleSignala("kontaktiran", false, "naki")).toBeNull();
    expect(fazaPosleSignala("ponuda", false, "kontakt-forma")).toBeNull();
  });
  it("arhiviran kao upisan bez aktivnog pristupa se vraća u levak", () => {
    expect(fazaPosleSignala("upisan", false, "naki")).toBe("nov");
  });
  it("arhiviran kao upisan koji se javio preko forme se vraća u levak i kad je kupac", () => {
    expect(fazaPosleSignala("upisan", true, "kontakt-forma")).toBe("nov");
  });
  it("aktivan kupac koji ćaska sa NaKI ostaje u arhivi", () => {
    expect(fazaPosleSignala("upisan", true, "naki")).toBeNull();
  });
});

describe("pocetnaFaza", () => {
  it("kupac → upisan, lid → nov, forma → uvek nov", () => {
    expect(pocetnaFaza(true, "naki")).toBe("upisan");
    expect(pocetnaFaza(false, "naki")).toBe("nov");
    expect(pocetnaFaza(true, "kontakt-forma")).toBe("nov");
  });
});

describe("opisKupca", () => {
  const datum = (iso: string) => `D(${iso.slice(0, 10)})`;
  const sveza = { order_number: "2026-646", created_at: "2026-10-11T07:27:00Z", items: [{ title: "Individualni kurs B2.1" }] };

  it("sveža plaćena narudžbina: šta i kada, sa brojem narudžbine", () => {
    const k = opisKupca([sveza], [], datum, NOW);
    expect(k).toEqual({ kupio: "D(2026-10-11) (narudžbina 2026-646)", sta: "Individualni kurs B2.1" });
  });

  it("više narudžbina: poslednja daje datum, nazivi se skupljaju bez duplikata", () => {
    const starija = { order_number: "2026-100", created_at: "2026-08-01T10:00:00Z", items: [{ title: "Video A1" }, { title: "Video A1" }] };
    const k = opisKupca([starija, sveza], [], datum, NOW);
    expect(k?.kupio).toContain("2026-646");
    expect(k?.sta).toBe("Individualni kurs B2.1, Video A1");
  });

  it("narudžbina starija od godinu dana ne zaustavlja ponudu (istekao kupac je renewal lid)", () => {
    const stara = { order_number: "2025-1", created_at: "2025-06-01T10:00:00Z", items: [{ title: "Video A1" }] };
    expect(opisKupca([stara], [], datum, NOW)).toBeNull();
  });

  it("bez narudžbine, ali sa važećim kupljenim pristupom: kupac", () => {
    const k = opisKupca([], [{ expires_at: buduce, source: "order:2026-548", title: "Video B1" }], datum, NOW);
    expect(k?.sta).toBe("Video B1");
    expect(k?.kupio).toContain("datum narudžbine nije zabeležen");
  });

  it("migracioni ostatak i istekao pristup nisu kupac", () => {
    expect(opisKupca([], [{ expires_at: buduce, source: "ld-migracija-2026-07", title: "Konverzacija" }], datum, NOW)).toBeNull();
    expect(opisKupca([], [{ expires_at: proslo, source: "order:1", title: "Video A1" }], datum, NOW)).toBeNull();
  });

  it("nema ničega: null; narudžbina bez naslova ne puca", () => {
    expect(opisKupca(null, null, datum, NOW)).toBeNull();
    const k = opisKupca([{ created_at: "2026-10-11T07:27:00Z", items: null }], [], datum, NOW);
    expect(k?.sta).toContain("naziv nije zabeležen");
    expect(k?.kupio).toBe("D(2026-10-11)");
  });
});
