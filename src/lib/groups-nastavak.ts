/**
 * Čista logika za ponudu nastavka nivoa (cron grupe-podsetnik).
 *
 * Pouka 22.09.2026: A2.2 grupi (Milica, kraj 23.09) cron je 16.09 ponudio B1.1 od 19.09 sa
 * Marijom, jer je to bila jedina otvorena. Nova B1.1 sa Milicom (ista profesorka, 28.09)
 * otvorena je 22.09 - posle ponude - i niko od polaznika za nju nije čuo, jer
 * `offer_sent_at` sprečava ponovno slanje.
 */

export interface GrupaKandidat {
  id: string;
  level: string;
  status: string;
  start_date: string;
  created_at: string;
  professor_id: string | null;
}

export interface GrupaKojaSeZavrsava {
  id: string;
  end_date: string;
  professor_id: string | null;
  offer_sent_at: string | null;
  offer_resent_at: string | null;
}

/** Koliko dana pre kraja grupe sledeća sme da počne (preklapanje jedne nedelje je u redu). */
const PREKLAPANJE_DANA = 7;
/** Do kada posle kraja grupe još ima smisla slati ponovnu ponudu. */
const ROK_POSLE_KRAJA_DANA = 14;

function plusDana(iso: string, d: number): string {
  const x = new Date(iso + "T00:00:00Z");
  x.setUTCDate(x.getUTCDate() + d);
  return x.toISOString().slice(0, 10);
}

/**
 * Među otvorenim grupama sledećeg nivoa bira onu za prvu ponudu:
 * prednost ima grupa iste profesorke, pa najraniji start.
 */
export function izaberiSledecu<T extends GrupaKandidat>(kandidati: T[], professorId: string | null): T | null {
  const otvorene = kandidati.filter((k) => k.status === "otvoren").sort((a, b) => a.start_date.localeCompare(b.start_date));
  if (!otvorene.length) return null;
  if (professorId) {
    const ista = otvorene.find((k) => k.professor_id === professorId);
    if (ista) return ista;
  }
  return otvorene[0];
}

/**
 * Da li grupi koja se završava treba PONOVNA ponuda nastavka, i za koju novu grupu.
 * Uslovi: prva ponuda već poslata, ponovna nije; još smo u roku posle kraja; postoji
 * otvorena grupa sledećeg nivoa SA ISTOM PROFESORKOM, otvorena POSLE prve ponude,
 * koja kreće najranije nedelju dana pre kraja tekuće.
 */
export function novaGrupaZaPonovnuPonudu<T extends GrupaKandidat>(
  g: GrupaKojaSeZavrsava,
  kandidati: T[],
  todayIso: string,
): T | null {
  if (!g.offer_sent_at || g.offer_resent_at) return null;
  if (!g.professor_id) return null;
  if (todayIso > plusDana(g.end_date, ROK_POSLE_KRAJA_DANA)) return null;
  const najranijiStart = plusDana(g.end_date, -PREKLAPANJE_DANA);
  const nove = kandidati
    .filter((k) => k.status === "otvoren")
    .filter((k) => k.professor_id === g.professor_id)
    .filter((k) => k.created_at > g.offer_sent_at!)
    .filter((k) => k.start_date >= najranijiStart)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  return nove[0] ?? null;
}
