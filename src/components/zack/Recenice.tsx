"use client";

// Tela rečeničnih igara: Slagalica (sa svojim vođenim režimom za učenje
// rečenica) i Dopuna. Ljuska je ista `Igra.tsx` - srca, napredak, odziv i
// spisak tačnih vodi isključivo sesija, pa ovde nema ničega od toga. Lokalno
// stanje je samo ono što sesija ne zna: koja je pločica gde i šta je dete
// upravo kliknulo.
//
// GLAS JE ISTI KAO U IGRI
// -----------------------
// Ime brenda samo na uspehu, greška neutralno „Ups!" i ODMAH tačan odgovor -
// oba ispisuje ljuska. Ovde se ne piše nijedna reč prekora, a u vođenom režimu
// (učenje rečenica) greške nema uopšte: pločica koja je stigla prerano se
// zatrese, vrati i mirno kaže „Ta reč ide kasnije." - i to je sve što se desi.
// Ni ta poruka ni isticanje pločice ne uzimaju crvenu: crvena je u vežbama boja
// pogrešnog odgovora, a ovde pogrešnog odgovora nema.
import { useEffect, useRef, useState } from "react";
import type { Pitanje } from "@/lib/zack/pitanja";
import { proveriSlaganje } from "@/lib/zack/recenice";

// Papir, ne gejmerski ekran. Iste vrednosti kao u `Igra.tsx`; tamo nisu
// izvezene, pa stoje i ovde, da igra izgleda kao jedna ista sveska.
const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const MASTILO = "#16161A";
const PRIGUSEN = "#6E6A5E";
const ZELENA = "#1E7A4B";
const CRVENA = "#E5342A";

/** Zajednički izgled svega što se klikće, sa vidljivim fokusom. */
const DUGME =
  "rounded-2xl outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:cursor-default";

/** Koliko pločica ostaje zatresena. Isto koliko traje i sama animacija. */
const TRESE_SE = 400;

type PitanjeSlagalice = Extract<Pitanje, { igra: "slagalica" }>;
type PitanjeDopune = Extract<Pitanje, { igra: "dopuna" }>;

/**
 * Znak na kraju rečenice stoji van pločica, pa ga dete vidi pre nego što išta
 * složi - pošten nagoveštaj da li je rečenica pitanje, uzvik ili izjava. Znak
 * je crtež (aria-hidden), pa mu uz njega ide i ime: ono što oko vidi mora i da
 * se čuje.
 */
const IME_ZNAKA: Record<string, string> = {
  ".": "tačka",
  "!": "uzvičnik",
  "?": "znak pitanja",
};

/** Prvo slovo veliko - cela rečenica se piše kako se piše, uprkos pravilu pločica. */
function velikoPrvo(s: string): string {
  return s.length === 0 ? s : s[0].toLocaleUpperCase("de") + s.slice(1);
}

/**
 * Odziv za čitač ekrana. Pločica koja se tapne nestaje iz spiska i osvane u
 * redu, pa fokus ostane bez svog dugmeta - bez ovoga dete koje sluša ne bi
 * imalo odakle da zna šta se desilo. Ovde ide SAMO tok slaganja („Do sada:
 * ..."); ono što ima šta da kaže i oku stoji u `Napomena`.
 */
function Najava({ tekst }: { tekst: string }) {
  return (
    <p aria-live="polite" className="sr-only">
      {tekst}
    </p>
  );
}

/**
 * Mirna linija ispod pločica, u vođenom slaganju.
 *
 * ONO ŠTO BOJA KAŽE MORA DA POSTOJI I KAO TEKST. Pločica koja je stigla
 * prerano se vraća, a u vođenom režimu ljuskina traka odziva stoji prazna (tu
 * se ništa ne javlja dok rečenica nije cela složena). Dok je poruka išla samo u
 * skriveni deo za čitač ekrana, detetu koje gleda ostajali su boja i pokret - a
 * uz smanjeno kretanje ni pokreta nema, pa je ostajala gola boja.
 *
 * Visina je rezervisana, kao i kod trake odziva u ljusci, da ekran ne poskoči
 * kad se poruka pojavi i dete ne promaši pločicu koja je odskočila.
 */
function Napomena({ tekst }: { tekst: string }) {
  return (
    <p
      aria-live="polite"
      className="mt-3 flex min-h-[1.75rem] items-center justify-center text-center text-[15px] leading-snug"
      style={{ color: PRIGUSEN }}
    >
      {tekst}
    </p>
  );
}

/**
 * Pločica u slagalici se identifikuje INDEKSOM u izmešanom nizu, ne tekstom:
 * dve iste reči („die ... die") su dve različite pločice i svaka sme u red
 * tačno jednom. Tačnost se poredi po TEKSTU (`proveriSlaganje`), pa su
 * duplikati ravnopravni i dete nikad nije kažnjeno što je uzelo „pogrešnu" od
 * dve iste pločice.
 */
