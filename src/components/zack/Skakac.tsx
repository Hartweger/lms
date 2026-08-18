"use client";

// Der-Die-Das skakač: telo igre u kojoj se rod ne bira sa spiska, nego se skače
// na platformu. Ljuska (`Igra.tsx`) i dalje vodi srca, napredak, odziv, slanje
// zarađenog i izlaz - ovde je samo ono što se crta i kreće.
//
// ZAŠTO NIJE CANVAS
// -----------------
// Canvas bi bio glatkiji, ali platforme moraju da budu prava dugmad: sa
// vidljivim fokusom, dohvatljiva tastaturom i sa imenom koje čitač ekrana
// pročita. Na canvasu ništa od toga ne postoji, a `prefers-reduced-motion` se
// tamo ne gasi nego se ručno prepisuje ceo crtež. Zato DOM i CSS transformacije.
//
// MANJE POKRETA
// -------------
// Ovo je jedina igra sa stvarnim kretanjem, pa je ovde `prefers-reduced-motion`
// najvažniji. Kad korisnik traži manje pokreta, trajanja prelaza padaju na nulu
// i međukoraci se preskaču: lik se ODMAH nađe na platformi ili na tlu. Igra je
// tada potpuno igriva, samo bez leta. Nijedna informacija ne postoji samo kao
// pokret - ishod ide kroz odziv ljuske (`aria-live`), a tačna platforma se
// oboji i dobije debeo okvir.
//
// PAD NIJE KAZNA
// --------------
// Dete pogreši desetine puta po partiji. Zato nema crvenog ekrana, drmanja ni
// tužnog lika: lik se odbije od promašene platforme, spusti se na tlo i uspravi.
// Poruka ostaje ista kao u ostalim igrama, neutralno „Ups!" i odmah tačan
// odgovor.
//
// SLUČAJNOST
// ----------
// U ishodu je nema. Sve što se ovde računa zavisi samo od toga koju je platformu
// dete dodirnulo.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Pitanje } from "@/lib/zack/pitanja";
import { bojaZaRod, type Rod } from "@/lib/zack/rec";

// Papir, ne gejmerski ekran. Iste boje kao u ljusci; stoje ovde zato što ih
// ljuska ne izvozi, a uvoz iz nje bi napravio krug (ljuska već uvozi ovaj fajl).
const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const MASTILO = "#16161A";
const PRIGUSEN = "#6E6A5E";

// ── Rod kao član ────────────────────────────────────────────────────────────

/**
 * Tri člana, bez „nema". Skakač ima tačno tri platforme, pa mu tačan odgovor
 * mora biti jedan od ta tri. Ljuska to proverava pre nego što uopšte iscrta
 * skakač, umesto da se ovde krpi sa `as` ili `!`.
 */
export type Clan = "der" | "die" | "das";

export const CLANOVI: readonly Clan[] = ["der", "die", "das"];

export function jeClan(rod: Rod): rod is Clan {
  return rod === "der" || rod === "die" || rod === "das";
}

export const NATPIS_RODA: Record<Rod, string> = {
  der: "der",
  die: "die",
  das: "das",
  nema: "bez člana",
};

/** Na žutoj i na crnoj podlozi bela slova ne rade isto. */
export function slovaNaRodu(rod: Rod): string {
  return rod === "das" ? MASTILO : "#FFFFFF";
}

/**
 * Skida član sa imenice. Reči se u tabelu unose sa članom („die Katze"), pa bi
 * bez ovoga igra sa članovima pisala odgovor u samom pitanju. Traži se razmak
 * iza člana, da „Dienstag" i „Dasein" ostanu netaknuti.
 */
export function bezClana(imenica: string): string {
  return imenica.replace(/^(der|die|das)\s+/i, "");
}

