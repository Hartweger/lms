"use client";

// Ekran lekcije. Ovo je jedini ekran koji dete stvarno koristi svaki dan, pa se
// ovde spaja sve: podsetnik na pravilo, učenje, vežbe, rečenice, kesica i album.
//
// REDOSLED: PRVO UČENJE, PA RAZRADA
// ---------------------------------
// Lekcija ide istim redom kojim se uči. Sekcija „Učenje" stoji prva i uvek je
// otvorena; „Vežbe" i „Rečenice" iza nje čekaju da se odgovarajuća faza jednom
// pređe. Ta dva katanca su MIRNA OBAVEŠTENJA, ne kazne:
//
// - nijedan ne oduzima ništa - i pod katancem se sve zarađeno vidi u albumu;
// - prođena faza se ne poništava, pa povratak na učenje ništa ne zaključava;
// - katanac se nikad ne veže za uslov koji se ne može ispuniti: lekcija bez
//   pločičnih rečenica nema fazu učenja rečenica, pa se dopuna otvara odmah;
// - kad se prolaz ne može ni pročitati ni upisati, ide se u korist deteta -
//   otključano.
//
// VRHOVNO PRAVILO
// ---------------
// Detetu se NIKAD ne oduzima ono što je zaradilo. Iz toga slede četiri stvari
// koje se ne smeju „pojednostaviti":
//
// 1. Napredak se u toku igre šalje iz same igre, red po red, posle svakog
//    tačnog odgovora. To slanje ide u pozadini i sme tiho da padne, pa NIJE
//    dokaz da je reč stigla.
// 2. Zato se na kraju partije ceo spisak tačnih šalje JOŠ JEDNOM, odavde, i to
//    se čeka i proverava. Ruta je idempotentna, pa ponovljeno slanje ne može
//    ništa da pokvari. Ako ni to ne prođe, spisak ostaje u ruci (`neposlato`) i
//    ide uz prvi sledeći pokušaj, a detetu se kaže istina - nikad da je sve u
//    redu kad nije.
// 3. Lepljenje se vidi ODMAH, a poziv ide u pozadini i njegov pad se guta.
//    Sličica je već zarađena i isporučena u bazi, pa pad mreže ne može da je
//    odnese: najgore što se desi je da ostane „u ruci" do sledećeg otvaranja.
// 4. Sličice koje su ostale u ruci od prošlog puta se pri učitavanju vraćaju u
//    ruku. Bez toga bi dete koje je zatvorilo karticu pre lepljenja zateklo
//    prazna mesta koja nema čime da popuni.
//
// ŠTA ALBUM SME DA POKAŽE
// -----------------------
// Reč koja je „u ruci" se u albumu ispod crta kao PRAZNO mesto, dok je dete ne
// zalepi. Album je nagrada za zalepljeno, ne spisak onoga što stiže.
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import Igra, { NAZIVI } from "@/components/zack/Igra";
import Isticanje from "@/components/zack/Isticanje";
import Kesica, { CIK_CAK } from "@/components/zack/Kesica";
import Milioner from "@/components/zack/Milioner";
import Slicica from "@/components/zack/Slicica";
import UcenjeReci from "@/components/zack/UcenjeReci";
import { brojac, type StavkaAlbuma } from "@/lib/zack/album";
import { PORUKA_ZAKLJUCANO } from "@/lib/zack/clanstvo";
import type { Igra as VrstaIgre, IgraReci as VrstaIgreReci } from "@/lib/zack/pitanja";
import { dokleSePopela, opisSprata } from "@/lib/zack/pojas";
import type { StaraRec } from "@/lib/zack/ponavljanje";
import { podobnaZaDopunu, podobnaZaSlagalicu, type Recenica } from "@/lib/zack/recenice";
import type { Rec } from "@/lib/zack/rec";
import {
  CRVENA,
  CRVENA_SENKA,
  CRVENA_ZNAK,
  DISPLAY,
  IVICA,
  MASTILO,
  PAPIR,
  PLAVA,
  PRIGUSEN,
  ZELENA_DAS,
  ZUTA,
} from "../../../Ukras";

type Lekcija = {
  id: string;
  broj: number;
  naziv: string;
  pravilo_naslov: string | null;
  pravilo_tekst: string | null;
  pravilo_primer: string | null;
};

/**
 * Redosled pločica u sekciji „Vežbe". Diktat je ubedljivo najteži i namerno
 * stoji poslednji: dete koje prvo naleti na njega odustane pre nego što proba
 * ostalo. Parovi su najlakši ulaz, pa idu prvi.
 *
 * Skakač stoji ODMAH iznad spiskovne verzije istog pitanja. Isti rod, dva tela:
 * ko hoće da igra bira skakač, ko hoće da brzo prođe reči bira spisak.
 *
 * Tip je namerno UŽI od onog koji ljuska `Igra` prima. Ljuska sada ume da
 * nacrta i rečenično pitanje, pa stanje `igra` drži ceo `VrstaIgre` - ali ovaj
 * spisak je spisak ŠEST VEŽBI OD REČI i rečenična igra u njemu nema šta da
 * traži: „Nauči rečenice" pripada Učenju, a slagalica i dopuna Rečenicama, i
 * nijedna od njih ne sme da se pojavi među vežbama koje čekaju na učenje reči.
 */
const IGRE: readonly VrstaIgreReci[] = [
  "parovi",
  "brzo-biranje",
  "skakac",
  "rod",
  "mnozina",
  "diktat",
];

/** Zelena uspeha, ista kao u odzivu igre. */
const ZELENA = "#1E7A4B";

// Mini najava Milionerovog TV izgleda: iste boje kao u samoj igri, da dete na
// tamnoj kartici prepozna „to je ono sa zlatnim šestougaonicima".
const NOC = "#08122E";
const NOC_SJAJ = "#0E2A5C";
const ZLATNA = "#E8A33D";
/** Na zlatnoj podlozi tamna slova: bela na zlatnoj daje ispod 3.5:1. */
const TAMNO = "#0A1836";
const NOC_PRIGUSENA = "#A9BEE4";
/** Šestougao sa televizije, sitniji šiljak nego u samoj igri. */
const HEX_MALI = "polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)";

/** Zajednički izgled svega što se klikće, sa vidljivim fokusom. */
const FOKUS = "outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]";

/**
 * Katanac na zaključanoj pločici. Uvek stoji uz reč „Zaključano" - ikona sama
 * ne sme da nosi značenje - pa je za čitače ekrana čist ukras.
 */
function Katanac() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" fill="currentColor" />
      <path
        d="M8 10.5V8a4 4 0 0 1 8 0v2.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
/** Na crvenoj kesici plavi okvir fokusa se gubi, pa je tamo fokus beo. */
const FOKUS_NA_CRVENOJ = "outline-offset-2 focus-visible:outline-4 focus-visible:outline-white";

// ── Brojevi u našem jeziku ──────────────────────────────────────────────────

/**
 * Broj menja oblik imenice iza sebe: 1 sličica, 2 sličice, 5 sličica. Brojevi
 * od 11 do 14 su izuzetak i idu kao 5, ma koja im bila poslednja cifra.
 */
type Oblik = "jedna" | "dve" | "pet";

function oblikBroja(n: number): Oblik {
  const ceo = Math.abs(Math.trunc(n));
  if (ceo % 100 >= 11 && ceo % 100 <= 14) return "pet";
  const poslednja = ceo % 10;
  if (poslednja === 1) return "jedna";
  if (poslednja >= 2 && poslednja <= 4) return "dve";
  return "pet";
}

const SLICICA: Record<Oblik, string> = { jedna: "sličica", dve: "sličice", pet: "sličica" };

function recSlicica(n: number): string {
  return SLICICA[oblikBroja(n)];
}

const CEKA: Record<Oblik, string> = {
  jedna: "nova sličica te čeka",
  dve: "nove sličice te čekaju",
  pet: "novih sličica te čeka",
};

const STIGLO: Record<Oblik, string> = {
  jedna: "Stigla je nova sličica",
  dve: "Stigle su nove sličice",
  pet: "Stiglo je novih sličica",
};

const MESTO: Record<Oblik, string> = {
  jedna: "prazno mesto",
  dve: "prazna mesta",
  pet: "praznih mesta",
};

/**
 * Poruka prazne kesice govori iz stanja albuma, ne napamet. Savet „probaj
 * neku drugu igru" ima smisla samo dok u albumu ima praznih mesta; kad je
 * album pun, kaže se baš to - i ništa se dalje ne traži. Izbledele sličice se
 * pomenu bez prekora: igranje im vraća boju, ali niko ništa nije izgubio.
 */
function recenicePrazneKesice(stavke: readonly StavkaAlbuma[]): string[] {
  const praznih = stavke.filter((s) => s.stanje === "prazno").length;
  if (praznih === 0) {
    const recenice = ["Ceo album ove lekcije je pun. Svaka reč je tu."];
    if (stavke.some((s) => s.stanje === "izbledela")) {
      recenice.push("Neke sličice su izbledele - igraj da im vratiš boju.");
    }
    return recenice;
  }
  const oblik = oblikBroja(praznih);
  return [
    "U ovoj kesici nema novih sličica - reči iz te igre već imaš.",
    `U albumu ${oblik === "dve" ? "čekaju" : "čeka"} još ${praznih} ${MESTO[oblik]}, probaj neku drugu igru.`,
  ];
}

