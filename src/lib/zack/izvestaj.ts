// Dvonedeljni izveštaj roditelju: šta ulazi, koja preporuka, da li je period
// prazan i da li se izveštaji gase. Ovde nema ni baze ni mejla - vreme i podaci
// stižu kao argumenti, pa se sve može testirati bez ijednog mrežnog poziva.
//
// GLAS IZVEŠTAJA
// --------------
// Ista pravila kao svuda u zack-u: bez prekora, bez poređenja među decom, bez
// procenata tačnosti. Prazan period je jedna mirna rečenica bez saveta i bez
// uzvičnika - pravilo sa platforme: ne opominjati. Zato ovde nema ni funkcije
// koja bi računala „koliko je dete propustilo": ono što se ne izračuna ne može
// ni da se prikaže kao prekor.
//
// GAŠENJE JE ISTO PRAVILO KAO ZA NEWSLETTER
// -----------------------------------------
// Dva prazna perioda zaredom (mesec dana tišine) znače da izveštaji staju, uz
// poslednji miran mejl. Roditelj ih jednim klikom u panelu pali nazad.
import { stanjeZapisa, type ZapisSlicice } from "./album";

/** Koliko dana unazad pokriva jedan izveštaj: „u ove dve nedelje". */
export const DANA_PERIODA = 14;

/**
 * Posle koliko dana je roditelj opet na redu. Dan kraće od perioda, da dnevni
 * cron ne „klizi": ako je prošli izveštaj poslat u 09:05 a cron danas prođe u
 * 09:00, sa punih 14 dana bi roditelj čekao petnaesti dan, pa šesnaesti...
 */
export const DANA_IZMEDJU_IZVESTAJA = 13;

/** Posle ovoliko praznih perioda zaredom izveštaji se sami gase. */
export const PRAZNIH_DO_GASENJA = 2;

/** Zapis sličice proširen datumom zarade, jer izveštaj broji nove u periodu. */
export type ZapisZaIzvestaj = ZapisSlicice & { zaradjena_at: string };

export type LekcijaZaIzvestaj = {
  broj: number;
  naziv: string;
  recIdovi: readonly string[];
};

export type DeteZaIzvestaj = {
  ime: string;
  /** Razred za koji je udžbenik pisan, za rečenicu „reči koje se uče u petom razredu". */
  razred: number | null;
  lekcije: readonly LekcijaZaIzvestaj[];
  /** Sve sličice deteta, i one koje još čekaju u kesici. */
  zapisi: readonly ZapisZaIzvestaj[];
};

export type LekcijaNapredak = {
  broj: number;
  naziv: string;
  zalepljene: number;
  ukupno: number;
  novih: number;
};

/**
 * Jedna konkretna preporuka, izvedena iz podataka. Bira se PRVO pravilo koje
 * se poklopi, ovim redom - bez pameti na silu. „nema" znači da rečenica
 * preporuke prosto izostane.
 */
export type Preporuka =
  | { vrsta: "izbledele"; izbledelih: number }
  | { vrsta: "nacetaLekcija"; broj: number; naziv: string; zalepljene: number; ukupno: number }
  | { vrsta: "svePuno" }
  | { vrsta: "nema" };

export type IzvestajDeteta = {
  ime: string;
  razred: number | null;
  /** Koliko lekcija udžbenik uopšte ima, da rečenica o lekciji ne ponavlja celinu. */
  brojLekcija: number;
  /** Da li je u periodu bilo IČEGA: nove sličice ili tačnog odgovora. */
  vezbalo: boolean;
  zalepljene: number;
  ukupno: number;
  /** Sličice zarađene u periodu, računajući i one koje još čekaju u kesici. */
  novih: number;
  /** Broj različitih dana sa tačnim odgovorom u periodu. */
  danaVezbanja: number;
  /** Lekcija sa najviše novih sličica u periodu, ili null ako novih nema. */
  gde: LekcijaNapredak | null;
  preporuka: Preporuka;
};

/** Da li datum (ISO tekst) upada u period (od, sada]. Pokvaren datum ne upada. */
function uPeriodu(datum: string, od: Date, sada: Date): boolean {
  const t = Date.parse(datum);
  if (!Number.isFinite(t)) return false;
  return t > od.getTime() && t <= sada.getTime();
}

