// Milioner: provera celine posle tri-četiri lekcije. Nije igra za sličice nego
// ispit, pa ovde nema ni srca ni nagrade - samo pitanja i tri pomoći.
//
// PRAVILO KOJE SE NE SME PREKRŠITI
// -------------------------------
// Milioner sme da pita SAMO obrađeno gradivo. Svaka gramatička tačka nosi
// `od_lekcije`, dakle broj lekcije od koje je to gradivo obrađeno, i u partiju
// ulaze isključivo tačke sa `od_lekcije <= broj lekcije iz koje se ušlo`.
//
// Provera stoji OVDE, u čistoj logici, a ne samo u upitu koji dovlači pitanja.
// Razlog je što upit vraća ono što mu je rečeno da vrati, a jedan pogrešan
// uslov u rutu se lako uvuče i niko ga ne primeti dok u bazi postoji samo prva
// lekcija. Ovde se to vidi u testu koji pada.
//
// Testiranje neobrađene gramatike demotiviše dete, i to je već utvrđeno pravilo
// na platformi. Nije stvar poštenja u igri, nego toga da dete koje izgubi na
// gradivu koje škola nije radila zaključi da ne zna nemački.
//
// ZAŠTO SE PONUĐENI ODGOVORI OBAVEZNO MEŠAJU
// ------------------------------------------
// U bazi je `tacan` indeks u nizu `opcije`, i u svih trideset unetih pitanja on
// je NULA. To je razumljivo dok se pitanja kucaju (tačan odgovor se piše prvi),
// ali bi na ekranu značilo da je tačan odgovor uvek prvo dugme. Dete to provali
// posle trećeg pitanja i dalje ne čita pitanja nego bira prvo dugme. Zato se
// opcije mešaju pri sastavljanju partije, a `tacan` se prevodi na novo mesto.
//
// SLUČAJNOST I VREME
// ------------------
// Ništa ovde ne zove `Math.random()` niti gleda u sat. Izvor slučajnosti se
// ubrizgava kao `rng`, da bi partija mogla da se ponovi u testu.
import { promesaj } from "./rec";

/** Gramatička tačka: podsetnik koji dete čita pre partije i uz pomoć „pitaj profesorku". */
export type GramatickaTacka = {
  id: string;
  redni_broj: number;
  naziv: string;
  objasnjenje: string;
  primer: string | null;
  /** Od koje je lekcije ovo gradivo obrađeno. Srce pravila iznad. */
  od_lekcije: number;
};

/** Pitanje kako stoji u bazi: `tacan` je indeks u `opcije`, a `opcije` još nisu mešane. */
export type GramatickoPitanje = {
  id: string;
  gramatika_id: string;
  pitanje: string;
  opcije: string[];
  tacan: number;
  /** 1 lako, 2 srednje, 3 teško. */
  tezina: number;
};

/** Pitanje spremno za ekran: opcije promešane, `tacan` preračunat na novo mesto. */
export type PitanjePartije = {
  id: string;
  /** Ključ tačke iz koje je pitanje. Preko njega „pitaj profesorku" nalazi objašnjenje. */
  gramatikaId: string;
  pitanje: string;
  opcije: string[];
  tacan: number;
  tezina: number;
};

export type Partija = {
  /**
   * Tačke koje su stvarno ušle u partiju, poređane po rednom broju. To je ono
   * što dete čita na početku, pre nego što krene: podsetnik na baš ovo gradivo,
   * a ne na sve što je ikad radilo.
   */
  tacke: GramatickaTacka[];
  pitanja: PitanjePartije[];
  /**
   * Dozvoljena pitanja koja nisu ušla u partiju. Iz njih se vadi zamena kad
   * dete potroši pomoć „zameni pitanje". Prazna rezerva nije greška, samo znači
   * da te pomoći nema čime da se posluži.
   */
  rezerva: PitanjePartije[];
};

/** Koliko pitanja ima partija. Ispod dvanaest se ide samo kad ih toliko ni nema. */
export const NAJMANJE_PITANJA = 12;
export const NAJVISE_PITANJA = 15;

