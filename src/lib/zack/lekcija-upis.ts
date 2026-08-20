// Čista logika upisa lekcije: provera i priprema spiska reči, i računanje šta
// bi brisanje odnelo. Ovde nema ni baze ni HTTP-a, da bi moglo da se testira
// bez ijednog mreženog poziva. Ruta iznad ovoga samo priča sa Supabaseom.

import { normalizujMnozinu, type Rod, type Vrsta } from "./rec";

const RODOVI: readonly Rod[] = ["der", "die", "das", "nema"];
const VRSTE: readonly Vrsta[] = ["imenica", "glagol", "pridev", "ostalo"];

/** Gornja granica jednog spiska. Lekcija sa više od ovoliko reči je omaška u lepljenju. */
export const NAJVISE_RECI = 500;

export type PripremljenaRec = {
  redni_broj: number;
  de: string;
  sr: string;
  rod: Rod;
  mnozina: string | null;
  vrsta: Vrsta;
  izuzetak: boolean;
};

/**
 * Sređuje nemački oblik pre nego što postane ključ reči.
 *
 * `de` je ključ po kome se reč prepoznaje između dva upisa, pa isti tekst mora
 * da da isti ključ. Bez ovoga „Mädchen“ otkucano sa spojenim ä (NFC) i isto to
 * sa razdvojenim ä (NFD) izgledaju kao dve različite reči, pa bi se stara
 * obrisala a nova ubacila prazna. Isto važi za dva razmaka u „der  Hund“.
 *
 * Menja se samo zapis, nikad sadržaj: razmaci se sažimaju, ne brišu, pa
 * „der Hund“ i „Hund“ i dalje ostaju dve različite reči.
 */
export function normalizujDe(s: string): string {
  return s.normalize("NFC").replace(/\s+/g, " ").trim();
}

function jeNeprazanTekst(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function jeRod(v: unknown): v is Rod {
  return typeof v === "string" && (RODOVI as readonly string[]).includes(v);
}

function jeVrsta(v: unknown): v is Vrsta {
  return typeof v === "string" && (VRSTE as readonly string[]).includes(v);
}

export type PripremaIshod =
  | { ok: true; reci: PripremljenaRec[] }
  | { ok: false; greska: string };

/**
 * Proverava i priprema ceo spisak reči. Prva greška prekida, sa brojem reda,
 * da bi Nataša znala koji red u tabeli da popravi.
 */
export function pripremiReci(ulaz: unknown): PripremaIshod {
  if (!Array.isArray(ulaz)) {
    return { ok: false, greska: "Spisak reči mora biti niz" };
  }
  if (ulaz.length === 0) {
    return { ok: false, greska: "Lekcija mora imati bar jednu reč" };
  }
  if (ulaz.length > NAJVISE_RECI) {
    return {
      ok: false,
      greska: `Spisak ima ${ulaz.length} reči, a najviše sme ${NAJVISE_RECI}`,
    };
  }

  const reci: PripremljenaRec[] = [];
  const videnoDe = new Map<string, number>();

  for (let i = 0; i < ulaz.length; i++) {
    const red = i + 1;
    const sirova: unknown = ulaz[i];
    if (typeof sirova !== "object" || sirova === null || Array.isArray(sirova)) {
      return { ok: false, greska: `Reč broj ${red}: red nije ispravno popunjen` };
    }
    const r = sirova as Record<string, unknown>;

    if (!jeNeprazanTekst(r.de)) {
      return { ok: false, greska: `Reč broj ${red}: nedostaje nemačka reč` };
    }
    if (!jeNeprazanTekst(r.sr)) {
      return { ok: false, greska: `Reč broj ${red}: nedostaje prevod na naš jezik` };
    }

    const de = normalizujDe(r.de);
    const vecViden = videnoDe.get(de);
    if (vecViden !== undefined) {
      return {
        ok: false,
        greska: `Reč broj ${red}: nemačka reč „${de}“ već postoji u spisku, pod brojem ${vecViden}`,
      };
    }
    videnoDe.set(de, red);

    let rod: Rod = "nema";
    if (r.rod !== undefined && r.rod !== null) {
      if (!jeRod(r.rod)) {
        return {
          ok: false,
          greska: `Reč broj ${red}: rod „${String(r.rod)}“ nije dozvoljen, koristi der, die, das ili nema`,
        };
      }
      rod = r.rod;
    }

    let vrsta: Vrsta = "ostalo";
    if (r.vrsta !== undefined && r.vrsta !== null) {
      if (!jeVrsta(r.vrsta)) {
        return {
          ok: false,
          greska: `Reč broj ${red}: vrsta „${String(r.vrsta)}“ nije dozvoljena, koristi imenica, glagol, pridev ili ostalo`,
        };
      }
      vrsta = r.vrsta;
    }

    // Množina sme da izostane, ali ono što nije ni tekst ni null je greška.
    // Tiho pretvaranje u null bi obrisalo množinu koja već stoji u bazi.
    //
    // Crtica i kosa crta su u tabeli oznaka praznog polja („ova reč nema
    // množinu"), pa se upisuju kao null - inače bi igra Množina pitala kako
    // glasi množina od Hunger i očekivala crticu. Prava množina se upisuje
    // onako kako je otkucana, samo bez ivičnih razmaka.
    let mnozina: string | null = null;
    if (r.mnozina !== undefined && r.mnozina !== null) {
      if (typeof r.mnozina !== "string") {
        return { ok: false, greska: `Reč broj ${red}: množina mora biti tekst ili prazno` };
      }
      mnozina = normalizujMnozinu(r.mnozina);
    }

    // Izuzetak mora biti pravi boolean. `Boolean("false")` je `true`, pa bi
    // tabela sa tekstom umesto kvačice svaku reč proglasila izuzetkom.
    let izuzetak = false;
    if (r.izuzetak !== undefined && r.izuzetak !== null) {
      if (typeof r.izuzetak !== "boolean") {
        return {
          ok: false,
          greska: `Reč broj ${red}: izuzetak mora biti tačno ili netačno`,
        };
      }
      izuzetak = r.izuzetak;
    }

    reci.push({
      redni_broj: red,
      de,
      sr: r.sr.trim(),
      rod,
      mnozina,
      vrsta,
      izuzetak,
    });
  }

  return { ok: true, reci };
}

/**
 * Koje postojeće reči više nisu u spisku. Vraća njihove id-jeve.
 * Poredi se po normalizovanom obliku, da razlika u zapisu ne bi obrisala reč
 * koja je zapravo ostala.
 */
export function izracunajBrisanje(
  postojece: readonly { id: string; de: string }[],
  noviDe: readonly string[]
): string[] {
  const zadrzi = new Set(noviDe.map(normalizujDe));
  return postojece.filter((r) => !zadrzi.has(normalizujDe(r.de))).map((r) => r.id);
}