// ── Čitanje odgovora rute ───────────────────────────────────────────────────

/**
 * Odgovor rute se ne uzima na veru. Nije stvar nepoverenja u sopstvenu rutu,
 * nego u to da jedan pokvaren red ne sme da obori ceo ekran detetu koje je taman
 * nešto zaradilo.
 */
function jeRec(v: unknown): v is Rec {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.redni_broj === "number" &&
    typeof o.de === "string" &&
    typeof o.sr === "string" &&
    (o.rod === "der" || o.rod === "die" || o.rod === "das" || o.rod === "nema") &&
    (o.mnozina === null || typeof o.mnozina === "string") &&
    (o.vrsta === "imenica" || o.vrsta === "glagol" || o.vrsta === "pridev" || o.vrsta === "ostalo") &&
    typeof o.izuzetak === "boolean"
  );
}

/**
 * Rekord iz odgovora rute. Vraća `null` kad odgovor nije onakav kakvom se nadamo
 * - tada se na ekranu zadržava ono što je već stajalo, umesto da se upiše
 * besmislica.
 */
function citajRekord(telo: unknown): number | null {
  if (typeof telo !== "object" || telo === null) return null;
  const sirovo = (telo as Record<string, unknown>).rekord;
  if (typeof sirovo !== "number" || !Number.isInteger(sirovo) || sirovo < 0) return null;
  return sirovo;
}

function citajKesicu(telo: unknown): { kesica: Rec[]; ostalo: number } {
  if (typeof telo !== "object" || telo === null) return { kesica: [], ostalo: 0 };
  const o = telo as Record<string, unknown>;
  const sirovo: unknown[] = Array.isArray(o.kesica) ? o.kesica : [];
  const ostalo = typeof o.ostaloNeisporuceno === "number" ? o.ostaloNeisporuceno : 0;
  return { kesica: sirovo.filter(jeRec), ostalo: Math.max(0, ostalo) };
}

// ── Sitne sličice ───────────────────────────────────────────────────────────

function Zvezdica({ velika }: { velika?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={velika ? "h-6 w-6 flex-none" : "h-[18px] w-[18px] flex-none"}
      fill="currentColor"
    >
      <path d="M12 2.2l2.7 6.3 6.8.6-5.1 4.5 1.5 6.6L12 16.7 6.1 20.2l1.5-6.6L2.5 9.1l6.8-.6z" />
    </svg>
  );
}

