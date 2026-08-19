// zack! članstvo - pravilo otključavanja i pomoćnici oko mesečne pretplate
// po detetu (migracija 093).
//
// PRAVILO (odluka vlasnice, zaključana): bez aktivnog članstva se zaključavaju
// SAMO igre, kesice i Milioner. Album, staza i brojači ostaju vidljivi - detetu
// se ništa ne oduzima. Dete NIKAD ne vidi cenu ni dugme za plaćanje; poruka mu
// je mirna i bez krivice, a plaćanje živi u roditeljskom panelu.
//
// Novac ide POSTOJEĆIM pretplatnim tokom (orders + subscriptions +
// subscriptions-poll + Fiscomm); ovde je samo ono što je zack-specifično:
// kome pristup pripada (detetu, kroz zack_deca.clanstvo_do) i kako se to čita.
//
// NAMERNO BEZ IJEDNOG UVOZA: ovo uvoze i klijentske komponente (pločice sa
// katancem), pa ovde ne sme ništa serversko. Sam upit ka bazi
// (clanstvoAktivno) živi u upiti.ts, uz ostale service-role upite.

/** slug kupovnog proizvoda (courses, migracija 093). BEZ course_unlocks. */
export const ZACK_CLANSTVO_SLUG = "zack-clanstvo";

/** Promo rata - mora da se slaže sa planom u subscription-plans.ts i courses.price. */
export const ZACK_PROMO_RSD = 1200;
/** Puna cena, samo za prikaz („promo cena, puna 2.399") - niko je još ne plaća. */
export const ZACK_PUNA_RSD = 2399;

/**
 * Poruka detetu kad su igre zaključane: mirna, bez cene i bez krivice.
 * Ista rečenica na pločicama i u 403 odgovoru ruta, da se UI i server ne raziđu.
 */
export const PORUKA_ZAKLJUCANO =
  "Za igre treba članstvo - pitaj roditelje da ga uključe u svom panelu.";

export interface ClanstvoDeteta {
  /** NULL = naša interna probna deca (pre roditeljskih naloga) - uvek otključana. */
  roditeljId: string | null;
  /** Pilot porodice i probna deca - admin pali SQL-om, plaćanje se ne traži. */
  oslobodjeno: boolean;
  /** Dokle važi plaćeno članstvo (produžava ga svaka uspela naplata). */
  clanstvoDo: string | null;
}

/**
 * Da li su detetu igre otključane. Dete je otključano ako je oslobođeno, ili
 * nema roditelja (interna probna deca), ili mu plaćeno članstvo još važi.
 *
 * Pokvaren datum se tretira kao „ne važi": to je naš podatak o naplati (ne
 * detetov rad), pa pokvarena vrednost ne sme da znači doživotno besplatno -
 * a dete koje stvarno plaća ovim ništa ne gubi trajno, jer se ispravan datum
 * upisuje sa svakom naplatom.
 */
export function jeOtkljucano(c: ClanstvoDeteta, sada: Date): boolean {
  if (c.oslobodjeno || c.roditeljId === null) return true;
  if (!c.clanstvoDo) return false;
  const t = Date.parse(c.clanstvoDo);
  return Number.isFinite(t) && t > sada.getTime();
}

/**
 * Novi rok članstva posle jedne naplate: postojeći rok se PRODUŽAVA, nikad ne
 * skraćuje - isto pravilo kao za course_access u grant-access.ts. Bez ovoga bi
 * naplata obrađena sa zakašnjenjem (poll sutradan) skratila već upisan rok.
 */
export function noviRokClanstva(postojeci: string | null, novi: Date): Date {
  if (!postojeci) return novi;
  const t = Date.parse(postojeci);
  if (!Number.isFinite(t)) return novi;
  return t > novi.getTime() ? new Date(t) : novi;
}
