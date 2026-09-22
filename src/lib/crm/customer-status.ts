/**
 * Ko se u CRM-u vodi kao „aktivan kupac" (faza „upisan", arhiva), a ko kao lid.
 *
 * Pouka 22.09.2026: Milica Živanović je tražila B1.1 termin preko forme, a CRM ju je
 * sakrio u arhivu „upisan" jer joj je ostao migrirani „Kurs konverzacije" iz LearnDash-a
 * (ld-migracija) sa istekom za dve nedelje. Takav ostatak stare migracije nije kupovina
 * na novoj platformi i ne sme da je vodi kao kupca.
 */

/** Izvori pristupa koji su ostatak stare migracije, ne kupovina na novoj platformi. */
const MIGRACIONI_OSTATAK = /^(ld-migracija|gramatika-migracija|pilot-)/i;

export function jeMigracioniOstatak(source: string | null | undefined): boolean {
  return MIGRACIONI_OSTATAK.test((source ?? "").trim());
}

export interface PristupRed {
  expires_at: string | null;
  source?: string | null;
}

/** Ima bar jedan važeći pristup koji NIJE ostatak stare migracije. */
export function jeAktivanKupac(rows: PristupRed[] | null | undefined, nowMs = Date.now()): boolean {
  return (rows ?? []).some((a) => {
    if (jeMigracioniOstatak(a.source)) return false;
    return a.expires_at === null || new Date(a.expires_at).getTime() > nowMs;
  });
}

/**
 * Nova faza za POSTOJEĆI kontakt posle dolaznog signala. Vraća null kad fazu ne treba dirati.
 * - aktivan kupac → „upisan" (odluka 14.06.2026: CRM je prodajni levak, ne baza polaznika)
 * - arhiviran kao „upisan", a nije više aktivan kupac → vraća se u levak kao „nov"
 *   (istekli kupci su renewal lidovi)
 * - arhiviran kao „upisan", a javio se preko forme na sajtu → „nov" bez obzira na pristup;
 *   ko popuni formu za termin/kontakt, izričito traži nešto novo
 */
export function fazaPosleSignala(
  trenutnaFaza: string | null | undefined,
  aktivanKupac: boolean,
  izvorSignala: string,
): "upisan" | "nov" | null {
  if (trenutnaFaza === "upisan") {
    if (izvorSignala === "kontakt-forma") return "nov";
    if (!aktivanKupac) return "nov";
    return null;
  }
  if (aktivanKupac) return "upisan";
  return null;
}

/** Faza za NOV kontakt. */
export function pocetnaFaza(aktivanKupac: boolean, izvorSignala: string): "upisan" | "nov" {
  if (izvorSignala === "kontakt-forma") return "nov";
  return aktivanKupac ? "upisan" : "nov";
}
