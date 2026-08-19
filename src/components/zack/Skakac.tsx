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
// KADAR NIKAD NIJE PRAZAN
// -----------------------
// Kamera se pomera CSS prelazom, dakle nju crta pretraživač, a mi ne znamo gde
// je tačno u datom trenutku. Stena i police se crtaju samo oko kadra, i to je
// jedina stvar koja ovde sme da pukne: ako se prozor crtanja računa po visini
// ka kojoj kamera IDE, a pretraživač još crta onu odakle je pošla, dete gleda
// prazan kadar. Nije teorija - dovoljno je da kartica ode u pozadinu usred
// klizanja (prelazi tamo stanu, tajmeri se uspore) pa da se po povratku prizor
// zatekne desetak spratova ispod onoga što je nacrtano.
//
// Zato ovde postoje DVE visine, i obe se poštuju:
//
//   `vidljivSprat`  - visina ka kojoj kamera ide (cilj).
//   `nacrtanSprat`  - visina za koju je PRETRAŽIVAČ potvrdio da je nacrtana,
//                     kroz `transitionend`. Nikad se ne pretpostavlja iz tajmera.
//
// Nacrtano je uvek niže ili jednako cilju, a stvarni položaj kamere je negde
// između. Prozor crtanja ide od nacrtanog do cilja, pa je sve kroz šta se putuje
// već na ekranu i nema tog rasporeda događaja u kom bi kadar ostao prazan.
//
// Uz to, kliza se samo kad je razmak tačno jedan sprat. Sve veće od toga je znak
// da prelaz nije stigao da se odvrti (pozadinska kartica, spor uređaj), pa se
// prelaz gasi i skače odmah. Time prozor nikad nije širi od jednog sprata: u
// miru je scena tačno onolika kolika je i bila, a dok kamera kliza ima jedan
// sprat viška, dakle desetak čvorova, i to samo tih pola sekunde. To je kočnica
// za brzinu; za ispravnost je dovoljan sam prozor.
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
// LIČNI REKORD
// ------------
// Na steni stoji tanka linija na visini najboljeg dosadašnjeg penjanja, sa
// sitnom oznakom. To je jedini razlog da se krene ponovo: bez nje je svaka
// partija sama sebi kraj. Kad je koza prestigne, javi se kratko i vedro, jednom,
// i to je sve - bez fanfara preko celog ekrana.
//
// Kad se rekord NE obori, ne piše se ništa. Nema „nisi uspeo", nema koliko je
// falilo. Isto pravilo kao i sve ostalo ovde: dete gubi srca, nikad reči i nikad
// visinu, i nikad ne dobija prekor. Pre prve partije linije nema, da prvi
// pokušaj ne počne poređenjem sa nečim.
//
// POJASEVI STENE
// --------------
// Stena se menja kako se koza penje: podnožje je toplo i zemljano, više gore je
// siv kamen, pa hladan greben, pa sneg, pa nebo iznad oblaka. Bez toga je sprat
// 7 izgledao isto kao sprat 1, pa je visina bila broj u uglu a ne prizor.
//
// Granice, imena i boje NISU ovde nego u `@/lib/zack/pojas`, u jednom nizu, jer
// će se menjati. Ovde je samo crtež.
//
// Prelaz se primeti, ali bez fanfara: boja stene se promeni, na kamenu ostane
// granična crta sa imenom pojasa, a iznad polica se na par sekundi javi mirna
// pločica („Koza je stigla do grebena"). Nagrada koja stiže na svakih pet-šest
// spratova, između dva rekorda.
//
// Ime pojasa nigde ne postoji SAMO kao boja: stoji i kao tekst iznad polica,
// stoji uz liniju rekorda, javlja se kroz `aria-live` i ulazi u poruku na kraju
// partije. Inače bi dete sa čitačem ekrana od cele ove izmene dobilo ništa.
//
// Pojas do kog se stiglo se imenuje; oni iznad se ne pominju. Nigde ne piše
// dokle dete NIJE stiglo.
//
// SLUČAJNOST
// ----------
// U ishodu je nema. Sve što se ovde računa zavisi samo od toga koju je policu
// dete dodirnulo.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Pitanje } from "@/lib/zack/pitanja";
import { bojaZaRod, type Rod } from "@/lib/zack/rec";
import { POJASEVI, opisSprata, pocinjePojas, pojasZaSprat, type Pojas } from "@/lib/zack/pojas";

