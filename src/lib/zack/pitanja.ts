// Iz jednog spiska reči pravi pitanja za svih pet igara prve celine.
// Ništa se ne unosi posebno po igri, sve izlazi iz iste tabele.
import { promesaj, type Rec, type Rod } from "./rec";

export type Igra = "brzo-biranje" | "rod" | "mnozina" | "diktat" | "parovi";

export type Pitanje =
  | { igra: "brzo-biranje"; recId: string; pitanje: string; opcije: string[]; tacan: string }
  | { igra: "rod"; recId: string; imenica: string; tacan: Rod }
  | { igra: "mnozina"; recId: string; jednina: string; opcije: string[]; tacan: string }
  | { igra: "diktat"; recId: string; prevod: string; tacan: string }
  | { igra: "parovi"; parovi: { recId: string; de: string; sr: string }[] };

/**
 * Tačan odgovor plus najviše (koliko - 1) pogrešnih, promešano.
 * Pogrešni koji se poklapaju sa tačnim ili međusobno se izbacuju, jer dva ista
 * ponuđena odgovora detetu deluju kao greška u aplikaciji.
 */
export function ponudjeni(
  tacan: string,
  kandidati: readonly string[],
  koliko: number,
  rng: () => number
): string[] {
  const pogresni: string[] = [];
  for (const k of promesaj(kandidati, rng)) {
    if (k === tacan || pogresni.includes(k)) continue;
    pogresni.push(k);
    if (pogresni.length >= koliko - 1) break;
  }
  return promesaj([tacan, ...pogresni], rng);
}

const PAROVA_NAJVISE = 6;

export function napraviPitanja(
  reci: readonly Rec[],
  igra: Igra,
  koliko: number,
  rng: () => number
): Pitanje[] {
  if (reci.length === 0) return [];

  if (igra === "parovi") {
    const izabrane = promesaj(reci, rng).slice(0, Math.min(koliko, PAROVA_NAJVISE));
    return [
      {
        igra: "parovi",
        parovi: izabrane.map((r) => ({ recId: r.id, de: r.de, sr: r.sr })),
      },
    ];
  }

  const podobne = reci.filter((r) => {
    if (igra === "rod") return r.rod !== "nema";
    if (igra === "mnozina") return Boolean(r.mnozina);
    return true;
  });

  const izabrane = promesaj(podobne, rng).slice(0, koliko);

  return izabrane.map((r): Pitanje => {
    if (igra === "brzo-biranje") {
      const kandidati = reci.filter((d) => d.id !== r.id).map((d) => d.sr);
      return {
        igra: "brzo-biranje",
        recId: r.id,
        pitanje: r.de,
        opcije: ponudjeni(r.sr, kandidati, 4, rng),
        tacan: r.sr,
      };
    }
    if (igra === "rod") {
      return { igra: "rod", recId: r.id, imenica: r.de, tacan: r.rod };
    }
    if (igra === "mnozina") {
      const kandidati = reci
        .filter((d) => d.id !== r.id && d.mnozina)
        .map((d) => d.mnozina as string);
      return {
        igra: "mnozina",
        recId: r.id,
        jednina: r.de,
        opcije: ponudjeni(r.mnozina as string, kandidati, 4, rng),
        tacan: r.mnozina as string,
      };
    }
    return { igra: "diktat", recId: r.id, prevod: r.sr, tacan: r.de };
  });
}
