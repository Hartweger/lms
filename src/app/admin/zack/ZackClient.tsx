"use client";

import { useMemo, useState } from "react";

// Ekran kroz koji Nataša unosi jednu lekciju zack-a. Reči se ne kucaju jedna po
// jedna, nego se nalepe iz tabele, jedan red po reči, kolone razdvojene
// tabulatorom.
//
// ZAŠTO OVAJ EKRAN NIJE SAMO OBRAZAC
// ----------------------------------
// Reč se unutar lekcije prepoznaje po nemačkom obliku. Ispravka prevoda, roda,
// množine ili redosleda ne dira sličice koje su deca sakupila, ali ispravka
// samog nemačkog oblika jeste brisanje: „Hund" ispravljen u „der Hund" je po
// ključu nova reč, a stara nestaje zajedno sa sličicama SVE dece. To ne može
// drugačije, jer nešto mora biti ključ, ali ne sme da prođe neprimetno. Zato
// odgovor sa `obrisanoReci > 0` ovde dobija crveni blok preko cele širine, a ne
// rečenicu u sivom tekstu.
//
// Iz istog razloga se ni razbijanje nalepljenog spiska ne oslanja na tiho
// preskakanje. Red koji ne izgleda kako treba zaustavlja čuvanje i kaže šta mu
// fali, umesto da se pretvori u nešto približno tačno.

interface Udzbenik {
  id: string;
  izdavac: string;
  naziv: string;
  razred: number;
}

interface Props {
  udzbenici: Udzbenik[];
}

type Rod = "der" | "die" | "das" | "nema";

type Red = {
  de: string;
  sr: string;
  rod: Rod;
  mnozina: string;
  izuzetak: boolean;
};

type Problem = { broj: number; poruka: string };

type Pregled = {
  redovi: Red[];
  problemi: Problem[];
  /** Spisak ima sadržaja, ali nigde nema tabulatora. Skoro uvek pogrešno lepljenje. */
  bezTabulatora: boolean;
};

const RODOVI: readonly string[] = ["der", "die", "das"];
/** Prazna kolona roda. Sve ostalo što nije rod je greška, ne prećutno „nema". */
const PRAZAN_ROD: readonly string[] = ["", "-", "/", "nema"];
const IZUZETAK_DA: readonly string[] = ["da", "x", "+"];
const IZUZETAK_NE: readonly string[] = ["", "ne", "-", "/"];

const UPUTSTVO = `nemački → naš → der/die/das → množina → izuzetak (upiši „da")`;

/** Koliko se pokvarenih redova ispisuje pojedinačno pre nego što se sabiju u broj. */
const PRIKAZANIH_PROBLEMA = 12;