function Strelica({ nazad }: { nazad?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={nazad ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ── Vinjete igara ───────────────────────────────────────────────────────────
// Svaka igra ima svoj mali crtež, nacrtan ovde u CSS-u i SVG-u, bez ijedne
// slike sa strane. Sve su čist ukras i stoje iza aria-hidden u samoj pločici.
// Boje roda (plava der, crvena die, zelena das) se i ovde drže pravila iz
// Ukrasa: kao ukras idu SVE TRI zajedno, nikad jedna sama da ne slaže o rodu.

/** Prazna poleđina sličice: isti karton kao u albumu, samo sitniji. */
function KartonSlicice({ boja, ugao, sirina }: { boja: string; ugao: number; sirina: number }) {
  return (
    <span
      className="block aspect-[3/4] rounded-[7px] border-2 shadow-[0_1px_3px_rgba(22,22,26,0.25)]"
      style={{
        width: `${sirina}px`,
        background: boja,
        borderColor: "#FFFFFF",
        transform: `rotate(${ugao}deg)`,
      }}
    />
  );
}

/** Parovi: dve iste poleđine, jedna preko druge - kao par koji se traži. */
function VinjetaParovi() {
  return (
    <span className="relative block h-12 w-16">
      <span className="absolute left-1 top-1">
        <KartonSlicice boja={CRVENA_ZNAK} ugao={-8} sirina={26} />
      </span>
      <span className="absolute left-8 top-0">
        <KartonSlicice boja={CRVENA_ZNAK} ugao={7} sirina={26} />
      </span>
    </span>
  );
}

/** Brzo biranje: munja, jer se tu igra na vreme. */
function VinjetaMunja() {
  return (
    <svg viewBox="0 0 24 24" className="h-12 w-12 -rotate-6">
      <path
        d="M13 2 5 13.5h5L9.5 22 19 9.5h-5.5L13 2z"
        fill={ZUTA}
        stroke={MASTILO}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Skakač: koza iz igre na tri stubića u bojama der, die i das. */
function VinjetaSkakac() {
  return (
    <span className="relative block h-12 w-20">
      <span className="absolute bottom-0 left-1 flex items-end gap-1">
        <span className="block w-5 rounded-t-md" style={{ height: "10px", background: PLAVA }} />
        <span className="block w-5 rounded-t-md" style={{ height: "16px", background: CRVENA_ZNAK }} />
        <span className="block w-5 rounded-t-md" style={{ height: "22px", background: ZELENA_DAS }} />
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- sitan lokalni
          svg ukras; next/image bi mu samo dodao obradu koja ničemu ne služi */}
      <img
        src="/zack/ikonice/1f410.svg"
        alt=""
        className="absolute bottom-[20px] left-[46px] h-7 w-7 -rotate-3"
      />
    </span>
  );
}

/** Der, die ili das: tri ponuđena odgovora, svaki u svojoj boji roda. */
function VinjetaRod() {
  return (
    <span className="flex h-12 items-center gap-1.5">
      <span
        className="block h-6 w-6 -rotate-6 rounded-md border-2 shadow-[0_1px_3px_rgba(22,22,26,0.25)]"
        style={{ background: PLAVA, borderColor: "#FFFFFF" }}
      />
      <span
        className="block h-7 w-7 rotate-3 rounded-md border-2 shadow-[0_1px_3px_rgba(22,22,26,0.25)]"
        style={{ background: CRVENA_ZNAK, borderColor: "#FFFFFF" }}
      />
      <span
        className="block h-6 w-6 -rotate-2 rounded-md border-2 shadow-[0_1px_3px_rgba(22,22,26,0.25)]"
        style={{ background: ZELENA_DAS, borderColor: "#FFFFFF" }}
      />
    </span>
  );
}

/** Množina: jedna sličica postane tri - a sve tri su žute, jer žuta znači množinu. */
function VinjetaMnozina() {
  return (
    <span className="flex h-12 items-center gap-1.5">
      <KartonSlicice boja={PLAVA} ugao={-4} sirina={22} />
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 flex-none"
        fill="none"
        stroke={MASTILO}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h13M13 6l6 6-6 6" />
      </svg>
      <span className="relative block h-11 w-12">
        <span className="absolute left-0 top-2">
          <KartonSlicice boja={ZUTA} ugao={-8} sirina={22} />
        </span>
        <span className="absolute left-3 top-0">
          <KartonSlicice boja={ZUTA} ugao={2} sirina={22} />
        </span>
        <span className="absolute left-6 top-2">
          <KartonSlicice boja={ZUTA} ugao={9} sirina={22} />
        </span>
      </span>
    </span>
  );
}

/** Diktat: olovka i talasasta linija rukopisa. */
function VinjetaOlovka() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12">
      <g transform="rotate(45 24 24)">
        <rect x="20" y="2" width="8" height="5" rx="1.5" fill={CRVENA_ZNAK} stroke={MASTILO} strokeWidth="1.6" />
        <rect x="20" y="7" width="8" height="20" fill={ZUTA} stroke={MASTILO} strokeWidth="1.6" />
        <path d="M20 27 24 35l4-8z" fill="#E8C79A" stroke={MASTILO} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M22.7 30.6 24 35l1.3-4.4z" fill={MASTILO} />
      </g>
      <path
        d="M6 43q5-6 10 0t10 0t10 0t10 0"
        fill="none"
        stroke={MASTILO}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Nauči reči: kartice sa trakom roda, iste kao u samom učenju. Traka nikad ne
 * ide sama u jednoj boji - jedna boja bi bila tvrdnja o rodu - pa su kartice
 * tri, ceo komplet der, die i das, razmaknute da se sve tri trake vide.
 */
function VinjetaKartica() {
  return (
    <span className="relative block h-12 w-16">
      {[
        { boja: PLAVA, levo: 0, vrh: 9, ugao: -7 },
        { boja: CRVENA_ZNAK, levo: 15, vrh: 5, ugao: 2 },
        { boja: ZELENA_DAS, levo: 31, vrh: 9, ugao: 8 },
      ].map((k) => (
        <span
          key={k.boja}
          className="absolute block overflow-hidden rounded-[6px] border-2 shadow-[0_1px_3px_rgba(22,22,26,0.25)]"
          style={{
            left: `${k.levo}px`,
            top: `${k.vrh}px`,
            width: "25px",
            height: "34px",
            background: PAPIR,
            borderColor: "#FFFFFF",
            transform: `rotate(${k.ugao}deg)`,
          }}
        >
          <span className="block h-[6px] w-full" style={{ background: k.boja }} />
          {/* Dve crte umesto teksta: reč se na ovoj veličini ne bi pročitala. */}
          <span
            className="mx-auto mt-[7px] block h-[3px] w-[14px] rounded-full"
            style={{ background: IVICA }}
          />
          <span
            className="mx-auto mt-[4px] block h-[3px] w-[9px] rounded-full"
            style={{ background: IVICA }}
          />
        </span>
      ))}
    </span>
  );
}

/** Jedna pločica reči: papir sa ivicom mastila i crtom koja glumi reč. */
function PlocicaReci({ ugao, sirina }: { ugao: number; sirina: number }) {
  return (
    <span
      className="flex flex-none items-center justify-center rounded-[5px] border-2 shadow-[0_1px_3px_rgba(22,22,26,0.25)]"
      style={{
        width: `${sirina}px`,
        height: "20px",
        background: PAPIR,
        borderColor: MASTILO,
        transform: `rotate(${ugao}deg)`,
      }}
    >
      <span
        className="block h-[3px] rounded-full"
        style={{ width: `${sirina - 10}px`, background: PRIGUSEN }}
      />
    </span>
  );
}

/**
 * Nauči rečenice i Složi rečenicu: tri pločice u nizu na traci po kojoj se
 * ređaju. Boje roda se ovde NE koriste: pločica nosi bilo koju reč, pa bi je
 * boja roda lažno predstavila kao imenicu.
 */
function VinjetaPlocice() {
  return (
    <span className="flex h-12 flex-col items-center justify-center gap-1.5">
      <span className="flex items-center gap-1.5">
        <PlocicaReci ugao={-5} sirina={20} />
        <PlocicaReci ugao={3} sirina={16} />
        <PlocicaReci ugao={-2} sirina={22} />
      </span>
      <span className="block h-[4px] w-16 rounded-full" style={{ background: ZUTA }} />
    </span>
  );
}

/** Dopuni rečenicu: reč, prazno mesto koje se popunjava, pa opet reč. */
function VinjetaPraznina() {
  return (
    <svg aria-hidden="true" viewBox="0 0 56 32" className="h-12 w-16">
      <rect x="1" y="12" width="14" height="6" rx="3" fill={MASTILO} />
      {/* Isprekidana ivica kaže da je mesto prazno, a ne da je tu neka reč. */}
      <rect
        x="19"
        y="6"
        width="18"
        height="17"
        rx="4"
        fill={ZUTA}
        stroke={MASTILO}
        strokeWidth="1.8"
        strokeDasharray="4 3"
      />
      <rect x="41" y="12" width="14" height="6" rx="3" fill={MASTILO} />
      {/* Crta na kojoj rečenica stoji, kao red u svesci. */}
      <path d="M1 28h54" stroke={IVICA} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Koja vinjeta ide uz koju igru. Redosled prikaza drže sekcije ekrana; ovde
 * stoji samo crtež.
 *
 * „Nauči rečenice" i „Složi rečenicu" namerno dele isti crtež: to su ista
 * pločice, jednom vođene a jednom same. Razliku nosi naziv, ne slika.
 */
const VINJETA: Record<VrstaIgre, React.ReactNode> = {
  parovi: <VinjetaParovi />,
  "brzo-biranje": <VinjetaMunja />,
  skakac: <VinjetaSkakac />,
  rod: <VinjetaRod />,
  mnozina: <VinjetaMnozina />,
  diktat: <VinjetaOlovka />,
  "ucenje-reci": <VinjetaKartica />,
  "ucenje-recenica": <VinjetaPlocice />,
  slagalica: <VinjetaPlocice />,
  dopuna: <VinjetaPraznina />,
};

/**
 * Naslov sekcije kao nalepnica: žuta, bela ivica, blag nagib - ista gramatika
 * kao ime na polici albuma. Tekst unutra ostaje običan naslov za čitač.
 */
function NaslovSekcije({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3.5">
      <span
        className="inline-block -rotate-1 rounded-lg border-[3px] px-2.5 py-0.5 text-[15px] shadow-[0_2px_5px_rgba(22,22,26,0.15)]"
        style={{ background: ZUTA, borderColor: "#FFFFFF", color: MASTILO, fontFamily: DISPLAY }}
      >
        {children}
      </span>
    </h2>
  );
}

// ── Pločice ─────────────────────────────────────────────────────────────────
// Pločica, ne red u spisku: svaka igra ima svoj crtež i display naslov, kao
// sličice na tezgi. Podloga svake ostaje papir - boju nose crteži, da ekran ne
// postane duga. Tri stanja, jedan izgled, pa se markup piše samo jednom.

/** Pločica koja se klikće. `kasni` je pomak u nizanju crteža pri ulasku. */
function PlocicaIgre({
  vrsta,
  kasni,
  onClick,
}: {
  vrsta: VrstaIgre;
  kasni: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${FOKUS} flex min-h-[120px] w-full flex-col items-center justify-center gap-2.5 rounded-2xl border p-3 text-center shadow-[0_3px_0_0_#DED8C8] motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
      style={{ background: PAPIR, borderColor: IVICA }}
    >
      <span
        aria-hidden="true"
        className="zack-zalepi flex h-12 items-center justify-center"
        style={{ ["--zack-kasni" as string]: `${kasni}ms` }}
      >
        {VINJETA[vrsta]}
      </span>
      <span
        className="block text-[15px] leading-tight"
        style={{ color: MASTILO, fontFamily: DISPLAY }}
      >
        {NAZIVI[vrsta]}
      </span>
    </button>
  );
}

/**
 * Pločica koja čeka prethodni korak: ista kartica, samo nije dugme - bledi
 * crtež, katanac i jedna mirna reč o tome šta se čeka. Tekst je OBAVEZAN, jer
 * katanac je ikona, a ikona sama ne sme da nosi značenje.
 *
 * Ovde nema nijedne reči prekora ni zapovesti: piše šta dolazi posle čega, a ne
 * šta dete „mora" ili šta „nije" uradilo.
 */
function PlocicaCeka({ vrsta, tekst }: { vrsta: VrstaIgre; tekst: string }) {
  return (
    <div
      className="flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center"
      style={{ background: PAPIR, borderColor: IVICA }}
    >
      <span aria-hidden="true" className="flex h-12 items-center justify-center opacity-40">
        {VINJETA[vrsta]}
      </span>
      <span
        className="block text-[15px] leading-tight"
        style={{ color: PRIGUSEN, fontFamily: DISPLAY }}
      >
        {NAZIVI[vrsta]}
      </span>
      <span
        className="font-heading flex items-center gap-1 text-[13px] font-bold leading-snug"
        style={{ color: PRIGUSEN }}
      >
        <Katanac />
        {tekst}
      </span>
    </div>
  );
}

/**
 * Pločica pod katancem članstva. Ista mirna kartica kao gore, samo joj je reč
 * druga: ovde se ne čeka nikakav korak deteta, pa piše prosto „Zaključano", a
 * zašto - stoji ispisano iznad pločica.
 */
function PlocicaZakljucana({ vrsta }: { vrsta: VrstaIgre }) {
  return <PlocicaCeka vrsta={vrsta} tekst="Zaključano" />;
}

/** Mirna rečenica iznad zaključanih pločica, uz katanac kao ukras. */
function RedKatanca({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-center gap-2.5 rounded-2xl border p-4 text-[15px] leading-relaxed"
      style={{ background: PAPIR, borderColor: IVICA, color: MASTILO }}
    >
      <span aria-hidden="true" className="flex-none" style={{ color: PRIGUSEN }}>
        <Katanac />
      </span>
      <span>{children}</span>
    </p>
  );
}

/** Prazna sekcija: nema šta da se radi, i to se kaže bez izvinjavanja. */
function RedPrazno({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="rounded-2xl border border-dashed p-5 text-center text-[15px] leading-relaxed"
      style={{ borderColor: IVICA, background: PAPIR, color: PRIGUSEN }}
    >
      {children}
    </p>
  );
}

// ── Ekran ───────────────────────────────────────────────────────────────────

type Poruka = "prazna-kesica" | "greska-kesice" | "nije-stiglo" | null;

export default function LekcijaClient({
  childId,
  lekcija,
  reci,
  stareReci,
  recenice,
  stareRecenice,
  pocetniProsaoReci,
  pocetniProsaoRecenice,
  pocetnoStanje,
  neotvorenaKesica,
  pocetniRekord,
  imaGramatike,
  zakljucano,
}: {
  childId: string;
  lekcija: Lekcija;
  reci: Rec[];
  /**
   * Stare reči iz ranijih lekcija za ponavljanje kroz igre: samo one koje dete
   * već ima u albumu, sa izbledelošću i brojem grešaka. Prva lekcija ih nema.
   */
  stareReci: StaraRec[];
  /**
   * Rečenice OVE lekcije. Iz njih se vidi i šta ekran uopšte sme da ponudi:
   * lekcija bez ijedne pločične rečenice nema „Nauči rečenice" ni „Složi
   * rečenicu", a lekcija bez ijedne rečenice nema celu sekciju „Rečenice".
   */
  recenice: Recenica[];
  /** Rečenice ranijih lekcija, za ponavljanje u slagalici i dopuni. */
  stareRecenice: Recenica[];
  /**
   * Da li je dete već prešlo faze učenja na ovoj lekciji. Polazno stanje
   * katanaca, ne konačno: prelazak u toku ove posete otključava odmah, bez
   * osvežavanja stranice.
   *
   * Kad se prolazi nisu mogli ni pročitati, stranica ovamo šalje `true` - kvar
   * pada u korist deteta.
   */
  pocetniProsaoReci: boolean;
  pocetniProsaoRecenice: boolean;
  pocetnoStanje: StavkaAlbuma[];
  neotvorenaKesica: number;
  /** Lični rekord u skakaču na ovoj lekciji, ili ništa ako ga još nema. */
  pocetniRekord: number | null;
  /**
   * Da li iz ove lekcije uopšte ima obrađenog gradiva za Milionera. Kad nema,
   * Milioner se NE prikazuje: dugme koje otvara prazan ekran je gore nego
   * dugme kog nema.
   */
  imaGramatike: boolean;
  /**
   * Bez aktivnog članstva (odluka vlasnice): igre, kesica i Milioner stoje pod
   * katancem sa MIRNOM porukom - bez cene i bez krivice, jer ovo čita dete.
   * Album, brojači i sve zarađeno ostaju netaknuti. Rute isto odbijaju (403),
   * ovde je samo izgled.
   */
  zakljucano: boolean;
}) {
  const [stanje, setStanje] = useState<StavkaAlbuma[]>(pocetnoStanje);
  // Ceo `VrstaIgre`, ne samo igre od reči: ljuska `Igra` sada ume da nacrta i
  // rečenično pitanje, pa se odavde biraju i slagalica, dopuna i učenje
  // rečenica. Spisak `IGRE` ostaje uži - vidi komentar uz njega.
  const [igra, setIgra] = useState<VrstaIgre | null>(null);
  // Milioner stoji odvojeno od igara i ne dodiruje ništa od ovoga: ne troši
  // srca, ne donosi sličice i ne javlja kraj partije. Zato mu je dovoljno jedno
  // da-ne stanje, bez ijednog poziva u `zavrsiIgru`.
  const [milioner, setMilioner] = useState(false);
  // Učenje reči zauzima ceo ekran, isto kao Milioner, pa mu je dovoljno jedno
  // da-ne stanje. Kraj mu se ipak obrađuje kao kraj partije, jer se u proveri
  // zarađuju prave sličice.
  const [ucenjeReci, setUcenjeReci] = useState(false);

  // Katanci učenja. Sede u stanju, a ne samo u propovima, da bi se otvorili u
  // istom trenutku kad dete pređe fazu - bez čekanja na mrežu i bez osvežavanja
  // stranice. Prelaze samo iz `false` u `true`: prođeno se ne poništava.
  const [prosaoReci, setProsaoReci] = useState(pocetniProsaoReci);
  const [prosaoRecenice, setProsaoRecenice] = useState(pocetniProsaoRecenice);

  // Dokle se koza popela u poslednjem skakaču. Visina je drugi rezultat te igre,
  // pored sličica, pa se posle partije i kaže - inače bi penjanje postojalo samo
  // dok igra traje. Ostale igre javljaju nulu i ništa se ne ispisuje.
  const [domet, setDomet] = useState(0);

  // Rekord se drži OVDE, a ne u igri, da bi druga partija u istom otvaranju
  // stranice već imala svež broj. Nula znači „još ga nema": tada se linija na
  // steni ne crta i rekord se detetu ne pominje.
  const [rekord, setRekord] = useState(pocetniRekord ?? 0);
  // Da li je baš poslednja partija oborila rekord. Prva partija ikad se ne
  // računa: tada rekorda nije ni bilo, pa nije bilo ni šta da se obori.
  const [novRekord, setNovRekord] = useState(false);

  // Sličice koje su ostale u ruci od prošlog puta moraju da se vrate u ruku,
  // inače dete nema čime da popuni mesta koja u albumu stoje prazna.
  const [uRuci, setURuci] = useState<Rec[]>(() =>
    pocetnoStanje.filter((s) => s.stanje === "u-ruci").map((s) => s.rec)
  );

  const [ceka, setCeka] = useState(neotvorenaKesica);
  const [otvaram, setOtvaram] = useState(false);
  // Slanje zarađenog i otvaranje kesice su dva različita posla i detetu se tako
  // i kažu. Jedno stanje za oba bi značilo da mu piše „Otvaram kesicu..." dok se
  // kesica još ni ne dodiruje.
  const [saljem, setSaljem] = useState(false);
  const [poruka, setPoruka] = useState<Poruka>(null);
  // Zaseban tekst za čitač ekrana. Ono što se vidi kao sličica mora i da se čuje.
  const [najava, setNajava] = useState("");

  // Dva brza tapa na „Otvori kesicu" ne smeju da pošalju dva poziva. Stanje
  // `otvaram` stiže tek u sledećem renderu, pa se čuva i u referenci.
  const uToku = useRef(false);

  // Ono što ni na kraju partije nije uspelo da se pošalje. Stoji ovde i ide uz
  // prvi sledeći pokušaj, da odigrana igra posle koje je mreža pukla ne bi
  // propala kad dete odigra sledeću. Referenca, ne stanje: čita se unutar
  // asinhronog toka, gde bi zatvorena vrednost stanja bila zastarela.
  const neposlato = useRef<string[]>([]);
  // Isto: drugi tap na „Probaj ponovo" ne sme da pokrene drugi tok.
  const krajUToku = useRef(false);

  const otvoriKesicu = useCallback(async () => {
    if (uToku.current) return;
    uToku.current = true;
    setOtvaram(true);
    setPoruka(null);

    try {
      const odgovor = await fetch(`/api/zack/${childId}/kesica`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lekcijaId: lekcija.id }),
      });
      if (!odgovor.ok) throw new Error(`kesica ${odgovor.status}`);

      const { kesica, ostalo } = citajKesicu(await odgovor.json());
      setCeka(ostalo);

      if (kesica.length === 0) {
        // Prazna kesica nije greška i ne sme da ostavi prazan ekran. Dete je
        // sve reči iz ove igre već videlo, i to mu se kaže mirno - istim
        // rečima koje stoje i na ekranu, izvedenim iz stanja albuma.
        setPoruka("prazna-kesica");
        setNajava(recenicePrazneKesice(stanje).join(" "));
        return;
      }

      // Spajanje, ne zamena: u ruci može već da stoji nešto od ranije.
      const novi = new Set(kesica.map((r) => r.id));
      setURuci((r) => [...r.filter((x) => !novi.has(x.id)), ...kesica]);
      setStanje((s) =>
        s.map((x): StavkaAlbuma => (novi.has(x.rec.id) ? { ...x, stanje: "u-ruci" } : x))
      );
      setNajava(`${STIGLO[oblikBroja(kesica.length)]}: ${kesica.length}. Tapni sličicu da je zalepiš.`);
    } catch {
      // Ništa nije izgubljeno: sličice su već zarađene u bazi i čekaju.
      setPoruka("greska-kesice");
      setNajava("Kesica se nije otvorila. Ništa nije izgubljeno, probaj ponovo.");
    } finally {
      uToku.current = false;
      setOtvaram(false);
    }
    // `stanje` je tu samo zbog najave prazne kesice; sme slobodno da obnavlja
    // ovaj callback, jer od njega ne zavisi nijedan efekat.
  }, [childId, lekcija.id, stanje]);

  /**
   * Ponovno slanje zarađenog, sa ČEKANJEM i proverom odgovora, za razliku od
   * slanja u toku igre koje sme da padne u tišini. Ruta je idempotentna
   * (ON CONFLICT DO NOTHING), pa reč koja je već stigla ne može da se duplira.
   * Vraća da li je zaista stiglo, jer se na tome zasniva šta se detetu kaže.
   */
  const posaljiZaradjeno = useCallback(
    async (recIdovi: string[]): Promise<boolean> => {
      if (recIdovi.length === 0) return true;
      try {
        const odgovor = await fetch(`/api/zack/${childId}/zaradi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recIdovi }),
        });
        return odgovor.ok;
      } catch {
        return false;
      }
    },
    [childId]
  );

  /**
   * Kraj partije: prvo se osigura zarađeno, pa tek onda otvara kesica. Spisak
   * tačnih dolazi iz same igre, jer samo ona zna šta je dete stvarno uradilo -
   * ruta zna samo ono što je do nje stiglo.
   *
   * Ako ponovno slanje ne prođe, kesica se NE otvara: bila bi to poruka o
   * uspehu preko toka koji nije uspeo. Umesto toga se kaže istina i spisak se
   * čuva za sledeći pokušaj.
   */
  const zavrsiIgru = useCallback(
    async (tacniRecIdovi: string[]) => {
      if (krajUToku.current) return;
      krajUToku.current = true;
      setSaljem(true);
      setPoruka(null);

      // Uz svež spisak ide i sve što je zaostalo od ranijih partija.
      const zaSlanje = [...new Set([...neposlato.current, ...tacniRecIdovi])];
      // `posaljiZaradjeno` ne baca, pa ovde nema šta da se hvata.
      const stiglo = await posaljiZaradjeno(zaSlanje);
      neposlato.current = stiglo ? [] : zaSlanje;
      krajUToku.current = false;
      setSaljem(false);

      if (!stiglo) {
        setPoruka("nije-stiglo");
        setNajava(
          "Internet trenutno ne radi kako treba, pa neke sličice iz ove igre možda nisu stigle. Probaj ponovo kad veza proradi."
        );
        return;
      }

      await otvoriKesicu();
    },
    [otvoriKesicu, posaljiZaradjeno]
  );

  /**
   * Javljanje da je faza učenja prođena. Poziv ide u POZADINI i njegov pad se
   * guta, a katanac se u stanju otvara odmah: dete ne sme da čeka mrežu za
   * nešto što je upravo uradilo.
   *
   * Izgubljen upis ne oduzima ništa. Ruta je idempotentna i red o prolasku ne
   * briše nikad, pa je najgore što se desi da sledeći dolazak na lekciju opet
   * ponudi fazu učenja - a ponavljanje učenja i inače nije kazna. Sličice, niz
   * i rekordi ne zavise od ovog reda.
   */
  const posaljiProlaz = useCallback(
    (faza: "reci" | "recenice") => {
      void fetch(`/api/zack/${childId}/ucenje`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lekcijaId: lekcija.id, faza }),
        // Dete često zatvori karticu čim vidi kraj učenja.
        keepalive: true,
      }).catch(() => {
        /* Katanac je već otvoren u stanju; ništa zarađeno ne zavisi od ovoga. */
      });
    },
    [childId, lekcija.id]
  );

  /**
   * Zajednički početak svakog ulaska u učenje ili igru. Domet i javljanje o
   * rekordu pripadaju PRETHODNOJ partiji, pa novu ne smeju da dočekaju. Sam
   * rekord OSTAJE - on se ne poništava.
   */
  const ocistiEkran = useCallback(() => {
    setPoruka(null);
    setDomet(0);
    setNovRekord(false);
  }, []);

  /**
   * Upis rekorda posle skakača. O tome da rekord SAMO raste brine ruta, pa se
   * ovde ništa ne poredi pre slanja: prima se ono što u bazi zaista stoji, a ne
   * ono što je poslato.
   *
   * Pad mreže se guta, kao i kod lepljenja. Sličice su ono što se ne sme
   * izgubiti i njih čuva `zavrsiIgru`; ako upis rekorda ne prođe, na ekranu
   * ostaje stari broj, jer je to ono što u bazi jeste. Detetu se ništa ne
   * prebacuje ni ne traži da pokušava ponovo.
   */
  const upisiRekord = useCallback(
    async (sprat: number) => {
      // Sa tla se ne postavlja rekord. Nula bi u bazi značila „rekord postoji",
      // pa bi se na steni pojavila linija na tlu.
      if (sprat <= 0) return;
      const prethodni = rekord;
      try {
        const odgovor = await fetch(`/api/zack/${childId}/rekord`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lekcijaId: lekcija.id, igra: "skakac", sprat }),
          // Dete često zatvori karticu čim vidi kraj partije.
          keepalive: true,
        });
        if (!odgovor.ok) return;
        const noviRekord = citajRekord(await odgovor.json());
        if (noviRekord === null) return;
        setRekord(noviRekord);
        // „Nov rekord" samo ako je pre njega nešto stajalo. Prvi rezultat prosto
        // postaje rekord i ne javlja se kao pobeda nad nečim.
        setNovRekord(prethodni > 0 && noviRekord > prethodni);
      } catch {
        /* Rekord nije stigao. Na ekranu ostaje onaj iz baze. */
      }
    },
    [childId, lekcija.id, rekord]
  );

  /**
   * Kraj igre, kako ga javlja sama igra. Zove se i kad dete izađe pre kraja
   * („Dosta za sad"), da mu ono što je do tada zaradilo ne ostane zaključano
   * iza nedovršene partije.
   */
  const naKrajIgre = useCallback(
    (tacniRecIdovi: string[], sprat: number, prosloSve: boolean) => {
      // Koja se igra upravo završila mora da se zapamti pre gašenja, jer se
      // rekord vodi po igri, a `sprat` veći od nule javlja samo skakač.
      const odigrana = igra;
      setIgra(null);
      setDomet(sprat);
      if (odigrana === "skakac") void upisiRekord(sprat);
      // Katanac rečenica otvara SAMO učenje rečenica, i samo kad je prošlo do
      // kraja. Izlaz na „Dosta za sad" ne otvara ništa - ali ni ne zatvara:
      // zarađeno iz te partije ide dalje kao i uvek, redom ispod.
      if (odigrana === "ucenje-recenica" && prosloSve) {
        setProsaoRecenice(true);
        posaljiProlaz("recenice");
      }
      void zavrsiIgru(tacniRecIdovi);
    },
    [igra, posaljiProlaz, upisiRekord, zavrsiIgru]
  );

  /** Poziv ide u pozadini. Ne čeka se, i njegov pad se namerno guta. */
  const posaljiLepljenje = useCallback(
    (recIdovi: string[]) => {
      if (recIdovi.length === 0) return;
      void fetch(`/api/zack/${childId}/zalepi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recIdovi }),
        // Dete često zatvori karticu čim zalepi. Bez ovoga pretraživač prekine
        // poziv u letu i sličica ostane u ruci do sledećeg puta.
        keepalive: true,
      }).catch(() => {
        /* Sličica je već isporučena u bazi, pa se ništa ne gubi. */
      });
    },
    [childId]
  );

  const zalepi = useCallback(
    (recIdovi: string[]) => {
      if (recIdovi.length === 0) return;
      const skup = new Set(recIdovi);
      // Prvo se vidi, pa se onda šalje. Dete ne sme da čeka mrežu.
      setURuci((r) => r.filter((x) => !skup.has(x.id)));
      setStanje((s) =>
        s.map((x): StavkaAlbuma => (skup.has(x.rec.id) ? { ...x, stanje: "zalepljena" } : x))
      );
      setPoruka(null);
      posaljiLepljenje(recIdovi);
    },
    [posaljiLepljenje]
  );

  const { zalepljene, ukupno } = brojac(stanje);

  // ── Milioner zauzima ceo ekran ────────────────────────────────────────────
  // Stoji pre igara, jer je i sam sebi ceo ekran. Izlaz iz njega ništa ne
  // predaje: nije bilo šta da se zaradi, pa nema ni šta da se sačuva.
  if (milioner) {
    return <Milioner childId={childId} lekcijaId={lekcija.id} onIzlaz={() => setMilioner(false)} />;
  }

  // ── Učenje reči zauzima ceo ekran ─────────────────────────────────────────
  // Izlaz („Dosta za sad") stoji UNUTAR učenja, kao i kod igre: samo ono zna
  // šta je dete do tog trenutka zaradilo.
  if (ucenjeReci) {
    return (
      <UcenjeReci
        childId={childId}
        reci={reci}
        onKraj={(tacni, prosloSve) => {
          setUcenjeReci(false);
          // Katanac vežbi otvara samo učenje prođeno DO KRAJA. Ranijim izlaskom
          // se ništa ne gubi - ono što je zarađeno ide dole, kao i uvek.
          if (prosloSve) {
            setProsaoReci(true);
            posaljiProlaz("reci");
          }
          // Ovo se NE sme preskočiti ni u jednom slučaju: `zavrsiIgru` je ono
          // što garantuje da zarađeno stvarno stigne (slanje iz same provere
          // sme tiho da padne) i što otvara kesicu.
          void zavrsiIgru(tacni);
        }}
      />
    );
  }

  // ── Igra zauzima ceo ekran ────────────────────────────────────────────────
  if (igra) {
    // Izlaz iz igre („Dosta za sad") stoji unutar same igre, jer samo ona zna
    // šta je dete do tog trenutka zaradilo. Izlaz odavde bi ugasio igru bez
    // spiska tačnih, pa bi ponovno slanje ostalo bez ičega da pošalje.
    return (
      <Igra
        childId={childId}
        reci={reci}
        stare={stareReci}
        recenice={recenice}
        stareRecenice={stareRecenice}
        vrsta={igra}
        rekord={rekord > 0 ? rekord : null}
        onKraj={naKrajIgre}
      />
    );
  }

  const imaPravilo = Boolean(lekcija.pravilo_tekst ?? lekcija.pravilo_naslov);

  // ── Šta lekcija uopšte ume da ponudi ──────────────────────────────────────
  // Pločica koja otvara prazan ekran je gora od pločice koje nema, pa se sve
  // odlučuje iz sadržaja: ako rečenica nije podobna za pločice, nema slagalice
  // ni učenja rečenica; ako nijedna nema prazninu, nema dopune.
  const imaReci = reci.length > 0;
  const imaSlagalicu = recenice.some(podobnaZaSlagalicu);
  const imaDopunu = recenice.some(podobnaZaDopunu);

  // KATANAC SE NIKAD NE VEZUJE ZA USLOV KOJI SE NE MOŽE ISPUNITI.
  // Učenje rečenica se pravi od pločica, pa lekcija bez ijedne pločične
  // rečenice tu fazu NEMA. Kad je nema, nema se ni šta preći - i dopuna stoji
  // otvorena od prvog trenutka. Isto važi za lekciju bez reči i fazu učenja
  // reči. Katanac koji se ne može otvoriti nije mirno obaveštenje nego ćorsokak.
  const cekaUcenjeReci = imaReci && !prosaoReci;
  const cekaUcenjeRecenica = imaSlagalicu && !prosaoRecenice;
  // Bedž sa neotvorenom kesicom ima svoje dugme, pa dok se ona otvara i sam
  // kaže da se otvara. Kad bedža nema, čekanje mora da dobije svoju karticu,
  // inače dete posle odigrane igre nakratko gleda ekran na kom se ništa ne
  // dešava i pomisli da mu je trud propao.
  const bedzKesice = ceka > 0 && uRuci.length === 0;
  const zauzeto = otvaram || saljem;
  const natpisZauzeto = saljem ? "Šaljem..." : "Otvaram...";

  return (
    <div>
      {/* Sve što se dešava sa kesicom i lepljenjem stiže i do čitača ekrana. */}
      <p aria-live="polite" className="sr-only">
        {najava}
      </p>

      <p className="mb-4">
        <Link
          href={`/zack/${childId}`}
          className={`${FOKUS} font-heading inline-flex items-center gap-1.5 rounded-lg py-1 text-[15px] font-bold`}
          style={{ color: PRIGUSEN }}
        >
          <Strelica nazad />
          Sve lekcije
        </Link>
      </p>

      {/* Dokle se koza popela. Stoji iznad kesice, jer je i to rezultat upravo
          odigrane partije, a ne podatak o lekciji. Bez glagola u prošlom vremenu
          za dete: penje se koza, pa se rod slaže sa njom.

          OVDE NEMA NIČEGA PREKORNOG. Kad rekord nije oboren, ne piše se ni „nisi
          uspeo" ni koliko je falilo - rekord prosto stoji kao podatak, isto kao
          i visina. Kad ga nema ili je jednak dometu (prva partija, oboren
          rekord), ne pominje se uopšte, da se broj ne ponavlja dvaput. */}
      {domet > 0 && (
        <section
          className="mb-4 rounded-2xl border px-4 py-2.5 text-center"
          style={{ background: PAPIR, borderColor: IVICA }}
        >
          {/* Uz broj ide i ime pojasa („do snega, 19. sprat"). Broj dete
              zaboravi do sutra, ime ne, pa je ime ono što od partije ostane. */}
          <p className="font-heading text-[15px] font-bold" style={{ color: PRIGUSEN }}>
            {`Koza se popela ${dokleSePopela(domet)}.`}
          </p>
          {novRekord && (
            <p className="font-heading mt-1 text-[15px] font-bold" style={{ color: ZELENA }}>
              Nov rekord!
            </p>
          )}
          {rekord > domet && (
            <p className="mt-1 text-[14px] leading-snug" style={{ color: PRIGUSEN }}>
              {`Tvoj rekord: ${opisSprata(rekord)}.`}
            </p>
          )}
        </section>
      )}

      {/* ── Kesica je PRVO što dete vidi ────────────────────────────────────
          Iznad naslova, iznad svega. To je jedini razlog zbog kog se dete vraća
          sutradan, pa ne sme da bude pri dnu ekrana.

          Pod katancem se kesica i lepljenje NE prikazuju: zarađeno mirno čeka
          u bazi i dočekaće dete kad se članstvo uključi - ništa se ne oduzima,
          samo se ne mami dugmetom koje bi vratilo 403. */}
      {!zakljucano && bedzKesice && (
        /* Prava kesica sa sličicama: crvena, debela bela ivica, blag nagib i
           nazubljena gornja ivica po kojoj se cepa. Nagib nosi omotač, da se
           dugme unutra ne bori sa zarotiranim fokusom. */
        <section className="zack-zalepi mb-6 -rotate-1">
          <div
            className="relative overflow-hidden rounded-2xl border-[3px] p-4 pt-6 shadow-[0_5px_14px_rgba(22,22,26,0.28)]"
            style={{ background: CRVENA, borderColor: "#FFFFFF" }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 100 6"
              preserveAspectRatio="none"
              className="absolute inset-x-0 top-0 h-2.5 w-full"
            >
              <path d={CIK_CAK} fill={CRVENA_SENKA} />
            </svg>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <h2
                  className="flex items-center gap-2 text-[20px] leading-tight text-white"
                  style={{ fontFamily: DISPLAY }}
                >
                  <span style={{ color: ZUTA }}>
                    <Zvezdica velika />
                  </span>
                  {`${ceka} ${CEKA[oblikBroja(ceka)]}`}
                </h2>
                <p className="mt-1.5 text-[15px] font-medium leading-snug text-white">
                  {/* Bez glagola u prošlom vremenu: „zaradio" i „zaradila" nisu isto,
                      a ovo čitaju i devojčice i dečaci. */}
                  Otvori kesicu da vidiš šta je unutra.
                </p>
              </div>
              {/* Kesica kao lik: zatvorena čeka i mami, na tap puca pečat.
                  Čist ukras - broj i poziv već piše levo od nje. */}
              <Kesica stanje={otvaram ? "otvara-se" : "zatvorena"} />
            </div>
            <button
              type="button"
              onClick={() => void otvoriKesicu()}
              disabled={zauzeto}
              className={`${FOKUS_NA_CRVENOJ} mt-3.5 block min-h-[60px] w-full rounded-2xl border-[3px] text-[19px] shadow-[0_3px_0_0_#8F1B14] disabled:opacity-60 motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
              style={{ background: ZUTA, borderColor: "#FFFFFF", color: MASTILO, fontFamily: DISPLAY }}
            >
              {zauzeto ? natpisZauzeto : "Otvori kesicu"}
            </button>
          </div>
        </section>
      )}

      {!zakljucano && zauzeto && !bedzKesice && (
        <div
          className="mb-6 flex items-center justify-center gap-4 rounded-2xl border-[3px] p-4"
          style={{ background: PAPIR, borderColor: ZUTA }}
        >
          {/* Posle igre kesica najčešće puca baš ovde, bez bedža iznad: dok
              se čeka odgovor, vidi se kako se cepa. Dok se tek šalje
              zarađeno, kesica se još ne dira, pa je i nema. */}
          {otvaram && <Kesica stanje="otvara-se" />}
          <p
            className="font-heading text-center text-[18px] font-bold"
            style={{ color: MASTILO }}
          >
            {saljem ? "Samo trenutak..." : "Otvaram kesicu..."}
          </p>
        </div>
      )}

      {/* ── Sličice u ruci ──────────────────────────────────────────────────
          Stoje tu dok ih dete ne zalepi. Lepljenje jednu po jednu je zabavno
          prve nedelje, ali „zalepi sve" mora da postoji, jer je u petoj nedelji
          tapkanje po dvadeset sličica teret. */}
      {!zakljucano && uRuci.length > 0 && (
        <section
          className="mb-6 rounded-2xl border-[3px] p-4"
          style={{ background: PAPIR, borderColor: CRVENA_ZNAK }}
        >
          <h2
            className="text-[19px] leading-tight"
            style={{ color: MASTILO, fontFamily: DISPLAY }}
          >
            {`${uRuci.length} ${recSlicica(uRuci.length)} u ruci`}
          </h2>
          <p className="mt-1.5 text-[15px] leading-snug" style={{ color: PRIGUSEN }}>
            Tapni sličicu da je zalepiš u album.
          </p>

          <ul className="mt-4 grid grid-cols-3 gap-3">
            {/* Sličice iz pocepane kesice ispadaju jedna za drugom, istim
                staggerom kao pločice igara. Ključ po reči čuva već završene
                animacije: lepljenje susedne sličice ne pokreće ove ponovo. */}
            {uRuci.map((rec, redni) => (
              <li
                key={rec.id}
                className="zack-zalepi"
                style={{ ["--zack-kasni" as string]: `${Math.min(redni * 60, 540)}ms` }}
              >
                <Slicica rec={rec} stanje="u-ruci" onClick={() => zalepi([rec.id])} />
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => zalepi(uRuci.map((r) => r.id))}
            className={`${FOKUS} font-heading mt-4 block min-h-[56px] w-full rounded-2xl border-2 text-[17px] font-bold motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
            style={{ background: "transparent", borderColor: MASTILO, color: MASTILO }}
          >
            Zalepi sve
          </button>

          {ceka > 0 && (
            <p className="mt-3 text-center text-[14px] leading-snug" style={{ color: PRIGUSEN }}>
              {`Još ${ceka} ${CEKA[oblikBroja(ceka)]} u sledećoj kesici.`}
            </p>
          )}
        </section>
      )}

      {/* Prazna kesica i pad mreže. Ni jedno ni drugo ne sme da ostavi prazan
          ekran posle odigrane igre. */}
      {poruka === "prazna-kesica" && (
        <section
          className="mb-6 rounded-2xl border p-4"
          style={{ background: PAPIR, borderColor: IVICA }}
        >
          <div className="flex items-center gap-4">
            {/* Otvoren, spljošten paketić: nije tuga, samo istina - unutra
                trenutno nema ničega. */}
            <Kesica stanje="prazna" />
            <div className="min-w-0 flex-1 space-y-1">
              {recenicePrazneKesice(stanje).map((recenica) => (
                <p
                  key={recenica}
                  className="text-[16px] leading-relaxed"
                  style={{ color: PRIGUSEN }}
                >
                  {recenica}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ponovno slanje nije prošlo. Ovde se NE sme reći da je sve na broju,
          jer nije: deo iz ove partije možda nije stigao do baze. Kaže se
          mirno, bez uzvičnika i bez prebacivanja, i ponudi se pokušaj ponovo -
          spisak stoji sačuvan i ide uz njega. */}
      {poruka === "nije-stiglo" && (
        <section
          className="mb-6 rounded-2xl border-2 p-4"
          style={{ background: PAPIR, borderColor: IVICA }}
        >
          <p className="text-[16px] leading-relaxed" style={{ color: MASTILO }}>
            Internet trenutno ne radi kako treba, pa neke sličice iz ove igre možda nisu stigle.
            Probaj ponovo kad veza proradi.
          </p>
          <button
            type="button"
            onClick={() => void zavrsiIgru([])}
            disabled={zauzeto}
            className={`${FOKUS} font-heading mt-3 block min-h-[52px] w-full rounded-2xl border-2 text-[17px] font-bold disabled:opacity-60`}
            style={{ background: "transparent", borderColor: MASTILO, color: MASTILO }}
          >
            {zauzeto ? natpisZauzeto : "Probaj ponovo"}
          </button>
        </section>
      )}

      {poruka === "greska-kesice" && (
        <section
          className="mb-6 rounded-2xl border-2 p-4"
          style={{ background: PAPIR, borderColor: IVICA }}
        >
          {/* Ovde se sme reći da ništa nije izgubljeno: do ove poruke se stiže
              tek pošto je zarađeno potvrđeno upisano, pa sličice zaista čekaju
              u bazi. Pala je samo isporuka iz kesice. */}
          <p className="text-[16px] leading-relaxed" style={{ color: MASTILO }}>
            Kesica se sad nije otvorila. Ništa nije izgubljeno, sve tvoje sličice te i dalje čekaju.
          </p>
          {/* Kad bedž stoji iznad, on već nosi dugme koje radi isto. Drugo
              dugme odmah ispod prvog detetu izgleda kao izbor, a nije. */}
          {!bedzKesice && (
            <button
              type="button"
              onClick={() => void otvoriKesicu()}
              disabled={zauzeto}
              className={`${FOKUS} font-heading mt-3 block min-h-[52px] w-full rounded-2xl border-2 text-[17px] font-bold disabled:opacity-60`}
              style={{ background: "transparent", borderColor: MASTILO, color: MASTILO }}
            >
              {zauzeto ? natpisZauzeto : "Probaj ponovo"}
            </button>
          )}
        </section>
      )}

      {/* ── Naslov i brojač ─────────────────────────────────────────────────
          Ista korica kao na polici: broj lekcije je crvena nalepnica sa belom
          ivicom i blagim nagibom, naziv je naslov korice u display slovu. Nagib
          iz broja lekcije, nikad iz slučajnog, da ne poskakuje pri osvežavanju. */}
      <header className="mb-6">
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden="true"
            className="zack-zalepi flex h-14 w-14 flex-none items-center justify-center rounded-xl border-[3px] text-[24px] tabular-nums shadow-[0_2px_5px_rgba(22,22,26,0.2)]"
            style={{
              background: CRVENA,
              borderColor: "#FFFFFF",
              color: "#FFFFFF",
              fontFamily: DISPLAY,
              transform: `rotate(${lekcija.broj % 2 === 0 ? 2 : -2}deg)`,
              ["--zack-r" as string]: `${lekcija.broj % 2 === 0 ? 2 : -2}deg`,
            }}
          >
            {lekcija.broj}
          </span>
          <h1
            className="min-w-0 flex-1 text-[26px] leading-tight tracking-tight"
            style={{ color: MASTILO, fontFamily: DISPLAY }}
          >
            <span className="sr-only">{`Lekcija ${lekcija.broj}: `}</span>
            {lekcija.naziv}
          </h1>
        </div>

        {/* Brojač je jedini broj na ekranu koji sme da bude ovako krupan, i
            jedini koji i dete i roditelj razumeju iz prve. Živ je, jer raste u
            trenutku lepljenja. */}
        <p className="mt-3.5" aria-live="polite">
          <span className="sr-only">{`U albumu: ${zalepljene} od ${ukupno} ${recSlicica(ukupno)}`}</span>
          <span aria-hidden="true" className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
            <span
              className="text-[34px] leading-none"
              style={{ color: MASTILO, fontFamily: DISPLAY }}
            >
              {zalepljene}
            </span>
            <span className="font-heading text-[17px] font-bold" style={{ color: PRIGUSEN }}>
              od
            </span>
            <span
              className="text-[34px] leading-none"
              style={{ color: MASTILO, fontFamily: DISPLAY }}
            >
              {ukupno}
            </span>
            <span className="font-heading text-[17px] font-bold" style={{ color: PRIGUSEN }}>
              {recSlicica(ukupno)}
            </span>
          </span>
        </p>
      </header>

      {/* ── Podsetnik na pravilo ────────────────────────────────────────────
          Papirić iz sveske zalepljen trakom preko gornje ivice, nikad veliki
          blok. Dete je došlo da igra, ne da čita. */}
      {imaPravilo && (
        <section
          className="relative mb-6 mt-2 -rotate-[0.6deg] rounded-lg border p-4 shadow-[0_3px_8px_rgba(22,22,26,0.12)]"
          style={{ background: PAPIR, borderColor: IVICA }}
        >
          <span
            aria-hidden="true"
            className="absolute -top-2.5 left-1/2 block h-5 w-24 -translate-x-1/2 -rotate-2 rounded-[2px]"
            style={{ background: "rgba(255,196,0,0.42)", boxShadow: "0 1px 2px rgba(22,22,26,0.08)" }}
          />
          {lekcija.pravilo_naslov && (
            <h2 className="font-heading text-[16px] font-bold leading-snug" style={{ color: MASTILO }}>
              {lekcija.pravilo_naslov}
            </h2>
          )}
          {lekcija.pravilo_tekst && (
            <p className="mt-1 text-[15px] leading-relaxed" style={{ color: PRIGUSEN }}>
              <Isticanje tekst={lekcija.pravilo_tekst} tema="svetla" />
            </p>
          )}
          {lekcija.pravilo_primer && (
            <p
              lang="de"
              className="font-heading mt-2 text-[16px] font-bold leading-snug"
              style={{ color: PLAVA }}
            >
              <Isticanje tekst={lekcija.pravilo_primer} tema="svetla" />
            </p>
          )}
        </section>
      )}

      {/* ── Zašto je zaključano ──────────────────────────────────────────────
          Kad članstvo ne važi, razlog stoji JEDNOM, iznad svih sekcija - dakle
          pre prve zaključane pločice koju dete uopšte vidi. Ranije je stajao
          tek kod vežbi, pa je dete prvo naletalo na katance u Učenju, bez ijedne
          reči o tome zašto. Katanac bez razloga nije mirno obaveštenje.

          Ista mirna rečenica koju vraćaju i rute: bez cene, bez krivice i bez
          ijednog dugmeta za plaćanje - novac je roditeljska strana, dete ovde
          samo vidi da igre čekaju.

          KATANAC ČLANSTVA IMA PREDNOST NAD KATANCEM UČENJA. Dok stoji ovaj
          razlog, nijedna sekcija ispod ne sme da doda svoj („Vežbe se
          otključavaju kad jednom pređeš Učenje.", „Otključava se kad jednom
          pređeš Nauči rečenice."). Jedan katanac, jedan razlog: dva razloga za
          istu pločicu su jedan razlog previše. */}
      {zakljucano && (
        <div className="mb-6">
          <RedKatanca>{PORUKA_ZAKLJUCANO}</RedKatanca>
        </div>
      )}

      {/* ── Učenje ───────────────────────────────────────────────────────────
          UVEK PRVO i uvek otvoreno. Reč se prvo vidi, pa tek onda vežba.
          „Nauči reči" ostaje otvoreno i pošto je jednom prođeno: povratak na
          učenje je dobrodošao, nikad korak unazad. */}
      <section className="mb-8">
        <NaslovSekcije>Učenje</NaslovSekcije>
        {!imaReci && !imaSlagalicu ? (
          <RedPrazno>
            U ovoj lekciji još nema gradiva, pa nema ni šta da se uči. Vrati se malo kasnije.
          </RedPrazno>
        ) : zakljucano ? (
          /* Zašto je zaključano piše IZNAD, jednom za sve tri sekcije. Ista
             poruka uz svaku sekciju bila bi opomena, a ovo je samo
             obaveštenje. */
          <ul className="grid grid-cols-2 gap-3">
            {imaReci && (
              <li>
                <PlocicaZakljucana vrsta="ucenje-reci" />
              </li>
            )}
            {imaSlagalicu && (
              <li>
                <PlocicaZakljucana vrsta="ucenje-recenica" />
              </li>
            )}
          </ul>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {imaReci && (
              <li>
                <PlocicaIgre
                  vrsta="ucenje-reci"
                  kasni={0}
                  onClick={() => {
                    ocistiEkran();
                    setUcenjeReci(true);
                  }}
                />
              </li>
            )}
            {imaSlagalicu && (
              <li>
                {cekaUcenjeReci ? (
                  <PlocicaCeka vrsta="ucenje-recenica" tekst="Posle učenja reči" />
                ) : (
                  <PlocicaIgre
                    vrsta="ucenje-recenica"
                    kasni={60}
                    onClick={() => {
                      ocistiEkran();
                      setIgra("ucenje-recenica");
                    }}
                  />
                )}
              </li>
            )}
          </ul>
        )}
      </section>

      {/* ── Vežbe ────────────────────────────────────────────────────────────
          Šest igara od reči. Stoje iza učenja, jer se vežba ono što je već
          viđeno - a ne oduzimaju ništa dok čekaju. */}
      <section className="mb-8">
        <NaslovSekcije>Vežbe</NaslovSekcije>
        {zakljucano ? (
          /* Razlog stoji iznad svih sekcija, pa se ovde ne ponavlja. Ova grana
             namerno dolazi PRE grane sa čekanjem učenja: dok važi katanac
             članstva, red „Vežbe se otključavaju kad jednom pređeš Učenje." se
             ne crta, jer bi detetu ponudio drugi razlog za isti katanac. */
          <ul className="grid grid-cols-2 gap-3">
            {IGRE.map((vrsta) => (
              <li key={vrsta}>
                <PlocicaZakljucana vrsta={vrsta} />
              </li>
            ))}
          </ul>
        ) : reci.length === 0 ? (
          <RedPrazno>
            U ovoj lekciji još nema reči, pa nema ni šta da se igra. Vrati se malo kasnije.
          </RedPrazno>
        ) : cekaUcenjeReci ? (
          <>
            {/* Konstatacija, ne zapovest: piše ŠTA otključava vežbe, ne šta
                dete treba da uradi i ne šta nije uradilo. „Jednom" je tu
                namerno - drugi put se više ne traži. */}
            <RedKatanca>Vežbe se otključavaju kad jednom pređeš Učenje.</RedKatanca>
            <ul className="mt-3 grid grid-cols-2 gap-3">
              {IGRE.map((vrsta) => (
                <li key={vrsta}>
                  <PlocicaCeka vrsta={vrsta} tekst="Posle učenja reči" />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {IGRE.map((vrsta, redni) => (
              <li key={vrsta}>
                <PlocicaIgre
                  vrsta={vrsta}
                  kasni={redni * 60}
                  onClick={() => {
                    ocistiEkran();
                    setIgra(vrsta);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Rečenice ─────────────────────────────────────────────────────────
          Cele sekcije nema kad lekcija nema nijednu upotrebljivu rečenicu.
          Prazan naslov bi obećavao nešto čega nema. */}
      {(imaSlagalicu || imaDopunu) && (
        <section className="mb-8">
          <NaslovSekcije>Rečenice</NaslovSekcije>
          {zakljucano ? (
            /* Sekcija OSTAJE na ekranu, samo pod katancem - isto kao Učenje i
               Vežbe. Da nestane, detetu bi pod katancem falio deo lekcije koji
               inače postoji, a to izgleda kao da mu je nešto oduzeto. Razlog
               piše iznad, pa se ni ovde ne ponavlja, i red o učenju rečenica se
               u ovoj grani ne crta. */
            <ul className="grid grid-cols-2 gap-3">
              {imaSlagalicu && (
                <li>
                  <PlocicaZakljucana vrsta="slagalica" />
                </li>
              )}
              {imaDopunu && (
                <li>
                  <PlocicaZakljucana vrsta="dopuna" />
                </li>
              )}
            </ul>
          ) : cekaUcenjeRecenica ? (
            /* Kad se čeka, čekaju OBE pločice: dopuna se otvara samo uz
               slagalicu, a bez slagalice ovde uopšte ne bi bilo katanca. Zato
               jedna rečenica pokriva celu sekciju. */
            <>
              <RedKatanca>Otključava se kad jednom pređeš Nauči rečenice.</RedKatanca>
              <ul className="mt-3 grid grid-cols-2 gap-3">
                <li>
                  <PlocicaCeka vrsta="slagalica" tekst="Posle učenja rečenica" />
                </li>
                {imaDopunu && (
                  <li>
                    <PlocicaCeka vrsta="dopuna" tekst="Posle učenja rečenica" />
                  </li>
                )}
              </ul>
            </>
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {imaSlagalicu && (
                <li>
                  <PlocicaIgre
                    vrsta="slagalica"
                    kasni={0}
                    onClick={() => {
                      ocistiEkran();
                      setIgra("slagalica");
                    }}
                  />
                </li>
              )}
              {imaDopunu && (
                <li>
                  <PlocicaIgre
                    vrsta="dopuna"
                    kasni={60}
                    onClick={() => {
                      ocistiEkran();
                      setIgra("dopuna");
                    }}
                  />
                </li>
              )}
            </ul>
          )}
        </section>
      )}

      {/* ── Milioner ─────────────────────────────────────────────────────────
          NAMERNO ODVOJEN OD IGARA, i naslovom i izgledom. Milioner ne donosi
          sličice i ne troši srca, pa u spisku igara ne sme da stoji: dete bi ga
          odigralo očekujući kesicu i doživelo bi izostanak nagrade kao kaznu za
          slab rezultat. Ovako se unapred zna da je to provera, a ne igra.

          Kad iz lekcije nema nijedne obrađene gramatičke tačke, ovog odeljka
          nema uopšte. */}
      {imaGramatike && (
        <section className="mb-8">
          <h2
            className="mb-3 text-[12px] uppercase tracking-[.18em]"
            style={{ color: PRIGUSEN, fontFamily: DISPLAY }}
          >
            Provera celine
          </h2>
          {/* Tamna kartica: mini najava Milionerovog TV studija, plava noć sa
              zlatnim šestougaonikom. Već po boji se vidi da OVO nije igra za
              sličice. Pod katancem ista kartica nije dugme i kaže „Zaključano" -
              zašto, već piše iznad, jednom za ceo ekran. */}
          {zakljucano ? (
            <div
              className="flex min-h-[76px] w-full items-center gap-3.5 rounded-2xl border-[3px] px-4 py-4 text-left opacity-90"
              style={{
                background: `radial-gradient(120% 130% at 50% 0%, ${NOC_SJAJ} 0%, ${NOC} 72%)`,
                borderColor: NOC_SJAJ,
              }}
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-16 flex-none items-center justify-center opacity-60"
                style={{ background: ZLATNA, clipPath: HEX_MALI }}
              >
                <span className="text-[19px]" style={{ color: TAMNO, fontFamily: DISPLAY }}>
                  ?
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[19px] leading-tight text-white"
                  style={{ fontFamily: DISPLAY }}
                >
                  Milioner
                </span>
                <span
                  className="mt-1 flex items-center gap-1.5 text-[14px] font-bold leading-snug"
                  style={{ color: NOC_PRIGUSENA }}
                >
                  <Katanac />
                  Zaključano
                </span>
              </span>
            </div>
          ) : (
          <button
            type="button"
            onClick={() => {
              setPoruka(null);
              setMilioner(true);
            }}
            className={`${FOKUS} flex min-h-[76px] w-full items-center gap-3.5 rounded-2xl border-[3px] px-4 py-4 text-left shadow-[0_4px_12px_rgba(8,18,46,0.35)] motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
            style={{
              background: `radial-gradient(120% 130% at 50% 0%, ${NOC_SJAJ} 0%, ${NOC} 72%)`,
              borderColor: ZLATNA,
            }}
          >
            <span
              aria-hidden="true"
              className="flex h-10 w-16 flex-none items-center justify-center"
              style={{ background: ZLATNA, clipPath: HEX_MALI }}
            >
              <span className="text-[19px]" style={{ color: TAMNO, fontFamily: DISPLAY }}>
                ?
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span
                className="block text-[19px] leading-tight text-white"
                style={{ fontFamily: DISPLAY }}
              >
                Milioner
              </span>
              {/* Bez ovoga bi Milioner bio šesta igra koja „ne radi kako treba". */}
              <span
                className="mt-1 block text-[14px] leading-snug"
                style={{ color: NOC_PRIGUSENA }}
              >
                Pitanja iz gramatike. Ovde nema sličica ni srca, samo provera.
              </span>
            </span>
            <span style={{ color: ZLATNA }}>
              <Strelica />
            </span>
          </button>
          )}
        </section>
      )}

      {/* ── Album ────────────────────────────────────────────────────────── */}
      <section>
        <NaslovSekcije>Album</NaslovSekcije>
        {stanje.length === 0 ? (
          <p
            className="rounded-2xl border border-dashed p-5 text-center text-[15px] leading-relaxed"
            style={{ borderColor: IVICA, background: PAPIR, color: PRIGUSEN }}
          >
            Ovde će stajati tvoje sličice, čim lekcija dobije prve reči.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-3">
            {stanje.map((s) => (
              <li key={s.rec.id}>
                {/* Reč koja je „u ruci" se ovde crta kao PRAZNO mesto. Album
                    ne sme da oda reč koju dete još nije zalepilo. */}
                <Slicica rec={s.rec} stanje={s.stanje === "u-ruci" ? "prazno" : s.stanje} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