// Papir, ne gejmerski ekran. Iste boje kao u ljusci; stoje ovde zato što ih
// ljuska ne izvozi, a uvoz iz nje bi napravio krug (ljuska već uvozi ovaj fajl).
const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const MASTILO = "#16161A";
const PRIGUSEN = "#6E6A5E";
// Kamen NEMA svoju boju ovde: tlo, traka uz levu ivicu i vazduh dobijaju je od
// pojasa u kom stoje (`@/lib/zack/pojas`), jer se stena menja po visini.
/** Zelena uspeha, ista kao u odzivu ljuske, da „dobro je" svuda izgleda isto. */
const ZELENA = "#1E7A4B";
const ZELENA_PODLOGA = "#E4F0E9";

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

/** Na das zelenoj belo daje samo 3.4:1, pa das nosi mastilo (5.3:1). */
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
// što stoji iznad i ispod scene: okvir stranice, naslov sa srcima, traka odziva,
// dugme „Dosta za sad" i sitna licenca u podnožju rasporeda. Tako scena sama
// popuni ekran, pa police padnu u donju trećinu gde ih palac dohvata, umesto da
// igra stoji u sredini sa praznim pojasom ispod.
// `dvh`, ne `vh`, jer na telefonu adresna traka jede deo ekrana. `clamp` je
// kočnica na oba kraja: na niskom prozoru se scena skupi umesto da napravi
// skrol, na širokom monitoru se ne razvuče.
//
// Traka napretka se u ovoj igri ne crta (partija nema unapred poznat kraj), pa
// je ovaj broj za njenu visinu manji nego dok je stajala.
const SCENA_VISINA = "clamp(330px, calc(100dvh - 282px), 560px)";

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

/**
 * Visina na kojoj koza STOJI kad osvoji sprat, dakle vrh te police. Linija
 * rekorda ide baš tu: kad koza stane na taj sprat, dodirne je, a sledeći skok je
 * prestiže. Da je linija bilo gde drugde, „dokle treba da stigneš" ne bi se
 * poklapalo sa tim gde koza stane.
 */
function visinaStajanja(sprat: number): number {
  return dnoSprata(sprat) + POLICA_VISINA;
}

// ── Pojasevi stene ──────────────────────────────────────────────────────────

/**
 * Donja ivica pojasa, dakle mesto gde se stena menja: donja ivica prve police
 * tog pojasa. Koza koja stoji na spratu ispod je jasno ispod te crte, a čim
 * osvoji prvi sprat pojasa, stoji jasno iznad nje.
 *
 * Podnožje kreće duboko ispod tla, da se ni pri prvom skoku ne vidi gde stena
 * počinje.
 */
function dnoPojasa(pojas: Pojas): number {
  return pojas.odSprata <= 1 ? SIDRO - TLO_DUBINA : dnoSprata(pojas.odSprata);
}

/**
 * Prozor oko kadra. Pojasevi se crtaju SAMO unutar njega, odsečeni i odozdo i
 * odozgo, jer poslednji pojas nema gornju ivicu: penjanje nema kraj, pa bi
 * inače jedan element bio visok trideset hiljada piksela i rastao bi sa svakim
 * spratom. Ovako je svaki sloj kamena visok najviše koliko i ekran, ma da li je
 * koza na petom ili na šezdesetom spratu.
 *
 * Ovo je SAMO margina oko puta kroz koji se putuje, da se odsečena ivica ne
 * zatekne u kadru zbog zaokruživanja i delimičnog reda. Zaostajanje kamere se
 * ovim viškom NE pokriva - za to služi to što prozor kreće od `nacrtanSprat`, a
 * ne od cilja (vidi „KADAR NIKAD NIJE PRAZAN" gore).
 */
