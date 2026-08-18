// Isticanje: znaci iz baze se vide kao izgled, a ne kao znaci.
//
// Objašnjenja i podsetnici pisani su kao markdown, pa nose kose navodnike oko
// nemačkih reči i dve zvezdice oko jezgra pravila. Dok su ta polja išla na ekran
// kao običan tekst, dete je umesto istaknute reči videlo navodnike i zvezdice.
// Ovde se ti znaci pretvaraju u ono što su i trebalo da budu.
//
// TEKST SE NIKAD NE PRETVARA U MARKUP
// -----------------------------------
// Rasparčavanje daje spisak komada, a ovde se od njih prave React elementi.
// `dangerouslySetInnerHTML` se ne koristi ni u jednom obliku. Tekst upisuje
// administrator, dakle nije tuđi unos, ali pravilo u ovom projektu ne poznaje
// izuzetke: ono što stiže iz baze ne postaje HTML.
//
// ZAŠTO NEMAČKA REČ DOBIJA I BOJU I `lang`
// ----------------------------------------
// Rečenice su mešane - naš jezik nosi objašnjenje, nemački primer. Dok su obe
// vrste reči izgledale isto, dete je moralo da pogađa šta prepisuje u svesku.
// Boja i blaga podloga to razdvajaju za oko, a `lang="de"` za sve ostalo:
// pretraživač po njemu prelama reč, a čitač ekrana je izgovori nemački, umesto
// da „müssen" pročita kao da je naša reč.
//
// JEDNA KOMPONENTA NA DVE PODLOGE
// -------------------------------
// Milioner je taman (studio), ekran lekcije je papir. Boje ne mogu da budu iste,
// ali komponenta sme da bude samo jedna, jer bi dve kopije značile dva mesta na
// kojima se pravilo menja. Zato ovde stoji `tema`: pozivalac kaže na kakvoj
// podlozi stoji, a paleta za obe živi na jednom mestu, ispod.
import type { CSSProperties, ReactNode } from "react";
import { Fragment } from "react";
import { rasparcaj } from "@/lib/zack/isticanje";

export type Tema = "tamna" | "svetla";

/**
 * Boje isticanja, po podlozi na kojoj stoje.
 *
 * Odnosi su IZMERENI (WCAG 2.1, relativna osvetljenost), ne procenjeni, i to sa
 * podlogom koja stvarno ispadne kad se providna ispuna položi na karticu:
 *
 *   tamna: zlatna #E8A33D na #12275A sa 14% zlatne preko  →  5.33:1
 *   svetla: plava #0B54C9 na #FCFBF7 sa 14% plave preko   →  5.23:1
 *
 * Oba su iznad 4.5:1, dakle i za sitan tekst. Ovo je aplikacija za decu i tu se
 * ne pogađa napamet: ko menja ijednu od ove četiri vrednosti, meri ponovo.
 */
const PALETA: Record<Tema, { boja: string; podloga: string }> = {
  tamna: { boja: "#E8A33D", podloga: "rgba(232, 163, 61, 0.14)" },
  svetla: { boja: "#0B54C9", podloga: "rgba(11, 84, 201, 0.14)" },
};

/**
 * Ispuna nemačke reči.
 *
 * Uspravno popunjavanje NE menja visinu reda: kod umetnutih elemenata visina
 * reda računa se po slovima, ne po ispuni. Zato podloga sme da bude malo viša
 * od slova, a da nijedan ekran ne poraste ni za piksel. To je uslov, jer
 * Milioner staje u tačno jedan vidokrug telefona.
 *
 * Vodoravno je namerno usko. Svaki dodatni delić gura zapetu i tačku koje
 * dolaze odmah iza reči, pa rečenica dobije rupu pred znakom interpunkcije.
 *
 * `boxDecorationBreak` je tu zbog izraza od dve reči (`in das`, `du arbeitest`):
 * kad se takav izraz prelomi na kraju reda, bez ovoga bi podloga ostala jedna
 * razvučena traka preko oba reda.
 */
const ISPUNA: CSSProperties = {
  padding: "0.1em 0.18em",
  borderRadius: "0.25em",
  boxDecorationBreak: "clone",
  WebkitBoxDecorationBreak: "clone",
};

/**
 * Tekst iz baze, sa isticanjem koje se vidi.
 *
 * Vraća samo umetnute elemente i nijedan blok, pa sme da stoji unutar `p`, `h2`
 * ili bilo čega drugog gde je tekst i do sada stajao. Pozivalac zadržava svoju
 * veličinu slova, boju običnog teksta i prored.
 */
export default function Isticanje({ tekst, tema }: { tekst: string; tema: Tema }): ReactNode {
  const { boja, podloga } = PALETA[tema];

  return (
    <>
      {rasparcaj(tekst).map((deo, redom) => {
        const jezgro = deo.nemacki ? (
          <span lang="de" style={{ ...ISPUNA, color: boja, background: podloga }}>
            {deo.tekst}
          </span>
        ) : (
          deo.tekst
        );

        return (
          <Fragment key={redom}>
            {deo.vazno ? <strong className="font-bold">{jezgro}</strong> : jezgro}
          </Fragment>
        );
      })}
    </>
  );
}