function parsirajSpisak(tekst: string): Pregled {
  const redovi: Red[] = [];
  const problemi: Problem[] = [];
  const videno = new Map<string, number>();
  let imaSadrzaja = false;
  let imaTabulatora = false;

  const linije = tekst.split(/\r?\n/);

  for (let i = 0; i < linije.length; i++) {
    const linija = linije[i];
    const broj = i + 1;

    // Prazan red je stvarno prazan red, ne greška.
    if (linija.trim() === "") continue;
    imaSadrzaja = true;
    if (linija.includes("\t")) imaTabulatora = true;

    const d = linija.split("\t").map((x) => x.trim());
    const de = d[0] ?? "";
    const sr = d[1] ?? "";

    if (!de || !sr) {
      problemi.push({
        broj,
        poruka: de
          ? `„${de}" nema prevod. Kolone se razdvajaju tabulatorom, ne razmakom.`
          : "red nema nemačku reč",
      });
      continue;
    }

    const vecViden = videno.get(de);
    if (vecViden !== undefined) {
      problemi.push({
        broj,
        poruka: `nemačka reč „${de}" već stoji u redu ${vecViden}. Ista reč ne sme dvaput u istoj lekciji.`,
      });
      continue;
    }

    // Rod se poredi malim slovima, pa „Der" iz tabele prolazi kao „der". Ali
    // ono što se ni tako ne prepozna NE pada tiho na „nema", jer bi imenica bez
    // roda izgledala kao uspešan unos, a bila bi pokvarena.
    const rodSirov = (d[2] ?? "").toLowerCase();
    let rod: Rod = "nema";
    if (RODOVI.includes(rodSirov)) {
      rod = rodSirov as Rod;
    } else if (!PRAZAN_ROD.includes(rodSirov)) {
      problemi.push({
        broj,
        poruka: `u koloni roda piše „${d[2]}". Dozvoljeno je der, die, das ili prazno. Proveri da ti kolone nisu pomerene.`,
      });
      continue;
    }

    const izuzetakSirov = (d[4] ?? "").toLowerCase();
    let izuzetak = false;
    if (IZUZETAK_DA.includes(izuzetakSirov)) {
      izuzetak = true;
    } else if (!IZUZETAK_NE.includes(izuzetakSirov)) {
      problemi.push({
        broj,
        poruka: `u koloni izuzetka piše „${d[4]}". Upiši „da" ili ostavi prazno.`,
      });
      continue;
    }

    // Šesta kolona i dalje. Ako tu nešto stoji, kolone su skoro sigurno
    // pomerene, pa i sve pročitano levo od toga može biti pogrešno.
    if (d.slice(5).some((x) => x !== "")) {
      problemi.push({
        broj,
        poruka: "red ima više od pet kolona. Proveri da ti kolone nisu pomerene.",
      });
      continue;
    }

    videno.set(de, broj);
    redovi.push({ de, sr, rod, mnozina: d[3] ?? "", izuzetak });
  }

  return { redovi, problemi, bezTabulatora: imaSadrzaja && !imaTabulatora };
}

function reciOblik(n: number): string {
  return n === 1 ? "reč" : "reči";
}

