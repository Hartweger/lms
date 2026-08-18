"use client";

// Der-Die-Das skakač: telo igre u kojoj se rod ne bira sa spiska, nego se skače
// na policu. Ljuska (`Igra.tsx`) i dalje vodi srca, napredak, odziv, slanje
// zarađenog i izlaz - ovde je samo ono što se crta i kreće.
//
// PENJANJE, NIKAD SPUŠTANJE
// -------------------------
// Cela partija je jedno penjanje uz stenu. Svaki tačan odgovor je nov sprat i
// koza tu visinu zadržava do kraja. Sledeći sprat polica je IZNAD, ne na istom
// mestu, pa visina sama postaje traka napretka: dete ne mora da čita broj da bi
// videlo koliko je odmaklo.
//
// Greška NIKAD ne obara kozu naniže. Visina je zarađena isto kao sličica, a u
// ovom proizvodu se zarađeno ne oduzima. Netačan odgovor uzme srce (to radi
// ljuska), koza skoči, ne uhvati policu i sklizne nazad na SVOJ sprat. Sledeće
// pitanje kreće odatle. Zato `istorija` samo raste i nigde nema koda koji je
// skraćuje.
//
// KAKO SE SCENA POMERA
// --------------------
// Stranica se ne skroluje. Pomera se sam prizor: `svet` je sloj koji nosi tlo,
// police i kozu, i spušta se za tačno jedan sprat pri svakom uspehu, pa koza
// ostane na istom mestu na ekranu (`SIDRO`). Kamera kasni za skokom, pa se prvo
// vidi kako koza skače uvis, a tek onda prizor sklizne za njom. Pređeni sprat
// ostaje ispod nje, delom vidljiv, da se vidi odakle je došla.
//
// ZAŠTO NIJE CANVAS
// -----------------
// Canvas bi bio glatkiji, ali police moraju da budu prava dugmad: sa vidljivim
// fokusom, dohvatljiva tastaturom i sa imenom koje čitač ekrana pročita. Na
// canvasu ništa od toga ne postoji, a `prefers-reduced-motion` se tamo ne gasi
// nego se ručno prepisuje ceo crtež. Zato DOM i CSS transformacije.
//
// MANJE POKRETA
// -------------
// Ovo je jedina igra sa stvarnim kretanjem, pa je ovde `prefers-reduced-motion`
// najvažniji. Kad korisnik traži manje pokreta, trajanja prelaza padaju na nulu
// i međukoraci se preskaču: koza se ODMAH nađe na novom spratu, a prizor se
// odmah namesti, bez klizanja. Visina i dalje raste, samo se ne animira. Igra je
// tada potpuno igriva. Nijedna informacija ne postoji samo kao pokret - ishod
// ide kroz odziv ljuske (`aria-live`), tačna polica se oboji i dobije debeo
// okvir, a nova visina se javi kroz svoj `aria-live`, jer bi inače postojala
// samo kao pomeranje prizora.
//
// PAD NIJE KAZNA
// --------------
// Dete pogreši desetine puta po partiji. Zato nema crvenog ekrana, drmanja ni
// tužnog lika: koza se odbije od promašene police, blago se nakrivi dok kliza i
// uspravi se na svom spratu. Poruka ostaje ista kao u ostalim igrama, neutralno
// „Ups!" i odmah tačan odgovor.
//
// SLUČAJNOST
// ----------
// U ishodu je nema. Sve što se ovde računa zavisi samo od toga koju je policu
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
/** Tlo i leva traka stene: ista boja, jer su isti kamen. */
const STENA = "#EFEADC";

// ── Rod kao član ────────────────────────────────────────────────────────────

/**
 * Tri člana, bez „nema". Skakač ima tačno tri police, pa mu tačan odgovor mora
 * biti jedan od ta tri. Ljuska to proverava pre nego što uopšte iscrta skakač,
 * umesto da se ovde krpi sa `as` ili `!`.
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
// rasporeda. Tako scena sama popuni ekran, pa police padnu u donju trećinu gde
// ih palac dohvata, umesto da igra stoji u sredini sa praznim pojasom ispod.
// `dvh`, ne `vh`, jer na telefonu adresna traka jede deo ekrana. `clamp` je
// kočnica na oba kraja: na niskom prozoru se scena skupi umesto da napravi
// skrol, na širokom monitoru se ne razvuče.
const SCENA_VISINA = "clamp(330px, calc(100dvh - 304px), 560px)";

/**
 * Lik je ikonica iz istog lokalnog skupa (Twemoji) kojim se crtaju sličice u
 * albumu, pa deluje kao da pripada igri, a ne kao nešto zalepljeno sa strane.
 * Koza se penje uz stenu, što je bukvalno mehanika ove igre, i jedina je od
 * kandidata vezana za nemačko govorno područje.
 *
 * Zamena lika je izmena SAMO ove jedne vrednosti. Ostali preuzeti kandidati:
 * žaba `1f438`, zec `1f430`, kengur `1f998`, skakavac `1f997`, hrčak `1f439`.
 */
