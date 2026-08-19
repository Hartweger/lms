// Prodajna strana zack!-a za roditelje. Jedina stranica pod /zack koja koristi
// punu širinu: sekcije su pune trake (papir, mastilo, plava), a sadržaj unutar
// njih drži svoju kolonu. Sve ostalo nasleđuje od dečjeg dela: papirni okvir,
// display slovo, isključeno školsko merenje - i ceo ukrasni rečnik iz Ukras.tsx.
//
// Glas je Natašin, ti-forma prema roditelju, bez roda deteta („tvoje dete").
// Nijedan broj ovde nije izmišljen: deset minuta, dve nedelje, 1.200 dinara
// mesečno po detetu i program Ministarstva su činjenice proizvoda. Utisaka
// korisnika nema, jer ih još nemamo. Peti razred se NE ističe u naslovima -
// stižu svi razredi, pa dostupnost živi sitno u FAQ-u, ne u reklami.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Slicica from "@/components/zack/Slicica";
import type { Rec, Rod } from "@/lib/zack/rec";
import {
  CRVENA,
  CRVENA_ZNAK,
  DISPLAY,
  GRESKA,
  IVICA,
  MASTILO,
  MiniSlicica,
  PAPIR,
  PLAVA,
  PRIGUSEN,
  SJAJ,
  TablicaOkvir,
  ZUTA,
  ZackZnak,
} from "../Ukras";
import LepljivPoziv from "./LepljivPoziv";
import Meni from "./Meni";
import Otkrij from "./Otkrij";

// Za razliku od dečjih ekrana (čije adrese nose ključ deteta), ova strana je
// javna i SME u pretragu - njoj je posao da dovodi roditelje.
export const metadata: Metadata = {
  title: "zack! - nemački za osnovce",
  description:
    "Album sa sličicama u kom tvoje dete uči nemački po deset minuta dnevno - po školskom programu, bez reklama i bez ocena.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "zack! - nemački za osnovce",
    description:
      "Album sa sličicama u kom tvoje dete uči nemački po deset minuta dnevno - po školskom programu.",
  },
};

// Tekst prigušene boje na tamnoj traci: izmereno 10.3:1 na mastilu.
const PRIGUSEN_NA_TAMNOM = "#C9C4B4";

// ── Rečnik mockupa ──────────────────────────────────────────────────────────
// Sličice u ovim ilustracijama su PRAVE sličice iz proizvoda (ista komponenta
// koju dete gleda u albumu), sa stvarnim rečima iz školske teme i tačnim
// rodovima - boje o rodu ne smeju da lažu ni u reklami. Sjajna je tačno jedna
// i to pravi izuzetak (die Tür, stvaran izuzetak iz lekcije „Im
// Klassenzimmer"), kao i u proizvodu. Baš Tür, a ne Mädchen: reč je kratka,
// pa se na uskom ekranu ne prelama nasred reči („Mäd-chen").
function rec(
  redniBroj: number,
  de: string,
  sr: string,
  rod: Rod,
  ikonica: string | null,
  izuzetak = false
): Rec {
  return {
    id: `landing-${redniBroj}`,
    redni_broj: redniBroj,
    de,
    sr,
    rod,
    mnozina: null,
    vrsta: "imenica",
    izuzetak,
    ikonica,
  };
}

const ALBUM_MOCK: { rec: Rec; stanje: "zalepljena" | "izbledela" | "prazno" }[] = [
  { rec: rec(1, "Stuhl", "stolica", "der", "1fa91"), stanje: "zalepljena" },
  { rec: rec(2, "Tasche", "torba", "die", "1f45c"), stanje: "zalepljena" },
  { rec: rec(3, "Heft", "sveska", "das", "1f4d3"), stanje: "zalepljena" },
  { rec: rec(4, "Lehrerin", "nastavnica", "die", "1f469-200d-1f3eb"), stanje: "zalepljena" },
  { rec: rec(5, "Fenster", "prozor", "das", "1fa9f"), stanje: "izbledela" },
  { rec: rec(6, "Lehrer", "nastavnik", "der", "1f468-200d-1f3eb"), stanje: "izbledela" },
  { rec: rec(7, "Tür", "vrata", "die", null, true), stanje: "zalepljena" },
  { rec: rec(8, "Schule", "škola", "die", "1f3eb"), stanje: "prazno" },
  { rec: rec(9, "Buch", "knjiga", "das", "1f4d5"), stanje: "prazno" },
];

// ── Sitni delovi ────────────────────────────────────────────────────────────

/** Fokus prsten za svetle podloge - isti plavi kao na dečjim ekranima. */
const FOKUS = "outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#0B54C9]";

/** Glavno dugme: debela crvena nalepnica, ista gramatika kao dečje „Uđi". */
function CtaDugme() {
  return (
    <Link
      href="/zack/roditelj"
      className={`inline-block rounded-2xl border-4 border-white px-8 py-4 text-[20px] text-white shadow-[0_5px_0_0_#8F1B14,0_8px_18px_rgba(22,22,26,0.22)] ${FOKUS} motion-safe:transition-transform motion-safe:duration-100 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-[3px] motion-safe:active:shadow-[0_1px_0_0_#8F1B14]`}
      style={{ background: CRVENA, fontFamily: DISPLAY }}
    >
      Napravi roditeljski nalog
    </Link>
  );
}

/** Naslov sekcije u display slovu, krupan i namerno malo nagnut. */
function Naslov({
  children,
  boja = MASTILO,
  className = "",
}: {
  children: React.ReactNode;
  boja?: string;
  className?: string;
}) {
  return (
    <h2
      className={`text-[30px] leading-[1.06] tracking-tight sm:text-[40px] lg:text-[46px] ${className}`}
      style={{ color: boja, fontFamily: DISPLAY }}
    >
      {children}
    </h2>
  );
}

/** Žuti marker preko par reči - kao flomaster u svesci. */
function Marker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-[4px] box-decoration-clone px-1.5 py-0.5"
      style={{ background: ZUTA, color: MASTILO }}
    >
      {children}
    </span>
  );
}

/** Koza iz igre - uvek čist ukras, uvek iza aria-hidden roditelja. */
function Koza({ className = "" }: { className?: string }) {
  /* eslint-disable-next-line @next/next/no-img-element -- sitan lokalni svg
     ukras; next/image bi mu samo dodao obradu koja ničemu ne služi */
  return <img src="/zack/ikonice/1f410.svg" alt="" aria-hidden="true" className={className} />;
}

// ── Hero kolaž ──────────────────────────────────────────────────────────────

