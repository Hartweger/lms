import { describe, it, expect } from "vitest";
import { NAJVISE_RECENICA, pripremiRecenice } from "./recenica-upis";

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

  // Isto pravilo kao za izuzetak u lekcija-upis.ts: `"da" === true` je netačno,
  // pa bi kolona iz tabele tiho isključila dopunu-samo za ceo spisak.
  it("odbija samoDopuna koja nije tačno ili netačno", () => {
    const ishod = pripremiRecenice([red({ samoDopuna: "da" })], reciLekcije);
    expect(ishod.ok).toBe(false);
    if (!ishod.ok) {
      expect(ishod.greska).toContain("Rečenica broj 1");
      expect(ishod.greska).toContain("tačno ili netačno");
    }
  });

  it("samoDopuna sme da izostane i tada je netačno", () => {
    const bezOznake: Record<string, unknown> = { ...red() };
    delete bezOznake.samoDopuna;
    const ishod = pripremiRecenice([bezOznake], reciLekcije);
    expect(ishod.ok).toBe(true);
    if (ishod.ok) expect(ishod.recenice[0].samo_dopuna).toBe(false);
  });

  it("samoDopuna tačno označi rečenicu za dopunu", () => {
    const ishod = pripremiRecenice([red({ samoDopuna: true })], reciLekcije);
    expect(ishod.ok).toBe(true);
    if (ishod.ok) expect(ishod.recenice[0].samo_dopuna).toBe(true);
  });

  it("odbija prazan spisak", () => {
    expect(pripremiRecenice([], reciLekcije).ok).toBe(false);
  });

  // Nalepljeno iz druge aplikacije ume da pomeša zapise istog slova: „ö“ kao
  // jedan znak (NFC) i „ö“ kao o + kvačica (NFD) na ekranu izgledaju isto, a
  // kao tekst su različiti. Zato praznina i pogrešni oblici moraju da prođu
  // isto sređivanje kao rečenica, inače kvar stigne do deteta.
  /** „möchte“ sa ö kao jednim znakom (NFC). */
  const OE_NFC = "m\u00f6chte";
  /** Isto to na ekranu, ali o + kvačica, dva znaka (NFD). */
  const OE_NFD = "mo\u0308chte";
  const reciMochten = new Map([["m\u00f6chten", "id-mochten"]]);
  const redMochte = (delovi: Partial<Record<string, unknown>> = {}) => ({
    de: `Ich ${OE_NFC} essen.`,
    sr: "Želim da jedem.",
    praznina: OE_NFC,
    distraktori: ["mag", "magst", "wollen"],
    glavna: "m\u00f6chten",
    ...delovi,
  });

  it("prima prazninu zapisanu drugim Unicode zapisom nego rečenica", () => {
    const ishod = pripremiRecenice([redMochte({ praznina: OE_NFD })], reciMochten);
    expect(ishod.ok).toBe(true);
    if (ishod.ok) expect(ishod.recenice[0].praznina).toBe(OE_NFC);
  });

  it("odbija pogrešan oblik koji je isti kao praznina, samo u drugom zapisu", () => {
    const ishod = pripremiRecenice(
      [redMochte({ distraktori: [OE_NFD, "mag", "magst"] })],
      reciMochten
    );
    expect(ishod.ok).toBe(false);
    if (!ishod.ok) expect(ishod.greska).toContain("jednak tačnom odgovoru");
  });

  it("odbija spisak duži od granice", () => {
    const previse = Array.from({ length: NAJVISE_RECENICA + 1 }, () => red());
    const ishod = pripremiRecenice(previse, reciLekcije);
    expect(ishod.ok).toBe(false);
    if (!ishod.ok) expect(ishod.greska).toContain(String(NAJVISE_RECENICA));
  });

  it("odbija ulaz koji uopšte nije niz", () => {
    expect(pripremiRecenice("Ich komme aus Serbien.", reciLekcije).ok).toBe(false);
    expect(pripremiRecenice(null, reciLekcije).ok).toBe(false);
    expect(pripremiRecenice({ 0: red() }, reciLekcije).ok).toBe(false);
  });

  it("odbija red koji nije objekat", () => {
    for (const nijeRed of ["Ich komme aus Serbien.", null, 7, ["de", "sr"]]) {
      const ishod = pripremiRecenice([nijeRed], reciLekcije);
      expect(ishod.ok).toBe(false);
      if (!ishod.ok) expect(ishod.greska).toContain("Rečenica broj 1");
    }
  });

  it("odbija red kome nedostaje obavezno polje, i kaže koje", () => {
    const polja: [string, string][] = [
      ["de", "nemačka rečenica"],
      ["sr", "prevod na naš jezik"],
      ["praznina", "oblik koji se vadi za dopunu"],
      ["glavna", "glavna reč"],
    ];
    for (const [polje, deoPoruke] of polja) {
      const ishod = pripremiRecenice([red({ [polje]: "" })], reciLekcije);
      expect(ishod.ok).toBe(false);
      if (!ishod.ok) expect(ishod.greska).toContain(deoPoruke);
    }
  });

  it("odbija distraktore koji nisu niz", () => {
    const ishod = pripremiRecenice([red({ distraktori: "kommst" })], reciLekcije);
    expect(ishod.ok).toBe(false);
    if (!ishod.ok) expect(ishod.greska).toContain("spisak");
  });

  it("odbija pogrešan oblik koji nije tekst", () => {
    const ishod = pripremiRecenice([red({ distraktori: ["kommst", 5, "kommt"] })], reciLekcije);
    expect(ishod.ok).toBe(false);
    if (!ishod.ok) expect(ishod.greska).toContain("Rečenica broj 1");
  });

  // Redni broj je didaktički redosled lekcije, pa mora da prati red u tabeli,
  // a ne da svaka rečenica bude prva.
  it("redni_broj prati redosled iz spiska", () => {
    const ishod = pripremiRecenice(
      [
        red(),
        red({
          de: "Wir wohnen in Berlin.",
          praznina: "wohnen",
          glavna: "wohnen",
          distraktori: ["wohne", "wohnst", "wohnt"],
        }),
        red({
          de: "Sie kommt aus Serbien.",
          praznina: "Serbien",
          glavna: "Serbien",
          distraktori: ["Berlin", "Bonn", "Wien"],
        }),
      ],
      reciLekcije
    );
    expect(ishod.ok).toBe(true);
    if (ishod.ok) {
      expect(ishod.recenice.map((r) => r.redni_broj)).toEqual([1, 2, 3]);
      expect(ishod.recenice.map((r) => r.rec_id)).toEqual([
        "id-kommen",
        "id-wohnen",
        "id-serbien",
      ]);
    }
  });
});
