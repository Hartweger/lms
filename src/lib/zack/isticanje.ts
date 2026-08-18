// Isticanje u objašnjenjima: znaci koje je autorka pisala postaju izgled.
//
// ODAKLE PROBLEM
// --------------
// Objašnjenja gramatike i podsetnici na pravilo pisani su kao markdown, pa u
// bazi stoje sa znacima za isticanje:
//
//   kosi navodnici oko nemačke reči   `müssen`, `in das`, `der`
//   dve zvezdice oko važnog           **MaRMeladeN**, **samo muški rod**
//
// Ta polja su se ispisivala kao običan tekst, pa je dete umesto istaknute reči
// videlo navodnike i zvezdice. Znaci se NE brišu: isticanje je namerno i nosi
// smisao, jer razdvaja nemački od našeg jezika i pokazuje šta je jezgro
// pravila. Zato se prikazuju kao ono što jesu.
//
// ZAŠTO OVDE, A NE U KOMPONENTI
// -----------------------------
// Rasparčavanje je čist posao nad tekstom: isti ulaz uvek daje isti izlaz, bez
// ijednog dodira sa ekranom. Zato živi ovde i pokriveno je testovima, a
// komponenta samo crta ono što joj ovo vrati. Tekst iz baze se nikad ne pretvara
// u HTML - komponenta pravi React elemente, jer se u ovom projektu unos iz baze
// ne ubacuje kao markup.
//
// SAMO DVA OBLIKA I NIŠTA VIŠE
// ----------------------------
// Nema naslova, spiskova, veza ni kosih slova. Sve što nije jedan od ta dva
// oblika je običan tekst. To nije nedovršen markdown nego namera: polja u bazi
// su rečenice, ne dokumenti, a svaki oblik koji se podrži postaje oblik koji
// neko sme da upiše.
//
// NEZATVOREN ZNAK OSTAJE SLOVO
// ----------------------------
// Ako navodnik ili zvezdice nemaju par, znak se ispisuje onako kako je i
// upisan. Tako pola rečenice ne odleti u isticanje zbog jednog viška znaka, a
// onome ko piše tekst greška ostane vidljiva umesto da tiho nestane.

/**
 * Jedan komad teksta i način na koji se prikazuje.
 *
 * Zastavice su dve nezavisne, a ne jedna vrsta, jer se isticanja preklapaju:
 * `**posle `in` ide akuzativ**` je i podebljano i, u sredini, nemačka reč.
 * Ravan spisak sa dve zastavice to nosi bez ugnežđivanja.
 */
export type Deo = {
  readonly tekst: string;
  /** Nemačka reč iz kosih navodnika. Dobija svoju boju i `lang="de"`. */
  readonly nemacki: boolean;
  /** Jezgro pravila iz dvostrukih zvezdica. Dobija podebljano. */
  readonly vazno: boolean;
};

const ZVEZDICE = "**";
const NAVODNIK = "`";

/**
 * Rasparčava tekst sa isticanjem na komade spremne za prikaz.
 *
 * Prazan tekst i tekst bez ijednog znaka prolaze netaknuti: prvi daje prazan
 * spisak, drugi jedan običan komad. Prazni komadi se ne vraćaju, pa `****` ne
 * ostavlja komad bez slova.
 */
export function rasparcaj(tekst: string): Deo[] {
  return uKomade(tekst, false);
}

/**
 * Isti prolaz za ceo tekst i za unutrašnjost podebljanog dela. `uVaznom` kaže
 * samo koju zastavicu nose komadi koji ispadnu, pa se pravilo o navodnicima
 * piše jednom.
 *
 * Zvezdice se traže samo u prvom prolazu. Podebljano u podebljanom ne postoji,
 * pa bi drugi nivo bio pravilo koje niko ne piše i koje niko ne bi proveravao.
 */
function uKomade(tekst: string, uVaznom: boolean): Deo[] {
  const delovi: Deo[] = [];
  let obicno = "";

  const spusti = () => {
    if (obicno !== "") {
      delovi.push({ tekst: obicno, nemacki: false, vazno: uVaznom });
      obicno = "";
    }
  };

  let i = 0;
  while (i < tekst.length) {
    if (!uVaznom && tekst.startsWith(ZVEZDICE, i)) {
      const kraj = tekst.indexOf(ZVEZDICE, i + ZVEZDICE.length);
      if (kraj !== -1) {
        spusti();
        delovi.push(...uKomade(tekst.slice(i + ZVEZDICE.length, kraj), true));
        i = kraj + ZVEZDICE.length;
        continue;
      }
      // Nema para: zvezdice su slova kao i sva ostala.
      obicno += ZVEZDICE;
      i += ZVEZDICE.length;
      continue;
    }

    if (tekst.startsWith(NAVODNIK, i)) {
      const kraj = tekst.indexOf(NAVODNIK, i + NAVODNIK.length);
      if (kraj !== -1) {
        spusti();
        const rec = tekst.slice(i + NAVODNIK.length, kraj);
        if (rec !== "") delovi.push({ tekst: rec, nemacki: true, vazno: uVaznom });
        i = kraj + NAVODNIK.length;
        continue;
      }
      obicno += NAVODNIK;
      i += NAVODNIK.length;
      continue;
    }

    obicno += tekst[i];
    i += 1;
  }

  spusti();
  return delovi;
}
