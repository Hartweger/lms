// Čista logika upisa rečenica: provera i priprema spiska koji je Nataša
// nalepila, pre nego što ijedan red ode u bazu. Ovde nema ni baze ni HTTP-a,
// isto kao u lekcija-upis.ts; ruta iznad ovoga samo priča sa Supabaseom.
//
// Pokvarena rečenica se ODBIJA pri upisu, a ne preskače kasnije u igri: dete
// nikad ne sme da dobije pitanje bez rešenja, a Nataša odmah vidi šta da
// popravi, dok joj je tabela još pred očima.

import { normalizujDe } from "./lekcija-upis";
import { brojPojavljivanja, rastaviRecenicu, PLOCICA_NAJMANJE, PLOCICA_NAJVISE } from "./recenice";

/** Gornja granica jednog spiska. Više od ovoliko rečenica je omaška u lepljenju. */
export const NAJVISE_RECENICA = 200;

/** Koliko pogrešnih oblika ide uz svaku rečenicu; dopuna nudi njih plus tačan. */
export const DISTRAKTORA = 3;

export type PripremljenaRecenica = {
  redni_broj: number;
  de: string;
  sr: string;
  praznina: string;
  distraktori: string[];
  rec_id: string;
  samo_dopuna: boolean;
};

export type PripremaRecenicaIshod =
  | { ok: true; recenice: PripremljenaRecenica[] }
  | { ok: false; greska: string };

function jeNeprazanTekst(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Proverava i priprema ceo spisak rečenica. Prva greška prekida, sa brojem
 * reda, da bi Nataša znala koji red u tabeli da popravi.
 *
 * `reciLekcije` je preslikavanje nemačke reči u njen id, onako kako ga ruta
 * pročita iz baze: glavna reč rečenice mora biti reč TE lekcije, jer se na nju
 * knjiže tačan odgovor i greška.
 */
export function pripremiRecenice(
  ulaz: unknown,
  reciLekcije: ReadonlyMap<string, string>
): PripremaRecenicaIshod {
  if (!Array.isArray(ulaz)) {
    return { ok: false, greska: "Spisak rečenica mora biti niz" };
  }
  if (ulaz.length === 0) {
    return { ok: false, greska: "Lekcija mora imati bar jednu rečenicu" };
  }
  if (ulaz.length > NAJVISE_RECENICA) {
    return {
      ok: false,
      greska: `Spisak ima ${ulaz.length} rečenica, a najviše sme ${NAJVISE_RECENICA}`,
    };
  }

  const recenice: PripremljenaRecenica[] = [];
  const videnoDe = new Map<string, number>();

  for (let i = 0; i < ulaz.length; i++) {
    const red = i + 1;
    const sirova: unknown = ulaz[i];
    if (typeof sirova !== "object" || sirova === null || Array.isArray(sirova)) {
      return { ok: false, greska: `Rečenica broj ${red}: red nije ispravno popunjen` };
    }
    const r = sirova as Record<string, unknown>;

    if (!jeNeprazanTekst(r.de)) {
      return { ok: false, greska: `Rečenica broj ${red}: nedostaje nemačka rečenica` };
    }
    if (!jeNeprazanTekst(r.sr)) {
      return { ok: false, greska: `Rečenica broj ${red}: nedostaje prevod na naš jezik` };
    }
    if (!jeNeprazanTekst(r.praznina)) {
      return {
        ok: false,
        greska: `Rečenica broj ${red}: nedostaje oblik koji se vadi za dopunu`,
      };
    }
    if (!jeNeprazanTekst(r.glavna)) {
      return { ok: false, greska: `Rečenica broj ${red}: nedostaje glavna reč` };
    }

    const de = normalizujDe(r.de);
    const vecViden = videnoDe.get(de);
    if (vecViden !== undefined) {
      return {
        ok: false,
        greska: `Rečenica broj ${red}: rečenica „${de}“ već postoji u spisku, pod brojem ${vecViden}`,
      };
    }
    videnoDe.set(de, red);

    // Oblik za dopunu mora da se javi tačno jednom: bez pojave nema šta da se
    // izvadi, a sa dve bi obe bile ispravan odgovor a priznala bi se samo jedna.
    // `brojPojavljivanja` gleda pločice bez repa („Komm,“ je „komm“) i ne
    // razlikuje veliko od malog slova.
    const { reci } = rastaviRecenicu(de);
    const praznina = r.praznina.trim();
    const puta = brojPojavljivanja(reci, praznina);
    if (puta !== 1) {
      return {
        ok: false,
        greska: `Rečenica broj ${red}: oblik „${praznina}“ se u rečenici javlja ${puta} puta, a mora tačno jednom`,
      };
    }

    if (!Array.isArray(r.distraktori)) {
      return {
        ok: false,
        greska: `Rečenica broj ${red}: pogrešni oblici moraju biti spisak od ${DISTRAKTORA} reči`,
      };
    }
    if (r.distraktori.length !== DISTRAKTORA) {
      return {
        ok: false,
        greska: `Rečenica broj ${red}: ima ${r.distraktori.length} pogrešnih oblika, a treba ih tačno ${DISTRAKTORA}`,
      };
    }
    const distraktori: string[] = [];
    // Ponuda dopune se pravi od tačnog oblika i ovih; dva ista oblika bi dala
    // dva ista dugmeta, a oblik jednak tačnom bi dao dva tačna odgovora.
    const videniOblici = new Set([praznina.toLocaleLowerCase("de")]);
    for (const d of r.distraktori) {
      if (!jeNeprazanTekst(d)) {
        return { ok: false, greska: `Rečenica broj ${red}: pogrešan oblik je prazan` };
      }
      const oblik = d.trim();
      const kljuc = oblik.toLocaleLowerCase("de");
      if (videniOblici.has(kljuc)) {
        return {
          ok: false,
          greska: `Rečenica broj ${red}: pogrešan oblik „${oblik}“ se ponavlja ili je jednak tačnom odgovoru`,
        };
      }
      videniOblici.add(kljuc);
      distraktori.push(oblik);
    }

    const glavna = normalizujDe(r.glavna);
    const rec_id = reciLekcije.get(glavna);
    if (rec_id === undefined) {
      return {
        ok: false,
        greska: `Rečenica broj ${red}: glavna reč „${glavna}“ nije reč ove lekcije`,
      };
    }

    // Broj pločica se računa direktno preko `rastaviRecenicu`, jer bi
    // `podobnaZaSlagalicu` tražila ceo `Recenica` zapis (sa id-jem koji ovde
    // još ne postoji); pravilo je isto, samo bez izmišljanja objekta.
    // Rečenica van granice nije greška - samo više ne ulazi u slagalicu.
    const vanSlagalice = reci.length < PLOCICA_NAJMANJE || reci.length > PLOCICA_NAJVISE;

    recenice.push({
      redni_broj: red,
      de,
      sr: r.sr.trim(),
      praznina,
      distraktori,
      rec_id,
      samo_dopuna: r.samoDopuna === true || vanSlagalice,
    });
  }

  return { ok: true, recenice };
}
