// Čista logika obaveštenja za Gen II kanal (api/cron/gen2-push).
// Bez baze i mreže - sve što se može testirati bez okruženja živi ovde.

const ZONA = "Europe/Belgrade";

// hourCycle: "h23" umesto hour12: false - potonje u nekim ICU verzijama vraća
// "24" za ponoć, pa bi poređenje sa 22 ispalo pogrešno.
const SAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONA,
  hour: "2-digit",
  hourCycle: "h23",
});

/**
 * Tiha zona 22-07 po beogradskom vremenu. Cron u njoj ne šalje NITI pomera
 * vodostaje, pa u 7 ujutru stigne jedno obaveštenje sa svime propuštenim.
 * Intl radi konverziju zone, pa prelaz na zimsko/letnje vreme ne treba računati.
 */
export function uTihimSatima(kada: Date): boolean {
  const sat = Number(SAT.format(kada));
  return sat >= 22 || sat < 7;
}

export interface PorukaZaObavestenje {
  id: string;
  user_id: string;
  ime: string;
  tekst: string;
  created_at: string;
}

export interface Primalac {
  user_id: string;
  push_do: string;
  mejl_do: string;
  /** Poslednje čitanje kanala (chat_procitano); null = nikad. */
  last_read_at: string | null;
}

export interface Obavestenje {
  user_id: string;
  poruke: PorukaZaObavestenje[];
  /** created_at najnovije obuhvaćene poruke - nova vrednost vodostaja. */
  najnovija: string;
}

/**
 * Za svakog primaoca izdvaja tuđe poruke novije od zadatog vodostaja koje još
 * nije pročitao. Primaoci bez ijedne takve poruke se izostavljaju, pa pozivalac
 * ne mora da filtrira prazne.
 */
export function grupisiPoPrimaocu(
  poruke: PorukaZaObavestenje[],
  primaoci: Primalac[],
  vodostaj: "push_do" | "mejl_do"
): Obavestenje[] {
  const out: Obavestenje[] = [];
  for (const prima of primaoci) {
    const od = new Date(prima[vodostaj]).getTime();
    const procitanoDo = prima.last_read_at ? new Date(prima.last_read_at).getTime() : -Infinity;
    const moje = poruke.filter((m) => {
      if (m.user_id === prima.user_id) return false;
      const t = new Date(m.created_at).getTime();
      return t > od && t > procitanoDo;
    });
    if (moje.length === 0) continue;
    const najnovija = moje.reduce(
      (max, m) => (new Date(m.created_at).getTime() > new Date(max).getTime() ? m.created_at : max),
      moje[0].created_at
    );
    out.push({ user_id: prima.user_id, poruke: moje, najnovija });
  }
  return out;
}

/** Srpska množina: 1 / 2-4 / 5+, uz izuzetak 11-14 koji idu na oblik za 5+. */
export function mnozina(n: number, jedna: string, dve: string, pet: string): string {
  const desetica = n % 100;
  if (desetica >= 11 && desetica <= 14) return pet;
  const jedinica = n % 10;
  if (jedinica === 1) return jedna;
  if (jedinica >= 2 && jedinica <= 4) return dve;
  return pet;
}

function skrati(s: string, najvise: number): string {
  return s.length <= najvise ? s : s.slice(0, najvise - 1) + "…";
}

/**
 * Telo push obaveštenja. Jedna poruka ide cela (koliko stane), više njih se
 * sažima u brojač + poslednja - da se u traci obaveštenja ne ređa pet redova.
 */
export function tekstObavestenja(poruke: PorukaZaObavestenje[]): { naslov: string; telo: string } {
  const poslednja = poruke[poruke.length - 1];
  if (poruke.length === 1) {
    return { naslov: "Gen II", telo: `${poslednja.ime}: ${skrati(poslednja.tekst, 120)}` };
  }
  const rec = mnozina(poruke.length, "nova poruka", "nove poruke", "novih poruka");
  return {
    naslov: "Gen II",
    telo: `${poruke.length} ${rec} - ${poslednja.ime}: ${skrati(poslednja.tekst, 80)}`,
  };
}

/** Prag posle kog mejl-rezerva sme da krene (u minutima). */
export const MEJL_PRAG_MIN = 10;

/**
 * Mejl ide tek kad je bar jedna poruka dovoljno stara i još nepročitana - inače
 * bi Resend slao mejl za nešto što je pročitano dva minuta kasnije.
 */
export function trebaMejl(
  poruke: PorukaZaObavestenje[],
  sada: Date,
  pragMin = MEJL_PRAG_MIN
): boolean {
  return poruke.some((m) => sada.getTime() - new Date(m.created_at).getTime() >= pragMin * 60_000);
}
