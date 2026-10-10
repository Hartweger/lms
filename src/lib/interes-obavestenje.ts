/**
 * Ko dobija obaveštenje da je termin otvoren.
 *
 * Lid nastaje kad neko na stranici kursa klikne „Obavesti me za sledeći termin"
 * (vidi `api/grupe/interes`) - zapiše se kao `crm_interactions` sa
 * `meta.tip = 'interes-za-grupu'` i `meta.nivo`. Do sada niko nije zatvarao taj
 * krug: termin se otvori, a čovek koji je ostavio mejl to ne sazna.
 *
 * Odluka je čista funkcija da bi se mogla testirati bez baze.
 */

export interface Lid {
  contactId: string;
  email: string;
  ime: string | null;
  /** Nivo iz forme - isti string kao `groups.level` ("A1.1", "Konverzacija B1+"). */
  nivo: string;
  /** Kad je ostavio mejl (ISO) - kupovina od tog dana gasi zahtev. */
  trazioAt?: string;
}

export interface OtvorenaGrupa {
  id: string;
  level: string;
  /** YYYY-MM-DD */
  startDate: string;
}

export interface Obavestenje {
  lid: Lid;
  grupa: OtvorenaGrupa;
}

/**
 * Parovi (lid, grupa) kojima treba poslati mejl.
 *
 * - samo grupe koje tek kreću (start_date >= danas) - niko ne želi poziv na
 *   kurs koji je prošle nedelje počeo
 * - jedan čovek dobija NAJRANIJU grupu svog nivoa, ne sve
 * - par koji je već obavešten se preskače (ključ `${contactId}|${groupId}`)
 * - isti mejl na dva nivoa dobija samo jedno obaveštenje po pokretanju, da se
 *   ne pretvori u dva mejla istog jutra
 * - zahtev se gasi ako je čovek istog dana ili posle njega platio kurs ili ušao
 *   u grupu: 10.10.2026 je Ana (upisana u B2.1 od 20.10 mesec ranije) dobila
 *   „termin je otvoren" za svoju grupu, jer je zahtev od 09.09 i dalje stajao
 *
 * `poslednjaKupovina`: mejl (mala slova) -> ISO poslednje plaćene porudžbine
 * ili upisa u grupu.
 */
export function zaObavestiti(
  lidovi: Lid[],
  grupe: OtvorenaGrupa[],
  vecObavesteni: Set<string>,
  danas: string,
  poslednjaKupovina: Map<string, string> = new Map(),
): Obavestenje[] {
  const poNivou = new Map<string, OtvorenaGrupa[]>();
  for (const g of grupe) {
    if (g.startDate < danas) continue;
    const lista = poNivou.get(g.level) ?? [];
    lista.push(g);
    poNivou.set(g.level, lista);
  }
  for (const lista of poNivou.values()) lista.sort((a, b) => a.startDate.localeCompare(b.startDate));

  const izabrani = new Map<string, Obavestenje>(); // po mejlu - jedan mejl po pokretanju
  for (const lid of lidovi) {
    // najranija grupa nivoa O KOJOJ OVAJ ČOVEK JOŠ NIJE OBAVEŠTEN - inače bi
    // onaj ko je čuo za oktobarsku grupu zauvek ostao bez vesti o decembarskoj
    const grupa = (poNivou.get(lid.nivo) ?? []).find(
      (g) => !vecObavesteni.has(kljuc(lid.contactId, g.id)),
    );
    if (!grupa) continue;

    const mejl = lid.email.trim().toLowerCase();
    if (!mejl.includes("@")) continue;
    if (kupioPosleZahteva(lid.trazioAt, poslednjaKupovina.get(mejl))) continue;
    const postojeci = izabrani.get(mejl);
    // ako čovek čeka dva nivoa, javi mu za onaj koji kreće pre
    if (!postojeci || grupa.startDate < postojeci.grupa.startDate) {
      izabrani.set(mejl, { lid: { ...lid, email: mejl }, grupa });
    }
  }
  return [...izabrani.values()];
}

/** Ključ para lid+grupa - isti oblik se upisuje u CRM posle slanja. */
export function kljuc(contactId: string, groupId: string): string {
  return `${contactId}|${groupId}`;
}

/**
 * Da li je kupovina/upis istog dana ili posle zahteva. Poredi se po danu, ne po
 * sekundi: ko klikne „obavesti me" pa za pola sata plati, takođe je rešen.
 * Kupovina PRE zahteva ne gasi ga - polaznik B1.1 koji traži Konverzaciju je
 * pravi lid.
 */
export function kupioPosleZahteva(trazioAt: string | undefined, kupioAt: string | undefined): boolean {
  if (!trazioAt || !kupioAt) return false;
  return kupioAt.slice(0, 10) >= trazioAt.slice(0, 10);
}
