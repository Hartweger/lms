"use client";

// Faza učenja reči: kartice u malim grupama, posle svake grupe kratka provera.
//
// ŠTA OVDE NAMERNO NEMA
// ---------------------
// Nema srca, nema kazne i nema upisa grešaka. Ovo je jedino mesto gde dete reč
// vidi PRVI put, pa promašaj ovde nije podatak nego korak u učenju: zato se ka
// /api/zack/<childId>/greska ne šalje ništa, iako igra to radi. Pogrešan
// odgovor mirno otkrije tačan i ide dalje - bez „pokušaj ponovo", bez drugog
// pokušaja i bez ijedne reči prekora.
//
// ZARAĐENO SE ŠALJE ODMAH, PA SE NA KRAJU ŠALJE JOŠ JEDNOM
// --------------------------------------------------------
// Ista disciplina kao u `Igra.tsx`: posle svakog tačnog odgovora u proveri ide
// poziv ka /api/zack/<childId>/zaradi, u pozadini, sa keepalive, i njegov pad
// se guta. Dete koje zatvori karticu nasred učenja ne sme ništa da izgubi.
//
// Ali poziv u pozadini sme da padne u tišini, pa on sam NIJE dokaz da je reč
// stigla. Zato ceo spisak tačnih na kraju ide roditelju kroz `onKraj`, koji ga
// šalje ponovo i ovog puta ČEKA odgovor. Ruta je idempotentna, pa ponovljeno
// slanje ne može ništa da pokvari ni da duplira.
//
// Iz istog razloga izlaz („Dosta za sad") stoji OVDE, a ne u ekranu lekcije:
// samo ovde se zna šta je dete do tog trenutka zaradilo. Izlaz koji bi ekran
// lekcije sam odradio ne bi imao šta da ponovo pošalje.
import { useEffect, useRef, useState } from "react";
import type { Pitanje } from "@/lib/zack/pitanja";
import { BOJA_MNOZINA, bojaZaRod, type Rec } from "@/lib/zack/rec";
import { miniProvera, napraviGrupe } from "@/lib/zack/ucenje";

// Papir, ne gejmerski ekran. Iste vrednosti kao u `Igra.tsx`; tamo nisu
// izvezene, pa stoje i ovde, da učenje i igra izgledaju kao ista sveska.
const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const MASTILO = "#16161A";
const PRIGUSEN = "#6E6A5E";
const ZELENA = "#1E7A4B";
const CRVENA = "#E5342A";

/** Koliko odziv stoji na ekranu. Greška duže, jer se uz nju čita i tačan odgovor. */
const ZADRZI_TACNO = 850;
const ZADRZI_GRESKU = 1900;

/** Zajednički izgled svega što se klikće, sa vidljivim fokusom. */
const DUGME =
  "rounded-2xl outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:cursor-default";

/** Mini provera je brzo biranje u blažoj ljusci, pa i pitanja nosi njegova. */
type PitanjeBiranja = Extract<Pitanje, { igra: "brzo-biranje" }>;

type Faza = "kartice" | "provera";

type Odziv = { tacno: boolean; tekst: string };

/** Jedna grupa kartica i provera koja ide uz nju. */
type Korak = { grupa: Rec[]; pitanja: PitanjeBiranja[] };

/**
 * Nemački oblik sa članom. Član se NE lepi ako je već otkucan u samoj reči,
 * inače bi na kartici pisalo „der der Hund". Reč bez roda ostaje kakva jeste -
 * glagolu se ne izmišlja član.
 */
function saClanom(rec: Rec): string {
  if (rec.rod === "nema") return rec.de;
  const pocetak = `${rec.rod} `;
  if (rec.de.toLowerCase().startsWith(pocetak)) return rec.de;
  return `${rec.rod} ${rec.de}`;
}

