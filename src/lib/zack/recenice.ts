// Rečenične igre: iz jednog zapisa rečenice se prave pitanja i za slagalicu
// i za dopunu (i za učenje rečenica, koje je blaži prikaz slagalice).
// Ista filozofija kao pitanja.ts: čiste funkcije, ubrizgan rng, bez mreže.
import { ponudjeni, type Pitanje } from "./pitanja";
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
 * Prikazni oblici pločica: prva reč rečenice ide malim slovom, da veliko slovo
 * ne oda rešenje (kod imperativa bi „Mach" odalo poentu). Veliko slovo
 * zadržavaju imenice (nemačke imenice ga ionako nose) i imena iz VELIKA_UVEK.
 * `pool` su reči iz kojih je rečenica sastavljena (lekcija + stare).
 */
export function prikazPlocica(reci: readonly string[], pool: readonly Rec[]): string[] {
  return reci.map((r, i) => {
    if (i > 0) return r;
    if (VELIKA_UVEK.has(r)) return r;
    const jeImenica = pool.some(
      (p) => p.vrsta === "imenica" && p.de.toLocaleLowerCase("de") === r.toLocaleLowerCase("de")
    );
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
  const j = izmesano.findIndex((p) => p !== izmesano[0]);
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