const KADAR_VISAK = 400;
/** Najviša scena koju `SCENA_VISINA` dopušta. Gornji kraj prozora. */
const KADAR_NAJVISE = 560;

/** Visina šare u kamenu. Sedi NA polici svog sprata, ne ispod nje. */
const MOTIV_VISINA = 26;

/**
 * Šara u kamenu, jedna po spratu. Crta se samo za spratove koji su u kadru, pa
 * ih na ekranu nikad nema više od pet, bez obzira dokle se koza popela.
 *
 * Stoji tačno NA polici svog sprata, a ne ispod nje: granica pojasa je donja
 * ivica prve police, pa bi šara ispod police upala u tuđi pojas i pukotine bi
 * se videle u travi.
 *
 * Sve je jedna te ista tanka linija u boji ivice tog pojasa: papir, ne slika.
 * Razlika među pojasevima je u tome ŠTA se crta, ne u tome koliko je šareno.
 */
function Motiv({ sprat }: { sprat: number }) {
  const pojas = pojasZaSprat(sprat);
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 26"
      preserveAspectRatio="xMidYMax meet"
      className="pointer-events-none absolute"
      style={{
        left: TRAKA_SIRINA,
        right: 0,
        bottom: visinaStajanja(sprat),
        height: MOTIV_VISINA,
        opacity: 0.85,
      }}
      fill="none"
      stroke={pojas.ivica}
      strokeWidth="2"
      strokeLinecap="round"
    >
      {/* Trava u podnožju: busenovi koji rastu uz kamen. */}
      {pojas.motiv === "trava" && (
        <>
          <path d="M18 25c0-7-3-10-6-13M18 25c0-8 2-11 5-14M24 25c0-6 2-9 4-11" />
          <path d="M104 25c0-7 3-10 6-13M110 25c0-8-2-11-5-14" />
          <path d="M196 25c0-6-3-9-5-11M202 25c0-8 2-11 5-13" />
          <path d="M290 25c0-7 3-10 6-13M296 25c0-6-2-8-4-10" />
        </>
      )}
      {/* Siva stena: pukotine u kamenu, mirne i retke. */}
      {pojas.motiv === "pukotina" && (
        <>
          <path d="M34 25l16-9 7 5 14-10" />
          <path d="M150 24l11-7 10 4" />
          <path d="M242 25l14-8 9 6" />
        </>
      )}
      {/* Greben: police su ovde ređe, pa se i u kamenu vide samo kratki izdanci. */}
      {pojas.motiv === "polica" && (
        <>
          <path d="M30 19h54" />
          <path d="M154 11h40" />
          <path d="M250 21h48" />
        </>
      )}
      {/* Sneg: tragovi koji vode uvis. */}
      {pojas.motiv === "trag" && (
        <g fill={pojas.ivica} stroke="none">
          <ellipse cx="46" cy="22" rx="4" ry="3" />
          <ellipse cx="82" cy="16" rx="4" ry="3" />
          <ellipse cx="118" cy="21" rx="4" ry="3" />
          <ellipse cx="196" cy="15" rx="4" ry="3" />
          <ellipse cx="232" cy="20" rx="4" ry="3" />
          <ellipse cx="268" cy="14" rx="4" ry="3" />
        </g>
      )}
      {/* Iznad oblaka: oblaci su ISPOD, pa se i crtaju kao da se gledaju odozgo. */}
      {pojas.motiv === "oblak" && (
        <g fill={pojas.ivica} stroke="none">
          <ellipse cx="60" cy="21" rx="34" ry="7" />
          <ellipse cx="44" cy="17" rx="16" ry="6" />
          <ellipse cx="222" cy="22" rx="40" ry="7" />
          <ellipse cx="244" cy="17" rx="18" ry="6" />
        </g>
      )}
    </svg>
  );
}