/**
 * Dužina partije prema tome koliko dozvoljenih pitanja uopšte postoji.
 *
 * Kad ima više nego što partija traži, jedno se NAMERNO ostavlja sa strane, da
 * pomoć „zameni pitanje" ima čime da radi. Bez toga bi partija od tačno onoliko
 * pitanja koliko ih ima pojela sve, pa bi jedna od tri pomoći bila mrtvo dugme.
 * Ispod donje granice se ne silazi: bolje partija bez zamene nego partija od
 * jedanaest pitanja.
 */
export function duzinaPartije(dostupno: number): number {
  if (dostupno <= NAJMANJE_PITANJA) return Math.max(0, dostupno);
  return Math.min(NAJVISE_PITANJA, dostupno - 1);
}

/**
 * Tačke koje smeju da se pitaju iz ove lekcije.
 *
 * Ovo je jedino mesto na kom se `od_lekcije` poredi, pa je i jedino mesto koje
 * može da pogreši. Sve ostalo ide preko njega.
 */
export function dozvoljeneTacke(
  tacke: readonly GramatickaTacka[],
  brojLekcije: number
): GramatickaTacka[] {
  return tacke.filter((t) => t.od_lekcije <= brojLekcije);
}

/**
 * Red iz baze se ne uzima na veru. `opcije` je JSONB, dakle sve što je neko
 * uspeo da upiše, a pitanje sa dve iste opcije ili sa `tacan` van niza detetu
 * izgleda kao greška u aplikaciji. Takvo pitanje TIHO otpada, umesto da obori
 * celu partiju: bolje jedno pitanje manje nego prazan ekran.
 */
function ispravno(p: GramatickoPitanje): boolean {
  if (!Array.isArray(p.opcije) || p.opcije.length < 2) return false;
  if (!p.opcije.every((o) => typeof o === "string" && o.length > 0)) return false;
  if (!Number.isInteger(p.tacan) || p.tacan < 0 || p.tacan >= p.opcije.length) return false;
  // Dve iste opcije nisu samo ružne: posle mešanja se tačno mesto traži po
  // tekstu, pa bi duplikat umeo da pokaže na pogrešnu od dve iste.
  if (new Set(p.opcije).size !== p.opcije.length) return false;
  return true;
}

/** Težina van 1-3 se ne odbacuje nego privlači na najbližu, da pitanje ne propadne. */
function tezinaUOpsegu(tezina: number): number {
  if (!Number.isFinite(tezina)) return 1;
  return Math.min(3, Math.max(1, Math.round(tezina)));
}

/** Meša ponuđene odgovore i pamti gde je tačan završio. Vidi uvod fajla. */
function zaEkran(p: GramatickoPitanje, rng: () => number): PitanjePartije {
  const tacanTekst = p.opcije[p.tacan];
  const opcije = promesaj(p.opcije, rng);
  return {
    id: p.id,
    gramatikaId: p.gramatika_id,
    pitanje: p.pitanje,
    opcije,
    tacan: opcije.indexOf(tacanTekst),
    tezina: tezinaUOpsegu(p.tezina),
  };
}

/**
 * Bira koja pitanja ulaze u partiju kad ih ima više nego što partija prima.
 *
 * Ne seče se prosto sa kraja poređanog spiska: tako bi otpala baš najteža
 * pitanja, a Milioner bez teškog kraja nije Milioner. Umesto toga se višak
 * skida sa NAJBROJNIJE težine, jednu po jednu, dok se ne stigne na traženu
 * dužinu. Time se retka teška pitanja čuvaju, a nagib partije ostaje.
 */
function raspodeli(poTezini: PitanjePartije[][], koliko: number): void {
  let ukupno = poTezini.reduce((z, grupa) => z + grupa.length, 0);
  while (ukupno > koliko) {
    let najveca = 0;
    for (let i = 1; i < poTezini.length; i++) {
      if (poTezini[i].length > poTezini[najveca].length) najveca = i;
    }
    if (poTezini[najveca].length === 0) return;
    poTezini[najveca].pop();
    ukupno--;
  }
}