export default function ZackClient({ udzbenici }: Props) {
  const [udzbenikId, setUdzbenikId] = useState<string>(udzbenici[0]?.id ?? "");
  const [broj, setBroj] = useState("1");
  const [naziv, setNaziv] = useState("");
  const [praviloNaslov, setPraviloNaslov] = useState("");
  const [praviloTekst, setPraviloTekst] = useState("");
  const [praviloPrimer, setPraviloPrimer] = useState("");
  const [tekst, setTekst] = useState("");

  const [cuvanje, setCuvanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [rezultat, setRezultat] = useState<
    { upisanoReci: number; obrisanoReci: number } | null
  >(null);

  const pregled = useMemo(() => parsirajSpisak(tekst), [tekst]);
  const izuzetaka = pregled.redovi.filter((r) => r.izuzetak).length;

  const brojLekcije = Number(broj);
  const brojOk =
    broj.trim() !== "" &&
    Number.isInteger(brojLekcije) &&
    brojLekcije >= 1 &&
    brojLekcije <= 32767;

  const mozeDaSacuva =
    !cuvanje &&
    udzbenikId !== "" &&
    naziv.trim() !== "" &&
    brojOk &&
    pregled.redovi.length > 0 &&
    pregled.problemi.length === 0 &&
    !pregled.bezTabulatora;

  async function sacuvaj() {
    setCuvanje(true);
    setGreska(null);
    setRezultat(null);
    try {
      // Polja pravila se šalju samo ako su popunjena. Ruta prazno polje upisuje
      // kao null, pa bi ponovni unos spiska reči bez prekucanog pravila obrisao
      // pravilo koje već stoji u bazi.
      const telo: Record<string, unknown> = {
        udzbenikId,
        broj: brojLekcije,
        naziv: naziv.trim(),
        reci: pregled.redovi.map((r) => ({
          de: r.de,
          sr: r.sr,
          rod: r.rod,
          mnozina: r.mnozina.trim() === "" ? null : r.mnozina.trim(),
          vrsta: r.rod === "nema" ? "ostalo" : "imenica",
          izuzetak: r.izuzetak,
        })),
      };
      if (praviloNaslov.trim() !== "") telo.praviloNaslov = praviloNaslov.trim();
      if (praviloTekst.trim() !== "") telo.praviloTekst = praviloTekst.trim();
      if (praviloPrimer.trim() !== "") telo.praviloPrimer = praviloPrimer.trim();

      const res = await fetch("/api/admin/zack/lekcija", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telo),
      });
      const podaci: unknown = await res.json().catch(() => null);
      const odgovor =
        typeof podaci === "object" && podaci !== null
          ? (podaci as Record<string, unknown>)
          : {};

      if (!res.ok) {
        setGreska(
          typeof odgovor.error === "string"
            ? odgovor.error
            : `Lekcija nije upisana (greška ${res.status}).`
        );
        return;
      }

      setRezultat({
        upisanoReci:
          typeof odgovor.upisanoReci === "number" ? odgovor.upisanoReci : 0,
        obrisanoReci:
          typeof odgovor.obrisanoReci === "number" ? odgovor.obrisanoReci : 0,
      });
    } catch {
      setGreska("Lekcija nije upisana, veza sa serverom je pukla.");
    } finally {
      setCuvanje(false);
    }
  }

  const poljeKlase =
    "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B54C9]";
  const labelaKlase = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#16161A] mb-6">
        zack! Unos lekcije
      </h1>

      {udzbenici.length === 0 && (
        <p className="mb-6 rounded-lg bg-[#FFC400]/20 p-4 text-sm text-[#16161A]">
          Nema nijednog udžbenika u bazi. Prvo dodaj udžbenik, pa se vrati ovde.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="sm:col-span-3">
          <label className={labelaKlase} htmlFor="zack-udzbenik">
            Udžbenik
          </label>
          <select
            id="zack-udzbenik"
            value={udzbenikId}
            onChange={(e) => setUdzbenikId(e.target.value)}
            className={poljeKlase}
          >
            <option value="">Izaberi udžbenik</option>
            {udzbenici.map((u) => (
              <option key={u.id} value={u.id}>
                {`${u.razred}. razred - ${u.izdavac} ${u.naziv}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelaKlase} htmlFor="zack-broj">
            Broj lekcije
          </label>
          <input
            id="zack-broj"
            type="number"
            min={1}
            max={32767}
            value={broj}
            onChange={(e) => setBroj(e.target.value)}
            className={poljeKlase}
          />
          {!brojOk && (
            <p className="mt-1 text-xs text-[#E5342A]">
              Broj lekcije mora biti ceo broj od 1 do 32767.
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className={labelaKlase} htmlFor="zack-naziv">
            Naziv lekcije
          </label>
          <input
            id="zack-naziv"
            type="text"
            value={naziv}
            onChange={(e) => setNaziv(e.target.value)}
            placeholder="npr. Meine Familie"
            className={poljeKlase}
          />
        </div>
      </div>

      <fieldset className="mb-4 rounded-xl border border-gray-200 p-4">
        <legend className="px-2 text-sm font-semibold text-[#16161A]">
          Podsetnik (opciono)
        </legend>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className={labelaKlase} htmlFor="zack-pravilo-naslov">
              Naslov pravila
            </label>
            <input
              id="zack-pravilo-naslov"
              type="text"
              value={praviloNaslov}
              onChange={(e) => setPraviloNaslov(e.target.value)}
              className={poljeKlase}
            />
          </div>
          <div>
            <label className={labelaKlase} htmlFor="zack-pravilo-tekst">
              Tekst pravila
            </label>
            <textarea
              id="zack-pravilo-tekst"
              rows={3}
              value={praviloTekst}
              onChange={(e) => setPraviloTekst(e.target.value)}
              className={poljeKlase}
            />
          </div>
          <div>
            <label className={labelaKlase} htmlFor="zack-pravilo-primer">
              Primer
            </label>
            <input
              id="zack-pravilo-primer"
              type="text"
              value={praviloPrimer}
              onChange={(e) => setPraviloPrimer(e.target.value)}
              className={poljeKlase}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Prazno polje se ne šalje, pa ostaje ono što već stoji u lekciji.
        </p>
      </fieldset>

      <div className="mb-4">
        <label className={labelaKlase} htmlFor="zack-reci">
          Reči, nalepi iz tabele
        </label>
        <p className="mb-2 text-xs text-gray-600">
          {`Jedan red po reči, kolone razdvojene tabulatorom: ${UPUTSTVO}`}
        </p>
        <textarea
          id="zack-reci"
          rows={14}
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          spellCheck={false}
          placeholder={"der Hund\tpas\tder\tdie Hunde\nlaufen\ttrčati"}
          className={`${poljeKlase} font-mono`}
        />
      </div>

      {/* Živi pregled */}
      <div className="mb-4 rounded-xl bg-gray-50 p-4">
        {pregled.bezTabulatora ? (
          <p className="text-sm font-semibold text-[#E5342A]">
            Nijedan red nema tabulator, pa nijedna reč nije prepoznata. Kolone
            moraju biti razdvojene tabulatorom, ne razmacima. Ako lepiš iz
            Excela ili Google tabele, označi ćelije u tabeli i nalepi ih
            direktno.
          </p>
        ) : (
          <p className="text-sm text-[#16161A]">
            {`Prepoznato ${pregled.redovi.length} ${reciOblik(
              pregled.redovi.length
            )}, od toga ${izuzetaka} ${izuzetaka === 1 ? "izuzetak" : "izuzetaka"}.`}
          </p>
        )}

        {/* Kad nijedan red nema tabulator, svaki red je „problem", pa bi spisak
            bio dugačak koliko i lekcija. Objašnjenje iznad je već tačno. */}
        {!pregled.bezTabulatora && pregled.problemi.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-semibold text-[#E5342A]">
              {`${pregled.problemi.length} ${
                pregled.problemi.length === 1 ? "red se ne čita" : "reda se ne čita"
              }, popravi ih pa sačuvaj:`}
            </p>
            <ul className="mt-1 space-y-1">
              {pregled.problemi.slice(0, PRIKAZANIH_PROBLEMA).map((p) => (
                <li key={p.broj} className="text-sm text-[#E5342A]">
                  {`Red ${p.broj}: ${p.poruka}`}
                </li>
              ))}
            </ul>
            {pregled.problemi.length > PRIKAZANIH_PROBLEMA && (
              <p className="mt-1 text-sm text-[#E5342A]">
                {`... i još ${pregled.problemi.length - PRIKAZANIH_PROBLEMA}.`}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={sacuvaj}
        disabled={!mozeDaSacuva}
        className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#0B54C9] text-white hover:bg-[#093f97] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {cuvanje ? "Čuvanje..." : "Sačuvaj lekciju"}
      </button>

      {greska && (
        <p className="mt-4 rounded-lg border border-[#E5342A] bg-[#E5342A]/10 p-3 text-sm font-medium text-[#E5342A]">
          {greska}
        </p>
      )}

      {rezultat &&
        (rezultat.obrisanoReci > 0 ? (
          // Ovo mora da se vidi sa drugog kraja sobe. Ako promakne, Nataša neće
          // primetiti da je kucaćom greškom obrisala deci pola albuma.
          <div className="mt-4 rounded-xl border-4 border-[#E5342A] bg-[#E5342A]/10 p-6">
            <p className="text-2xl sm:text-3xl font-extrabold leading-snug text-[#E5342A]">
              {`Obrisano je ${rezultat.obrisanoReci} ${reciOblik(
                rezultat.obrisanoReci
              )} i sve sličice koje su deca imala za njih.`}
            </p>
            <p className="mt-3 text-base text-[#16161A]">
              {`Upisano ${rezultat.upisanoReci} ${reciOblik(
                rezultat.upisanoReci
              )}. Reč se prepoznaje po nemačkom obliku, pa i najmanja ispravka tog oblika briše staru reč. Ako ovo nisi htela, proveri da nisi promenila nemačku reč nekoj od starih reči.`}
            </p>
            <p className="mt-2 text-base font-semibold text-[#16161A]">
              Sličice koje su deca imala za obrisane reči ne mogu da se vrate ni
              ako ponovo upišeš isti spisak.
            </p>
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-[#0B54C9] bg-[#0B54C9]/10 p-4 text-base font-medium text-[#16161A]">
            {`Upisano ${rezultat.upisanoReci} ${reciOblik(
              rezultat.upisanoReci
            )}. Nijedna reč nije obrisana.`}
          </p>
        ))}
    </div>
  );
}
