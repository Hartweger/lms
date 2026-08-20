// Rečenične igre: iz jednog zapisa rečenice se prave pitanja i za slagalicu
// i za dopunu (i za učenje rečenica, koje je blaži prikaz slagalice).
// Ista filozofija kao pitanja.ts: čiste funkcije, ubrizgan rng, bez mreže.
import { ponudjeni, type Pitanje } from "./pitanja";
// Rečenično ponavljanje se drži ISTOG pravila kao rečeničko: bira se preko
// glavne reči (`izaberiStare`), pa se uzmu rečenice tih reči. Uvoz ide samo u
// ovom smeru - `ponavljanje.ts` ne zna za rečenice, pa kruga nema.
import { izaberiStare, kvotaStarih, type StaraRec } from "./ponavljanje";
import { promesaj, type Rec } from "./rec";

export type Recenica = {
  id: string;
  redni_broj: number;
  /** Cela nemačka rečenica, sa završnim znakom. */
  de: string;
  sr: string;
  /** Oblik koji se vadi za dopunu; mora se javiti tačno jednom u `de`. */
  praznina: string;
  distraktori: string[];
  /** Glavna reč - na nju se knjiže tačno i greška. */
  rec_id: string;
  /** Rečenice sa više ispravnih redosleda ne ulaze u slagalicu. */
  samo_dopuna: boolean;
};

/** Prikaz praznine: tačno 6 crta, postojeća konvencija projekta. */
export const PRAZNINA_PRIKAZ = "______";

/** Koliko pločica sme da ima slagalica. Van toga rečenica ide samo u dopunu. */
export const PLOCICA_NAJMANJE = 3;
export const PLOCICA_NAJVISE = 6;

/**
 * Imena i oslovljavanja koja na pločici zadržavaju veliko slovo i kad su prva
 * reč rečenice. Spisak namerno mali i vezan za naš korpus rečenica (imena iz
 * primera Pravilnika); test sadržaja proverava da je svaka velika prva reč
 * korpusa ili imenica lekcije ili odavde. Pogrešna procena samo ostavi veliko
 * slovo - lakši nagoveštaj, nikad pokvarena igra.
 */
export const VELIKA_UVEK: ReadonlySet<string> = new Set([
  "Sie", "Ihnen", "Frau", "Herr",
  "Anna", "Petra", "Markus", "Lina", "Maria", "Barbara", "Mimi", "Novak",
  "Serbien", "Deutschland", "Österreich", "Bonn", "Berlin", "Belgrad",
  "Niš", "Smederevo",
]);

/**
 * Rečenica bez završnog znaka + znak. Rečenica bez znaka dobija tačku, da
 * prikaz kraja ne zavisi od toga da li je autor otkucao znak.
 */
export function rastaviRecenicu(de: string): { reci: string[]; znak: string } {
  const sredjeno = de.trim().replace(/\s+/g, " ");
  const poklapanje = sredjeno.match(/([.!?]+)$/);
  const znak = poklapanje ? poklapanje[1] : ".";
  const bezZnaka = poklapanje ? sredjeno.slice(0, -poklapanje[1].length).trim() : sredjeno;
  return { reci: bezZnaka.length === 0 ? [] : bezZnaka.split(" "), znak };
}

/**
 * Reč iz spiska bez člana ispred. Udžbenici se ne slažu oko toga kako se imenica
 * zapisuje: u „nemacki-5-razred" stoji goli oblik („Familie"), a u starijim
 * „maximal-*" udžbenicima stoji sa članom („die Familie"). Pločica nosi uvek
 * goli oblik, pa bi poređenje celog zapisa promašilo baš imenice iz starijih
 * udžbenika i ostavljalo ih malim slovom. Isti oblik izraza kao u
 * `istoNapisano` (`components/zack/Igra.tsx`), da se pravilo o članu na oba
 * mesta čita isto.
 */
function bezClana(de: string): string {
  return de.replace(/^(der|die|das)\s+/i, "");
}

/**
 * Prikazni oblici pločica: prva reč rečenice ide malim slovom, da veliko slovo
 * ne oda rešenje (kod imperativa bi „Mach" odalo poentu). Veliko slovo
 * zadržavaju imenice (nemačke imenice ga ionako nose) i imena iz VELIKA_UVEK.
 *
 * `pool` su reči iz kojih je rečenica sastavljena (lekcija + SVE ranije reči
 * udžbenika). Ovaj spisak se namerno NE filtrira po tome šta dete već ima u
 * albumu: veliko slovo je pravilo nemačkog jezika, a ne nagrada. Kad bi pool
 * bio spisak zarađenih reči, detetu koje još ništa nije zaradilo bi svaka
 * imenica iz ranijih lekcija osvanula malim slovom - pogrešan nemački, i to
 * baš onom detetu koje najmanje ume da ga prepozna.
 */
