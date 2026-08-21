// zack! poklon do 1. septembra 2026: dete dobija ceo zack! BESPLATNO, bez
// kartice i bez ijednog plaćanja - obnavljanje nemačkog pred polazak u školu.
//
// Zašto poklon jaše postojeći gost-tok umesto da ima svoj: nalog, roditeljski
// red sa pristankom i dete sa kodom već zna da pravi grant-access.ts, iz
// porudžbine. Poklon zato pravi porudžbinu ISTOG oblika kao gost-kupovina, samo
// sa iznosom 0 i oznakom ispod - novca i fiskalnog računa nema jer ih grant
// nikad i ne radi (to je posao pozivaoca, a pozivalac poklona ne dira ni
// NestPay ni Fiscomm ni pretplatu).
//
// Kad poklon istekne, detetu se NIŠTA ne oduzima: važi isto mirno pravilo iz
// clanstvo.ts - miruju samo igre, kesice i Milioner, a album, staza i sve
// zarađeno ostaju vidljivi.
//
// NAMERNO BEZ IJEDNOG UVOZA: ovo uvoze i klijentske komponente (poklon strana)
// i vitest - isti razlog kao u clanstvo.ts i gost.ts.

/**
 * Dokle poklon važi - JEDINO MESTO NA KOM SE MENJA. Ista vrednost radi dva
 * posla, pa se ne mogu razići:
 * - do kad se poklon SME uzeti (posle ovog trenutka strana i ruta odbijaju),
 * - koliko detetu traje pristup (zack_deca.clanstvo_do), FIKSNO - poklon nije
 *   period od 30 dana koji se pomera, nego datum koji je vlasnica odredila.
 *
 * Beogradsko vreme (+02:00, letnje): poklon se gasi u ponoć između 31. avgusta
 * i 1. septembra, kako roditelj i čita „do 1. septembra".
 */
export const POKLON_DO = "2026-09-01T00:00:00+02:00";

/** Isti datum ispisan za ljude - da se u tekstovima ne kuca ručno. */
export const POKLON_DO_PRIKAZ = "1. septembra 2026";

/** Mirna poruka kad je poklon prošao - roditelju, bez greške i bez žurbe. */
export const PORUKA_POKLON_ISTEKAO =
  "Poklon je važio do 1. septembra i sada je zatvoren. Ako želiš da dete nastavi, članstvo se uključuje u svakom trenutku.";

/**
 * Mirna poruka na drugi pokušaj sa istim mejlom. NAMERNO ne kaže ni ime
 * deteta ni kod ni da li na toj adresi postoji nalog - samo da je poklon za tu
 * adresu već uzet i gde roditelj nalazi svoje podatke. Ko nije uzeo poklon,
 * odavde o tuđem nalogu ne saznaje ništa.
 */
export const PORUKA_POKLON_VEC_UZET =
  "Za ovu mejl adresu je poklon već uzet - jedan poklon ide po adresi. Kod za prijavu deteta stigao je na taj mejl, a sve o detetu stoji u roditeljskom panelu.";

/**
 * Oznaka koju poklon-porudžbina nosi u items[0].zack_poklon. Postoji da bi
 * poklon imao TRAG: po njoj se posle vidi ko je dobio pristup bez plaćanja,
 * dokle mu je obećan i kojom akcijom - i po njoj grant-access zna da upiše
 * fiksan rok umesto godine dana.
 */
export type ZackPoklonMeta = {
  /** Rok koji je detetu obećan, prepisan iz POKLON_DO u trenutku davanja. */
  do: string;
  /** Koja akcija je poklon dala - da se kasnije poklon-akcije ne mešaju. */
  akcija: string;
};

/** Naziv akcije u tragu; menja se samo ako vlasnica pokrene NOVU poklon-akciju. */
export const POKLON_AKCIJA = "poklon-do-1-9-2026";

export function napraviPoklonMeta(): ZackPoklonMeta {
  return { do: POKLON_DO, akcija: POKLON_AKCIJA };
}

/**
 * Da li se poklon u ovom trenutku još sme dati. Proveravaju ga I strana (da
 * roditelj ne popunjava obrazac uzalud) I ruta - strana je javna, pa je ruta
 * ta koja stvarno zatvara vrata.
 */
export function poklonVazi(sada: Date): boolean {
  return sada.getTime() < Date.parse(POKLON_DO);
}

/** Da li stavka porudžbine nosi ispravnu poklon-oznaku (a ne podmetnutu vrednost). */
export function jePoklonStavka(stavka: unknown): boolean {
  if (typeof stavka !== "object" || stavka === null) return false;
  const oznaka = (stavka as { zack_poklon?: unknown }).zack_poklon;
  if (typeof oznaka !== "object" || oznaka === null) return false;
  return typeof (oznaka as ZackPoklonMeta).do === "string"
    && typeof (oznaka as ZackPoklonMeta).akcija === "string";
}

/**
 * Jedan poklon po mejl adresi. Gleda se PORUDŽBINA, ne dete: porudžbina je
 * trajan trag koji se ne briše ni ako roditelj obriše detetov profil, pa se
 * poklon ne može uzeti dvaput istom adresom.
 *
 * Plaćene porudžbine se ne broje - ko već plaća članstvo za jedno dete sme da
 * uzme poklon za drugo.
 */
export function vecUzetPoklon(porudzbine: readonly { items: unknown }[]): boolean {
  return porudzbine.some(
    (o) => Array.isArray(o.items) && o.items.some((stavka) => jePoklonStavka(stavka)),
  );
}
