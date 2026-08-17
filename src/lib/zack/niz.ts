// Niz dana: koliko dana zaredom je dete igralo.
//
// ZAŠTO OVDE NEMA POJMA „IZGUBLJEN NIZ"
// ------------------------------------
// Niz je jedina mehanika u aplikaciji koja može da se pokvari sama od sebe, bez
// ijedne detetove greške: dovoljno je da jedan dan ne igra. Zato se prekid nigde
// ne računa kao gubitak. Kad se niz prekine, on prosto opet kreće od 1, mirno.
// Ova funkcija zato nikad ne vraća „koliko si imao pre", niti razliku, nego samo
// nov broj. Ono što se ne izračuna ne može ni da se prikaže kao kazna.
//
// ZAŠTO PO DANIMA, A NE PO SATIMA
// -------------------------------
// Dete koje igra u 23:50 pa sutra u 00:10 nije preskočilo dan, iako je između
// prošlo dvadeset minuta. Zato se sve računa po kalendarskim danima u lokalnoj
// zoni, a datumi ulaze kao gotov tekst „YYYY-MM-DD".
//
// Vreme se uvek prosleđuje spolja. Bez `new Date()` unutra, da bi rezultat bio
// isti danas i za godinu dana, i da bi testovi mogli da provere prestupnu godinu
// i prelaz preko Nove godine.

const MS_U_DANU = 86_400_000;

/**
 * Redni broj dana od epohe za datum oblika „YYYY-MM-DD", ili null ako datum
 * nije ispravan. Nikad ne baca grešku, jer ovo hrani prikaz detetu.
 */
function redniDan(datum: string | null): number | null {
  if (typeof datum !== "string") return null;

  const delovi = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datum);
  if (!delovi) return null;

  const godina = Number(delovi[1]);
  const mesec = Number(delovi[2]);
  const dan = Number(delovi[3]);

  const ms = Date.UTC(godina, mesec - 1, dan);

  // Date.UTC tiho prelama nepostojeće datume: 31.04. postane 01.05, a 29.02. u
  // godini koja nije prestupna postane 01.03. Poređenje nazad hvata takve
  // datume i vraća ih kao neispravne, umesto da ih ćutke pomeri.
  const proba = new Date(ms);
  if (
    proba.getUTCFullYear() !== godina ||
    proba.getUTCMonth() !== mesec - 1 ||
    proba.getUTCDate() !== dan
  ) {
    return null;
  }

  return Math.round(ms / MS_U_DANU);
}

/** Niz iz baze je smallint, ali smeće na ulazu ne sme da sruši računicu. */
function celBroj(n: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

/**
 * Nov niz na osnovu poslednjeg dana igranja.
 *
 * @param poslednjiDan „YYYY-MM-DD" ili null ako dete nikad nije igralo
 * @param danas        „YYYY-MM-DD" u zoni u kojoj dete živi
 * @param trenutniNiz  niz koji je do sada zapisan
 * @returns nov niz i podatak da li se uopšte promenio; ako nije promenjen,
 *          bazu ne treba ni dirati
 */
export function noviNiz(
  poslednjiDan: string | null,
  danas: string,
  trenutniNiz: number
): { niz: number; promenjen: boolean } {
  const danasnji = redniDan(danas);
  const poslednji = redniDan(poslednjiDan);
  const dosad = celBroj(trenutniNiz);

  // Nikad nije igralo, ili u bazi stoji datum koji ne valja. U oba slučaja ovo
  // je prvi dan niza. Neispravan datum se namerno ne razlikuje od prvog igranja:
  // dete za njega nije krivo, a jedina bezbedna pretpostavka je da niza nema.
  if (danasnji === null || poslednji === null) {
    return { niz: 1, promenjen: true };
  }

  const razmak = danasnji - poslednji;

  // Već je igralo danas, pa drugi tačan odgovor istog dana ne diže niz.
  // Ovde upada i datum iz budućnosti, kad je sat na uređaju pomeren unapred:
  // niz se tada ne diže, ali se ni ne obara. Dete nije krivo za pokvaren sat.
  if (razmak <= 0) {
    return { niz: dosad, promenjen: false };
  }

  // Juče pa danas.
  if (razmak === 1) {
    return { niz: dosad + 1, promenjen: true };
  }

  // Preskočen je bar jedan dan. Niz kreće od 1, i to je nov početak, a ne kazna.
  return { niz: 1, promenjen: true };
}
