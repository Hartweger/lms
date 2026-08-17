/**
 * Grupisanje podsetnika o isteku pristupa: JEDAN mejl po polazniku i danu isteka.
 *
 * Zašto: pristup se vodi po sadržajnom kursu, pa ko je kupio paket od 6 nivoa ima 6
 * redova u `course_access` sa istim `expires_at`. Slanje po redu je 13.08.2026. jednoj
 * polaznici poslalo 6 identičnih mejlova u razmaku od 5 sekundi. Dedup u bazi
 * (`expiry_reminders`) ostaje po redu - grupiše se samo slanje.
 */

export interface ExpiryRow {
  user_id: string;
  course_id: string;
  expires_at: string;
}

export interface ExpiryGroup<T extends ExpiryRow = ExpiryRow> {
  userId: string;
  /** Najraniji istek u grupi - taj datum ide u mejl. */
  expiresAt: string;
  rows: T[];
}

/** Dan isteka (UTC) - isti ključ koji mejl prikazuje kao datum. */
function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/**
 * Grupiše redove po (polaznik, dan isteka). Redosled grupa prati redosled prvog
 * pojavljivanja, a redovi unutar grupe ostaju u ulaznom redosledu - da batch
 * (`MAX_PER_RUN`) bude predvidiv između pokretanja.
 */
export function groupExpiryRows<T extends ExpiryRow>(rows: T[]): ExpiryGroup<T>[] {
  const groups = new Map<string, ExpiryGroup<T>>();
  for (const r of rows) {
    const key = `${r.user_id}|${dayKey(r.expires_at)}`;
    const g = groups.get(key);
    if (!g) {
      groups.set(key, { userId: r.user_id, expiresAt: r.expires_at, rows: [r] });
      continue;
    }
    g.rows.push(r);
    if (new Date(r.expires_at) < new Date(g.expiresAt)) g.expiresAt = r.expires_at;
  }
  return [...groups.values()];
}
