// Ponavljanje kroz module: igre kasnijih lekcija mešaju u pitanja i reči iz
// RANIJIH lekcija. Bledenje time prestaje da bude pasivno - izbledela reč se
// sama vrati pred dete usred igre, a tačan odgovor joj kroz `zaradi` osveži
// `poslednje_tacno_at` i vrati boju.
//
// VRHOVNO PRAVILO I OVDE VAŽI
// ---------------------------
// Detetu se ništa ne oduzima i ništa mu se ne prebacuje. Stara reč u igri
// izgleda tačno kao i svaka druga: nema oznake „ovo si zaboravila", nema
// posebne boje. Kandidati su ISKLJUČIVO reči koje dete već ima u albumu
// (o tome brine ekran lekcije, koji ovde šalje samo viđene reči), pa tačan
// odgovor nikad ne pravi novu sličicu ni ne dira kesicu - samo osveži datum.
//
// KO IMA PREDNOST
// ---------------
// Prvo reči sa najviše grešaka, pa izbledele, pa nasumične starije. Greške su
// ispred bledenja namerno: izbledela reč je možda samo dugo čekala, a reč sa
// greškom je dokazano rupa.
//
// SLUČAJNOST SE UBRIZGAVA
// -----------------------
// Ništa ovde ne zove `Math.random()`. Izvor slučajnosti dolazi kao `rng`, da bi
// se izbor mogao ponoviti u testu - isto pravilo kao u `milioner.ts`.
import { napraviPitanja, podobnaZaIgru, type IgraReci, type Pitanje } from "./pitanja";
import { promesaj, type Rec } from "./rec";

/** Stara reč kako je vidi izbor: uz nju i ono po čemu se rangira. */
export type StaraRec = { rec: Rec; izbledela: boolean; gresaka: number };

/**
 * Najviše starih reči u jednoj partiji. Granica postoji da ponavljanje ne
 * proguta lekciju: dete je ušlo u OVU lekciju i ona mora da ostane glavna.
 */
export const NAJVISE_STARIH = 4;

/** Udeo starih u partiji, pre gornje granice. */
const UDEO_STARIH = 0.25;

/** Koliko starih ide u igru od `n` pitanja: ~25%, najmanje 0, najviše 4. */
export function kvotaStarih(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(NAJVISE_STARIH, Math.floor(n * UDEO_STARIH));
}

/**
 * Bira do `koliko` starih reči za mešanje u igru: prvo najviše grešaka,
 * pa izbledele, pa nasumične starije. Deterministički uz rng.
 *
 * Redosled se pravi u dva koraka: kandidati se PRVO promešaju, pa se stabilno
 * poređaju po (greške opadajuće, izbledelost). Time je nasumičnost tačno tamo
 * gde treba - među jednakima - a prednost tačno tamo gde je obećana.
 */
export function izaberiStare(
  kandidati: readonly StaraRec[],
  koliko: number,
  rng: () => number
): Rec[] {
  if (koliko <= 0 || kandidati.length === 0) return [];

  const poredjano = promesaj(kandidati, rng).sort((a, b) => {
    if (a.gresaka !== b.gresaka) return b.gresaka - a.gresaka;
    return Number(b.izbledela) - Number(a.izbledela);
  });
  return poredjano.slice(0, koliko).map((s) => s.rec);
}

/**
 * Dokle u toku pitanja sme da se umetne staro pitanje. Bitno za skakača: njegov
 * tok ima šezdeset mesta, a dete sa tri srca realno vidi prvih desetak. Staro
 * pitanje umetnuto na četrdesetom mestu ne bi videlo nikad, pa bi ponavljanje
 * postojalo samo na papiru.
 */
const UMETANJE_DO = 12;

/**
 * Pitanja partije sa umešanim starim rečima.
 *
 * Parovi NAMERNO ostaju čisto lekcijski: to je jedno pitanje koje traje celu
 * igru, pa bi stara reč u tabli značila da se lekcijska reč izgubi - a tabla
 * Parova je i jedini ekran na kom se sve reči lekcije vide odjednom.
 *
 * Prva lekcija nema starih, pa sve radi kao i do sad: bez kandidata se vraća
 * tačno ono što bi vratila i sama `napraviPitanja`.
 *
 * Stara pitanja dobijaju pun izbor pogrešnih odgovora iz ZAJEDNIČKOG skupa
 * (lekcija + izabrane stare), da pitanje o staroj reči ne bude prepoznatljivo
 * po tome što nudi manje odgovora.
 */
export function pitanjaSaStarima(
  reci: readonly Rec[],
  stare: readonly StaraRec[],
  igra: IgraReci,
  koliko: number,
  rng: () => number
): Pitanje[] {
  if (igra === "parovi" || stare.length === 0) {
    return napraviPitanja(reci, igra, koliko, rng);
  }

  // Reč koja je i u ovoj lekciji nije „stara": pitala bi se dvaput.
  const uLekciji = new Set(reci.map((r) => r.id));
  const kandidati = stare.filter(
    (s) => !uLekciji.has(s.rec.id) && podobnaZaIgru(s.rec, igra)
  );
  const izabrane = izaberiStare(kandidati, kvotaStarih(koliko), rng);
  if (izabrane.length === 0) return napraviPitanja(reci, igra, koliko, rng);

  const zajednicki = [...reci, ...izabrane];
  const osnovna = napraviPitanja(reci, igra, koliko - izabrane.length, rng, zajednicki);
  const stara = napraviPitanja(izabrane, igra, izabrane.length, rng, zajednicki);

  // Stara pitanja se umeću na slučajna mesta u ranom delu toka, da se ne
  // grupišu i da ih dete stvarno dočeka (vidi UMETANJE_DO).
  const sva = [...osnovna];
  for (const p of stara) {
    const najdalje = Math.min(sva.length, UMETANJE_DO);
    sva.splice(Math.floor(rng() * (najdalje + 1)), 0, p);
  }
  return sva;
}