// ── Mere scene ──────────────────────────────────────────────────────────────
//
// Sve se meri od DNA scene naviše, pa scena sme da bude viša ili niža a da se
// odnosi ne pomere.
//
// Visina scene je ono što ostane od ekrana. Broj koji se oduzima je zbir svega
// što stoji iznad i ispod scene: okvir stranice, naslov sa srcima, traka
// napretka, traka odziva, dugme „Dosta za sad" i sitna licenca u podnožju
// rasporeda. Tako scena sama popuni ekran,
// pa platforme padnu u donju trećinu gde ih palac dohvata, umesto da igra stoji
// u sredini sa praznim pojasom ispod. `dvh`, ne `vh`, jer na telefonu adresna
// traka jede deo ekrana. `clamp` je kočnica na oba kraja: na niskom prozoru se
// scena skupi umesto da napravi skrol, na širokom monitoru se ne razvuče.
const SCENA_VISINA = "clamp(330px, calc(100dvh - 304px), 560px)";

/**
 * Lik je ikonica iz istog lokalnog skupa (Twemoji) kojim se crtaju sličice u
 * albumu, pa deluje kao da pripada igri, a ne kao nešto zalepljeno sa strane.
 * Koza skače po stenama, što je bukvalno mehanika ove igre, i jedina je od
 * kandidata vezana za nemačko govorno područje.
 *
 * Zamena lika je izmena SAMO ove jedne vrednosti. Ostali preuzeti kandidati:
 * žaba `1f438`, zec `1f430`, kengur `1f998`, skakavac `1f997`, hrčak `1f439`.
 */
const LIK_IKONICA = "1f410";

const TLO = 14; // koliko su noge lika iznad donje ivice scene
const LIK_SIRINA = 72;
// Platforme su namerno krupne: dete igra na telefonu jednom rukom, pa promašen
// palac ne sme da bude deo igre.
const PLATFORMA_DNO = 106;
const PLATFORMA_VISINA = 124;
const PLATFORMA_VRH = PLATFORMA_DNO + PLATFORMA_VISINA;

/** Koliko lik stoji više kad je na platformi nego kad je na tlu. */
const NA_PLATFORMI = PLATFORMA_VRH - TLO;
/** Teme skoka je iznad platforme, da let bude luk a ne kosa linija. */
const TEME = NA_PLATFORMI + 44;

// ── Tok jednog skoka ────────────────────────────────────────────────────────

type Faza = "tlo" | "let" | "platforma" | "pad" | "ustao";

const VISINA_FAZE: Record<Faza, number> = {
  tlo: 0,
  let: TEME,
  platforma: NA_PLATFORMI,
  pad: 0,
  ustao: 0,
};

/**
 * Blag nagib dok lik pada, da promašaj ima svoj izraz i bez menjanja crteža.
 * Namerno mali: prevrnut lik bi pad pretvorio u kaznu, a pada se desetine puta
 * po partiji. Kad je pokret ugašen, faza „pad" se preskače, pa nagiba i nema.
 */
const NAGIB_FAZE: Record<Faza, number> = {
  tlo: 0,
  let: 0,
  platforma: 0,
  pad: -14,
  ustao: 0,
};

/** Trajanje i kriva uspona, spuštanja i pada. Vodoravno kretanje ide zasebno. */
const PRELAZ_FAZE: Record<Faza, { ms: number; kriva: string }> = {
  tlo: { ms: 0, kriva: "linear" },
  let: { ms: 190, kriva: "cubic-bezier(.16,.84,.44,1)" },
  platforma: { ms: 190, kriva: "cubic-bezier(.55,0,.85,.35)" },
  pad: { ms: 420, kriva: "cubic-bezier(.55,0,.85,.35)" },
  ustao: { ms: 0, kriva: "linear" },
};

/** Vodoravno kretanje traje ceo let, pa se uspon i spuštanje slože u luk. */
const LET_VODORAVNO = 380;

// ── Lik ─────────────────────────────────────────────────────────────────────

/**
 * Lik je ukras: sve što se mora znati stiže kroz odziv ljuske i kroz obojenu
 * tačnu platformu, pa `alt` ostaje prazan. Slika je lokalna, iz istog skupa kao
 * sličice u albumu, i ne ide kroz optimizator - fajl je sitan SVG, a ovde se
 * pomera na svaki kadar, pa mu ne treba ništa osim da bude tu.
 */
function Lik() {
  // eslint-disable-next-line @next/next/no-img-element -- SVG ikonica, optimizator nema šta da uradi
  return <img src={`/zack/ikonice/${LIK_IKONICA}.svg`} alt="" className="block h-auto w-full" />;
}