export function Slagalica({
  pitanje,
  vodjeno,
  zakljucano,
  naOdgovor,
  naVodjenoSlozena,
}: {
  pitanje: PitanjeSlagalice;
  /** Učenje rečenica: prvo se pokaže cela rečenica, greška vraća pločicu. */
  vodjeno: boolean;
  zakljucano: boolean;
  /** Vežba: jedan odgovor po rečenici, standardni tok ljuske. */
  naOdgovor: (tacno: boolean, tacanTekst: string, pitanje: Pitanje) => void;
  /** Učenje: rečenica složena (uvek tačno, bez ijedne kazne usput). */
  naVodjenoSlozena?: (pitanje: Pitanje) => void;
}) {
  // Faza vođenog režima: prvo gledanje, pa slaganje. U vežbi se gledanje
  // preskače - tamo se rečenica ne pokazuje, nego zna.
  const [gleda, setGleda] = useState(vodjeno);
  /** Indeksi pločica u redu za slaganje, redom kojim ih je dete stavilo. */
  const [uRedu, setURedu] = useState<number[]>([]);
  /** Pločica koja se upravo zatresla (pogrešan pokušaj u vođenom režimu). */
  const [tresem, setTresem] = useState<number | null>(null);
  const [odgovoreno, setOdgovoreno] = useState(false);
  const [najava, setNajava] = useState("");
  /** Vidljiva mirna poruka o pločici koja je stigla prerano. */
  const [napomena, setNapomena] = useState("");
  /** Da li je složena rečenica tačna. `null` dok se ne odgovori. */
  const [slozenoTacno, setSlozenoTacno] = useState<boolean | null>(null);

  // Odgovor se šalje TAČNO jednom. Stanje `odgovoreno` stiže tek u sledećem
  // renderu, pa dva brza tapa po „Proveri" prođu kroz istu proveru - kao dvaput
  // otvorena kesica u ekranu lekcije.
  const poslato = useRef(false);

  const tajmer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (tajmer.current) clearTimeout(tajmer.current);
    },
    []
  );

  const cela = `${velikoPrvo(pitanje.tacan.join(" "))}${pitanje.znak}`;
  const imeZnaka = IME_ZNAKA[pitanje.znak[0]] ?? "";

  if (gleda) {
    return (
      <div>
        <div
          className="rounded-2xl border px-5 py-7 text-center"
          style={{ background: PAPIR, borderColor: IVICA }}
        >
          <p
            className="font-heading text-[12px] font-bold uppercase tracking-[.18em]"
            style={{ color: PRIGUSEN }}
          >
            Pogledaj i zapamti
          </p>
          <p
            lang="de"
            className="font-heading mt-2 text-[26px] font-bold leading-tight [overflow-wrap:anywhere]"
            style={{ color: MASTILO }}
          >
            {cela}
          </p>
          <p className="mt-2 text-[16px] leading-snug" style={{ color: PRIGUSEN }}>
            {pitanje.prevod}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setGleda(false)}
          className={`${DUGME} font-heading mt-4 block min-h-[60px] w-full text-[19px] font-bold motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
          style={{ background: MASTILO, color: "#FFFFFF" }}
        >
          Složi je
        </button>
      </div>
    );
  }

  const slobodne = pitanje.plocice.map((_, i) => i).filter((i) => !uRedu.includes(i));
  const sveSlozeno = uRedu.length === pitanje.plocice.length;

  const doSada = (spisak: readonly number[]) =>
    spisak.length === 0
      ? "Red je prazan."
      : `Do sada: ${spisak.map((i) => pitanje.plocice[i]).join(" ")}`;

  const tapniSlobodnu = (i: number) => {
    if (zakljucano || odgovoreno || poslato.current) return;

    if (vodjeno) {
      // Vođeni režim: pločica mora da bude sledeća tačna. Poredi se tekst bez
      // velikog slova, pa su i ovde dve iste pločice ravnopravne. Pogrešna se
      // zatrese i vrati - bez srca, bez upisa greške, bez ijedne reči prekora.
      const ocekivana = pitanje.tacan[uRedu.length]?.toLocaleLowerCase("de");
      if (ocekivana !== undefined && pitanje.plocice[i].toLocaleLowerCase("de") !== ocekivana) {
        setTresem(i);
        // Tresenje je pokret, a pokret se ne čuje i uz smanjeno kretanje se ni
        // ne dešava. Zato ista poruka ide i kao VIDLJIV tekst - mirno, kao
        // uputstvo, ne kao ocena.
        setNapomena("Ta reč ide kasnije.");
        if (tajmer.current) clearTimeout(tajmer.current);
        tajmer.current = setTimeout(() => setTresem(null), TRESE_SE);
        return;
      }
    }

    const novi = [...uRedu, i];
    setURedu(novi);
    setNajava(doSada(novi));
    // Pločica je legla, pa poruka o prethodnoj više nema šta da kaže. Bez ovog
    // brisanja bi ista rečenica ostala da visi i posle uspeha, a čitač ekrana
    // ne bi ponovio poruku kad sledeća pločica opet stigne prerano.
    setNapomena("");

    if (vodjeno && novi.length === pitanje.plocice.length) {
      poslato.current = true;
      setOdgovoreno(true);
      setSlozenoTacno(true);
      naVodjenoSlozena?.(pitanje);
    }
  };

  const vratiIzReda = (i: number) => {
    // U vođenom režimu se složeno ne vraća: tu je svaka pločica već proverena,
    // pa bi vraćanje značilo da dete rasklapa ono što je upravo naučilo.
    if (zakljucano || odgovoreno || vodjeno) return;
    const novi = uRedu.filter((x) => x !== i);
    setURedu(novi);
    setNajava(doSada(novi));
  };

  const proveri = () => {
    if (zakljucano || odgovoreno || poslato.current || !sveSlozeno) return;
    poslato.current = true;
    setOdgovoreno(true);
    const slozeno = uRedu.map((i) => pitanje.plocice[i]);
    const jeTacno = proveriSlaganje(slozeno, pitanje.tacan);
    setSlozenoTacno(jeTacno);
    // Tačan tekst za „Ups!" je CELA tačna rečenica: greška se ne prebacuje,
    // nego se odmah pokaže kako rečenica glasi.
    naOdgovor(jeTacno, cela, pitanje);
  };

  return (
    <div>
      <Najava tekst={najava} />

      <div
        className="rounded-2xl border px-5 py-5 text-center"
        style={{ background: PAPIR, borderColor: IVICA }}
      >
        <p
          className="font-heading text-[12px] font-bold uppercase tracking-[.18em]"
          style={{ color: PRIGUSEN }}
        >
          {/* Bez glagola u prošlom vremenu i bez oslovljavanja po rodu: isti
              nadnaslov važi i u vežbi i u učenju. */}
          Složi rečenicu
        </p>
        {/* Prevod je jedino mesto na kom piše šta rečenica znači, pa stoji i u
            vežbi: slagalica pita RED REČI, ne značenje. */}
        <p className="mt-1 text-[15px] leading-snug" style={{ color: PRIGUSEN }}>
          {pitanje.prevod}
        </p>

        {/* Red za slaganje: složene pločice i znak koji ih čeka na kraju. */}
        <div
          role="group"
          aria-label="Rečenica koju slažeš"
          lang="de"
          className="mt-3 flex min-h-[52px] flex-wrap items-center justify-center gap-2"
        >
          {uRedu.map((i) => {
            const tekst = pitanje.plocice[i];
            const stil = { background: "#E4F0E9", borderColor: ZELENA, color: MASTILO };
            return vodjeno ? (
              <span
                key={i}
                className="font-heading rounded-2xl border-2 px-3 py-2 text-[19px] font-bold"
                style={stil}
              >
                {tekst}
              </span>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => vratiIzReda(i)}
                disabled={zakljucano || odgovoreno}
                aria-label={`Vrati reč ${tekst}`}
                className={`${DUGME} font-heading border-2 px-3 py-2 text-[19px] font-bold`}
                style={stil}
              >
                {tekst}
              </button>
            );
          })}
          {imeZnaka !== "" && (
            <span className="sr-only" lang="sr">{`Na kraju stoji ${imeZnaka}.`}</span>
          )}
          <span
            aria-hidden="true"
            className="font-heading text-[22px] font-bold"
            style={{ color: PRIGUSEN }}
          >
            {pitanje.znak}
          </span>
        </div>

        {/* Tačno složena rečenica se pokaže onako kako se PIŠE: veliko početno
            slovo i završni znak. Pločice namerno idu malim slovom da ne odaju
            rešenje, pa je ispravan zapis do sada postojao samo uz „Ups!" - put
            nagrade je bio jedini na kom dete nikad ne vidi ispravan nemački.
            Kad odgovor nije tačan, ovde se ne crta ništa: tačnu rečenicu tada
            već ispisuje traka odziva u ljusci, a zeleni tekst ispod pogrešno
            složenog reda bi tvrdio da je taj red tačan. */}
        {slozenoTacno === true && (
          <p
            lang="de"
            className="font-heading mt-3 text-[20px] font-bold leading-snug [overflow-wrap:anywhere]"
            style={{ color: ZELENA }}
          >
            {cela}
          </p>
        )}
      </div>

      <ul
        lang="de"
        aria-label="Reči za slaganje"
        className="mt-4 flex flex-wrap justify-center gap-2.5"
      >
        {slobodne.map((i) => {
          const tekst = pitanje.plocice[i];
          const trese = tresem === i;
          return (
            // Klasa `zack-tresi` je definisana u rasporedu /zack, unutar
            // no-preference: uz smanjeno kretanje se pločica ne pomeri, ali
            // svejedno ostane u spisku i boja se svejedno promeni.
            <li key={i} className={trese ? "zack-tresi" : undefined}>
              <button
                type="button"
                onClick={() => tapniSlobodnu(i)}
                disabled={zakljucano || odgovoreno}
                aria-label={`Dodaj reč ${tekst}`}
                className={`${DUGME} font-heading min-h-[56px] border-2 px-4 py-3 text-[19px] font-bold motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.97]`}
                // Vraćena pločica se NAMERNO ne boji crveno. Rozikasta podloga
                // i crvena ivica su u vežbama boja pogrešnog odgovora, a ovde
                // je faza u kojoj greške nema: pločica koja je stigla prerano
                // nije promašaj nego reč koja još nije na redu. Crvena bi na
                // tom mestu bila presuda tamo gde presude nema. Zato neutralno
                // isticanje - ivica u boji mastila - a šta se desilo kaže
                // rečenica ispod pločica.
                style={{
                  background: PAPIR,
                  borderColor: trese ? MASTILO : IVICA,
                  color: MASTILO,
                }}
              >
                {tekst}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Samo u vođenom režimu: tamo je ovo jedino mesto na kom se vidi zašto
          se pločica vratila. U vežbi se pločice ne odbijaju, pa bi prazna linija
          bila samo rupa u rasporedu. */}
      {vodjeno && <Napomena tekst={napomena} />}

      {/* Vođeni režim nema „Proveri": tamo je svaka pločica već proverena pri
          tapu, pa se rečenica završi sama kad poslednja legne na svoje mesto. */}
      {!vodjeno && (
        <button
          type="button"
          onClick={proveri}
          disabled={zakljucano || odgovoreno || !sveSlozeno}
          className={`${DUGME} font-heading mt-4 block min-h-[60px] w-full text-[19px] font-bold disabled:opacity-45 motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
          style={{ background: MASTILO, color: "#FFFFFF" }}
        >
          Proveri
        </button>
      )}
    </div>
  );
}

