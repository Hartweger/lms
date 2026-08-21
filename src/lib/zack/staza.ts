// Znak „gde sam stalo" na polici sa albumima.
//
// ODAKLE PROBLEM
// --------------
// Dete otvori stazu i vidi tuce kartica koje izgledaju isto. Jedina razlika je
// deblja žuta ivica kad negde čeka kesica. Nigde ne piše gde je stalo, pa se
// povratak u aplikaciju pretvara u traženje - a najviše to smeta baš detetu
// koje se vraća, onom koje najviše želimo nazad.
//
// ZNAK JE POZIV, NE KAPIJA
// ------------------------
// Ovde se ne računa „sledeća dozvoljena" lekcija nego samo „predložena". Sve
// kartice ostaju otvorene, ništa se ne zaključava niti priguši; znak je jedan
// jedini i samo pokazuje odakle je najlakše nastaviti.
//
// ZAŠTO OVDE, A NE U KOMPONENTI
// -----------------------------
// Izbor je čist posao nad brojevima: isti spisak lekcija uvek daje isti znak.
// Zato živi ovde i pokriven je testovima, a ekran samo crta ono što ovo vrati.
// Stabilnost je deo pravila: između dve posete, uz nepromenjene podatke, znak
// mora da stoji na istoj kartici.

/** Jedna kartica na stazi, onako kako je ekran dobija sa servera. */
export type StavkaStaze = {
  broj: number;
  naziv: string;
  zalepljene: number;
  ukupno: number;
  neotvorenaKesica: number;
};

/** Znak na tačno jednoj kartici: koja je i šta na njemu piše. */
export type ZnakStaze = { broj: number; tekst: string };

// Oba natpisa su zapovedni način, pa ne otkrivaju rod deteta. „Kreni odavde"
// stoji samo dok nigde ničega nema, jer je tada to prvi korak, a ne nastavak.
const KRENI = "Kreni odavde";
const NASTAVI = "Nastavi";

/** Album je pun samo ako u njemu uopšte ima šta da se skuplja. */
function puna(l: StavkaStaze): boolean {
  return l.ukupno > 0 && l.zalepljene >= l.ukupno;
}

/**
 * Koja lekcija dobija znak. Prvo pravilo koje se poklopi pobeđuje:
 *
 *   1. lekcija u kojoj čeka neotvorena kesica - nagrada je već tu, a otvaranje
 *      kesice je najkraći put do lepog trenutka;
 *   2. započeta lekcija (ima zalepljenih sličica, album još nije pun);
 *   3. prva lekcija čiji je album prazan;
 *   4. ako su svi albumi puni - nema znaka. Nema šta da se pokaže, a znak bi
 *      tada izmislio zadatak koji ne postoji.
 *
 * Kod izjednačenja bira se NAJMANJI broj lekcije, pa znak stoji na istom mestu
 * i kad se dete vrati sutra.
 *
 * Lekcija bez ijedne reči (`ukupno === 0`) ne može da bude predlog po pravilima
 * 2 i 3: to je lekcija koju autorka još nije napunila, pa bi znak poslao dete u
 * prazno. Ako u takvoj lekciji ipak čeka kesica, pravilo 1 važi normalno - ta
 * nagrada je stvarna i detetu se ne oduzima zbog nepotpunih podataka.
 *
 * Vraća broj lekcije ili null kad znaka nema.
 */
export function predlozenaLekcija(lekcije: readonly StavkaStaze[]): number | null {
  // Ne oslanjamo se na redosled u kom je spisak stigao: izjednačenje se lomi
  // po broju lekcije, pa se po broju i traži.
  const poRedu = [...lekcije].sort((a, b) => a.broj - b.broj);

  const saKesicom = poRedu.find((l) => l.neotvorenaKesica > 0);
  if (saKesicom) return saKesicom.broj;

  const zapoceta = poRedu.find((l) => l.ukupno > 0 && l.zalepljene > 0 && !puna(l));
  if (zapoceta) return zapoceta.broj;

  const prazna = poRedu.find((l) => l.ukupno > 0 && l.zalepljene === 0);
  if (prazna) return prazna.broj;

  return null;
}

/**
 * Ceo znak: koja kartica i koji natpis.
 *
 * „Kreni odavde" ide samo detetu koje nigde nema ni jednu zalepljenu sličicu ni
 * kesicu koja čeka - dakle onom koje prvi put stoji pred policom. Svima ostalima
 * ide „Nastavi", jer su već negde počeli.
 */
export function znakStaze(lekcije: readonly StavkaStaze[]): ZnakStaze | null {
  const broj = predlozenaLekcija(lekcije);
  if (broj === null) return null;

  const nigdeNista = lekcije.every((l) => l.zalepljene === 0 && l.neotvorenaKesica === 0);
  return { broj, tekst: nigdeNista ? KRENI : NASTAVI };
}
