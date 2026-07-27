// src/lib/naki-brief.ts
// NaKI u jutarnjem pregledu. Posle prepravki promptova 25-27.07.2026 (rod se pita,
// varijanta se prati, kurs se nudi od 4. poruke) ništa od toga se nije videlo bez
// ručnog upita u bazu. Ovde su brojke koje kažu da li izmene rade i da li smetaju.

export interface NakiBriefInput {
  /** Sve jučerašnje poruke tutora (kind='tutor'). */
  poruke: { sessionId: string; role: string; message: string }[];
  /** Novi redovi u naki_profiles juče. */
  noviMejlovi: number;
}

export interface NakiBrief {
  sesija: number;
  porukaKorisnika: number;
  ponudaKursa: number;
  ponudaProcenat: number;
  /** Sesije u kojima je isto pitanje (nivo ili rod) postavljeno 2+ puta. Cilj: 0. */
  ponovljenoPitanje: number;
  pohvale: number;
  zalbe: number;
  /**
   * Pohvale po jednoj žalbi. `null` dok žalbi ima manje od praga - na jednom danu
   * ih je premalo (26.07.2026: 8 pohvala, 0 žalbi) da bi odnos nešto značio.
   * Osnovica na celom periodu 05.06-25.07: 4,6.
   */
  odnos: number | null;
  noviMejlovi: number;
  stopaHvatanja: number;
  limitDogadjaja: number;
}

// PAZI: \b i \w u JS su ASCII, a \m ne postoji (to je Postgres). Granicu reči
// pravimo klasom naših slova, inače "učiš" i slično pucaju na č/š.
const SLOVA = "A-Za-zČĆŽŠĐčćžšđ";
const GRANICA = `(?<![${SLOVA}])`;

const PONUDA_RE = /\/kursevi/i;
const PITAO_NIVO_RE = /koji nivo u[čc]i[šs]/i;
const PITAO_ROD_RE = /kako da ti se obra[ćc]am/i;
const POHVALA_RE = new RegExp(
  `${GRANICA}(hvala|super|odli[čc]no|bravo|svaka [čc]ast|najbolja si|savr[šs]eno|odli[čc]na si)`,
  "i"
);
const ZALBA_RE =
  /(ne razume[šs]|glupo|nisi normal|pogre[šs]no|nije ta[čc]no|ponavlja[šs]|dosadno|ne valja|ne poma[žz]e|ne radi)/i;
const LIMIT_RE = /^\[limit_reached\]/;

/** Ispod ovoliko žalbi odnos je šum, pa se ne prikazuje ni ne alarmira. */
const MIN_ZALBI_ZA_ODNOS = 3;

const procenat = (deo: number, celina: number) => (celina ? Math.round((deo / celina) * 100) : 0);

export function buildNakiBrief(input: NakiBriefInput): NakiBrief {
  const sesije = new Set<string>();
  const saPonudom = new Set<string>();
  const nivoPo = new Map<string, number>();
  const rodPo = new Map<string, number>();
  let porukaKorisnika = 0;
  let pohvale = 0;
  let zalbe = 0;
  let limitDogadjaja = 0;

  const uvecaj = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

  for (const p of input.poruke) {
    sesije.add(p.sessionId);
    if (LIMIT_RE.test(p.message)) {
      limitDogadjaja++;
      continue;
    }
    if (p.role === "user") {
      porukaKorisnika++;
      if (POHVALA_RE.test(p.message)) pohvale++;
      if (ZALBA_RE.test(p.message)) zalbe++;
      continue;
    }
    if (PONUDA_RE.test(p.message)) saPonudom.add(p.sessionId);
    if (PITAO_NIVO_RE.test(p.message)) uvecaj(nivoPo, p.sessionId);
    if (PITAO_ROD_RE.test(p.message)) uvecaj(rodPo, p.sessionId);
  }

  const ponovljene = new Set<string>();
  for (const [s, n] of nivoPo) if (n > 1) ponovljene.add(s);
  for (const [s, n] of rodPo) if (n > 1) ponovljene.add(s);

  return {
    sesija: sesije.size,
    porukaKorisnika,
    ponudaKursa: saPonudom.size,
    ponudaProcenat: procenat(saPonudom.size, sesije.size),
    ponovljenoPitanje: ponovljene.size,
    pohvale,
    zalbe,
    odnos: zalbe >= MIN_ZALBI_ZA_ODNOS ? Math.round((pohvale / zalbe) * 10) / 10 : null,
    noviMejlovi: input.noviMejlovi,
    stopaHvatanja: procenat(input.noviMejlovi, sesije.size),
    limitDogadjaja,
  };
}