/** Uzak kolaž za telefon: znak sa zalepljenim sličicama, kao dečja prijava. */
function KolazTelefon() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-[168px] max-w-md lg:hidden">
      <span className="absolute left-[3%] top-2">
        <MiniSlicica boja={PAPIR} ugao={-9} sirina={54} kasni={240} ikonica="/zack/ikonice/1f410.svg" />
      </span>
      <span className="absolute bottom-1 left-[17%]">
        <MiniSlicica boja={ZUTA} ugao={7} sirina={42} kasni={360} ikonica="/zack/ikonice/1f4d3.svg" />
      </span>
      <span className="absolute right-[4%] top-0">
        <MiniSlicica boja={PLAVA} ugao={9} sirina={50} kasni={300} ikonica="/zack/ikonice/1fa91.svg" />
      </span>
      <span className="absolute bottom-2 right-[18%]">
        <MiniSlicica boja={CRVENA_ZNAK} ugao={-7} sirina={40} kasni={430} ikonica="/zack/ikonice/1f45c.svg" />
      </span>
      <span className="absolute bottom-9 right-[1%]">
        <MiniSlicica boja={SJAJ} ugao={-11} sirina={26} kasni={520} />
      </span>
      <span
        className="zack-zalepi absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ ["--zack-kasni" as string]: "80ms" }}
      >
        <ZackZnak velicina="lg" />
      </span>
    </div>
  );
}

/** Široki kolaž za veliki ekran: prave sličice iz albuma oko krupnog znaka. */
function KolazSiroki() {
  return (
    <div aria-hidden="true" className="relative hidden h-[440px] select-none lg:block">
      {/* Znak je težište, nagnut kao nalepnica preko svega. */}
      <span
        className="zack-zalepi absolute left-1/2 top-[44%] z-20 -translate-x-1/2 -translate-y-1/2 scale-[1.6]"
        style={{ ["--zack-kasni" as string]: "80ms" }}
      >
        <ZackZnak velicina="lg" />
      </span>
      {/* Prave sličice iz proizvoda - roditelj vidi TAČNO ono što dete dobija. */}
      <span className="zack-zalepi absolute left-[4%] top-[2%] z-10 w-[150px]" style={{ ["--zack-kasni" as string]: "260ms" }}>
        <span className="block -rotate-[7deg]">
          <Slicica rec={ALBUM_MOCK[1].rec} stanje="zalepljena" />
        </span>
      </span>
      <span className="zack-zalepi absolute bottom-[4%] right-[6%] z-10 w-[140px]" style={{ ["--zack-kasni" as string]: "340ms" }}>
        <span className="block rotate-[6deg]">
          <Slicica rec={ALBUM_MOCK[0].rec} stanje="zalepljena" />
        </span>
      </span>
      <span className="zack-zalepi absolute right-[2%] top-[4%] z-10 w-[116px]" style={{ ["--zack-kasni" as string]: "430ms" }}>
        <span className="block rotate-[9deg]">
          <Slicica rec={ALBUM_MOCK[6].rec} stanje="zalepljena" />
        </span>
      </span>
      <span className="zack-zalepi absolute bottom-[10%] left-[10%] z-10 w-[128px]" style={{ ["--zack-kasni" as string]: "500ms" }}>
        <span className="block -rotate-[5deg]">
          <Slicica rec={ALBUM_MOCK[2].rec} stanje="zalepljena" />
        </span>
      </span>
      {/* Prazne poleđine popunjavaju dubinu, sve tri boje zajedno. */}
      <span className="absolute left-[38%] top-[6%]">
        <MiniSlicica boja={ZUTA} ugao={8} sirina={44} kasni={560} />
      </span>
      <span className="absolute bottom-[2%] left-[42%]">
        <MiniSlicica boja={PLAVA} ugao={-6} sirina={40} kasni={620} />
      </span>
      <span className="absolute right-[30%] top-[54%]">
        <MiniSlicica boja={CRVENA_ZNAK} ugao={5} sirina={36} kasni={680} />
      </span>
      {/* Koza viri iza znaka - lik koji dete vodi kroz igre. */}
      <span className="zack-zalepi absolute left-[26%] top-[16%] z-30" style={{ ["--zack-kasni" as string]: "760ms" }}>
        <Koza className="h-12 w-12 -rotate-[10deg]" />
      </span>
    </div>
  );
}

// ── Vinjete igara ───────────────────────────────────────────────────────────
// Crteži u CSS-u, bez slika sa strane; boje roda idu SVE TRI zajedno.

function VinjetaSkakac() {
  return (
    <span aria-hidden="true" className="relative block h-14 w-24">
      <span className="absolute bottom-0 left-1 flex items-end gap-1">
        <span className="block w-6 rounded-t-md" style={{ height: "12px", background: PLAVA }} />
        <span className="block w-6 rounded-t-md" style={{ height: "20px", background: CRVENA_ZNAK }} />
        <span className="block w-6 rounded-t-md" style={{ height: "28px", background: ZUTA }} />
      </span>
      <Koza className="absolute bottom-[26px] left-[56px] h-8 w-8 -rotate-3" />
    </span>
  );
}

function VinjetaMilioner() {
  return (
    <span aria-hidden="true" className="relative block h-14 w-24">
      <span
        className="absolute left-6 top-0 flex h-11 w-11 items-center justify-center"
        style={{
          background: ZUTA,
          clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        }}
      >
        <span className="text-[20px]" style={{ color: MASTILO, fontFamily: DISPLAY }}>
          ?
        </span>
      </span>
      <span className="absolute bottom-0 left-1 h-3 w-10 rounded-full border-2" style={{ borderColor: MASTILO, background: PAPIR }} />
      <span className="absolute bottom-0 left-[52px] h-3 w-10 rounded-full border-2" style={{ borderColor: MASTILO, background: PLAVA }} />
    </span>
  );
}

function VinjetaKesica() {
  return (
    <span aria-hidden="true" className="relative block h-14 w-24">
      <span className="absolute left-2 top-4">
        <MiniSlicica boja={PLAVA} ugao={-14} sirina={26} kasni={0} />
      </span>
      <span
        className="absolute left-8 top-1 flex h-12 w-11 rotate-3 items-end justify-center rounded-lg border-[3px] border-white pb-1 shadow-[0_2px_5px_rgba(22,22,26,0.25)]"
        style={{ background: CRVENA_ZNAK }}
      >
        <span className="text-[15px] text-white" style={{ fontFamily: DISPLAY }}>
          z!
        </span>
      </span>
      <span className="absolute left-[74px] top-6">
        <MiniSlicica boja={ZUTA} ugao={12} sirina={24} kasni={0} />
      </span>
    </span>
  );
}