function Zvezdica() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1em] w-[1em] flex-none">
      <path
        d="M12 2.5l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7 6.2 20.1l1.5-6.5-5-4.4 6.6-.6z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function UcenjeReci({
  childId,
  reci,
  onKraj,
}: {
  childId: string;
  reci: Rec[];
  /** Kraj učenja: spisak tačnih iz provera i da li je prošlo do kraja. */
  onKraj: (tacniRecIdovi: string[], prosloSve: boolean) => void;
}) {
  // Tok se pravi tek posle montiranja. `miniProvera` meša preko Math.random, pa
  // bi računanje u prvom renderu dalo drugačiji raspored odgovora na serveru
  // nego u pretraživaču i React bi prijavio neslaganje pri hidraciji. Ni
  // useMemo to ne rešava: i on se izvršava u prvom renderu, samo jednom.
  const [tok, setTok] = useState<Korak[] | null>(null);

  const [grupaIndeks, setGrupaIndeks] = useState(0);
  const [faza, setFaza] = useState<Faza>("kartice");
  const [pitanjeIndeks, setPitanjeIndeks] = useState(0);

  /** Šta je dete kliknulo na tekućem pitanju. Dok nije null, telo je zaključano. */
  const [izabrano, setIzabrano] = useState<string | null>(null);
  const [odziv, setOdziv] = useState<Odziv | null>(null);

  /**
   * Spisak zarađenog. Ref, ne stanje: njime se ništa ne crta, a mora da bude
   * tačan i u tajmeru i u izlazu, gde bi zatvoreno stanje umelo da bude staro.
   */
  const tacni = useRef<string[]>([]);

  // `reci` je novi niz pri svakom renderu roditelja, pa ne sme u zavisnosti
  // efekta - grupe bi se pravile u krug i dete nikad ne bi prešlo prvu.
  const reciRef = useRef(reci);
  useEffect(() => {
    reciRef.current = reci;
  }, [reci]);

  useEffect(() => {
    const spisak = reciRef.current;
    setTok(
      napraviGrupe(spisak).map((grupa) => ({
        grupa,
        // `miniProvera` po ugovoru daje samo pitanja brzog biranja. Filter je tu
        // da se to vidi i u tipu; `as` bi ovde bio nada, ne provera.
        pitanja: miniProvera(grupa, spisak, Math.random).filter(
          (p): p is PitanjeBiranja => p.igra === "brzo-biranje"
        ),
      }))
    );
  }, []);

  const tajmer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (tajmer.current) clearTimeout(tajmer.current);
    },
    []
  );

  // Kraj se javlja roditelju tačno jednom, ma kojim putem se stiglo do njega.
  const javljenKraj = useRef(false);
  const onKrajRef = useRef(onKraj);
  useEffect(() => {
    onKrajRef.current = onKraj;
  }, [onKraj]);

  // Lekcija bez reči nije greška ovog ekrana: poruku o praznoj lekciji ispisuje
  // ekran lekcije, pa se ovde ne crta ništa.
  if (reci.length === 0) return null;

  if (!tok) {
    return (
      <p className="py-16 text-center text-[17px]" style={{ color: PRIGUSEN }}>
        Samo trenutak...
      </p>
    );
  }

  const korak = tok[grupaIndeks];
  if (!korak) return null;

  /**
   * Slanje u toku učenja. Ide u pozadini, ne čeka se i njegov pad se namerno
   * guta, jer se učenje ne sme prekidati zbog mreže. Ono što ovde ne stigne,
   * hvata ponovno slanje na kraju (vidi `zavrsi`).
   */
  const posaljiZaradjeno = (recId: string) => {
    void fetch(`/api/zack/${childId}/zaradi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recIdovi: [recId] }),
      // Dete često zatvori karticu čim odgovori. Bez ovoga pretraživač prekine
      // poziv u letu i sličica propadne.
      keepalive: true,
    }).catch(() => {
      /* Učenje se ne prekida zbog mreže. */
    });
  };

  const zavrsi = (prosloSve: boolean) => {
    if (javljenKraj.current) return;
    javljenKraj.current = true;
    if (tajmer.current) clearTimeout(tajmer.current);
    onKrajRef.current([...tacni.current], prosloSve);
  };

  const naSledecuGrupu = () => {
    if (grupaIndeks + 1 < tok.length) {
      setGrupaIndeks(grupaIndeks + 1);
      setFaza("kartice");
      setPitanjeIndeks(0);
      return;
    }
    zavrsi(true);
  };

  const naProveru = () => {
    // Grupa bez pitanja ne sme da ostavi prazan ekran bez izlaza, pa se
    // preskače kao da je provera odrađena.
    if (korak.pitanja.length === 0) {
      naSledecuGrupu();
      return;
    }
    setFaza("provera");
    setPitanjeIndeks(0);
  };

  const naOdgovor = (pitanje: PitanjeBiranja, opcija: string) => {
    // Drugi dodir dok odziv stoji ne sme da upadne u odgovor koji je već poslat.
    if (izabrano !== null) return;
    setIzabrano(opcija);

    const tacno = opcija === pitanje.tacan;
    if (tacno) {
      // Ista reč ume da se pojavi u više provera; zarađuje se jednom.
      if (!tacni.current.includes(pitanje.recId)) tacni.current.push(pitanje.recId);
      posaljiZaradjeno(pitanje.recId);
    }
    // Ime brenda samo na uspehu. Greška nosi neutralno „Ups!" i ODMAH tačan
    // odgovor, jer je to jedini ispravak koji dete ovde dobija.
    setOdziv({ tacno, tekst: tacno ? "Zack!" : `Ups! ${pitanje.tacan}` });

    if (tajmer.current) clearTimeout(tajmer.current);
    tajmer.current = setTimeout(
      () => {
        const imaJosPitanja = pitanjeIndeks + 1 < korak.pitanja.length;
        // Posle POSLEDNJEG pitanja se ne čisti ništa: odziv i obojen tačan
        // odgovor ostaju na ekranu dok ekran lekcije ne preuzme. Čišćenje bi na
        // tren vratilo neodgovoreno pitanje, a dete bi stiglo da klikne na njega.
        if (!imaJosPitanja && grupaIndeks + 1 >= tok.length) {
          zavrsi(true);
          return;
        }
        setIzabrano(null);
        setOdziv(null);
        if (imaJosPitanja) {
          setPitanjeIndeks(pitanjeIndeks + 1);
          return;
        }
        naSledecuGrupu();
      },
      tacno ? ZADRZI_TACNO : ZADRZI_GRESKU
    );
  };

  const pitanje = korak.pitanja[pitanjeIndeks];

  const napredak =
    faza === "kartice"
      ? `Nove reči, grupa ${grupaIndeks + 1} od ${tok.length}`
      : `Brza provera ${pitanjeIndeks + 1} od ${korak.pitanja.length}`;

  return (
    <div>
      <header>
        {/* Naziv stoji ispisan, a ne uvezen iz `NAZIVI` u `Igra.tsx`: uvoz bi
            zbog jedne reči povukao celu ljusku igre u snop ovog ekrana. */}
        <h1
          className="font-heading text-[19px] font-bold leading-tight tracking-tight"
          style={{ color: MASTILO }}
        >
          Nauči reči
        </h1>
        <p className="font-heading mt-1 text-[15px] font-bold" style={{ color: PRIGUSEN }}>
          {napredak}
        </p>
      </header>

      {faza === "kartice" || !pitanje ? (
        <div className="mt-5">
          <ul className="space-y-2.5">
            {korak.grupa.map((rec) => (
              <Kartica key={rec.id} rec={rec} />
            ))}
          </ul>

          <button
            type="button"
            onClick={naProveru}
            className={`${DUGME} font-heading mt-5 block min-h-[60px] w-full text-[19px] font-bold motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
            style={{ background: MASTILO, color: "#FFFFFF" }}
          >
            Idemo na proveru
          </button>
          <Izlaz onIzlaz={() => zavrsi(false)} />
        </div>
      ) : (
        <div className="mt-5">
          <OdzivTraka odziv={odziv} />
          <Zadatak nadnaslov="Šta ovo znači" tekst={pitanje.pitanje} />
          <ul className="mt-4 space-y-2.5">
            {pitanje.opcije.map((opcija) => {
              const jeTacna = opcija === pitanje.tacan;
              const jeIzabrana = opcija === izabrano;
              // Posle odgovora se tačan UVEK oboji, i kad dete nije njega
              // izabralo. To je ono „odmah daje tačan odgovor" u praksi.
              const stil = !izabrano
                ? { background: PAPIR, borderColor: IVICA, color: MASTILO }
                : jeTacna
                  ? { background: "#E4F0E9", borderColor: ZELENA, color: MASTILO }
                  : jeIzabrana
                    ? { background: "#FBE7E5", borderColor: CRVENA, color: MASTILO }
                    : { background: PAPIR, borderColor: IVICA, color: PRIGUSEN };

              return (
                <li key={opcija}>
                  <button
                    type="button"
                    disabled={izabrano !== null}
                    onClick={() => naOdgovor(pitanje, opcija)}
                    className={`${DUGME} font-heading block min-h-[60px] w-full border-2 px-4 py-3.5 text-left text-[19px] font-bold leading-snug [overflow-wrap:anywhere] motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
                    style={stil}
                  >
                    {opcija}
                  </button>
                </li>
              );
            })}
          </ul>

          <Izlaz onIzlaz={() => zavrsi(false)} />
        </div>
      )}
    </div>
  );
}

/**
 * Izlaz iz učenja. Stoji u OBE faze, i na karticama i u proveri.
 *
 * Učenje zauzima ceo ekran, pa i link „Sve lekcije" ostaje iza njega. Dok je
 * ovog dugmeta bilo samo u proveri, dete je kroz pet ekrana kartica (lekcija od
 * 26 reči ih ima toliko) imalo jedini izlaz preko dugmeta „nazad" u
 * pretraživaču - a tim putem se kraj nikad ne javi, pa izostane i ponovno
 * slanje zarađenog i otvaranje kesice.
 *
 * Javlja kraj sa „nije prošlo do kraja", što je tačno u obe faze: sve zarađeno
 * ide sa njim, samo se učenje ne broji kao završeno.
 */
function Izlaz({ onIzlaz }: { onIzlaz: () => void }) {
  return (
    <button
      type="button"
      onClick={onIzlaz}
      className={`${DUGME} font-heading mt-6 block min-h-[52px] w-full border-2 text-[17px] font-bold`}
      style={{ background: "transparent", borderColor: IVICA, color: PRIGUSEN }}
    >
      Dosta za sad
    </button>
  );
}

/**
 * Odziv mora da stigne i do čitača ekrana, ne samo do oka: zelena i crvena su
 * boje, a boja se ne čita. Traka stoji uvek, i kad je prazna, da se ekran ne
 * pomera kad poruka iskoči - dete bi promašilo dugme koje je skočilo.
 */
function OdzivTraka({ odziv }: { odziv: Odziv | null }) {
  return (
    <p
      aria-live="assertive"
      className="font-heading flex min-h-[2.75rem] items-center justify-center rounded-xl px-4 text-center text-[19px] font-bold leading-snug"
      style={{
        background: odziv ? (odziv.tacno ? "#E4F0E9" : "#FBE7E5") : "transparent",
        color: odziv ? (odziv.tacno ? ZELENA : MASTILO) : "transparent",
      }}
    >
      {odziv ? odziv.tekst : ""}
    </p>
  );
}

/** Reč o kojoj se pita. Isti okvir kao u igri, da provera ne deluje kao drugi svet. */
function Zadatak({ tekst, nadnaslov }: { tekst: string; nadnaslov: string }) {
  return (
    <div
      className="mt-4 rounded-2xl border px-5 py-7 text-center"
      style={{ background: PAPIR, borderColor: IVICA }}
    >
      <p
        className="font-heading text-[12px] font-bold uppercase tracking-[.18em]"
        style={{ color: PRIGUSEN }}
      >
        {nadnaslov}
      </p>
      <p
        lang="de"
        className="font-heading mt-2 text-[30px] font-bold leading-tight tracking-tight [overflow-wrap:anywhere]"
        style={{ color: MASTILO }}
      >
        {tekst}
      </p>
    </div>
  );
}

/**
 * Jedna reč na kartici. Traka gore nosi boju roda - istu učioničku konvenciju
 * kao sličica u albumu, da dete istu reč posle prepozna po boji. Boja ništa ne
 * nosi sama: član stoji ispisan uz nemačku reč, pa čitač ekrana čuje ono što
 * oko vidi.
 */
function Kartica({ rec }: { rec: Rec }) {
  // Reč bez roda NE dobija boju roda: `bojaZaRod` za „nema" vraća mastilo, a
  // crna traka pored plave, crvene i zelene izgleda kao četvrti član. Ivica
  // papira ne tvrdi ništa.
  const traka = rec.rod === "nema" ? IVICA : bojaZaRod(rec.rod);

  return (
    <li
      className="overflow-hidden rounded-2xl border"
      style={{ background: PAPIR, borderColor: IVICA }}
    >
      <span aria-hidden="true" className="block h-2.5 w-full" style={{ background: traka }} />
      <div className="px-4 py-3.5">
        <p
          lang="de"
          className="font-heading text-[22px] font-bold leading-tight [overflow-wrap:anywhere]"
          style={{ color: MASTILO }}
        >
          {saClanom(rec)}
        </p>
        {/* Prevod se ne seče: on je jedino mesto gde piše šta reč znači. */}
        <p className="mt-1 text-[17px] leading-snug break-words" style={{ color: PRIGUSEN }}>
          {rec.sr}
        </p>

        {(rec.mnozina || rec.izuzetak) && (
          <p className="mt-2.5 flex flex-wrap items-center gap-2">
            {rec.mnozina && (
              // Žuta u učioničkoj konvenciji znači MNOŽINU, ali boja se ne čita,
              // pa reč „množina" stoji ispisana uz oblik.
              <span
                className="font-heading inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[14px] font-bold"
                style={{ background: BOJA_MNOZINA, color: MASTILO }}
              >
                <span>množina</span>
                <span lang="de">{rec.mnozina}</span>
              </span>
            )}
            {rec.izuzetak && (
              // Izuzetak se ovde samo mirno označava. Sjaj i zvezdice sa punom
              // nagradnom težinom pripadaju sličici u albumu; ovde je reč tek u
              // učenju i oznaka ne sme da odvuče pažnju sa same reči.
              <span
                className="font-heading inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[14px] font-bold"
                style={{ borderColor: IVICA, color: PRIGUSEN }}
              >
                <Zvezdica />
                izuzetak
              </span>
            )}
          </p>
        )}
      </div>
    </li>
  );
}