export function izvestajZaDete(dete: DeteZaIzvestaj, od: Date, sada: Date): IzvestajDeteta {
  const poRecId = new Map(dete.zapisi.map((z) => [z.rec_id, z]));

  let zalepljene = 0;
  let ukupno = 0;
  let izbledelih = 0;
  let novih = 0;
  const poLekciji: LekcijaNapredak[] = [];

  for (const lekcija of dete.lekcije) {
    let zalepljeneLekcije = 0;
    let novihLekcije = 0;
    for (const recId of lekcija.recIdovi) {
      const zapis = poRecId.get(recId);
      const stanje = stanjeZapisa(zapis, sada);
      // Izbledela se broji kao zalepljena: detetu ništa nije oduzeto.
      if (stanje === "zalepljena" || stanje === "izbledela") zalepljeneLekcije++;
      if (stanje === "izbledela") izbledelih++;
      if (zapis && uPeriodu(zapis.zaradjena_at, od, sada)) novihLekcije++;
    }
    zalepljene += zalepljeneLekcije;
    ukupno += lekcija.recIdovi.length;
    novih += novihLekcije;
    poLekciji.push({
      broj: lekcija.broj,
      naziv: lekcija.naziv,
      zalepljene: zalepljeneLekcije,
      ukupno: lekcija.recIdovi.length,
      novih: novihLekcije,
    });
  }

  // Različiti dani sa tačnim odgovorom. poslednje_tacno_at pamti samo poslednji
  // tačan odgovor po sličici, pa je ovo donja granica broja dana - i to je u
  // redu: izveštaj radije kaže manje nego da izmišlja.
  const dani = new Set<string>();
  for (const zapis of dete.zapisi) {
    if (uPeriodu(zapis.poslednje_tacno_at, od, sada)) {
      dani.add(zapis.poslednje_tacno_at.slice(0, 10));
    }
  }
  const danaVezbanja = dani.size;

  const vezbalo = novih > 0 || danaVezbanja > 0;

  // Lekcija sa najviše novih; kod izjednačenja ranija po broju.
  let gde: LekcijaNapredak | null = null;
  for (const l of poLekciji) {
    if (l.novih > 0 && (gde === null || l.novih > gde.novih)) gde = l;
  }

  return {
    ime: dete.ime,
    razred: dete.razred,
    brojLekcija: dete.lekcije.length,
    vezbalo,
    zalepljene,
    ukupno,
    novih,
    danaVezbanja,
    gde: vezbalo ? gde : null,
    // Prazan period NE dobija preporuku: jedna mirna rečenica i ništa više.
    preporuka: vezbalo ? preporukaZaDete(poLekciji, izbledelih, ukupno, zalepljene) : { vrsta: "nema" },
  };
}

/** Prvo pravilo koje se poklopi, tim redom. */
function preporukaZaDete(
  poLekciji: readonly LekcijaNapredak[],
  izbledelih: number,
  ukupno: number,
  zalepljene: number
): Preporuka {
  if (izbledelih > 0) return { vrsta: "izbledele", izbledelih };

  // Načeta lekcija koja u periodu stoji: ima zalepljenih, nije puna, bez novih.
  const naceta = poLekciji.find(
    (l) => l.zalepljene > 0 && l.zalepljene < l.ukupno && l.novih === 0
  );
  if (naceta) {
    return {
      vrsta: "nacetaLekcija",
      broj: naceta.broj,
      naziv: naceta.naziv,
      zalepljene: naceta.zalepljene,
      ukupno: naceta.ukupno,
    };
  }

  if (ukupno > 0 && zalepljene === ukupno) return { vrsta: "svePuno" };

  return { vrsta: "nema" };
}

export type IzvestajRoditelja = {
  deca: IzvestajDeteta[];
  /** Nijedno dete nije imalo aktivnost u periodu. */
  svaPrazna: boolean;
};

export function izvestajRoditelja(
  deca: readonly DeteZaIzvestaj[],
  od: Date,
  sada: Date
): IzvestajRoditelja {
  const izvestaji = deca.map((d) => izvestajZaDete(d, od, sada));
  return {
    deca: izvestaji,
    svaPrazna: izvestaji.every((d) => !d.vezbalo),
  };
}

/** Da li je roditelj na redu za izveštaj. Pokvaren datum znači „na redu je". */
export function naRedu(poslednjiIzvestajAt: string | null, sada: Date): boolean {
  if (poslednjiIzvestajAt === null) return true;
  const t = Date.parse(poslednjiIzvestajAt);
  if (!Number.isFinite(t)) return true;
  return sada.getTime() - t >= DANA_IZMEDJU_IZVESTAJA * 24 * 60 * 60 * 1000;
}

/** Prazan period diže brojač, bilo kakva aktivnost ga vraća na nulu. */
export function noviBrojPraznih(svaPrazna: boolean, dosadasnjih: number): number {
  const dosad = Number.isFinite(dosadasnjih) ? Math.max(0, Math.trunc(dosadasnjih)) : 0;
  return svaPrazna ? dosad + 1 : 0;
}

