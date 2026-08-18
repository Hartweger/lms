// Pojasevi stene: visina koja se vidi, a ne samo broji.
//
// ZAŠTO POSTOJI OVAJ FAJL
// -----------------------
// U skakaču se koza penje uvis i partija traje dok ima srca, pa se stiže i do
// tridesetog sprata. Dok je stena bila jedna te ista siva sve do vrha, sprat 7
// je izgledao isto kao sprat 1: visina je bila broj u uglu, a ne prizor. Zato je
// penjanje podeljeno na pojaseve, i svaki ima svoje ime, svoju boju i svoj
// motiv u kamenu.
//
// IME JE POLA STVARI
// ------------------
// Broj sprata dete zaboravi, ime ne. „Popela sam se do snega" je rečenica koju
// dete ima kome da kaže, „popela sam se na 19. sprat" nije. Zato ime pojasa ne
// postoji samo kao boja: ulazi u pločicu iznad polica, u oznaku uz liniju
// rekorda, u poruku na kraju partije i u javljanje čitaču ekrana.
//
// NEMA PROPUŠTENOG POJASA
// -----------------------
// Nigde se ne računa ni ne ispisuje dokle dete NIJE stiglo. Pojas do kog je
// stiglo se imenuje, oni iznad njega se ne pominju. Zato ovde nema ni funkcije
// koja bi vratila „sledeći pojas" ni „koliko fali": ono što se ne izračuna ne
// može ni da se prikaže kao prekor.
//
// SVE IZ JEDNOG NIZA
// ------------------
// Granice, imena i boje stoje na jednom mestu, u `POJASEVI`. Izmena imena ili
// boje je izmena samo tog niza - nigde drugde nema uslova tipa „ako je sprat
// veći od 12". Redosled niza je i redosled visine: svaki sledeći pojas počinje
// više od prethodnog.

/**
 * Šara koja se crta u kamenu tog pojasa. Sam crtež je u skakaču, ovde stoji
 * samo koji je, da bi pojas ostao čist podatak bez ijednog SVG-a.
 */
export type Motiv = "trava" | "pukotina" | "polica" | "trag" | "oblak";

export type Pojas = {
  /** Prvi sprat ovog pojasa. Traje do sprata ispod početka sledećeg. */
  readonly odSprata: number;
  /** Ime kako stoji samo za sebe, na početku reda: „Greben". */
  readonly ime: string;
  /** Isto ime usred rečenice: „Rekord: greben, 14. sprat". */
  readonly imeMalo: string;
  /** Dopuna uz „popela se ...": „do grebena", „iznad oblaka". */
  readonly dokle: string;
  /** Vazduh pojasa: široka podloga scene. Prigušen ton na papiru, ne slika. */
  readonly nebo: string;
  /** Kamen pojasa: traka uz levu ivicu i tlo. */
  readonly kamen: string;
  /** Ivice, granična crta i šara u kamenu. */
  readonly ivica: string;
  readonly motiv: Motiv;
};

/**
 * Prvi pojas stoji i kao zasebna konstanta, jer je on odgovor na svako pitanje
 * o spratu ispod prvog (tlo, nula, smeće na ulazu) i početak od kog se meri da
 * li je pojas uopšte nov.
 */
const PODNOZJE: Pojas = {
  odSprata: 1,
  ime: "Podnožje",
  imeMalo: "podnožje",
  dokle: "do podnožja",
  nebo: "#FCF6E6",
  kamen: "#E7DCBE",
  ivica: "#CDBE9A",
  motiv: "trava",
};

/**
 * Granice su namerno neravnomerne: prvi pojas je najkraći, da prva promena
 * stigne brzo i da dete uopšte sazna da se stena menja. Kasniji su duži, jer se
 * do njih ionako ređe stiže.
 */
export const POJASEVI: readonly Pojas[] = [
  PODNOZJE,
  {
    odSprata: 6,
    ime: "Stena",
    imeMalo: "stena",
    dokle: "do stene",
    nebo: "#F5F4F0",
    kamen: "#E1DDD4",
    ivica: "#C6C0B2",
    motiv: "pukotina",
  },
  {
    odSprata: 12,
    ime: "Greben",
    imeMalo: "greben",
    dokle: "do grebena",
    nebo: "#EEF3F7",
    kamen: "#D7E2EB",
    ivica: "#B2C3D2",
    motiv: "polica",
  },
  {
    odSprata: 18,
    ime: "Sneg",
    imeMalo: "sneg",
    dokle: "do snega",
    nebo: "#FAFCFE",
    kamen: "#EBF2F8",
    ivica: "#C4D4E1",
    motiv: "trag",
  },
  {
    odSprata: 25,
    ime: "Iznad oblaka",
    imeMalo: "iznad oblaka",
    dokle: "iznad oblaka",
    nebo: "#F0F6FF",
    kamen: "#E1ECFB",
    ivica: "#BAD1EE",
    motiv: "oblak",
  },
];

/** Sprat ume da stigne i kao nula i kao smeće; ovde se svede na ceo broj. */
function celSprat(sprat: number): number {
  return Number.isFinite(sprat) ? Math.trunc(sprat) : 0;
}

/**
 * Pojas u kom je dati sprat. Tlo (sprat 0) i sve ispod njega su podnožje, jer
 * odatle koza kreće, a iznad poslednjeg praga se ostaje u poslednjem pojasu
 * koliko god se penjalo - penjanje nema kraj, pa ga ni pojasevi nemaju.
 */
export function pojasZaSprat(sprat: number): Pojas {
  const n = celSprat(sprat);
  let nadjen: Pojas = PODNOZJE;
  for (const pojas of POJASEVI) {
    if (n >= pojas.odSprata) nadjen = pojas;
  }
  return nadjen;
}

/**
 * Pojas koji baš na ovom spratu POČINJE, ili ništa. Po ovome se javlja prelaz,
 * pa se javi tačno jednom, na prvom spratu novog pojasa.
 *
 * Podnožje se ne javlja: tamo koza već jeste kad partija počne, pa „stigla si
 * do podnožja" ne bi bilo stizanje nego opis mesta sa kog se kreće.
 */
export function pocinjePojas(sprat: number): Pojas | null {
  const n = celSprat(sprat);
  const pojas = pojasZaSprat(n);
  return pojas !== PODNOZJE && pojas.odSprata === n ? pojas : null;
}

/** Sprat sa imenom pojasa, usred rečenice: „greben, 14. sprat". */
export function opisSprata(sprat: number): string {
  const n = celSprat(sprat);
  return `${pojasZaSprat(n).imeMalo}, ${n}. sprat`;
}

/** Dopuna uz „Koza se popela ...": „do snega, 17. sprat". */
export function dokleSePopela(sprat: number): string {
  const n = celSprat(sprat);
  return `${pojasZaSprat(n).dokle}, ${n}. sprat`;
}