const LIK_IKONICA = "1f410";

const LIK_SIRINA = 68;
/** Traka stene uz levu ivicu, sa brojem sprata. Miruje; brojevi klize kroz nju. */
const TRAKA_SIRINA = 26;
// Police su namerno krupne: dete igra na telefonu jednom rukom, pa promašen
// palac ne sme da bude deo igre. I najniža je dvostruko viša od najmanje mete
// koju pristupačnost traži.
const POLICA_VISINA = 62;
/**
 * Razmak između dva sprata. Mora da bude veći od police plus lika, inače bi koza
 * dok stoji glavom ulazila u policu iznad sebe.
 */
const SPRAT_RAZMAK = 152;
/**
 * Gde koza stoji na ekranu, mereno od dna scene. Ovo je jedina tačka koja se ne
 * pomera: kamera se namešta tako da koza uvek bude tu. Dovoljno visoko da se
 * ispod nazire sprat sa kog je došla, dovoljno nisko da nova polica stane iznad.
 */
const SIDRO = 112;
/** Koliko iznad nove police ide teme skoka, da let bude luk a ne kosa linija. */
const TEME_VISAK = 36;
/** Dokle stigne skok koji ne uhvati policu. Namerno ispod ivice: nije uspeo. */
const PROMASAJ_TEME = 96;
/** Blok kamena ispod prvog sprata. Samo mora da bude viši od scene. */
const TLO_DUBINA = 900;

/** Prva polica je sprat 1; sprat 0 je tlo i nema svoju policu. */
function dnoSprata(sprat: number): number {
  return SIDRO + sprat * SPRAT_RAZMAK - POLICA_VISINA;
}

// ── Tok jednog skoka ────────────────────────────────────────────────────────

type Faza = "mirno" | "let" | "sleteo" | "promasaj" | "klizanje" | "ustao";

/**
 * Visina lika U ODNOSU NA SVOJ SPRAT. Sprat nosi `istorija`, pa se ovde nikad ne
 * pojavljuje negativan broj: nijedna faza ne spušta kozu ispod sopstvenog sprata.
 */
const VISINA_FAZE: Record<Faza, number> = {
  mirno: 0,
  let: SPRAT_RAZMAK + TEME_VISAK,
  sleteo: 0,
  promasaj: PROMASAJ_TEME,
  klizanje: 0,
  ustao: 0,
};

/**
 * Blag nagib dok koza kliza, da promašaj ima svoj izraz i bez menjanja crteža.
 * Namerno mali: prevrnut lik bi pad pretvorio u kaznu, a pada se desetine puta
 * po partiji. Kad je pokret ugašen, faza „klizanje" se preskače, pa nagiba nema.
 */
const NAGIB_FAZE: Record<Faza, number> = {
  mirno: 0,
  let: 0,
  sleteo: 0,
  promasaj: 0,
  klizanje: -12,
  ustao: 0,
};

/** Trajanje i kriva svake faze. Vodoravno kretanje ide zasebno. */
const PRELAZ_FAZE: Record<Faza, { ms: number; kriva: string }> = {
  mirno: { ms: 0, kriva: "linear" },
  let: { ms: 190, kriva: "cubic-bezier(.16,.84,.44,1)" },
  sleteo: { ms: 190, kriva: "cubic-bezier(.55,0,.85,.35)" },
  promasaj: { ms: 190, kriva: "cubic-bezier(.16,.84,.44,1)" },
  klizanje: { ms: 380, kriva: "cubic-bezier(.55,0,.85,.35)" },
  ustao: { ms: 140, kriva: "linear" },
};