/** Da li se sa ovim brojem praznih perioda izveštaji gase. */
export function gasiSe(praznihZaredom: number): boolean {
  return praznihZaredom >= PRAZNIH_DO_GASENJA;
}

// ── Tekst ──────────────────────────────────────────────────────────────────
// SLIČICE SU DEČJI SVET I TAMO OSTAJU. Roditelju se ne priča o sličicama,
// kesicama ni spratovima, nego o onome što oni znače: koliko je dete vežbalo
// i koje reči je naučilo. Zato ovde piše „reč" i „naučilo", a interno se sve
// i dalje broji preko sličica - to je isti podatak, samo preveden.
// Broj u našem jeziku menja oblik imenice iza sebe, a 11-14 su izuzetak.

type Oblik = "jedna" | "dve" | "pet";

function oblikBroja(n: number): Oblik {
  const ceo = Math.abs(Math.trunc(n));
  if (ceo % 100 >= 11 && ceo % 100 <= 14) return "pet";
  const poslednja = ceo % 10;
  if (poslednja === 1) return "jedna";
  if (poslednja >= 2 && poslednja <= 4) return "dve";
  return "pet";
}

const NOVA_REC: Record<Oblik, string> = { jedna: "novu reč", dve: "nove reči", pet: "novih reči" };
const DAN: Record<Oblik, string> = { jedna: "dan", dve: "dana", pet: "dana" };

export function recDan(n: number): string {
  return DAN[oblikBroja(n)];
}

/** „u petom razredu" - lokativ rednog broja razreda osnovne škole. */
const RAZRED_LOKATIV: Record<number, string> = {
  1: "prvom",
  2: "drugom",
  3: "trećem",
  4: "četvrtom",
  5: "petom",
  6: "šestom",
  7: "sedmom",
  8: "osmom",
};

/** „reči koje se uče u petom razredu", ili bez razreda „reči iz udžbenika". */
export function opisGradiva(razred: number | null): string {
  const lokativ = razred === null ? undefined : RAZRED_LOKATIV[razred];
  return lokativ ? `reči koje se uče u ${lokativ} razredu` : "reči iz udžbenika";
}

/**
 * Rečenica konteksta: šta broj novih reči znači u školskim merama. Kaže se
 * samo kad je tempo bar blizu jedne lekcije mesečno - sporiji tempo se NE
 * imenuje, jer bi svako „sporije od..." bilo prekor u brojci.
 */
function tempoRecenica(novih: number, ukupno: number, brojLekcija: number): string | null {
  if (novih <= 0 || brojLekcija <= 0 || ukupno <= 0) return null;
  const reciPoLekciji = ukupno / brojLekcija;
  // Period je pola meseca, pa je mesečni tempo dvostruk.
  const odnos = (novih * 2) / reciPoLekciji;
  if (odnos >= 1.75) return "To je tempo od oko dve školske lekcije mesečno.";
  if (odnos >= 0.75) return "To je otprilike tempo kojim se prelazi jedna školska lekcija mesečno.";
  return null;
}

/**
 * Naslov mejla: ime ili imena dece, prirodnim redom.
 * „kako napreduje Petra", „kako napreduju Petra i Marko".
 */
export function naslovIzvestaja(imena: readonly string[]): string {
  if (imena.length === 0) return "zack! - izveštaj o napretku";
  if (imena.length === 1) return `zack! - kako napreduje ${imena[0]}`;
  const osimPoslednjeg = imena.slice(0, -1).join(", ");
  return `zack! - kako napreduju ${osimPoslednjeg} i ${imena[imena.length - 1]}`;
}

/**
 * Rečenice izveštaja za jedno dete, redom kojim idu u mejl. Ovde su kao čist
 * tekst da bi ih testovi čitali bez HTML-a; mejl ih samo prelama.
 *
 * Redosled je namerno roditeljski: PRVO koliko je vežbalo, pa šta zna, pa šta
 * to znači, pa gde je trenutno, pa jedna konkretna preporuka.
 */
