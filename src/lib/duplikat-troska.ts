// Da isti trošak ne uđe dvaput.
//
// Trošak sada ima troja vrata: mesečno ponavljanje, stavka sa bankovnog izvoda i
// ulazna faktura sa SEF-a. Isti račun ume da stigne kroz sva troja - knjigovođa je
// u avgustu 2026. bio i ponavljanje, i stavka sa izvoda, i faktura koja čeka.
//
// Ovaj modul samo UPOZORAVA. Odluka ostaje na Nataši: uparivanje po iznosu ne može
// da bude sigurno, a tiho blokiranje bi sakrilo trošak koji stvarno postoji dvaput.

import { monthKey, type ExpenseRow } from "@/lib/finansije";

/** Koliko dana levo-desno se gleda kod jednokratnih troškova. */
const PROZOR_DANA = 35;

export interface Kandidat {
  /** Naziv dobavljača ili stavke - koristi se za poređenje po imenu. */
  naziv: string | null;
  iznos: number | null;
  datum: string | null;
}

export interface Sumnja {
  naziv: string;
  iznos: number;
  /** "mesečno ponavljanje" ili datum jednokratnog troška. */
  kako: string;
}

function danaIzmedju(a: string, b: string): number {
  const ms = Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`);
  return Number.isNaN(ms) ? Infinity : Math.abs(ms) / 86_400_000;
}

/** Isti iznos do dinara - SEF ume da pošalje 623.21 gde je knjiženo 623. */
function istiIznos(a: number, b: number): boolean {
  return Math.abs(Math.round(a) - Math.round(b)) <= 1;
}

/**
 * Reč po reč, bez kvačica i bez pravnih oblika, samo reči od 4+ slova.
 * "Knjiški moljac 2012 DOO" → ["knjiski", "moljac"]
 */
function reci(s: string): string[] {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((r) => r.length >= 4 && !["doo", "beograd", "akcionarsko", "drustvo", "srbija", "preduzece"].includes(r));
}

function istoIme(a: string, b: string): boolean {
  const ra = reci(a);
  const rb = reci(b);
  return ra.some((r) => rb.includes(r));
}

/**
 * Troškovi koji bi mogli da budu isti kao `k`. Prazan niz znači da se ništa nije poklopilo.
 *
 * Mesečno ponavljanje se javlja ako pokriva mesec kandidata I poklapa se po imenu
 * ili iznosu; jednokratni ako je istog iznosa u prozoru od 35 dana. Namerno se ne
 * traži poklapanje i imena i iznosa: knjigovođa je bio isti iznos pod drugim imenom.
 */
export function nadjiSumnje(k: Kandidat, troskovi: ExpenseRow[]): Sumnja[] {
  if (k.iznos == null || !k.datum) return [];
  const iznos = k.iznos;
  const mesec = monthKey(k.datum);
  const out: Sumnja[] = [];

  for (const e of troskovi) {
    const poIznosu = istiIznos(iznos, e.amount);
    const poImenu = !!k.naziv && istoIme(k.naziv, e.name);

    if (e.recurring) {
      const pocetak = monthKey(e.expense_date);
      const kraj = e.ended_at ? monthKey(e.ended_at) : "9999-99";
      if (mesec < pocetak || mesec > kraj) continue;
      if (poIznosu || poImenu) out.push({ naziv: e.name, iznos: e.amount, kako: "mesečno ponavljanje" });
      continue;
    }

    if (poIznosu && danaIzmedju(k.datum, e.expense_date) <= PROZOR_DANA) {
      out.push({ naziv: e.name, iznos: e.amount, kako: e.expense_date });
    }
  }

  return out;
}

/** Jedna rečenica za prikaz, ili null ako nema sumnje. */
export function upozorenje(k: Kandidat, troskovi: ExpenseRow[]): string | null {
  const s = nadjiSumnje(k, troskovi);
  if (s.length === 0) return null;
  const opis = s
    .slice(0, 3)
    .map((x) => `${x.naziv} (${Math.round(x.iznos).toLocaleString("sr-RS")} RSD, ${x.kako})`)
    .join("; ");
  const jos = s.length > 3 ? ` i još ${s.length - 3}` : "";
  return `Možda je već knjiženo: ${opis}${jos}.`;
}