/** Vodoravno kretanje traje ceo let, pa se uspon i doskok slože u luk. */
const LET_VODORAVNO = 340;

/**
 * Kamera namerno kasni za skokom. Bez zastoja bi se prizor spustio u istom
 * trenutku kad koza skoči, pa bi izgledalo kao da koza stoji u mestu a svet se
 * pomera. Ovako se prvo vidi skok, pa onda penjanje.
 */
const KAMERA_MS = 420;
const KAMERA_ZASTOJ = 140;

// ── Lik ─────────────────────────────────────────────────────────────────────

/**
 * Lik je ukras: sve što se mora znati stiže kroz odziv ljuske, kroz obojenu
 * tačnu policu i kroz javljanje sprata, pa `alt` ostaje prazan. Slika je
 * lokalna, iz istog skupa kao sličice u albumu, i ne ide kroz optimizator - fajl
 * je sitan SVG, a ovde se pomera na svaki kadar, pa mu ne treba ništa osim da
 * bude tu.
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

/**
 * Pređen sprat. Ostaje ispod koze kao trag: polica koju je osvojila zadržava
 * boju svog roda i debeo okvir, druge dve su ugašene. Ista slika kao odgovorena
 * meta, pa se u trenutku doskoka ništa ne trza - meta samo skoči na sledeći
 * sprat, a ovo ostane na njenom mestu.
 */
