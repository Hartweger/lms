// Zajednička logika AI ocenjivanja Schreiben zadataka (prompt + obračun ocene).
// Koriste je /api/check-essay i scripts/calibrate-essay-grading.ts - da kalibracija
// uvek meri TAČNO ono što ruta radi u produkciji.
//
// Dizajn: AI vraća ocene po 4 Goethe kriterijuma (0-5), a ZBIRNA ocena se računa
// deterministički u kodu - time se uklanja glavni izvor nedoslednosti modela.
// Erfüllung nosi duplu težinu (Goethe: sadržaj je najvažniji), a Erfüllung 0
// obara ceo rad (Goethe pravilo: promašen zadatak = 0 bez obzira na jezik).

export interface EssayCriteria {
  erfuellung: number;   // sadržaj/ispunjenost zadatka
  kohaerenz: number;    // povezanost teksta
  wortschatz: number;   // vokabular
  korrektheit: number;  // gramatička tačnost
}

export interface GradingResult {
  feedback: string;
  corrections: { original: string; corrected: string; explanation: string }[];
  criteria: EssayCriteria;
  nedostaje?: string; // koje tačke zadatka nedostaju (prazno ako su sve tu)
}

// Kalibrisano na 155 profesorski ocenjenih radova (scripts/calibrate-essay-grading.ts,
// avgust 2026): Haiku je najbolji na A1 (80% naspram 72% Sonneta), Sonnet svuda dalje
// (A2 74% vs 66%, B1 68% vs 56% starog prompta). Ne menjaj bez ponovne kalibracije.
export function pickGradingModel(level: string): string {
  const l = (level || "A1").toUpperCase();
  return l.startsWith("A1") ? "claude-haiku-4-5-20251001" : "claude-sonnet-4-5";
}

// Orijentacioni obim po nivou (Goethe ispitni formati); zadatak može da kaže drugačije.
const EXPECTED_WORDS: Record<string, string> = {
  A1: "oko 30 reči",
  A2: "oko 30-40 reči",
  B1: "oko 80 reči",
  B2: "oko 150 reči",
  C1: "oko 200 reči",
};

const clamp05 = (n: unknown): number =>
  Math.max(0, Math.min(5, Math.round(typeof n === "number" && Number.isFinite(n) ? n : 0)));

export function normalizeCriteria(raw: unknown): EssayCriteria {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    erfuellung: clamp05(o.erfuellung),
    kohaerenz: clamp05(o.kohaerenz),
    wortschatz: clamp05(o.wortschatz),
    korrektheit: clamp05(o.korrektheit),
  };
}

// Zbirna ocena 1-5: ponderisani prosek sa duplom težinom Erfüllung-a.
// Erfüllung 0 (zadatak promašen/prazan) → 1, ma kakav jezik bio.
export function computeScore(c: EssayCriteria): number {
  if (c.erfuellung === 0) return 1;
  const weighted = (2 * c.erfuellung + c.kohaerenz + c.wortschatz + c.korrektheit) / 5;
  return Math.max(1, Math.min(5, Math.round(weighted)));
}

// Predlog bodova za ispitne vežbe (maxPoints 20/40): ista ponderisana suma
// preslikana na bodovnu skalu. Erfüllung 0 → 0 bodova (Goethe pravilo).
export function computePoints(c: EssayCriteria, maxPoints: number): number {
  if (c.erfuellung === 0) return 0;
  const weighted = (2 * c.erfuellung + c.kohaerenz + c.wortschatz + c.korrektheit) / 25;
  return Math.max(0, Math.min(maxPoints, Math.round(weighted * maxPoints)));
}

export const countWords = (text: string): number =>
  text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

// Structured output: model MORA da odgovori kroz ovaj alat - nema više parsiranja
// JSON-a iz teksta (koji je pucao kad se odgovor prekine na max_tokens).
export const GRADING_TOOL = {
  name: "oceni_schreiben",
  description: "Vrati ocenu Schreiben rada po Goethe kriterijumima.",
  input_schema: {
    type: "object" as const,
    properties: {
      criteria: {
        type: "object",
        properties: {
          erfuellung: { type: "integer", minimum: 0, maximum: 5 },
          kohaerenz: { type: "integer", minimum: 0, maximum: 5 },
          wortschatz: { type: "integer", minimum: 0, maximum: 5 },
          korrektheit: { type: "integer", minimum: 0, maximum: 5 },
        },
        required: ["erfuellung", "kohaerenz", "wortschatz", "korrektheit"],
      },
      nedostaje: { type: "string", description: "Koje tačke zadatka nedostaju; prazan string ako su sve obrađene." },
      feedback: { type: "string", description: "1-2 rečenice za polaznika, ohrabrujuće ali konkretno." },
      corrections: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            original: { type: "string" },
            corrected: { type: "string" },
            explanation: { type: "string" },
          },
          required: ["original", "corrected"],
        },
      },
    },
    required: ["criteria", "feedback", "corrections"],
  },
};

