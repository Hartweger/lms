// Kratka anketa o utiscima za roditelja čije dete zaista koristi zack!.
//
// ODLUKE (Nataša, 22.08.2026):
// - stiže oko 7. dana poklona, DOK dete vežba - da odgovor stigne na vreme da
//   se nešto popravi, a ne kad je sve gotovo,
// - prvo pitanje se odgovara klikom IZ MEJLA (pa se beleži i kad roditelj
//   odustane od ostatka), ostala dva su na stranici,
// - INTERNA je: bez pitanja o dozvoli, bez citata na sajtu, bez zamolnice za
//   Google recenziju. Postoji samo da vidimo šta da popravimo.
//
// NAMERNO BEZ IJEDNOG UVOZA IZ APLIKACIJE: ovo uvoze i klijentska strana ankete
// i vitest - isti razlog kao u clanstvo.ts, gost.ts i poklon.ts.

/** Koliko dana posle uzimanja poklona ide anketa. */
export const DANA_DO_ANKETE = 7;

/**
 * Razmak u KALENDARSKIM danima po Beogradu, ne u satima.
 *
 * Zašto: cron ide u fiksni sat. Ako se dan broji od tačnog trenutka uzimanja
 * poklona, roditelj koji ga je uzeo u 13h nikad ne bi dobio mejl trećeg dana -
 * u trenutku prolaza crona bilo bi proteklo 2 dana i 22 sata, pa bi svaki mejl
 * u nizu stalno kasnio po jedan dan. Sa kalendarskim danima raspored je onakav
 * kakav piše, bez obzira na to u koliko sati je poklon uzet i kad cron ide.
 */
export function danaIzmedju(od: Date, do_: Date): number {
  const uDane = (d: Date) => {
    const delovi = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Belgrade",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const uzmi = (tip: string) => Number(delovi.find((p) => p.type === tip)?.value ?? "0");
    return Date.UTC(uzmi("year"), uzmi("month") - 1, uzmi("day")) / 86400000;
  };
  return uDane(do_) - uDane(od);
}

/**
 * Prvo pitanje - jedino koje stiže u mejlu, kao tri dugmeta.
 *
 * Formulacije su BEZ RODA (pravilo zack!-a): nigde „sam/sama" ni „vratio/la",
 * nego sadašnje vreme i bezlični oblik. `kljuc` je ono što ide u bazu i mora
 * da ostane stabilno - tekst se sme menjati, ključ ne.
 */
export const VRACA_SE: readonly { kljuc: string; tekst: string }[] = [
  { kljuc: "sam", tekst: "Traži ga bez podsećanja" },
  { kljuc: "podsticaj", tekst: "Uz mali podsticaj" },
  { kljuc: "ne", tekst: "Zasad ne" },
] as const;

/** Drugo pitanje - više odgovora, na stranici. Redosled prati staza u igri. */
export const OMILJENO: readonly { kljuc: string; tekst: string }[] = [
  { kljuc: "album", tekst: "Album i sličice" },
  { kljuc: "kesice", tekst: "Kesice" },
  { kljuc: "igre", tekst: "Igre sa rečima" },
  { kljuc: "skakac", tekst: "Skakač sa kozom" },
  { kljuc: "milioner", tekst: "Milioner" },
  { kljuc: "recenice", tekst: "Slaganje rečenica" },
] as const;

/** Slobodan tekst ume da stigne i kao roman - baza i mejl imaju granicu. */
export const NAJVISE_SLOVA_SMETA = 1000;

export function jeVracaSeKljuc(v: unknown): boolean {
  return typeof v === "string" && VRACA_SE.some((o) => o.kljuc === v);
}

/** Prihvata samo poznate ključeve i baca duplikate - ostalo se tiho odbacuje. */
export function ocistiOmiljeno(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const dozvoljeni = new Set(OMILJENO.map((o) => o.kljuc));
  return [...new Set(v.filter((k): k is string => typeof k === "string" && dozvoljeni.has(k)))];
}

export function ocistiSmeta(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, NAJVISE_SLOVA_SMETA) : null;
}

/**
 * Da li je detetu vreme za anketu.
 *
 * Tri uslova moraju da važe zajedno:
 * - prošlo je bar DANA_DO_ANKETE od pravljenja profila,
 * - dete je STVARNO vežbalo (ima poslednji dan igranja) - roditelj koga pitamo
 *   za utisak o nečemu što dete nije ni otvorilo dobija besmislen mejl,
 * - poklon još traje. Posle isteka anketu zamenjuje mejl o isteku, da roditelj
 *   ne dobije dva mejla o istoj stvari u istoj nedelji.
 */
export function vremeZaAnketu(o: {
  sada: Date;
  napravljeno: string;
  poslednjiDan: string | null;
  clanstvoDo: string | null;
}): boolean {
  if (!o.poslednjiDan) return false;
  const od = new Date(o.napravljeno);
  if (Number.isNaN(od.getTime())) return false;
  if (danaIzmedju(od, o.sada) < DANA_DO_ANKETE) return false;
  const rok = o.clanstvoDo ? Date.parse(o.clanstvoDo) : NaN;
  if (Number.isNaN(rok) || o.sada.getTime() >= rok) return false;
  return true;
}

/**
 * Da li roditelju treba javiti da kod još čeka.
 *
 * Poklon koji dete nikad ne otvori je propao poklon, a najčešći razlog je
 * proza: papirić sa kodom se zaturi. Zato JEDAN miran mejl trećeg dana, i to
 * bez ijednog prekora - ne kaže se „dete nije ušlo", nego „kod čeka".
 */
export const DANA_DO_AKTIVACIJE = 3;

export function vremeZaAktivaciju(o: {
  sada: Date;
  napravljeno: string;
  poslednjiDan: string | null;
  clanstvoDo: string | null;
}): boolean {
  // Dete koje se ijednom igralo nema šta da aktivira.
  if (o.poslednjiDan) return false;
  const od = new Date(o.napravljeno);
  if (Number.isNaN(od.getTime())) return false;
  if (danaIzmedju(od, o.sada) < DANA_DO_AKTIVACIJE) return false;
  // Posle isteka poklona podsećanje na kod nema smisla - igre ionako miruju.
  const rok = o.clanstvoDo ? Date.parse(o.clanstvoDo) : NaN;
  if (Number.isNaN(rok) || o.sada.getTime() >= rok) return false;
  return true;
}

/**
 * Da li je vreme za mejl o isteku poklona. Šalje se DAN POSLE roka, ne na sam
 * rok: tog dana je dete možda još igralo, pa bi mejl stigao pre nego što se
 * išta promenilo. Prozor je tri dana - ko ga propusti (cron pao), dobija ga
 * sutradan, a ne za mesec dana kad više nikoga ne zanima.
 */
export const DANA_PROZOR_ISTEKA = 3;

export function vremeZaIstek(sada: Date, clanstvoDo: string | null): boolean {
  if (!clanstvoDo) return false;
  const rok = Date.parse(clanstvoDo);
  if (Number.isNaN(rok)) return false;
  const dan = 24 * 60 * 60 * 1000;
  return sada.getTime() >= rok && sada.getTime() < rok + DANA_PROZOR_ISTEKA * dan;
}