/**
 * Dopuna je po toku isto što i brzo biranje: jedno pitanje, jedan odgovor,
 * posle odgovora se tačan UVEK oboji - i kad dete nije njega izabralo. To je
 * ono „odmah daje tačan odgovor" u praksi.
 */
export function Dopuna({
  pitanje,
  zakljucano,
  naOdgovor,
}: {
  pitanje: PitanjeDopune;
  zakljucano: boolean;
  naOdgovor: (tacno: boolean, tacanTekst: string, pitanje: Pitanje) => void;
}) {
  const [izabrano, setIzabrano] = useState<string | null>(null);

  return (
    <div>
      <div
        className="rounded-2xl border px-5 py-7 text-center"
        style={{ background: PAPIR, borderColor: IVICA }}
      >
        <p
          className="font-heading text-[12px] font-bold uppercase tracking-[.18em]"
          style={{ color: PRIGUSEN }}
        >
          Šta ide u prazninu
        </p>
        <p
          lang="de"
          className="font-heading mt-2 text-[24px] font-bold leading-snug [overflow-wrap:anywhere]"
          style={{ color: MASTILO }}
        >
          {pitanje.saPrazninom}
        </p>
        {/* Prevod je pomoć, ne pitanje: bez njega se oblik pogađa, sa njim se
            bira. */}
        <p className="mt-2 text-[15px] leading-snug" style={{ color: PRIGUSEN }}>
          {pitanje.prevod}
        </p>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-2.5">
        {pitanje.opcije.map((opcija) => {
          const jeTacna = opcija === pitanje.tacan;
          const jeIzabrana = opcija === izabrano;
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
                lang="de"
                // Jedan odgovor po pitanju: posle prvog izbora se ostalo ne
                // dira, kao i u brzom biranju.
                disabled={zakljucano || izabrano !== null}
                onClick={() => {
                  if (izabrano !== null) return;
                  setIzabrano(opcija);
                  naOdgovor(jeTacna, pitanje.tacan, pitanje);
                }}
                className={`${DUGME} font-heading block min-h-[60px] w-full border-2 px-4 py-3.5 text-center text-[19px] font-bold leading-snug [overflow-wrap:anywhere] motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
                style={stil}
              >
                {opcija}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