export function prikazPlocica(reci: readonly string[], pool: readonly Rec[]): string[] {
  return reci.map((r, i) => {
    if (i > 0) return r;
    if (VELIKA_UVEK.has(r)) return r;
    const plocica = r.toLocaleLowerCase("de");
    const jeImenica = pool.some((p) => {
      if (p.vrsta !== "imenica") return false;
      const zapis = p.de.toLocaleLowerCase("de");
      return zapis === plocica || bezClana(zapis) === plocica;
    });
    return jeImenica ? r : r.toLocaleLowerCase("de");
  });
}

/**
 * Da li su pločice složene tačno. Poredi se TEKST po redosledu, ne identitet
 * pločice: dve iste pločice su ravnopravne. Veliko/malo slovo se ne razlikuje,
 * jer je prva pločica namerno prikazana malim slovom.
 */
export function proveriSlaganje(slozeno: readonly string[], tacan: readonly string[]): boolean {
  if (slozeno.length !== tacan.length) return false;
  return slozeno.every(
    (s, i) => s.toLocaleLowerCase("de") === tacan[i].toLocaleLowerCase("de")
  );
}

/**
 * Deo pločice koji se poredi sa prazninom i rep koji se ne dira. Pločica nosi
 * i zapetu iz sredine rečenice („Komm," nosi zapetu), pa bi poređenje celog
 * teksta promašilo oblik koji autor traži. Rep se čuva da ga praznina u
 * prikazu vrati na isto mesto.
 */
function rastaviPlocicu(plocica: string): { jezgro: string; rep: string } {
  const poklapanje = plocica.match(/[^\p{L}\p{N}]+$/u);
  if (!poklapanje) return { jezgro: plocica, rep: "" };
  return { jezgro: plocica.slice(0, -poklapanje[0].length), rep: poklapanje[0] };
}

/** Da li se pločica poklapa sa traženim oblikom, bez repa i bez velikog slova. */
function istaKaoPraznina(plocica: string, praznina: string): boolean {
  return (
    rastaviPlocicu(plocica).jezgro.toLocaleLowerCase("de") === praznina.toLocaleLowerCase("de")
  );
}

/** Koliko puta se traženi oblik javlja među pločicama rečenice. */
export function brojPojavljivanja(reci: readonly string[], praznina: string): number {
  return reci.filter((r) => istaKaoPraznina(r, praznina)).length;
}

/** Slagalica traži jedan ispravan redosled i broj pločica koji stane na ekran. */
export function podobnaZaSlagalicu(recenica: Recenica): boolean {
  if (recenica.samo_dopuna) return false;
  const broj = rastaviRecenicu(recenica.de).reci.length;
  return broj >= PLOCICA_NAJMANJE && broj <= PLOCICA_NAJVISE;
}

/**
 * Dopuna traži da se oblik javlja TAČNO jednom: bez pojave nema šta da se
 * izvadi, a sa dve bi obe bile ispravan odgovor a priznala bi se samo jedna.
 */
export function podobnaZaDopunu(recenica: Recenica): boolean {
  return brojPojavljivanja(rastaviRecenicu(recenica.de).reci, recenica.praznina) === 1;
}

/**
 * Promešane pločice koje NIKAD nisu tačan redosled iz prve: rečenica koja
 * stigne već složena ne pita ništa. Kad mešanje slučajno pogodi polazni
 * redosled, prva pločica menja mesto sa prvom različitom od nje - kao sudar
 * krugova u `uKrugovima`. Jedino se spisak istovetnih pločica ne može
 * izmešati, ali takva rečenica ne postoji.
 */
export function promesajPlocice(plocice: readonly string[], rng: () => number): string[] {
  const izmesano = promesaj(plocice, rng);
  if (plocice.length < 2 || !proveriSlaganje(izmesano, plocice)) return izmesano;
  // Traži se pločica različita PO ISTOM MERILU po kom se gore proverava da li
  // je složeno: „sie" i „Sie" su za proveru ista pločica, pa zamena sa njom ne
  // bi razložila rečenicu nego bi je samo prepisala.
  const prva = izmesano[0].toLocaleLowerCase("de");
  const j = izmesano.findIndex((p) => p.toLocaleLowerCase("de") !== prva);
  if (j > 0) [izmesano[0], izmesano[j]] = [izmesano[j], izmesano[0]];
  return izmesano;
}

/** Cela rečenica sa prazninom umesto izvađenog oblika; rep pločice ostaje. */
function saPrazninom(reci: readonly string[], znak: string, praznina: string): string {
  const zamenjeno = reci.map((r) =>
    istaKaoPraznina(r, praznina) ? PRAZNINA_PRIKAZ + rastaviPlocicu(r).rep : r
  );
  return zamenjeno.join(" ") + znak;
}

