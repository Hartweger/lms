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

/**
 * Zaštita pri sastavljanju odgovora na lid: da li je osoba već kupac i šta je kupila.
 *
 * Pouka 11.10.2026 (Nikolina Mataija): kupila je 1:1 B2.1, a tri sata kasnije joj je iz CRM-a
 * otišla preporuka grupnih kurseva. Ovde se gleda i plaćena narudžbina i važeći pristup.
 * Pristup sam nije dovoljan za sve slučajeve (kupovina na uplatnicu, pristup još nije
 * otvoren), a narudžbina sama ne vidi pristup dodeljen ručno. Ostatak stare migracije se
 * ne računa (jeAktivanKupac).
 */

/** Plaćena narudžbina starija od ovoga ne zaustavlja ponudu: pristup traje godinu dana, pa je
 *  osoba posle toga renewal lid (isto pravilo kao fazaPosleSignala za istekle kupce). */
export const KUPAC_NARUDZBINA_DANA = 365;

export interface PlacenaNarudzbina {
  order_number?: string | number | null;
  created_at: string;
  items?: unknown;
}

export interface PristupSaNaslovom extends PristupRed {
  title?: string | null;
}

export interface OpisKupca {
  /** Kada, ljudski rečeno: „11. oktobra 2026 (narudžbina 2026-646)". */
  kupio: string;
  /** Šta je kupila: nazivi kurseva, odvojeni zarezom. */
  sta: string;
}

function naslovi(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((i) => (i && typeof i === "object" ? (i as { title?: unknown }).title : null))
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim());
}

export function opisKupca(
  narudzbine: PlacenaNarudzbina[] | null | undefined,
  pristup: PristupSaNaslovom[] | null | undefined,
  formatirajDatum: (iso: string) => string,
  nowMs = Date.now(),
): OpisKupca | null {
  const granica = nowMs - KUPAC_NARUDZBINA_DANA * 24 * 3600 * 1000;
  const sveze = (narudzbine ?? [])
    .filter((n) => new Date(n.created_at).getTime() > granica)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (sveze.length > 0) {
    const poslednja = sveze[0];
    const sta = [...new Set(sveze.flatMap((n) => naslovi(n.items)))];
    const oznaka = poslednja.order_number != null && poslednja.order_number !== ""
      ? ` (narudžbina ${poslednja.order_number})` : "";
    return {
      kupio: `${formatirajDatum(poslednja.created_at)}${oznaka}`,
      sta: sta.length ? sta.join(", ") : "kurs (naziv nije zabeležen u narudžbini)",
    };
  }

  // Bez sveže narudžbine, ali sa važećim pristupom koji nije migracioni ostatak.
  if (jeAktivanKupac(pristup, nowMs)) {
    const sta = [...new Set(
      (pristup ?? [])
        .filter((a) => !jeMigracioniOstatak(a.source)
          && (a.expires_at === null || new Date(a.expires_at).getTime() > nowMs))
        .map((a) => a.title?.trim())
        .filter((t): t is string => Boolean(t)),
    )];
    return {
      kupio: "datum narudžbine nije zabeležen, ali pristup na platformi je važeći",
      sta: sta.length ? sta.join(", ") : "kurs na platformi",
    };
  }
  return null;
}