// ── Strana ──────────────────────────────────────────────────────────────────

export default function ZaRoditeljePage() {
  return (
    <div className="overflow-x-clip">
      {/* Otkrivanje na skrol živi u istom no-preference svetu kao zack-zalepi:
          uz reduced-motion ništa se ne krije i ništa se ne pomera. Bez
          JavaScripta data-otkrij ne postoji, pa je sve normalno vidljivo. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          [data-otkrij="ne"] .zz { opacity: 0; }
          [data-otkrij="da"] .zz {
            animation: zack-zalepi 0.5s cubic-bezier(0.2, 0.7, 0.3, 1.15) both;
            animation-delay: calc(var(--zack-osnovni-kasni, 0ms) + var(--zack-kasni, 0ms));
          }
        }
      `}</style>

      {/* ── Zaglavlje ──────────────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 pt-6 sm:px-8">
        {/* Uz znak ide zvanični par iz identiteta: „nemački za osnovce".
            „Za roditelje" NIKAD ne stoji uz znak kao odrednica proizvoda -
            proizvod nije nemački za roditelje. */}
        <span className="flex items-center gap-3">
          <ZackZnak velicina="sm" />
          <span className="text-[15px] font-bold tracking-wide" style={{ color: PRIGUSEN, fontFamily: DISPLAY }}>
            nemački za osnovce
          </span>
        </span>
        <Meni />
      </header>

      {/* Koreni raspored već renderuje <main id="glavni">, pa bi još jedan
          <main> ovde bio ugnežden i nevalidan - zato običan div. */}
      <div>
        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12 lg:pb-24">
          <KolazTelefon />
          <div className="mt-6 grid items-center gap-10 lg:mt-0 lg:grid-cols-[7fr_5fr]">
            <div>
              <p
                className="zack-zalepi inline-block -rotate-1 rounded-lg border-2 bg-white px-3 py-1.5 text-[14px] font-bold tracking-wide shadow-[0_2px_5px_rgba(22,22,26,0.12)]"
                style={{ borderColor: IVICA, color: PRIGUSEN, ["--zack-kasni" as string]: "40ms" }}
              >
                po školskom programu
              </p>
              <h1
                className="zack-zalepi mt-5 text-[40px] leading-[1.02] tracking-tight sm:text-[56px] lg:text-[64px] xl:text-[72px]"
                style={{ color: MASTILO, fontFamily: DISPLAY, ["--zack-kasni" as string]: "140ms" }}
              >
                Nemački se ne uči <Marker>veče pred kontrolni.</Marker>
              </h1>
              <p
                className="zack-zalepi mt-6 max-w-xl text-[18px] leading-relaxed sm:text-[19px]"
                style={{ color: PRIGUSEN, ["--zack-kasni" as string]: "260ms" }}
              >
                Jezik se gradi iz reči, a reči se ne uče za jedno popodne. zack!
                pretvara učenje u album sa sličicama koji tvoje dete samo hoće da
                popuni - po deset minuta, svaki dan.
              </p>
              {/* id koristi lepljivi poziv: dok je ovo dugme u kadru (ili
                  ispod njega), papirić sa cenom se ne prikazuje. */}
              <div id="hero-cta" className="zack-zalepi mt-8" style={{ ["--zack-kasni" as string]: "380ms" }}>
                <CtaDugme />
                <p className="mt-3 text-[14px]" style={{ color: PRIGUSEN }}>
                  Bez ugovora - otkazuješ kad hoćeš.
                </p>
              </div>
            </div>
            <KolazSiroki />
          </div>
        </section>

        {/* ── ISTINA O UČENJU JEZIKA ─────────────────────────────────────── */}
        <section className="relative" style={{ background: MASTILO }}>
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[5fr_7fr] lg:gap-14 lg:py-24">
            <Otkrij>
              <span className="zz block" style={{ ["--zack-kasni" as string]: "0ms" }}>
                <Naslov boja="#FFFFFF">Čas-dva pred ispit kod jezika ne pomažu</Naslov>
              </span>
              {/* Tri stvari od kojih je jezik sazdan, kao tri nalepnice. */}
              <span aria-hidden="true" className="mt-6 flex flex-wrap gap-2.5">
                <span className="zz inline-block" style={{ ["--zack-kasni" as string]: "180ms" }}>
                  <span className="inline-block -rotate-2 rounded-lg border-2 border-white px-3 py-1 text-[15px] text-white" style={{ background: PLAVA, fontFamily: DISPLAY }}>
                    reči
                  </span>
                </span>
                <span className="zz inline-block" style={{ ["--zack-kasni" as string]: "260ms" }}>
                  <span className="inline-block rotate-1 rounded-lg border-2 border-white px-3 py-1 text-[15px] text-white" style={{ background: CRVENA, fontFamily: DISPLAY }}>
                    rodovi
                  </span>
                </span>
                <span className="zz inline-block" style={{ ["--zack-kasni" as string]: "340ms" }}>
                  <span className="inline-block -rotate-1 rounded-lg border-2 border-white px-3 py-1 text-[15px]" style={{ background: ZUTA, color: MASTILO, fontFamily: DISPLAY }}>
                    oblici
                  </span>
                </span>
              </span>
            </Otkrij>
            <Otkrij kasni={120}>
              <p className="zz text-[18px] leading-relaxed sm:text-[20px]" style={{ color: PRIGUSEN_NA_TAMNOM }}>
                Za test iz biologije dete može da nabuba lekcije za jedno veče.
                Za jezik ne može, jer je jezik{" "}
                <strong className="font-bold text-white">hiljadu malih stvari</strong>{" "}
                - reči, rodovi, oblici - i svaka traži svoje vreme. Dete koje je
                zapustilo reči ne može da ih stigne pred kontrolni, ma koliko
                časova platiš.
              </p>
              <p className="zz mt-6 text-[18px] leading-relaxed sm:text-[20px]" style={{ color: PRIGUSEN_NA_TAMNOM, ["--zack-kasni" as string]: "140ms" }}>
                Jedino što kod jezika radi je kontinuitet:{" "}
                <Marker>malo, ali stalno.</Marker>
              </p>
            </Otkrij>
          </div>
        </section>

        {/* ── ALBUM, A NE KURS ───────────────────────────────────────────── */}
        {/* Kraći lg:py i uža kartica nego u susednim sekcijama: mockup je
            visok, pa bi pun ritam ostavio mrtav prostor oko teksta. */}
        <section id="kako-radi" className="relative mx-auto max-w-6xl scroll-mt-6 px-5 py-16 sm:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[6fr_6fr] lg:gap-14">
            <Otkrij>
              <span className="zz block">
                <Naslov>Zato je zack! album, a ne kurs</Naslov>
              </span>
              <p className="zz mt-6 text-[17px] leading-relaxed sm:text-[18px]" style={{ color: PRIGUSEN, ["--zack-kasni" as string]: "120ms" }}>
                Svaka reč koju dete savlada postaje sličica u albumu. Album ima
                tačno onoliko mesta koliko lekcija ima reči - dete vidi šta mu
                fali, bez ocena i bez procenata.
              </p>
              <p className="zz mt-4 text-[17px] leading-relaxed sm:text-[18px]" style={{ color: PRIGUSEN, ["--zack-kasni" as string]: "220ms" }}>
                Sličica koju dete dugo ne ponovi{" "}
                <strong className="font-bold" style={{ color: MASTILO }}>izbledi</strong>{" "}
                - i vraća se u boju čim je dete ponovo pogodi. Stare reči se same
                vraćaju u igru, pa dete obnavlja i kad misli da samo igra.
              </p>
              {/* Legenda boja: boje NOSE ZNAČENJE, i to roditelju odmah kažemo. */}
              <p className="zz mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px]" style={{ color: PRIGUSEN, ["--zack-kasni" as string]: "320ms" }}>
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block h-3.5 w-3.5 rounded-[4px]" style={{ background: PLAVA }} />
                  <strong className="font-bold" style={{ color: MASTILO }}>der</strong> plava
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block h-3.5 w-3.5 rounded-[4px]" style={{ background: CRVENA_ZNAK }} />
                  <strong className="font-bold" style={{ color: MASTILO }}>die</strong> crvena
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block h-3.5 w-3.5 rounded-[4px]" style={{ background: ZUTA }} />
                  <strong className="font-bold" style={{ color: MASTILO }}>das</strong> žuta
                </span>
                <span className="w-full sm:w-auto">Dete rod upija kroz boju, ne bubanjem.</span>
              </p>
            </Otkrij>

            {/* Živ mockup albuma: prava Slicica komponenta, ne slika. */}
            <Otkrij kasni={160}>
              <div aria-hidden="true" className="relative mx-auto w-full max-w-md lg:max-w-[400px]">
                <Koza className="absolute -top-9 right-8 z-10 h-11 w-11 rotate-6" />
                <div
                  className="zz rounded-3xl border p-4 shadow-[0_4px_0_0_#DED8C8,0_14px_30px_rgba(22,22,26,0.12)] sm:p-6"
                  style={{ background: PAPIR, borderColor: IVICA }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 flex-none -rotate-3 items-center justify-center rounded-xl border-[3px] border-white text-[18px] text-white shadow-[0_2px_5px_rgba(22,22,26,0.25)]"
                      style={{ background: CRVENA_ZNAK, fontFamily: DISPLAY }}
                    >
                      3
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[19px] leading-tight" style={{ color: MASTILO, fontFamily: DISPLAY }}>
                        Im Klassenzimmer
                      </span>
                      <span className="block text-[14px]" style={{ color: PRIGUSEN }}>
                        7 od 9 sličica
                      </span>
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {ALBUM_MOCK.map(({ rec: r, stanje }, i) => (
                      <span key={r.id} className="zz block" style={{ ["--zack-kasni" as string]: `${120 + i * 70}ms` }}>
                        <Slicica rec={r} stanje={stanje} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Otkrij>
          </div>
        </section>

        {/* ── TELEFON NA PRAVOJ STRANI ───────────────────────────────────── */}
        <section className="border-y" style={{ background: PAPIR, borderColor: IVICA }}>
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
            <Otkrij className="max-w-2xl">
              <span className="zz block">
                <Naslov>Igrice mogu da budu i drugačije</Naslov>
              </span>
              <p className="zz mt-6 text-[17px] leading-relaxed sm:text-[18px]" style={{ color: PRIGUSEN, ["--zack-kasni" as string]: "120ms" }}>
                Telefon tvoje dete ionako ne ispušta iz ruke. zack! mu na tom
                istom telefonu daje igre u kojima svaki tačan odgovor nešto
                trajno gradi.
              </p>
            </Otkrij>
            <Otkrij className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  vinjeta: <VinjetaSkakac />,
                  naslov: "Der Die Das skakač",
                  opis: "Koza se penje uz stenu dok dete pogađa rodove - svaki tačan odgovor je stepenik više.",
                },
                {
                  vinjeta: <VinjetaMilioner />,
                  naslov: "Milioner",
                  opis: "Kviz za gramatiku: pitanja se penju od lakših ka težim, a do vrha se stiže samo znanjem.",
                },
                {
                  vinjeta: <VinjetaKesica />,
                  naslov: "Kesice sa sličicama",
                  opis: "Posle svake igre dete otvara kesicu - kao one sa kioska, samo što se zarađuju znanjem.",
                },
              ].map((igra, i) => (
                <div
                  key={igra.naslov}
                  className="zz flex flex-col items-center gap-3 rounded-2xl border p-6 text-center shadow-[0_3px_0_0_#DED8C8]"
                  style={{ background: "#FFFFFF", borderColor: IVICA, ["--zack-kasni" as string]: `${i * 120}ms` }}
                >
                  {igra.vinjeta}
                  <h3 className="text-[18px] leading-tight" style={{ color: MASTILO, fontFamily: DISPLAY }}>
                    {igra.naslov}
                  </h3>
                  <p className="text-[15px] leading-relaxed" style={{ color: PRIGUSEN }}>
                    {igra.opis}
                  </p>
                </div>
              ))}
            </Otkrij>
            {/* Tri pečata: kratko i glasno, jer je roditelju ovo često presudno. */}
            <Otkrij className="mt-10 flex flex-wrap items-center gap-3">
              {["Bez reklama", "Bez kupovina u aplikaciji", "Bez praćenja"].map((pecat, i) => (
                <span key={pecat} className="zz inline-block" style={{ ["--zack-kasni" as string]: `${i * 140}ms` }}>
                  <span
                    className={`inline-block rounded-lg border-[3px] px-3.5 py-1.5 text-[15px] font-bold uppercase tracking-wide ${i % 2 === 0 ? "-rotate-1" : "rotate-1"}`}
                    style={{ borderColor: GRESKA, color: GRESKA, fontFamily: DISPLAY }}
                  >
                    {pecat}
                  </span>
                </span>
              ))}
            </Otkrij>
          </div>
        </section>

        {/* ── ŠTA SVE DOBIJAŠ ────────────────────────────────────────────── */}
        {/* Cela ponuda na jednom mestu, kao nalepnice - ne generička lista sa
            štikliranjem. Boje mini-sličica idu sve tri u krug, nikad jedna
            sama, po pravilu iz Ukras.tsx. */}
        <section id="sta-dobijas" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-16 sm:px-8 lg:py-24">
          <Otkrij className="max-w-2xl">
            <span className="zz block">
              <Naslov>Šta sve dobijaš</Naslov>
            </span>
          </Otkrij>
          <Otkrij className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              {
                naslov: "Šest igara za reči",
                ostatak: "+ skakač sa kozom za der-die-das.",
              },
              {
                naslov: "Milioner",
                ostatak: "- kviz za gramatiku, kao onaj sa televizije.",
              },
              {
                naslov: "Album sa sličicama",
                ostatak: "za svaku lekciju.",
              },
              {
                naslov: "Izveštaj tebi na mejl,",
                ostatak: "na svake dve nedelje.",
              },
              {
                naslov: "Roditeljski panel",
                ostatak: "sa napretkom po lekcijama.",
              },
              {
                naslov: "Svako dete ima svoj profil, kod i album",
                ostatak: "- sve iz jednog roditeljskog naloga.",
              },
              {
                naslov: "Bez reklama,",
                ostatak: "bez kupovina u aplikaciji.",
              },
              {
                naslov: "Bez instalacije",
                ostatak:
                  "- radi u pretraživaču, a na telefonu se doda na početni ekran kao aplikacija.",
              },
            ].map((stavka, i) => (
              <div
                key={stavka.naslov}
                className="zz flex items-start gap-4 rounded-2xl border p-5 shadow-[0_3px_0_0_#DED8C8]"
                style={{ background: PAPIR, borderColor: IVICA, ["--zack-kasni" as string]: `${(i % 4) * 90}ms` }}
              >
                <span aria-hidden="true" className="mt-0.5 flex-none">
                  <MiniSlicica
                    boja={[PLAVA, CRVENA_ZNAK, ZUTA][i % 3]}
                    ugao={i % 2 === 0 ? -5 : 5}
                    sirina={30}
                  />
                </span>
                <p className="text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
                  <strong className="font-bold" style={{ color: MASTILO }}>
                    {stavka.naslov}
                  </strong>{" "}
                  {stavka.ostatak}
                </p>
              </div>
            ))}
          </Otkrij>
        </section>

        {/* ── KAKO POČINJEŠ ──────────────────────────────────────────────── */}
        {/* Tri koraka sa crvenim brojevima-nalepnicama, istom gramatikom kao
            broj lekcije u mockup albumu. Broj nosi CRVENA (5.0:1 uz beli
            tekst), ne brend CRVENA_ZNAK - pravilo iz Ukras.tsx. */}
        <section id="kako-pocinjes" className="scroll-mt-6 border-y" style={{ background: PAPIR, borderColor: IVICA }}>
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
            <Otkrij className="max-w-2xl">
              <span className="zz block">
                <Naslov>Kako počinješ</Naslov>
              </span>
            </Otkrij>
            <Otkrij className="mt-10 grid gap-4 lg:grid-cols-3">
              {[
                {
                  naslov: "Napraviš nalog",
                  opis: "Mejl, profil deteta i PIN. Povežeš bilo koju karticu i pretplatiš se - mesečno manje nego što daješ na kesice sa sličicama za album.",
                },
                {
                  naslov: "Prepišeš detetu kod i PIN na papirić",
                  opis: "To je cela „instalacija“. Bez mejla za dete, bez skidanja.",
                },
                {
                  naslov: "Dete igra, ti gledaš kako raste album",
                  opis: "Deset minuta dnevno je dovoljno, a izveštaj ti stiže na svake dve nedelje.",
                },
              ].map((korak, i) => (
                <div
                  key={korak.naslov}
                  className="zz rounded-2xl border bg-white p-6 shadow-[0_3px_0_0_#DED8C8]"
                  style={{ borderColor: IVICA, ["--zack-kasni" as string]: `${i * 140}ms` }}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border-[3px] border-white text-[22px] text-white shadow-[0_2px_5px_rgba(22,22,26,0.25)] ${i % 2 === 0 ? "-rotate-3" : "rotate-3"}`}
                    style={{ background: CRVENA, fontFamily: DISPLAY }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-[19px] leading-tight" style={{ color: MASTILO, fontFamily: DISPLAY }}>
                    {korak.naslov}
                  </h3>
                  <p className="mt-2 text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
                    {korak.opis}
                  </p>
                </div>
              ))}
            </Otkrij>
            <Otkrij className="mt-10 text-center">
              <div className="zz">
                <CtaDugme />
                <p className="mt-3 text-[14px]" style={{ color: PRIGUSEN }}>
                  Bez ugovora - otkazuješ kad hoćeš.
                </p>
              </div>
            </Otkrij>
          </div>
        </section>

        {/* ── IZVEŠTAJ RODITELJU ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[6fr_6fr] lg:gap-14">
            {/* Mockup izveštaja: skica bez ijednog broja, jer brojeve mockup
                nema pravo da izmišlja - prave dobija roditelj, o svom detetu. */}
            <Otkrij className="order-2 lg:order-1">
              <div aria-hidden="true" className="relative mx-auto w-full max-w-sm">
                <span
                  className="absolute -top-2.5 left-1/2 z-10 block h-5 w-28 -translate-x-1/2 -rotate-2 rounded-[2px]"
                  style={{ background: "rgba(255,196,0,0.42)", boxShadow: "0 1px 2px rgba(22,22,26,0.08)" }}
                />
                <div
                  className="zz -rotate-1 rounded-2xl border p-6 shadow-[0_4px_0_0_#DED8C8,0_14px_30px_rgba(22,22,26,0.1)]"
                  style={{ background: "#FFFFFF", borderColor: IVICA }}
                >
                  <p className="text-[16px]" style={{ color: MASTILO, fontFamily: DISPLAY }}>
                    zack! - izveštaj o napretku
                  </p>
                  <p className="mt-0.5 text-[13px]" style={{ color: PRIGUSEN }}>
                    stiže mejlom, na svake dve nedelje
                  </p>
                  <p className="mt-4 text-[14px] font-bold" style={{ color: PRIGUSEN }}>
                    Dani vežbanja
                  </p>
                  <span className="mt-1.5 flex gap-1.5">
                    {[1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1].map((pun, i) => (
                      <span
                        key={i}
                        className="h-3.5 w-3.5 rounded-[4px]"
                        style={{ background: pun ? MASTILO : "#E9E4D6" }}
                      />
                    ))}
                  </span>
                  <p className="mt-4 text-[14px] font-bold" style={{ color: PRIGUSEN }}>
                    Nove reči u albumu
                  </p>
                  <span className="mt-1.5 flex gap-1.5">
                    <MiniSlicica boja={PLAVA} ugao={-3} sirina={24} />
                    <MiniSlicica boja={CRVENA_ZNAK} ugao={2} sirina={24} />
                    <MiniSlicica boja={ZUTA} ugao={-2} sirina={24} />
                    <MiniSlicica boja={PLAVA} ugao={3} sirina={24} />
                    <MiniSlicica boja={CRVENA_ZNAK} ugao={-2} sirina={24} />
                  </span>
                  <p className="mt-4 text-[14px] font-bold" style={{ color: PRIGUSEN }}>
                    Gde je zastalo
                  </p>
                  <span className="mt-1.5 block h-3 w-4/5 rounded-full" style={{ background: "#E9E4D6" }} />
                  <span className="mt-1.5 block h-3 w-3/5 rounded-full" style={{ background: "#E9E4D6" }} />
                </div>
              </div>
            </Otkrij>
            <Otkrij className="order-1 lg:order-2" kasni={120}>
              <span className="zz block">
                <Naslov>Ti vidiš ono što te stvarno zanima</Naslov>
              </span>
              <p className="zz mt-6 text-[17px] leading-relaxed sm:text-[18px]" style={{ color: PRIGUSEN, ["--zack-kasni" as string]: "120ms" }}>
                Na svake dve nedelje ti stigne kratak izveštaj: koliko je dana
                dete vežbalo, koliko je novih reči naučilo i gde je zastalo -
                običnim jezikom, bez procenata. A u roditeljskom panelu u svakom
                trenutku vidiš napredak po lekcijama.
              </p>
            </Otkrij>
          </div>
        </section>

        {/* ── PO PROGRAMU ────────────────────────────────────────────────── */}
        <section style={{ background: PLAVA }}>
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[7fr_5fr] lg:py-20">
            <Otkrij>
              <span className="zz block">
                <Naslov boja="#FFFFFF">Po programu, ne pokraj njega</Naslov>
              </span>
              <p className="zz mt-6 max-w-xl text-[17px] leading-relaxed text-white sm:text-[18px]" style={{ ["--zack-kasni" as string]: "120ms" }}>
                Sadržaj prati zvanični plan i program Ministarstva prosvete -
                za svaki razred, redom kako se gradivo uči u školi. Radi uz
                svaki udžbenik, jer svi udžbenici prate isti program.
              </p>
            </Otkrij>
            <Otkrij className="flex flex-wrap items-center justify-start gap-4 lg:justify-center" kasni={160}>
              <span className="zz inline-block">
                <span
                  className="inline-block -rotate-2 rounded-2xl border-4 border-white px-5 py-3 text-[26px] shadow-[0_3px_10px_rgba(22,22,26,0.25)]"
                  style={{ background: PAPIR, color: MASTILO, fontFamily: DISPLAY }}
                >
                  svaki razred
                </span>
              </span>
              <span className="zz inline-block" style={{ ["--zack-kasni" as string]: "140ms" }}>
                <span
                  className="inline-block rotate-2 rounded-2xl border-4 border-white px-5 py-3 text-[26px] shadow-[0_3px_10px_rgba(22,22,26,0.25)]"
                  style={{ background: ZUTA, color: MASTILO, fontFamily: DISPLAY }}
                >
                  svaki udžbenik
                </span>
              </span>
            </Otkrij>
          </div>
        </section>

        {/* ── PRIVATNOST PRE SVEGA ───────────────────────────────────────── */}
        <section style={{ background: MASTILO }}>
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[6fr_6fr] lg:items-center lg:gap-14 lg:py-20">
            <Otkrij>
              <span className="zz block">
                <Naslov boja="#FFFFFF">Privatnost pre svega</Naslov>
              </span>
              <p className="zz mt-6 text-[17px] leading-relaxed sm:text-[18px]" style={{ color: PRIGUSEN_NA_TAMNOM, ["--zack-kasni" as string]: "100ms" }}>
                Bez reklama, bez kupovina u aplikaciji, bez iskačućih prozora i
                bez svega onoga što iskače u običnim igricama - toga ovde nema,{" "}
                <strong className="font-bold text-white">ni sada ni bilo kada</strong>.
              </p>
              <p className="zz mt-4 text-[17px] leading-relaxed sm:text-[18px]" style={{ color: PRIGUSEN_NA_TAMNOM, ["--zack-kasni" as string]: "200ms" }}>
                O detetu čuvamo samo{" "}
                <strong className="font-bold text-white">ime i napredak</strong>:
                bez prezimena, bez fotografija, bez prodaje podataka. Nalog
                otvaraš ti, dete se prijavljuje kodom i PIN-om - bez mejla.
              </p>
              <span className="mt-7 flex flex-wrap gap-3">
                {["Bez prezimena", "Bez fotografija", "Bez prodaje podataka"].map((pecat, i) => (
                  <span key={pecat} className="zz inline-block" style={{ ["--zack-kasni" as string]: `${280 + i * 120}ms` }}>
                    <span
                      className={`inline-block rounded-lg border-[3px] px-3.5 py-1.5 text-[15px] font-bold uppercase tracking-wide sm:text-[16px] ${i % 2 === 0 ? "-rotate-1" : "rotate-1"}`}
                      style={{ borderColor: ZUTA, color: ZUTA, fontFamily: DISPLAY }}
                    >
                      {pecat}
                    </span>
                  </span>
                ))}
              </span>
            </Otkrij>
            {/* Udarna poruka na papiriću: most ka sekciji sa Natašinom slikom. */}
            <Otkrij kasni={160} className="lg:justify-self-center">
              <div className="relative mx-auto w-full max-w-sm">
                <span
                  aria-hidden="true"
                  className="absolute -top-2.5 left-1/2 z-10 block h-5 w-24 -translate-x-1/2 rotate-2 rounded-[2px]"
                  style={{ background: "rgba(255,196,0,0.42)", boxShadow: "0 1px 2px rgba(22,22,26,0.08)" }}
                />
                <div
                  className="zz rotate-1 rounded-2xl border p-6 shadow-[0_10px_26px_rgba(0,0,0,0.4)] sm:p-7"
                  style={{ background: PAPIR, borderColor: IVICA }}
                >
                  <p
                    className="text-[24px] leading-[1.15] tracking-tight sm:text-[28px]"
                    style={{ color: MASTILO, fontFamily: DISPLAY }}
                  >
                    Ovo nije softver iz Kalifornije.
                  </p>
                  <p className="mt-3 text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
                    Iza ovoga svojim imenom stoji profesorka nemačkog - pedagog,
                    mentor i preduzetnica.
                  </p>
                </div>
              </div>
            </Otkrij>
          </div>
        </section>

        {/* ── KO STOJI IZA OVOGA ─────────────────────────────────────────── */}
        {/* Jedino mesto na celom zack-u gde Hartweger ime i lice smeju da
            stoje krupno: roditeljska strana gradi poverenje, dečji deo ostaje
            bez škole. Fotografija je uramljena kao velika sličica iz albuma -
            bela ivica, blagi nagib, papirna traka sa imenom. */}
        <section className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <Koza className="absolute -top-5 left-8 h-10 w-10 -rotate-6 sm:left-12" />
          <div className="mx-auto grid max-w-4xl items-center gap-10 lg:grid-cols-[5fr_7fr] lg:gap-14">
            <Otkrij>
              <figure
                className="zz mx-auto w-full max-w-[280px] -rotate-2 rounded-[20px] border-[6px] border-white pb-1 shadow-[0_4px_0_0_#DED8C8,0_16px_34px_rgba(22,22,26,0.16)] lg:max-w-[320px]"
                style={{ background: "#FFFFFF" }}
              >
                <Image
                  src="/images/IMG_6264.jpg"
                  alt="Nataša Hartweger"
                  width={600}
                  height={800}
                  className="block h-auto w-full rounded-[14px]"
                />
                <figcaption className="px-2.5 pb-1.5 pt-2.5">
                  <span className="block text-[17px] leading-tight" style={{ color: MASTILO, fontFamily: DISPLAY }}>
                    Nataša Hartweger
                  </span>
                  <span className="block text-[14px]" style={{ color: PRIGUSEN }}>
                    profesorka nemačkog - die Lehrerin
                  </span>
                </figcaption>
              </figure>
            </Otkrij>
            <Otkrij kasni={140}>
              <span className="zz block">
                <Naslov className="text-[26px] sm:text-[32px] lg:text-[34px]">Ko stoji iza ovoga</Naslov>
              </span>
              <p className="zz mt-5 text-[17px] leading-relaxed sm:text-[18px]" style={{ color: PRIGUSEN, ["--zack-kasni" as string]: "100ms" }}>
                zack! je osmislila{" "}
                <strong className="font-bold" style={{ color: MASTILO }}>Nataša Hartweger</strong>{" "}
                - profesorka nemačkog sa godinama rada u učionici i autorka
                priručnika za nastavnike uz udžbenike nemačkog za osnovnu školu.
              </p>
              <p className="zz mt-4 text-[17px] leading-relaxed sm:text-[18px]" style={{ color: PRIGUSEN, ["--zack-kasni" as string]: "200ms" }}>
                Ovo nije aplikacija koju je napravio algoritam, nego nastavnica
                koja tačno zna gde deca zastaju.
              </p>
              <p className="zz mt-6 flex items-center gap-3 text-[15px]" style={{ color: PRIGUSEN, ["--zack-kasni" as string]: "300ms" }}>
                <ZackZnak velicina="sm" />
                <span>je Hartweger aplikacija</span>
              </p>
            </Otkrij>
          </div>
        </section>


        {/* ── ČLANSTVO ───────────────────────────────────────────────────── */}
        {/* Informativna kartica sa cenom, u identitetu: papir traka, bela
            kartica. NIKAKVE naplate ovde nema - CTA i dalje vodi samo na
            registraciju. Nigde „besplatno" ni „probni period": naplata je
            stvarna od početka i strana o tome ne sme da laže. */}
        <section id="cena" className="scroll-mt-6 border-y" style={{ background: PAPIR, borderColor: IVICA }}>
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
            <Otkrij className="mx-auto max-w-md">
              <span className="zz block text-center">
                <Naslov>Članstvo</Naslov>
              </span>
              <div className="zz relative mt-10" style={{ ["--zack-kasni" as string]: "140ms" }}>
                {/* Žuta nalepnica preko gornje ivice kartice - u čitanju ide
                    PRE cene, pa precrtani broj odmah ima objašnjenje. */}
                <span
                  className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 -rotate-2 rounded-lg border-[3px] border-white px-3.5 py-1.5 text-[15px] font-bold uppercase tracking-wide shadow-[0_3px_8px_rgba(22,22,26,0.18)]"
                  style={{ background: ZUTA, color: MASTILO, fontFamily: DISPLAY }}
                >
                  Promo cena
                </span>
                <div
                  className="rounded-3xl border bg-white px-6 pb-8 pt-10 text-center shadow-[0_4px_0_0_#DED8C8,0_14px_30px_rgba(22,22,26,0.1)] sm:px-8"
                  style={{ borderColor: IVICA }}
                >
                  <p className="text-[34px] leading-tight tracking-tight sm:text-[38px]" style={{ color: MASTILO, fontFamily: DISPLAY }}>
                    <span className="sr-only">Puna cena </span>
                    <s className="mr-1 text-[20px] sm:text-[22px]" style={{ color: PRIGUSEN }}>
                      2.399
                    </s>{" "}
                    1.200 dinara{" "}
                    <span className="text-[20px] sm:text-[22px]">mesečno</span>
                  </p>
                  <p className="mt-1 text-[17px]" style={{ color: PRIGUSEN }}>
                    po detetu
                  </p>
                  <p className="mt-4 text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
                    Manje nego što mesečno ode na kesice sa sličicama na kiosku
                    - a{" "}
                    <strong className="font-bold" style={{ color: MASTILO }}>
                      ove sličice uče nemački
                    </strong>
                    .
                  </p>
                  <p className="mt-3 text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
                    Svako dete ima svoj profil, kod i album.
                  </p>
                  <p
                    className="mt-5 border-t pt-5 text-[16px] leading-relaxed"
                    style={{ color: PRIGUSEN, borderColor: IVICA }}
                  >
                    Otkazuješ jednim klikom,{" "}
                    <strong className="font-bold" style={{ color: MASTILO }}>bez ugovora</strong>.
                  </p>
                </div>
              </div>
            </Otkrij>
          </div>
        </section>

        {/* ── ZAVRŠNI POZIV ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 py-16 text-center sm:px-8 lg:py-24">
          <Otkrij className="mx-auto max-w-2xl">
            {/* Papirić: cela „instalacija" za dete stane na ovo. */}
            <div aria-hidden="true" className="relative mx-auto w-64">
              <Koza className="absolute -left-10 bottom-2 h-10 w-10 -rotate-6" />
              <span
                className="absolute -top-2.5 left-1/2 z-10 block h-5 w-24 -translate-x-1/2 rotate-2 rounded-[2px]"
                style={{ background: "rgba(255,196,0,0.42)", boxShadow: "0 1px 2px rgba(22,22,26,0.08)" }}
              />
              <div
                className="zz rotate-2 rounded-xl border p-4 shadow-[0_3px_8px_rgba(22,22,26,0.14)]"
                style={{ background: "#FFFFFF", borderColor: IVICA }}
              >
                <TablicaOkvir>
                  <span
                    className="w-full bg-white px-3 py-2 text-center text-[20px] uppercase tracking-[0.1em]"
                    style={{ color: MASTILO, fontFamily: DISPLAY }}
                  >
                    ZK-4F7Q
                  </span>
                </TablicaOkvir>
                <p className="mt-2 text-[15px] tracking-[0.3em]" style={{ color: PRIGUSEN }}>
                  PIN ••••
                </p>
              </div>
            </div>
            <span className="zz block" style={{ ["--zack-kasni" as string]: "120ms" }}>
              <Naslov className="mt-8">Prva lekcija čeka.</Naslov>
            </span>
            <p className="zz mt-3 text-[17px] leading-relaxed sm:text-[18px]" style={{ color: PRIGUSEN, ["--zack-kasni" as string]: "200ms" }}>
              Kod i PIN staju na papirić.
            </p>
            <div className="zz mt-8" style={{ ["--zack-kasni" as string]: "300ms" }}>
              <CtaDugme />
              <p className="mt-3 text-[14px]" style={{ color: PRIGUSEN }}>
                Bez ugovora - otkazuješ kad hoćeš.
              </p>
            </div>
          </Otkrij>
        </section>

        {/* ── ČESTA PITANJA ──────────────────────────────────────────────── */}
        <section id="pitanja" className="scroll-mt-6 border-t" style={{ background: PAPIR, borderColor: IVICA }}>
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-20">
            <Naslov className="text-[26px] sm:text-[32px] lg:text-[34px]">Česta pitanja</Naslov>
            <div className="mt-8 flex flex-col gap-3">
              {[
                {
                  p: "Da li radi uz udžbenik koji dete koristi u školi?",
                  o: "Da. Svi udžbenici prate isti plan i program Ministarstva prosvete, a zack! prati taj program - iste reči, ista gramatika, isti redosled tema.",
                },
                {
                  p: "Za koje razrede postoji?",
                  o: "Krećemo od petog razreda - kompletan je, po programu. Ostali razredi stižu redom. Ako ti treba drugi razred, javi nam se na info@hartweger.rs da znamo šta da guramo prvo.",
                },
                {
                  p: "Koliko vremena dnevno je dovoljno?",
                  o: "Deset minuta. Jezik se ne gradi dugim sedenjem nego kratkim, čestim susretima sa rečima - zato su igre kratke i uvek imaju kraj.",
                },
                {
                  p: "Šta ako dete pauzira?",
                  o: "Ništa se ne gubi. Sličice koje dete dugo ne ponovi samo izblede, a vraćaju se u boju čim ih dete ponovo pogodi u igri. Bez opomena i bez prekora.",
                },
                {
                  p: "Mora li da se instalira?",
                  o: "Ne. Radi u pretraživaču na bilo kom telefonu, tabletu ili računaru, a na telefonu se jednim potezom doda na početni ekran i ponaša se kao aplikacija.",
                },
                {
                  p: "Da li mogu da upišem dva deteta?",
                  o: "Da - iz istog roditeljskog naloga dodaješ više dece, svako ima svoj profil, kod i album. Članarina je po detetu.",
                },
                {
                  p: "Koliko košta?",
                  o: "Promo cena je 1.200 dinara mesečno po detetu (puna cena 2.399). Svako dete ima svoj profil, kod i album.",
                },
              ].map((stavka) => (
                <details
                  key={stavka.p}
                  className="group rounded-2xl border bg-white shadow-[0_2px_0_0_#DED8C8]"
                  style={{ borderColor: IVICA }}
                >
                  <summary
                    className={`flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-3.5 text-[16px] font-bold [&::-webkit-details-marker]:hidden ${FOKUS}`}
                    style={{ color: MASTILO }}
                  >
                    {stavka.p}
                    <span
                      aria-hidden="true"
                      className="flex-none text-[22px] leading-none motion-safe:transition-transform motion-safe:duration-150 group-open:rotate-45"
                      style={{ color: CRVENA, fontFamily: DISPLAY }}
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
                    {stavka.o}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Podnožje ───────────────────────────────────────────────────────── */}
      {/* Roditeljska strana je jedino mesto pod /zack gde Hartweger ime sme da
          stoji - dečji deo ostaje bez škole. */}
      <footer className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="flex items-center gap-3">
            <ZackZnak velicina="sm" />
            <span className="text-[14px]" style={{ color: PRIGUSEN }}>
              nemački za osnovce
            </span>
          </span>
          <nav className="flex flex-wrap items-center gap-1">
            <Link
              href="/zack"
              className={`rounded-lg px-3 py-2.5 text-[14px] underline underline-offset-2 ${FOKUS}`}
              style={{ color: PRIGUSEN }}
            >
              Prijava za dete
            </Link>
            <Link
              href="/zack/roditelj"
              className={`rounded-lg px-3 py-2.5 text-[14px] underline underline-offset-2 ${FOKUS}`}
              style={{ color: PRIGUSEN }}
            >
              Roditeljski nalog
            </Link>
          </nav>
        </div>
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t pt-5 text-[14px]"
          style={{ borderColor: IVICA, color: PRIGUSEN }}
        >
          <p className="flex flex-wrap items-center">
            Pitanja? Piši nam:{" "}
            <a
              href="mailto:info@hartweger.rs"
              className={`ml-1 inline-block rounded-lg py-2.5 underline underline-offset-2 ${FOKUS}`}
              style={{ color: PRIGUSEN }}
            >
              info@hartweger.rs
            </a>
          </p>
          <p>zack! je deo Hartweger škole nemačkog jezika.</p>
        </div>
      </footer>

      {/* Papirić sa cenom koji prati skrol - pojavi se tek posle hero dugmeta. */}
      <LepljivPoziv />
    </div>
  );
}