/**
 * Sastavlja partiju: dozvoljena pitanja, poređana po rastućoj težini, promešana
 * unutar iste težine, bez ijednog ponavljanja.
 *
 * Isto pitanje se u jednoj partiji ne pojavljuje dvaput ni kad ih nema dovoljno.
 * Radije se igra kraća partija nego da se dete pita isto dvaput - to je jedina
 * stvar koju u kvizu odmah primeti i doživi kao da aplikacija ne radi.
 */
export function sastaviPartiju(
  tacke: readonly GramatickaTacka[],
  pitanja: readonly GramatickoPitanje[],
  brojLekcije: number,
  rng: () => number
): Partija {
  const dozvoljene = dozvoljeneTacke(tacke, brojLekcije);
  const kljucevi = new Set(dozvoljene.map((t) => t.id));

  const podobna = pitanja.filter((p) => kljucevi.has(p.gramatika_id) && ispravno(p));

  // Tri korpe, po jedna za svaku težinu, svaka promešana za sebe.
  const poTezini: PitanjePartije[][] = [[], [], []];
  for (const p of promesaj(podobna, rng)) {
    const spremno = zaEkran(p, rng);
    poTezini[spremno.tezina - 1].push(spremno);
  }

  // Ono što ostane u korpama posle raspodele je rezerva za „zameni pitanje".
  const sve = poTezini.map((grupa) => [...grupa]);
  raspodeli(poTezini, duzinaPartije(podobna.length));

  const uPartiji = poTezini.flat();
  const uzeti = new Set(uPartiji.map((p) => p.id));
  const rezerva = sve.flat().filter((p) => !uzeti.has(p.id));

  const uPartijiTacke = new Set(uPartiji.map((p) => p.gramatikaId));
  return {
    tacke: dozvoljene
      .filter((t) => uPartijiTacke.has(t.id))
      .sort((a, b) => a.redni_broj - b.redni_broj),
    pitanja: uPartiji,
    rezerva,
  };
}

/**
 * Pomoć „pola-pola": ostaju tačan odgovor i jedan netačan, druga dva se sklone.
 *
 * Vraća mesta koja OSTAJU, poređana kako su i stajala. Redosled se ne dira, jer
 * bi dete koje je već pročitalo četiri odgovora zateklo dva na drugom mestu i
 * moralo da čita iznova.
 */
export function polaPola(pitanje: PitanjePartije, rng: () => number): number[] {
  const pogresna = pitanje.opcije.map((_, i) => i).filter((i) => i !== pitanje.tacan);
  const ostaje = promesaj(pogresna, rng)[0];
  // Pitanje sa samo tačnim odgovorom je nemoguće (proverava se u `ispravno`),
  // ali ako se ikad desi, pomoć ne sme da pukne nego prosto ostavlja tačan.
  if (ostaje === undefined) return [pitanje.tacan];
  return [pitanje.tacan, ostaje].sort((a, b) => a - b);
}

/**
 * Pomoć „zameni pitanje": sledeće neiskorišćeno pitanje ISTE težine ako ga ima,
 * inače bilo koje neiskorišćeno.
 *
 * Ista težina je bitna, jer je zamena inače kazna ili poklon: dete koje na
 * dvanaestom pitanju dobije lako pitanje umesto teškog nije prošlo isti kviz.
 * Vraća `null` kad zamene nema, i tada se pomoć NE troši.
 */
export function zameniPitanje(
  rezerva: readonly PitanjePartije[],
  trenutno: PitanjePartije,
  iskorisceni: ReadonlySet<string>
): PitanjePartije | null {
  const slobodna = rezerva.filter((p) => p.id !== trenutno.id && !iskorisceni.has(p.id));
  return slobodna.find((p) => p.tezina === trenutno.tezina) ?? slobodna[0] ?? null;
}