/**
 * Kratko slavlje na doskoku. Nacrtano, ne animirano, pa se vidi i kad je pokret
 * ugašen - inače bi slavlje bilo podatak koji postoji samo kao kretanje.
 */
function Iskre() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 44 20"
      className="pointer-events-none absolute -top-4 left-0 h-5 w-full"
      fill="none"
      stroke={MASTILO}
      strokeWidth="3"
      strokeLinecap="round"
    >
      <path d="M6 14L3 8" />
      <path d="M22 10V3" />
      <path d="M38 14L41 8" />
    </svg>
  );
}

// ── Manje pokreta ───────────────────────────────────────────────────────────

const UPIT_POKRETA = "(prefers-reduced-motion: reduce)";

function pretplatiSe(naPromenu: () => void): () => void {
  const upit = window.matchMedia(UPIT_POKRETA);
  upit.addEventListener("change", naPromenu);
  return () => upit.removeEventListener("change", naPromenu);
}

/**
 * Postavka pretraživača je spoljni izvor, ne naše stanje, pa se čita kroz
 * `useSyncExternalStore`: React sam prati promenu i sam pređe sa serverske
 * pretpostavke na stvarnu vrednost, bez neslaganja pri hidraciji. Na serveru se
 * ne zna šta korisnik traži, pa tamo stoji „pun pokret".
 */
function useManjePokreta(): boolean {
  return useSyncExternalStore(
    pretplatiSe,
    () => window.matchMedia(UPIT_POKRETA).matches,
    () => false
  );
}

// ── Igra ────────────────────────────────────────────────────────────────────

