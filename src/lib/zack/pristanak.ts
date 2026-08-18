// Tekst pristanka koji roditelj potvrđuje pri otvaranju naloga.
//
// Ceo tekst se upisuje u bazu (zack_roditelji.pristanak_tekst), ne samo
// oznaka verzije, da uvek postoji dokaz šta je roditelj stvarno video i na
// šta je pristao. Pravni osnov: dete mlađe od 15 godina kod nas ne može samo
// da da pristanak za obradu podataka, pa pristanak daje roditelj.
//
// Tekst je namerno ljudski, bez pravničkog jezika. Roditelj ga stvarno čita.

export const PRISTANAK_VERZIJA = "2026-08-18.1";

export const PRISTANAK_TEKST = `Potvrđujem da sam roditelj ili staratelj deteta za koje otvaram profil.

Pristajem da se o detetu čuvaju samo ime i napredak u učenju: koje je reči savladalo, koliko dana zaredom vežba i kako mu idu provere. Ništa drugo se o detetu ne čuva, ni prezime, ni datum rođenja, ni fotografija.

Ti podaci služe da dete vidi svoj album i da ja dobijam izveštaj o napretku. Ne prodaju se i ne dele ni sa kim.

Pristanak mogu da povučem kad god poželim, brisanjem detetovog profila ili porukom na info@hartweger.rs, i tada se detetovi podaci brišu.`;