/**
 * Jedan pojas stene: vazduh preko cele scene, kamena traka uz levu ivicu i, na
 * donjoj ivici, granična crta sa imenom pojasa.
 *
 * Sve to klizi zajedno sa ostatkom sveta, pa se promena boje ne pretapa nego
 * uklizi odozgo. Zato ovde nema nijednog prelaza koji bi `prefers-reduced-motion`
 * morao da gasi: kad je kamera bez animacije, i stena se promeni istog trena.
 *
 * Ime na crti je ovde vezano za MESTO, a ne za stanje igre, pa ostaje na svojoj
 * visini i izađe iz kadra kad koza odmakne. Ono što uvek mora da bude vidljivo
 * stoji gore, uz imenicu.
 *
 * `dno` i `vrh` su već odsečeni na prozor oko kadra, pa je ovo uvek jedan
 * komad kamena visok najviše kao ekran. `granica` kaže da li je u kadru i
 * STVARNI početak pojasa; samo tada se crtaju crta i ime.
 */
function PojasStene({
  pojas,
  dno,
  vrh,
  granica,
}: {
  pojas: Pojas;
  dno: number;
  vrh: number;
  granica: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0"
      style={{ bottom: dno, height: vrh - dno, background: pojas.nebo }}
    >
      {/* Kamena traka uz levu ivicu. Ona se ne pomera vodoravno, a brojevi
          spratova klize kroz nju - po tome se vidi da se penje. */}
      <span
        className="absolute inset-y-0 left-0 border-r-2"
        style={{ width: TRAKA_SIRINA, background: pojas.kamen, borderColor: pojas.ivica }}
      />
      {granica && (
        <>
          {/* Granična crta. Puna, ne isprekidana, da se ne pomeša sa linijom
              rekorda, koja je jedina isprekidana stvar na steni. */}
          <span
            className="absolute inset-x-0 bottom-0 border-b-2"
            style={{ borderColor: pojas.ivica }}
          />
          {/* Ime stoji ISPOD crte, u praznom zidu između dve police. Iznad crte
              je odmah prva polica pojasa, a ona je dugme i ne sme da se pokriva.
              `z-[5]` je iznad koze a ispod polica: kad se poklope, ime ostane
              čitko, a nijedna meta se ne zaklanja. */}
          <span
            className="font-heading absolute bottom-[-46px] right-2 z-[5] rounded-full border px-2 py-[2px] text-[11px] font-bold"
            style={{
              borderColor: pojas.ivica,
              background: pojas.kamen,
              color: MASTILO,
            }}
          >
            {pojas.ime}
          </span>
        </>
      )}
    </div>
  );
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
 * Koliko javljanje o oborenom rekordu stoji na ekranu. Kratko, jer se posle toga
 * penjanje nastavlja. Ovo je tajmer, ne animacija: pločica se pojavi i nestane
 * bez ijednog prelaza, pa `prefers-reduced-motion` nema šta da gasi.
 */
const SLAVLJE_MS = 2200;

/**
 * Pretapanje boje pojasa na pločicama iznad polica. Sama stena se ne pretapa -
 * ona uklizi odozdo zajedno sa kamerom - ali pločice stoje u mestu, pa bi im
 * skok boje bio trzaj. Kratko i bez krive, da promena ne izgleda kao događaj.
 * Kad je pokret ugašen, ovo prođe kroz `trajanje()` i padne na nulu.
 */
const POJAS_MS = 260;

/**
 * Kamera namerno kasni za skokom. Bez zastoja bi se prizor spustio u istom
 * trenutku kad koza skoči, pa bi izgledalo kao da koza stoji u mestu a svet se
 * pomera. Ovako se prvo vidi skok, pa onda penjanje.
 */
const KAMERA_MS = 420;
const KAMERA_ZASTOJ = 140;

/**
 * Koliko sprata kamera sme da pređe klizanjem. Jedan: toliko je i skok. Sve
 * veće od toga znači da prethodni prelaz nije stigao da se odvrti, pa se ne
 * kliza nego skače - inače bi klizanje kroz pola stene bilo i sporo i ružno.
 */
const KAMERA_KLIZI_SPRATOVA = 1;

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

/**
 * Linija najboljeg dosadašnjeg penjanja. Ide preko cele scene, i preko trake sa
 * brojevima, jer je to visina a ne polica - ništa se na nju ne skače.
 *
 * Crta se u sloju koji se penje, pa klizi zajedno sa stenom i sama izađe iz
 * kadra kad je koza prestigne. Iznad polica je namerno: kad se poklopi sa vrhom
 * police, mora da se vidi da linija tu jeste.
 *
 * Uz liniju stoji i ime pojasa u kom je rekord („Rekord: greben, 14. sprat").
 * Broj sam za sebe je bio jedini orijentir u praznoj steni; sa imenom se vidi
 * NA KOJOJ VISINI rekord stoji, isto onako kako se vidi gde je koza.
 *
 * `aria-hidden`, jer isto to piše u uputstvu za čitač ekrana gore. Podatak koji
 * postoji samo kao crta na ekranu ne bi bio dostupan.
 */
function LinijaRekorda({ sprat }: { sprat: number }) {
  const pojas = pojasZaSprat(sprat);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-[15] border-t-2 border-dashed"
      style={{ bottom: visinaStajanja(sprat), borderColor: PRIGUSEN }}
    >
      {/* Oznaka stoji IZNAD linije, da ne pokrije policu koja je odmah ispod. */}
      <span
        className="font-heading absolute bottom-[3px] right-2 rounded-full border px-2 py-[2px] text-[11px] font-bold"
        style={{ borderColor: pojas.ivica, background: pojas.kamen, color: PRIGUSEN }}
      >
        {`Rekord: ${opisSprata(sprat)}`}
      </span>
    </div>
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
  rekord,
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
  /**
   * Najbolje dosadašnje penjanje na ovoj lekciji, ili ništa ako rekorda još
   * nema. Rekord se ovde samo prikazuje - upisuje ga ekran lekcije na kraju
   * partije, jer samo on ima pristup rutama.
   */
  rekord?: number | null;
}) {
  const manjePokreta = useManjePokreta();
  const imenica = bezClana(pitanje.imenica);
  // Nula i ništa su ovde ista stvar: rekord na tlu nije rekord, pa se linija ne
  // crta i detetu se ne pominje.
  const rekordSprat = typeof rekord === "number" && rekord > 0 ? rekord : null;

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
  /**
   * Sprat za koji je PRETRAŽIVAČ potvrdio da ga je nacrtao. Ne pogađa se iz
   * tajmera nego stiže iz `transitionend`, jer klizanje kamere crta pretraživač
   * i on jedini zna da je stiglo do kraja. Sve između ovoga i `vidljivSprat` je
   * put kroz koji kamera upravo prolazi - i baš zato se sve to i crta.
   *
   * Nikad nije veći od `vidljivSprat`: visina se ne gubi, pa se ni prizor ne
   * spušta.
   */
  const [nacrtanSprat, setNacrtanSprat] = useState(0);
  const [faza, setFaza] = useState<Faza>("mirno");
  // Koja je polica dodirnuta. Ujedno i brava: dok stoji, drugi tap ne prolazi.
  const [meta, setMeta] = useState<number | null>(null);
  /** Stoji samo u trenutku kad se rekord obori, i to kratko. */
  const [slavlje, setSlavlje] = useState(false);
  /**
   * Pojas u koji je koza upravo ušla, i to samo prvih par sekundi. Posle toga
   * pločica iznad polica vrati puko ime pojasa - promena je vest, sam pojas nije.
   */
  const [stigla, setStigla] = useState<Pojas | null>(null);

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

  /**
   * Tajmer slavlja stoji ODVOJENO od tajmera skoka, jer se oni čiste na svako
   * novo pitanje. Gašenje javljanja mora da preživi taj prelaz, inače bi pločica
   * ostala na ekranu do kraja partije.
   */
  const slavljeTajmer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Isto važi i za javljanje o novom pojasu, iz istog razloga. */
  const pojasTajmer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (slavljeTajmer.current) clearTimeout(slavljeTajmer.current);
      if (pojasTajmer.current) clearTimeout(pojasTajmer.current);
    },
    []
  );

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

      // Rekord se obara tačno jednom po partiji: na spratu odmah iznad njega.
      // Sve iznad toga je i dalje novi rekord, ali se više ne javlja - jednom je
      // vedro, na svakom spratu bi bilo galama.
      if (rekordSprat !== null && noviSprat === rekordSprat + 1) {
        setSlavlje(true);
        if (slavljeTajmer.current) clearTimeout(slavljeTajmer.current);
        slavljeTajmer.current = setTimeout(() => setSlavlje(false), SLAVLJE_MS);
      }

      // Nov pojas se javi tačno na svom prvom spratu, pa svakih pet-šest
      // spratova. Mirno, jednom, i onda pločica vrati puko ime pojasa.
      const nov = pocinjePojas(noviSprat);
      if (nov) {
        setStigla(nov);
        if (pojasTajmer.current) clearTimeout(pojasTajmer.current);
        pojasTajmer.current = setTimeout(() => setStigla(null), SLAVLJE_MS);
      }

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

  /**
   * Kamera se ne kliza, nego skače: ili je već stigla (nema šta da se kliza),
   * ili je razmak veći od jednog sprata pa prethodni prelaz nije stigao da se
   * odvrti, ili korisnik traži manje pokreta. U sva tri slučaja prelaza nema, pa
   * pretraživač nacrta novi položaj istog trena.
   */
  const kameraSkace = manjePokreta || vidljivSprat - nacrtanSprat !== KAMERA_KLIZI_SPRATOVA;
  // Kad se skače, nema `transitionend` koji bi javio da je stiglo, pa se upisuje
  // ovde. Namerno u telu, ne u tajmeru ni u efektu: tako novi položaj i prozor
  // crtanja odu na ekran u ISTOM kadru, pa ne postoji trenutak u kom se razilaze.
  if (kameraSkace && nacrtanSprat !== vidljivSprat) setNacrtanSprat(vidljivSprat);

  const metaSprat = vidljivSprat + 1;
  // Prozor spratova koji se uopšte crtaju. Kreće od NACRTANOG sprata, ne od
  // vidljivog: dok kamera kliza, na ekranu je još stari položaj, pa mora da bude
  // nacrtano sve kroz šta se prolazi. Gornja dva daju osećaj da stena ide dalje
  // uvis. Sve van prozora je ionako iza ivice scene.
  const predjeni: number[] = [];
  for (let s = Math.max(1, nacrtanSprat - 1); s <= vidljivSprat; s++) predjeni.push(s);
  const buduci = [metaSprat + 1, metaSprat + 2];
  const oznake = [...predjeni, metaSprat, metaSprat + 1, metaSprat + 2];

  const najava = sprat === 0 ? "" : `Koza je na ${sprat}. spratu.`;

  /** Pojas se vodi po ZARAĐENOJ visini, isto kao i brojka u uglu. */
  const pojasSad = pojasZaSprat(sprat);
  // Kamen se crta samo u prozoru oko kadra, isto kao i police. U nizu je pet
  // pojaseva, u kadru ih je najviše dva-tri, i nijedan nije viši od ekrana - ni
  // na petom ni na šezdesetom spratu.
  // Od nacrtanog do ciljnog, pa je pokriven ceo put kroz koji kamera prolazi.
  const kadarDno = nacrtanSprat * SPRAT_RAZMAK - KADAR_VISAK;
  const kadarVrh = kamera + KADAR_NAJVISE + KADAR_VISAK;
  const slojevi = POJASEVI.map((pojas, i) => {
    const sledeci = POJASEVI[i + 1];
    const dno = dnoPojasa(pojas);
    // Poslednji pojas nema vrh: iznad njega se penje dokle god ima srca.
    const vrh = sledeci ? dnoPojasa(sledeci) : Number.POSITIVE_INFINITY;
    return {
      pojas,
      dno: Math.max(dno, kadarDno),
      vrh: Math.min(vrh, kadarVrh),
      // Podnožje počinje ispod tla, pa mu se početak nikad ne crta.
      granica: pojas.odSprata > 1 && dno >= kadarDno,
      uKadru: vrh > kadarDno && dno < kadarVrh,
    };
  }).filter((s) => s.uKadru);

  return (
    <div>
      <p className="sr-only">
        Dodirni policu sa tačnim članom i koza skače na nju. Svaki tačan odgovor je sprat više i
        koza se sa te visine nikad ne spušta. Strelicama levo i desno biraš policu, a Enterom
        skačeš.
        {/* Linija rekorda na steni je inače podatak koji postoji samo kao crta
            na ekranu. Kad rekorda nema, ovde se ne pominje ništa. */}
        {rekordSprat !== null && ` Na steni je linija tvog rekorda: ${opisSprata(rekordSprat)}.`}
        {/* Stena se penjanjem menja: ime pojasa je inače samo boja, a boja za
            čitač ekrana ne postoji. */}
        {` Stena se menja kako se penješ i svaki pojas ima svoje ime. Koza je u pojasu ${pojasSad.imeMalo}.`}
      </p>
      {/* Visina inače postoji samo kao pokret prizora, pa se svaki nov sprat i
          izgovori. „Uljudno", da ne preseca odziv ljuske („Zack!", „Ups!"), koji
          je hitniji i stiže u istom trenutku. */}
      <p aria-live="polite" className="sr-only">
        {najava}
      </p>
      {/* Obaranje rekorda ima SVOJ `aria-live`, a ne dopisak na najavu sprata:
          spojeni, čitač bi ponovo pročitao sprat kad se javljanje ugasi. */}
      <p aria-live="polite" className="sr-only">
        {slavlje ? `Nov rekord! ${sprat}. sprat.` : ""}
      </p>
      {/* Ulazak u nov pojas ide kroz SVOJ `aria-live`, iz istog razloga: spojen
          sa najavom sprata, čitač bi ponovo pročitao sprat kad se javljanje
          ugasi. Bez ovoga bi cela promena stene za dete koje ne vidi ekran bila
          samo promena boje, dakle ništa. */}
      <p aria-live="polite" className="sr-only">
        {stigla ? `Koza je stigla ${stigla.dokle}.` : ""}
      </p>

      <div
        className="relative overflow-hidden rounded-2xl border"
        style={{ height: SCENA_VISINA, background: PAPIR, borderColor: IVICA }}
      >
        {/* Sve što se penje. Jedan sloj, jedan `translateY`: stena, tlo, police,
            brojevi i koza se pomeraju zajedno, pa se odnosi među njima ne mogu
            razići. Zato i pojasevi klize sa svime ostalim: granica između dva
            pojasa je mesto na steni, a ne stanje igre. */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translateY(${kamera}px)`,
            transition: kameraSkace
              ? "none"
              : `transform ${KAMERA_MS}ms cubic-bezier(.33,1,.68,1) ${KAMERA_ZASTOJ}ms`,
          }}
          // Jedino mesto sa kog se saznaje da je prizor STVARNO stigao. Prelazi
          // koze i pločica takođe stižu dovde, pa se propuštaju samo oni sa
          // ovog sloja.
          onTransitionEnd={(e) => {
            if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
            // Odvrteo se tačno onoliko koliko se i klizalo, dakle jedan sprat.
            // Ako je za to vreme zarađen još jedan, on još NIJE nacrtan, pa se
            // ne sme upisati - zato korak, a ne skok na `vidljivSprat`.
            setNacrtanSprat((s) => Math.min(vidljivSprat, s + KAMERA_KLIZI_SPRATOVA));
          }}
        >
          {/* Stena, pojas po pojas. Ide prvo, pa je iza svega ostalog. */}
          {slojevi.map(({ pojas, dno, vrh, granica }) => (
            <PojasStene key={pojas.odSprata} pojas={pojas} dno={dno} vrh={vrh} granica={granica} />
          ))}

          {/* Tlo. Odavde koza kreće; ispod njega se nikad ne ide. Uvek je u
              prvom pojasu, pa nosi njegovu boju kamena. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 border-t-2"
            style={{
              bottom: SIDRO - TLO_DUBINA,
              height: TLO_DUBINA,
              background: pojasZaSprat(0).kamen,
              borderColor: pojasZaSprat(0).ivica,
            }}
          />

          {/* Šara u kamenu, po jedna uz svaki sprat u kadru. */}
          {oznake.map((s) => (
            <Motiv key={s} sprat={s} />
          ))}

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

          {rekordSprat !== null && <LinijaRekorda sprat={rekordSprat} />}

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
          {/* Brojka uz penjanje. Nosi boje pojasa u kom je koza, pa se i gore, u
              mirnom delu ekrana, vidi da se stena promenila. Boja se pretapa,
              jer se ovo ne pomera sa scenom nego stoji - a kad je pokret ugašen,
              trajanje padne na nulu i promena je trenutna.
              Čitač ekrana istu stvar dobija kroz `aria-live` gore. */}
          <span
            aria-hidden="true"
            className="font-heading absolute right-3 top-3 rounded-full border px-2 py-[3px] text-[11px] font-bold tabular-nums"
            style={{
              borderColor: pojasSad.ivica,
              background: pojasSad.kamen,
              color: PRIGUSEN,
              transition: `background-color ${trajanje(POJAS_MS)}ms linear, border-color ${trajanje(POJAS_MS)}ms linear`,
            }}
          >
            {sprat === 0 ? "tlo" : `${sprat}. sprat`}
          </span>

          {/* Red pločica ispod imenice. Nema animacije, pa izgleda isto i kad je
              pokret ugašen, a duga reč prolazi iznad njega umesto ispod. */}
          <p
            aria-hidden="true"
            className="font-heading mt-1.5 flex flex-wrap justify-center gap-1.5 text-[12px] font-bold leading-none"
          >
            {/* Ime pojasa stoji STALNO, ne samo u trenutku prelaza: dete koje
                uđe u igru na desetom spratu inače ne bi imalo odakle da sazna
                gde je. Kad koza uđe u nov pojas, ista pločica na par sekundi
                kaže da je stigla, pa se vrati na samo ime. Bez fanfara: boje su
                boje tog kamena, ne zelena uspeha. */}
            <span
              className="inline-block rounded-full border-2 px-2.5 py-[4px]"
              style={{
                borderColor: pojasSad.ivica,
                background: pojasSad.kamen,
                color: stigla ? MASTILO : PRIGUSEN,
                transition: `background-color ${trajanje(POJAS_MS)}ms linear, border-color ${trajanje(POJAS_MS)}ms linear`,
              }}
            >
              {stigla ? `Koza je stigla ${stigla.dokle}` : pojasSad.imeMalo}
            </span>

            {/* Obaranje rekorda, u zelenoj boji uspeha iz ljuske. Ume da se
                poklopi sa ulaskom u nov pojas, pa stoje jedna uz drugu. */}
            {slavlje && (
              <span
                className="inline-block rounded-full border-2 px-2.5 py-[4px]"
                style={{ borderColor: ZELENA, background: ZELENA_PODLOGA, color: ZELENA }}
              >
                Nov rekord!
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