function PredjenSprat({ sprat, osvojen }: { sprat: number; osvojen: Clan | undefined }) {
  return (
    <ul
      aria-hidden="true"
      className="absolute z-10 grid grid-cols-3"
      style={{ left: TRAKA_SIRINA, right: 0, bottom: dnoSprata(sprat), height: POLICA_VISINA }}
    >
      {CLANOVI.map((clan) => {
        const jeOsvojen = clan === osvojen;
        return (
          <li key={clan} className="h-full px-1">
            <span
              className="font-heading flex h-full w-full items-center justify-center rounded-xl border-4 text-[19px] font-bold"
              style={{
                background: jeOsvojen ? bojaZaRod(clan) : PAPIR,
                borderColor: jeOsvojen ? MASTILO : IVICA,
                color: jeOsvojen ? slovaNaRodu(clan) : PRIGUSEN,
                opacity: jeOsvojen ? 1 : 0.5,
              }}
            >
              {NATPIS_RODA[clan]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Sprat do kog se još nije stiglo. Samo obris, bez slova i bez boje, da se vidi
 * da stena ide dalje uvis a da ništa ne izgleda kao da se može dodirnuti.
 */
function BuduciSprat({ sprat }: { sprat: number }) {
  return (
    <ul
      aria-hidden="true"
      className="absolute z-10 grid grid-cols-3"
      style={{ left: TRAKA_SIRINA, right: 0, bottom: dnoSprata(sprat), height: POLICA_VISINA }}
    >
      {CLANOVI.map((clan) => (
        <li key={clan} className="h-full px-1">
          <span
            className="block h-full w-full rounded-xl border-2 border-dashed"
            style={{ borderColor: IVICA, opacity: 0.7 }}
          />
        </li>
      ))}
    </ul>
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
  naVisinu,
}: {
  pitanje: Extract<Pitanje, { igra: "rod" }>;
  /** Tačan član. Stiže odvojeno, već proveren, da ovde nema neverovatnog slučaja. */
  tacan: Clan;
  zakljucano: boolean;
  naOdgovor: (tacno: boolean, tacanTekst: string, pitanje: Pitanje) => void;
  /**
   * Javlja dokle se koza popela. Ljuska to ne koristi u igri, samo prosleđuje
   * dalje, da poruka na kraju partije može da kaže dokle se stiglo. Mora da bude
   * stabilna funkcija, inače bi se javljalo na svaki render.
   */
  naVisinu?: (sprat: number) => void;
}) {
  const manjePokreta = useManjePokreta();
  const imenica = bezClana(pitanje.imenica);

  /**
   * Osvojene police, po spratovima: `istorija[0]` je prvi sprat. Ovo je i visina
   * i trag. Niz SAMO raste - nema mesta u kodu koje ga skraćuje, jer greška ne
   * sme da obori kozu naniže.
   */
  const [istorija, setIstorija] = useState<Clan[]>([]);
  /**
   * Sprat koji prizor TRENUTNO crta. Zaostaje za zarađenim tačno koliko traje
   * skok, da se prvo vidi kako koza skače pa tek onda kako se prizor spušta za
   * njom. Samo prikaz - zarađenu visinu nosi `istorija`.
   */
  const [vidljivSprat, setVidljivSprat] = useState(0);
  const [faza, setFaza] = useState<Faza>("mirno");
  // Koja je polica dodirnuta. Ujedno i brava: dok stoji, drugi tap ne prolazi.
  const [meta, setMeta] = useState<number | null>(null);

  /** Zarađena visina. Jedina istina o tome dokle se koza popela. */
  const sprat = istorija.length;

  // Telo igre živi celu partiju (ljuska ga ne prekraja po pitanju), pa se stanje
  // jednog pitanja mora ručno vratiti kad stigne novo. Visina se NE dira.
  const [prethodno, setPrethodno] = useState<Pitanje>(pitanje);
  if (prethodno !== pitanje) {
    setPrethodno(pitanje);
    setMeta(null);
    setFaza("mirno");
    // Ako je tajmer doskoka otkazan time što je stiglo novo pitanje, prizor
    // ovde sustiže zarađenu visinu. Zarađeni sprat se ne može izgubiti ni u toj
    // trci: `istorija` se upisuje odmah po tačnom odgovoru, a ovo je samo
    // prikaz koji je za njom zaostao.
    if (vidljivSprat !== sprat) setVidljivSprat(sprat);
  }

  const poslednji = istorija.at(-1);
  const kolonaKuce = poslednji === undefined ? 1 : Math.max(0, CLANOVI.indexOf(poslednji));

  const tajmeri = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Čisti se i pri promeni pitanja, ne samo pri gašenju: zaostao tajmer bi
  // postavio fazu preko upravo vraćenog stanja.
  useEffect(() => {
    const spisak = tajmeri.current;
    return () => {
      for (const t of spisak) clearTimeout(t);
      tajmeri.current = [];
    };
  }, [pitanje]);

  useEffect(() => {
    naVisinu?.(sprat);
  }, [sprat, naVisinu]);

  const dugmad = useRef<(HTMLButtonElement | null)[]>([]);

  const skoci = (kolona: number, clan: Clan) => {
    if (meta !== null || zakljucano) return;
    const tacno = clan === tacan;

    setMeta(kolona);
    // Odziv ide ODMAH, u istom trenutku kad i dodir. Da čeka doskok, čitač
    // ekrana bi ćutao pola sekunde, a dete bi videlo ishod pre nego što ga čuje.
    naOdgovor(tacno, `${NATPIS_RODA[tacan]} ${imenica}`, pitanje);

    if (tacno) {
      // Zarađena visina se upisuje ODMAH, u istom potezu kao i odgovor, i to
      // van svakog tajmera. Da čeka doskok, dovoljno bi bilo da tajmer nekad ne
      // stigne (spor uređaj, kartica u pozadini) pa da dete ostane bez sprata
      // koji je pošteno osvojilo. Tajmer ispod pomera samo prizor.
      setIstorija((s) => [...s, clan]);
      const noviSprat = sprat + 1;

      if (manjePokreta) {
        // Bez međukoraka: koza je odmah na novom spratu, prizor odmah namešten.
        // Visina i dalje raste, samo se ne animira.
        setVidljivSprat(noviSprat);
        setFaza("sleteo");
        return;
      }

      setFaza("let");
      tajmeri.current.push(
        setTimeout(() => {
          setVidljivSprat(noviSprat);
          setFaza("sleteo");
        }, PRELAZ_FAZE.let.ms)
      );
      return;
    }

    if (manjePokreta) {
      setFaza("ustao");
      return;
    }

    // Promašaj: skok kreće, ne uhvati ivicu i koza sklizne NA SVOJ sprat. Visina
    // ostaje ista, menja se samo držanje.
    setFaza("promasaj");
    tajmeri.current.push(setTimeout(() => setFaza("klizanje"), PRELAZ_FAZE.promasaj.ms));
    tajmeri.current.push(
      setTimeout(
        () => setFaza("ustao"),
        PRELAZ_FAZE.promasaj.ms + PRELAZ_FAZE.klizanje.ms
      )
    );
  };

  const naTaster = (e: React.KeyboardEvent, kolona: number) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const pomak = e.key === "ArrowRight" ? 1 : CLANOVI.length - 1;
    dugmad.current[(kolona + pomak) % CLANOVI.length]?.focus();
  };

  const trajanje = (ms: number) => (manjePokreta ? 0 : ms);
  const prelaz = PRELAZ_FAZE[faza];

  // Dok skače ka meti, koza ide na dodirnutu kolonu; kad sklizne, vraća se na
  // svoju. Posle uspešnog doskoka su to ista kolona, pa se ništa ne trza.
  const uLetu = faza === "let" || faza === "promasaj";
  const kolonaSad = uLetu && meta !== null ? meta : kolonaKuce;
  // Kolone su tačno trećine pojasa sa policama, a nosač lika je širok koliko i
  // taj pojas, pa je pomak od jedne kolone tačno 100/3 odsto njegove širine.
  const pomakX = (kolonaSad - 1) * (100 / 3);
  // Geometrija ide po vidljivom spratu, da se prizor ne trza pre nego što koza
  // stigne do police. Brojka i javljanje idu po zarađenom, jer je to istina.
  const visinaLika = vidljivSprat * SPRAT_RAZMAK + VISINA_FAZE[faza];
  const kamera = vidljivSprat * SPRAT_RAZMAK;

  const metaSprat = vidljivSprat + 1;
  // Prozor spratova koji se uopšte crtaju. Donji je pređeni sprat, koji za vreme
  // klizanja kamere još stoji na ekranu; gornja dva daju osećaj da stena ide
  // dalje uvis. Sve van prozora je ionako iza ivice scene.
  const predjeni = [vidljivSprat - 1, vidljivSprat].filter((s) => s >= 1);
  const buduci = [metaSprat + 1, metaSprat + 2];
  const oznake = [vidljivSprat - 1, vidljivSprat, metaSprat, metaSprat + 1, metaSprat + 2].filter(
    (s) => s >= 1
  );

  const najava = sprat === 0 ? "" : `Koza je na ${sprat}. spratu.`;

  return (
    <div>
      <p className="sr-only">
        Dodirni policu sa tačnim članom i koza skače na nju. Svaki tačan odgovor je sprat više i
        koza se sa te visine nikad ne spušta. Strelicama levo i desno biraš policu, a Enterom
        skačeš.
      </p>
      {/* Visina inače postoji samo kao pokret prizora, pa se svaki nov sprat i
          izgovori. „Uljudno", da ne preseca odziv ljuske („Zack!", „Ups!"), koji
          je hitniji i stiže u istom trenutku. */}
      <p aria-live="polite" className="sr-only">
        {najava}
      </p>

      <div
        className="relative overflow-hidden rounded-2xl border"
        style={{ height: SCENA_VISINA, background: PAPIR, borderColor: IVICA }}
      >
        {/* Traka stene uz levu ivicu. Ona MIRUJE, a brojevi spratova klize kroz
            nju - po tome se vidi da se penje, a ne da police same rastu. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 border-r-2"
          style={{ width: TRAKA_SIRINA, background: STENA, borderColor: IVICA }}
        />

        {/* Sve što se penje. Jedan sloj, jedan `translateY`: tlo, police, brojevi
            i koza se pomeraju zajedno, pa se odnosi među njima ne mogu razići. */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translateY(${kamera}px)`,
            transition: `transform ${trajanje(KAMERA_MS)}ms cubic-bezier(.33,1,.68,1) ${trajanje(KAMERA_ZASTOJ)}ms`,
          }}
        >
          {/* Tlo. Odavde koza kreće; ispod njega se nikad ne ide. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 border-t-2"
            style={{
              bottom: SIDRO - TLO_DUBINA,
              height: TLO_DUBINA,
              background: STENA,
              borderColor: IVICA,
            }}
          />

          {/* Brojevi spratova u traci. */}
          {oznake.map((s) => (
            <span
              key={s}
              aria-hidden="true"
              className="font-heading absolute flex items-center justify-center text-[12px] font-bold tabular-nums"
              style={{
                left: 0,
                width: TRAKA_SIRINA,
                bottom: dnoSprata(s),
                height: POLICA_VISINA,
                color: s <= vidljivSprat ? MASTILO : PRIGUSEN,
                opacity: s <= vidljivSprat ? 0.75 : 0.4,
              }}
            >
              {s}
            </span>
          ))}

          {/* Koza. Police su iznad nje namerno: promašen skok prođe iza njih,
              umesto da lik prosečen stoji preko table. Nosač nosi vodoravni
              pomak, unutrašnji sloj visinu, da uspon i vodoravno kretanje mogu
              da imaju različite krive i da se slože u luk. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute block"
            style={{
              left: TRAKA_SIRINA,
              right: 0,
              bottom: SIDRO,
              transform: `translateX(${pomakX}%)`,
              transition: `transform ${trajanje(LET_VODORAVNO)}ms linear`,
            }}
          >
            <span
              className="relative mx-auto block"
              style={{
                width: LIK_SIRINA,
                transform: `translateY(${-visinaLika}px) rotate(${NAGIB_FAZE[faza]}deg)`,
                transition: `transform ${trajanje(prelaz.ms)}ms ${prelaz.kriva}`,
              }}
            >
              {faza === "sleteo" && <Iskre />}
              <Lik />
            </span>
          </span>

          {predjeni.map((s) => (
            <PredjenSprat key={s} sprat={s} osvojen={istorija.at(s - 1)} />
          ))}
          {buduci.map((s) => (
            <BuduciSprat key={s} sprat={s} />
          ))}

          {/* Meta. Jedan te isti `<ul>` celu partiju - samo mu se menja visina.
              Zato fokus tastature preživi i odgovor i penjanje, umesto da posle
              svakog skoka ispadne na početak stranice. */}
          <ul
            className="absolute z-10 grid grid-cols-3"
            style={{
              left: TRAKA_SIRINA,
              right: 0,
              bottom: dnoSprata(metaSprat),
              height: POLICA_VISINA,
            }}
          >
            {CLANOVI.map((clan, kolona) => {
              const jeTacna = clan === tacan;
              const boja = bojaZaRod(clan);
              // Dok se ne odgovori, polica je u punoj boji svog roda. Posle
              // odgovora se pogrešne gase, a tačna ostaje u boji i dobija okvir,
              // da se razlika ne oslanja samo na boju.
              const ugasena = meta !== null && !jeTacna;
              // `aria-disabled`, ne `disabled`: pravo gašenje dugmeta izbaci
              // fokus na telo stranice, pa dete koje igra tastaturom posle
              // svakog odgovora mora tabom nazad. Sam skok je ionako zaključan
              // u `skoci`.
              const neaktivna = zakljucano || meta !== null;

              return (
                <li key={clan} className="h-full px-1">
                  <button
                    type="button"
                    lang="de"
                    ref={(el) => {
                      dugmad.current[kolona] = el;
                    }}
                    aria-disabled={neaktivna}
                    onClick={() => skoci(kolona, clan)}
                    onKeyDown={(e) => naTaster(e, kolona)}
                    className="font-heading block h-full w-full rounded-xl border-4 text-[21px] font-bold outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]"
                    style={{
                      background: ugasena ? PAPIR : boja,
                      borderColor: jeTacna && meta !== null ? MASTILO : ugasena ? IVICA : boja,
                      color: ugasena ? PRIGUSEN : slovaNaRodu(clan),
                      opacity: ugasena ? 0.55 : 1,
                      boxShadow: ugasena ? "none" : "inset 0 -6px 0 rgba(0,0,0,.16)",
                      cursor: neaktivna ? "default" : "pointer",
                    }}
                  >
                    {NATPIS_RODA[clan]}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Imenica stoji u samoj sceni, iznad polica, a ne u zasebnoj kartici
            iznad nje. Tako nebo nije prazan pojas, a scena sme da uzme ceo ekran
            koji joj ostane. Podloga je puna i sloj je iznad svega što se penje,
            da se reč ne izmeša sa policama koje klize naviše. */}
        <div
          className="absolute inset-x-0 top-0 z-20 px-4 pb-2 pt-4 text-center"
          style={{ background: PAPIR }}
        >
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
          {/* Brojka uz penjanje. Čitač ekrana istu stvar dobija kroz `aria-live`
              gore, pa ovo ostaje samo slika. */}
          <span
            aria-hidden="true"
            className="font-heading absolute right-3 top-3 rounded-full border px-2 py-[3px] text-[11px] font-bold tabular-nums"
            style={{ borderColor: IVICA, background: STENA, color: PRIGUSEN }}
          >
            {sprat === 0 ? "tlo" : `${sprat}. sprat`}
          </span>
        </div>
      </div>
    </div>
  );
}
