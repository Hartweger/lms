// Rodno neutralno pisanje dok rod korisnika nije poznat - poslednja brana.
//
// Prompt sam ovo ne izdrži: probano 26.07.2026 tri puta, pa opet 23.08.2026 na
// produkciji ("što si već tačno uradio" u prvom odgovoru, rod nepoznat). Razlog je
// što se rod provlači kroz svaki particip, a particip dolazi uz bilo koji glagol -
// spisak zamena bi morao da pokrije ceo rečnik.
//
// Zato ovde ne prepravljamo tekst regexom nego ga samo PREPOZNAJEMO, a prepisivanje
// vraćamo modelu sa jednim jasnim nalogom. Regex koji bi menjao "napisao si" u nešto
// neutralno morao bi da menja i konstrukciju rečenice, a to nije posao za zamenu niza.

const SLOVA = "A-Za-zČĆŽŠĐčćžšđ";
const NE_PRE = `(?<![${SLOVA}])`;
const NE_POSLE = `(?![${SLOVA}])`;
// Particip radni u oba roda: napisao / napisala, video / videla, rekao / rekla.
const PARTICIP = `[${SLOVA}]{2,}(?:ao|io|eo|la)`;
// Pridevi kojima se korisnik opisuje - rod se vidi i bez participa.
const PRIDEV = "(?:siguran|sigurna|spreman|spremna|umoran|umorna|ponosan|ponosna|zadovoljan|zadovoljna)";
// Između "si"/"bi" i participa staju do dve kratke reči: "si već tačno uradio",
// "si to napisala", "bi ti rekao". Interpunkcija ih ne preskače (nije u klasi slova),
// pa "si u pravu, škola..." ne pada kao lažan pogodak.
const UMETNUTO = `(?:\\s+[${SLOVA}]{1,6}){0,2}`;

const RODNI_OBLIK_RE = new RegExp(
  [
    // "napisao si", "sigurna si"
    `${NE_PRE}(?:${PARTICIP}|${PRIDEV})\\s+si${NE_POSLE}`,
    // "si napisao", "da si razumela", "si već tačno uradio"
    `${NE_PRE}si${UMETNUTO}\\s+(?:${PARTICIP}|${PRIDEV})${NE_POSLE}`,
    // "kako bi rekao", "šta bi napisala", "kako bi ti rekao"
    `${NE_PRE}bi${UMETNUTO}\\s+${PARTICIP}${NE_POSLE}`,
  ].join("|"),
  "i"
);

/** Da li se u tekstu korisniku obraća rodno obeleženim oblikom. */
export function imaRodniOblik(text: string): boolean {
  return !!text && RODNI_OBLIK_RE.test(text);
}

/**
 * Nalog za prepisivanje. Namerno traži SAMO preoblikovanje spornih mesta: svaka
 * dodatna sloboda ovde znači da se odgovor koji je već dobar pokvari u drugom prolazu.
 */
export const NEUTRALIZE_PROMPT = `Prepiši tekst koji dobiješ tako da se korisniku NIGDE ne obraćaš rodno obeleženim oblikom, jer mu rod ne znaš.

Umesto "uradio si" napiši "odlično rešeno", umesto "kako bi rekao" napiši "kako to glasi", umesto "napisao si" napiši "u tvojoj rečenici", umesto "razumeo si" napiši "to je jasno". Nikad ne piši "uradio/la" ni "rekao/la" - to je zabranjeno; uvek preoblikuj rečenicu.

Sve ostalo ostavi TAČNO kako jeste: isti sadržaj, isti redosled, isti nemački primeri, isti bold, isti emoji, ista dužina. Ne dodaj ni reč komentara, ne pozdravljaj, ne objašnjavaj šta si menjao. Crtica je obična (-), pismo je latinica.

Vrati samo prepisan tekst.`;

/**
 * Prepis se uzima samo ako je zaista rešio problem. Ako je model vratio prazno,
 * skratio odgovor ili opet procurio rod, ostaje original - odgovor koji je stigao
 * do korisnika vredi više od pravila o rodu.
 */
export function izaberiPrepis(original: string, prepis: string | null | undefined): string {
  if (!prepis) return original;
  const p = prepis.trim();
  if (!p || imaRodniOblik(p)) return original;
  // Prepis kraći od pola originala znači da je model rezimirao umesto da prepiše.
  if (p.length < original.trim().length / 2) return original;
  return p;
}