/**
 * Pitanja za jednu rečeničnu igru. `pool` su reči (lekcija + stare) za pravilo
 * velikog slova; dopuna vadi pogrešne odgovore iz sopstvenih distraktora.
 *
 * Nepodobne rečenice se TIHO preskaču (kao pokvareni redovi u gramatici):
 * pokvaren zapis ne sme da stigne do deteta, a partija se pravi od ostalih.
 */
export function napraviPitanjaRecenica(
  recenice: readonly Recenica[],
  igra: "slagalica" | "dopuna",
  koliko: number,
  rng: () => number,
  pool: readonly Rec[]
): Pitanje[] {
  // Bez ove granice bi `slice(0, -1)` na negativnom broju vratio skoro ceo
  // spisak: traženo je nula pitanja, a stiglo bi ih desetak.
  if (koliko <= 0) return [];

  const podobne = recenice.filter(
    igra === "slagalica" ? podobnaZaSlagalicu : podobnaZaDopunu
  );
  const izabrane = promesaj(podobne, rng).slice(0, koliko);

  return izabrane.map((r): Pitanje => {
    const { reci, znak } = rastaviRecenicu(r.de);
    if (igra === "slagalica") {
      return {
        igra: "slagalica",
        recenicaId: r.id,
        recId: r.rec_id,
        plocice: promesajPlocice(prikazPlocica(reci, pool), rng),
        tacan: reci,
        znak,
        prevod: r.sr,
      };
    }
    return {
      igra: "dopuna",
      recenicaId: r.id,
      recId: r.rec_id,
      saPrazninom: saPrazninom(reci, znak, r.praznina),
      opcije: ponudjeni(r.praznina, r.distraktori, 4, rng),
      tacan: r.praznina,
      prevod: r.sr,
    };
  });
}

/**
 * Pitanja rečenične partije sa ponavljanjem: lekcijske rečenice + rečenice
 * starih reči (izbor starih ide ISTIM pravilom kao kod reči: greške >
 * izbledele, preko glavne reči). Učenje rečenica ne meša stare - uči se OVA
 * lekcija, pa mu ljuska i ne šalje stare rečenice.
 *
 * Stara pitanja ULAZE u dogovoreni broj, ne preko njega: koliko ih se stvarno
 * napravilo, toliko manje ide lekcijskih. Broji se ono što je napravljeno, a ne
 * ono što je izabrano, jer i posle svega ispod ume da se desi da pitanje ne
 * ispadne - tada mesto mirno pripadne lekciji umesto da propadne.
 *
 * IZBOR IDE SAMO MEĐU REČIMA KOJE ZAISTA IMAJU REČENICU ZA OVU IGRU. Ranije se
 * biralo iz svih starih reči pa se presecalo sa rečenicama, a većina starih
 * reči nije glavna reč nijedne rečenice - kvota se time gotovo uvek istopila i
 * ponavljanja kroz rečenice praktično nije ni bilo. Isti redosled kao u
 * `pitanjaSaStarima`: prvo se sužava na podobne kandidate, pa se onda bira.
 */
export function recenicnaPitanja(
  recenice: readonly Recenica[],
  stareRecenice: readonly Recenica[],
  stare: readonly StaraRec[],
  igra: "slagalica" | "dopuna",
  koliko: number,
  rng: () => number,
  pool: readonly Rec[]
): Pitanje[] {
  const kvota = kvotaStarih(koliko);
  const podobna = igra === "slagalica" ? podobnaZaSlagalicu : podobnaZaDopunu;
  // Reči koje imaju bar jednu rečenicu podobnu BAŠ ZA OVU igru. Rečenica koja
  // ne ulazi u slagalicu (previše pločica, više ispravnih redosleda) ne čini
  // svoju reč kandidatom za slagalicu, ma koliko drugih rečenica imala.
  const saRecenicom = new Set(stareRecenice.filter(podobna).map((s) => s.rec_id));
  const izabraneStare = izaberiStare(
    stare.filter((s) => saRecenicom.has(s.rec.id)),
    kvota,
    rng
  );
  const stariIdovi = new Set(izabraneStare.map((r) => r.id));
  const kandidati = stareRecenice.filter((s) => stariIdovi.has(s.rec_id));

  const staraPitanja = napraviPitanjaRecenica(kandidati, igra, kvota, rng, pool);
  // `Math.max` je pojas i tregeri: kvota je najviše četvrtina, pa iznad
  // `koliko` ne može da ode - ali negativan broj ovde bi značio partiju od
  // skoro svih rečenica lekcije, pa se ne oslanja na to.
  const osnovna = napraviPitanjaRecenica(
    recenice,
    igra,
    Math.max(0, koliko - staraPitanja.length),
    rng,
    pool
  );

  // Stara pitanja se umeću na slučajna mesta, da se ne grupišu na kraju i da
  // dete ne oseti šav između „lekcije" i „ponavljanja".
  const sva = [...osnovna];
  for (const p of staraPitanja) {
    sva.splice(Math.floor(rng() * (sva.length + 1)), 0, p);
  }
  return sva;
}