export default function Skakac({
  pitanje,
  tacan,
  zakljucano,
  naOdgovor,
}: {
  pitanje: Extract<Pitanje, { igra: "rod" }>;
  /** Tačan član. Stiže odvojeno, već proveren, da ovde nema neverovatnog slučaja. */
  tacan: Clan;
  zakljucano: boolean;
  naOdgovor: (tacno: boolean, tacanTekst: string, pitanje: Pitanje) => void;
}) {
  const manjePokreta = useManjePokreta();
  const imenica = bezClana(pitanje.imenica);

  const [faza, setFaza] = useState<Faza>("tlo");
  // Koja je platforma dodirnuta. Ujedno i brava: dok stoji, drugi tap ne prolazi.
  const [meta, setMeta] = useState<number | null>(null);

  const tajmeri = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const spisak = tajmeri.current;
    return () => {
      for (const t of spisak) clearTimeout(t);
    };
  }, []);

  const dugmad = useRef<(HTMLButtonElement | null)[]>([]);

  const skoci = (kolona: number, clan: Clan) => {
    if (meta !== null || zakljucano) return;
    const tacno = clan === tacan;

    setMeta(kolona);
    // Odziv ide ODMAH, u istom trenutku kad i dodir. Da čeka doskok, čitač
    // ekrana bi ćutao pola sekunde, a dete bi videlo ishod pre nego što ga čuje.
    naOdgovor(tacno, `${NATPIS_RODA[tacan]} ${imenica}`, pitanje);

    if (manjePokreta) {
      // Bez međukoraka: lik je odmah tamo gde treba da završi.
      setFaza(tacno ? "platforma" : "ustao");
      return;
    }

    setFaza("let");
    tajmeri.current.push(
      setTimeout(() => setFaza(tacno ? "platforma" : "pad"), PRELAZ_FAZE.let.ms)
    );
    if (!tacno) {
      // Pao je, ustao je, ide dalje. Nema ležanja na tlu.
      tajmeri.current.push(
        setTimeout(() => setFaza("ustao"), PRELAZ_FAZE.let.ms + PRELAZ_FAZE.pad.ms)
      );
    }
  };

  const naTaster = (e: React.KeyboardEvent, kolona: number) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const pomak = e.key === "ArrowRight" ? 1 : CLANOVI.length - 1;
    dugmad.current[(kolona + pomak) % CLANOVI.length]?.focus();
  };

  const trajanje = (ms: number) => (manjePokreta ? 0 : ms);
  const prelaz = PRELAZ_FAZE[faza];
  // Kolone su tačno trećine scene, a nosač lika je širok koliko i scena, pa je
  // pomak od jedne kolone tačno 100/3 odsto njegove širine.
  const pomakX = meta === null ? 0 : (meta - 1) * (100 / 3);

  return (
    <div>
      <p className="sr-only">
        Dodirni platformu sa tačnim članom i lik skače na nju. Strelicama levo i desno biraš
        platformu, a Enterom skačeš.
      </p>

      <div
        className="relative overflow-hidden rounded-2xl border"
        style={{ height: SCENA_VISINA, background: PAPIR, borderColor: IVICA }}
      >
        {/* Imenica stoji u samoj sceni, iznad platformi, a ne u zasebnoj kartici
            iznad nje. Tako nebo nije prazan pojas, a scena sme da uzme ceo ekran
            koji joj ostane. Podloga je puna i sloj je iznad lika, da se reč ne
            izmeša sa likom u letu na niskom prozoru. */}
        <div className="absolute inset-x-0 top-0 z-10 px-4 pb-2 pt-4 text-center" style={{ background: PAPIR }}>
          <p
            className="font-heading text-[11px] font-bold uppercase tracking-[.18em]"
            style={{ color: PRIGUSEN }}
          >
            Skoči na tačan član
          </p>
          <p
            lang="de"
            className="font-heading mt-1 text-[30px] font-bold leading-tight tracking-tight [overflow-wrap:anywhere]"
            style={{ color: MASTILO }}
          >
            {imenica}
          </p>
        </div>

        {/* Tlo. Lik uvek polazi odavde i ovde se vraća kad promaši. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 border-t-2"
          style={{ height: TLO, background: "#EFEADC", borderColor: IVICA }}
        />

        {/* Lik. Nosač je širok koliko scena, pa se vodoravni pomak meri u
            trećinama scene; unutrašnji sloj nosi visinu, da uspon i vodoravno
            kretanje mogu da imaju različite krive i da se slože u luk. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 block"
          style={{
            bottom: TLO,
            transform: `translateX(${pomakX}%)`,
            transition: `transform ${trajanje(LET_VODORAVNO)}ms linear`,
          }}
        >
          <span
            className="relative mx-auto block"
            style={{
              width: LIK_SIRINA,
              transform: `translateY(${-VISINA_FAZE[faza]}px) rotate(${NAGIB_FAZE[faza]}deg)`,
              transition: `transform ${trajanje(prelaz.ms)}ms ${prelaz.kriva}`,
            }}
          >
            {faza === "platforma" && <Iskre />}
            <Lik />
          </span>
        </span>

        {/* Platforme. Iznad lika su namerno: promašen skok prođe iza njih i
            spusti se na tlo, umesto da lik prosečen stoji preko table. */}
        <ul
          className="absolute inset-x-0 z-10 grid grid-cols-3"
          style={{ bottom: PLATFORMA_DNO, height: PLATFORMA_VISINA }}
        >
          {CLANOVI.map((clan, kolona) => {
            const jeTacna = clan === tacan;
            const boja = bojaZaRod(clan);
            // Dok se ne odgovori, platforma je u punoj boji svog roda. Posle
            // odgovora se pogrešne gase, a tačna ostaje u boji i dobija okvir,
            // da se razlika ne oslanja samo na boju.
            const ugasena = meta !== null && !jeTacna;

            return (
              <li key={clan} className="h-full px-1">
                <button
                  type="button"
                  lang="de"
                  ref={(el) => {
                    dugmad.current[kolona] = el;
                  }}
                  disabled={zakljucano}
                  onClick={() => skoci(kolona, clan)}
                  onKeyDown={(e) => naTaster(e, kolona)}
                  className="font-heading block h-full w-full rounded-xl border-4 text-[21px] font-bold outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:cursor-default"
                  style={{
                    background: ugasena ? PAPIR : boja,
                    borderColor: jeTacna && meta !== null ? MASTILO : ugasena ? IVICA : boja,
                    color: ugasena ? PRIGUSEN : slovaNaRodu(clan),
                    opacity: ugasena ? 0.55 : 1,
                    boxShadow: ugasena ? "none" : "inset 0 -8px 0 rgba(0,0,0,.16)",
                  }}
                >
                  {NATPIS_RODA[clan]}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