export function buildGradingPrompt(opts: {
  task: string;
  text: string;
  level?: string;
  isExam?: boolean;
}): string {
  const level = (opts.level || "A1").toUpperCase().slice(0, 2);
  const words = countWords(opts.text);
  const expected = EXPECTED_WORDS[level] ?? EXPECTED_WORDS.A1;

  return `Ti si iskusan ocenjivač Schreiben zadataka po kriterijumima Goethe-Instituta. Polaznik je na nivou ${level}.${opts.isExam ? " Ovo je ISPITNA vežba (Modelltest) - primeni ispitni standard za taj nivo, ali i na ispitu Goethe ocenjuje komunikativni uspeh, ne savršenstvo." : ""}

Goethe pristup: NE traži se savršenstvo, već KOMUNIKATIVNI USPEH. Oceni SVAKI od 4 kriterijuma ocenom 0-5:
1. ERFÜLLUNG (sadržaj/zadatak) - da li su obrađene SVE tačke zadatka i da li je obim primeren? NAJVAŽNIJI kriterijum.
   5 = sve tačke potpuno obrađene; 3 = tačke delimično obrađene ili obim znatno kraći; 1 = jedva dotaknut zadatak; 0 = zadatak promašen, tema druga ili tekst prazan/nevezan.
2. KOHÄRENZ (povezanost) - da li tekst teče, ima li logičan redosled i osnovne veznike primerene nivou?
3. WORTSCHATZ (vokabular) - da li je izbor reči razumljiv i primeren nivou i vrsti teksta (formalno/neformalno)?
4. KORREKTHEIT (gramatika/pravopis) - računaju se prvenstveno greške koje OTEŽAVAJU RAZUMEVANJE. Sitne greške koje ne ometaju komunikaciju snižavaju malo ili nimalo.

Očekivanja po nivou (greške su NORMALNE, posebno na nižim nivoima):
- A1: jednostavne rečenice i osnovni vokabular su SASVIM DOVOLJNI. Ako se poruka razume i tačke su obrađene - visoke ocene, i pored grešaka u rodu, redu reči ili pravopisu.
- A2: povezane rečenice, prošlo vreme, modalni glagoli. Greške se tolerišu ako poruka prolazi.
- B1: složenije rečenice i veznici (weil, dass, wenn...); greške koje ometaju razumevanje se računaju, ali komunikativni uspeh ostaje glavno merilo. NE zahtevaj strukture iznad nivoa (npr. Konjunktiv II nije uslov za B1).
- B2: tečan i precizan izraz, viši standard - ali ni ovde se ne traži savršenstvo.

Obim: tekst ima ${words} reči; za ${level} je uobičajeno ${expected} - OSIM ako sam zadatak izričito traži drugačije. Kraći tekst snižava samo ERFÜLLUNG (i to tek ako je znatno kraći ili tačke fale); duži tekst se NE kažnjava.

Stroga pravila:
- NE izmišljaj zahteve koje zadatak ne postavlja (broj reči, konkretne gramatičke strukture, formu koju zadatak ne traži).
- Pazi na registar SAMO ako ga zadatak jasno traži (npr. formalno pismo sa "Sie" - mešanje "du/dein" u formalnom pismu jeste greška koja se računa).
- Ispravke: NAJVIŠE 3, i to SAMO jasne greške (ne stilske preferencije); prednost greškama koje ometaju razumevanje. Na A1/A2 ne preteruj sa ispravkama.
- Feedback za polaznika: 1-2 rečenice, ohrabrujuće ali konkretno, obraćaj se sa "ti" i rodno neutralno (izbegavaj oblike koji odaju rod, npr. "uradio si" → "zadatak je ispunjen / super ti ide"). Objašnjenja ispravki: 1 rečenica.
- Feedback i objašnjenja piši na ISTOM jeziku na kom je pisano ovo uputstvo - NIKAD na nemačkom, čak i ako je zadatak na nemačkom.

Zadatak:
"""
${opts.task}
"""

Polaznik je napisao:
"""
${opts.text}
"""

Oceni rad pozivom alata oceni_schreiben.`;
}
