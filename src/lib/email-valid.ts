// Strožija provera mejl adrese nego staro /^[^\s@]+@[^\s@]+\.[^\s@]+$/ — ono propušta
// TLD sa ciframa ("gmail.com5"), koji Resend odbija sa "Invalid `to` field" (Sentry 40ddd5d2).
// TLD mora biti najmanje 2 slova, bez cifara.
const DELIVERABLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/**
 * Domeni koji izgledaju ispravno, a ne postoje - tipfeleri velikih provajdera.
 * Spisak je izveden iz adresa koje su STVARNO upisane u bazu i odbile se
 * ([[project_ciscenje_neaktivnih]] nije isto - ovde je reč o neisporučivosti).
 *
 * OPREZ: `ymail.com`, `rocketmail.com`, `hotmail.it`, `yahoo.com.sg` i `email.com` su
 * PRAVI domeni i NE smeju ovde - u bazi ih ima 25, blokada bi odbila žive ljude.
 *
 * `gamil.com` zaslužuje posebnu pažnju: ima aktivan mejl server, pa poruka stigne -
 * ali nekom trećem. To je gore od odbačaja, jer sadržaj polaznika ode strancu.
 */
const TIPFELER_DOMENI = new Set([
  "gamil.com", "gmai.com", "gmial.com", "gmali.com", "gmaill.com", "gmil.com", "gmail.co",
  "gmail.cm", "gmail.om", "gmail.cokm", "84gmil.com",
  "hotmai.com", "hotmial.com", "hotmail.co", "yahooo.com", "yaho.com", "iclod.com", "iclou.com",
]);

/**
 * Provajderi kod kojih je uz „.com" ZALEPLJENO još nešto („comcom", „comh", „coma").
 * Posle „.com" mora da sledi tačka ili ništa - inače bi pale državne varijante
 * (`yahoo.com.sg`, `hotmail.com.br`), koje su prave adrese.
 */
const VELIKI_PROVAJDERI = /^(gmail|hotmail|yahoo|icloud|outlook|live|aol)\.com[^.].*$/i;

/**
 * Predlog ispravke domena, ili null ako je domen u redu. Koristi se za poruku o grešci -
 * „neispravna adresa" bez objašnjenja čovek pročita kao kvar sajta i ode.
 */
export function domainTypoHint(email: string): string | null {
  const domen = email.trim().toLowerCase().split("@")[1] ?? "";
  if (!domen) return null;
  if (domen.includes("..")) return domen.replace(/\.\.+/g, ".");
  if (/\.con$/.test(domen)) return domen.replace(/\.con$/, ".com");   // .con TLD ne postoji
  const veliki = domen.match(VELIKI_PROVAJDERI);
  if (veliki) return `${veliki[1].toLowerCase()}.com`;
  if (TIPFELER_DOMENI.has(domen)) {
    if (domen.startsWith("hotma") || domen === "hotmail.co") return "hotmail.com";
    if (domen.startsWith("yah")) return "yahoo.com";
    if (domen.startsWith("iclo")) return "icloud.com";
    return "gmail.com";
  }
  return null;
}

export function isDeliverableEmail(email: string): boolean {
  return DELIVERABLE_EMAIL_RE.test(email) && domainTypoHint(email) === null;
}