export function receniceZaDete(d: IzvestajDeteta): string[] {
  // Prazan period: jedna mirna rečenica, bez saveta i bez uzvičnika.
  if (!d.vezbalo) return ["U ove dve nedelje nije bilo vežbanja."];

  const recenice: string[] = [];

  // 1. Vežbanje, pa učenje - to je ono što roditelj prvo pita.
  if (d.danaVezbanja > 0 && d.novih > 0) {
    recenice.push(
      `Vežbalo je ${d.danaVezbanja} ${recDan(d.danaVezbanja)} u poslednje dve nedelje i naučilo ${d.novih} ${NOVA_REC[oblikBroja(d.novih)]}.`
    );
  } else if (d.danaVezbanja > 0) {
    recenice.push(`Vežbalo je ${d.danaVezbanja} ${recDan(d.danaVezbanja)} u poslednje dve nedelje.`);
  } else {
    recenice.push(`Naučilo je ${d.novih} ${NOVA_REC[oblikBroja(d.novih)]} u poslednje dve nedelje.`);
  }

  // 2. Šta ukupno zna. Nula se ne ispisuje: „zna 0 od 180" bi bilo obaranje
  // pogleda na samom početku, a dete je tek krenulo.
  if (d.zalepljene > 0) {
    recenice.push(`Ukupno zna ${d.zalepljene} od ${d.ukupno} ${opisGradiva(d.razred)}.`);
  }

  // 3. Šta taj broj znači, jednom rečenicom konteksta.
  const tempo = tempoRecenica(d.novih, d.ukupno, d.brojLekcija);
  if (tempo) recenice.push(tempo);

  // 4. Gde je trenutno - po NAZIVU lekcije, jer broj roditelju ništa ne kaže.
  // Kad udžbenik ima samo jednu lekciju, rečenica bi ponovila celinu, pa izostaje.
  if (d.gde && d.brojLekcija > 1) {
    // „od 3 njene reči", ali „od 30 njenih reči" - pridev prati oblik broja.
    const njene = oblikBroja(d.gde.ukupno) === "pet" ? "njenih" : "njene";
    recenice.push(
      `Trenutno radi lekciju „${d.gde.naziv}" i zna ${d.gde.zalepljene} od ${d.gde.ukupno} ${njene} reči.`
    );
  }

  const p = recenicaPreporuke(d.preporuka);
  if (p) recenice.push(p);

  return recenice;
}

function recenicaPreporuke(p: Preporuka): string | null {
  switch (p.vrsta) {
    case "izbledele":
      // „Tri nedelje" prati DANA_DO_BLEDENJA (21) iz albuma.
      return p.izbledelih === 1
        ? "1 reč nije ponavljalo duže od tri nedelje - pet minuta ponavljanja je vraća."
        : `${p.izbledelih} reči nije ponavljalo duže od tri nedelje - pet minuta ponavljanja ih vraća.`;
    case "nacetaLekcija":
      return `Dobar sledeći korak je lekcija „${p.naziv}" - u njoj već zna ${p.zalepljene} od ${p.ukupno} reči.`;
    case "svePuno":
      return "Naučilo je sve reči iz udžbenika - svaka čast.";
    case "nema":
      return null;
  }
}

// ── Pomoćnici za ekran napretka ────────────────────────────────────────────

/** Broj dana između dva datuma oblika „YYYY-MM-DD", ili null ako ne valjaju. */
function daniIzmedju(od: string, danas: string): number | null {
  const OBLIK = /^(\d{4})-(\d{2})-(\d{2})$/;
  const a = OBLIK.exec(od);
  const b = OBLIK.exec(danas);
  if (!a || !b) return null;
  const ms =
    Date.UTC(Number(b[1]), Number(b[2]) - 1, Number(b[3])) -
    Date.UTC(Number(a[1]), Number(a[2]) - 1, Number(a[3]));
  if (!Number.isFinite(ms)) return null;
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

/**
 * Poslednja aktivnost, mirno. Bez uzvičnika i bez saveta - a stariji datum od
 * dve nedelje se ne broji naglas, jer bi „pre 40 dana" već zvučalo kao prekor.
 */
export function opisPoslednjeAktivnosti(poslednjiDan: string | null, danas: string): string {
  const NIJE = "nije vežbalo u poslednje vreme";
  if (poslednjiDan === null) return NIJE;
  const dana = daniIzmedju(poslednjiDan, danas);
  if (dana === null || dana >= DANA_PERIODA) return NIJE;
  if (dana <= 0) return "vežbalo danas";
  if (dana === 1) return "vežbalo juče";
  return `vežbalo pre ${dana} dana`;
}

/**
 * Niz dana za prikaz roditelju: tek od 2 naviše, i samo dok stvarno traje
 * (danas ili juče). Stariji niz u bazi čeka sledeće igranje da se preračuna,
 * a roditelju se u međuvremenu ne prikazuje broj koji više ne važi.
 */
export function nizZaPrikaz(niz: number, poslednjiDan: string | null, danas: string): number | null {
  if (!Number.isFinite(niz) || niz < 2) return null;
  if (poslednjiDan === null) return null;
  const dana = daniIzmedju(poslednjiDan, danas);
  if (dana === null || dana < 0 || dana > 1) return null;
  return Math.trunc(niz);
}
