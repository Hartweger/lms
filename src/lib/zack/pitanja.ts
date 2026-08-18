// Iz jednog spiska reči pravi pitanja za svih pet igara prve celine.
// Ništa se ne unosi posebno po igri, sve izlazi iz iste tabele.
import { promesaj, type Rec, type Rod } from "./rec";

// „skakac" NIJE nova vrsta pitanja, nego drugi način prikaza pitanja o rodu.
// Zato ovde stoji među igrama, a dole se obrađuje isto kao „rod" i pravi pitanja
// sa `igra: "rod"`. Da je dobio svoj tip pitanja, sve što zna da radi sa rodom
// (sesija, spisak tačnih, telo igre) moralo bi da nauči još jedan slučaj.
export type Igra = "brzo-biranje" | "rod" | "skakac" | "mnozina" | "diktat" | "parovi";

/**
 * Iste igre, ali kao vrednosti. Tip `Igra` postoji samo dok se prevodi, a ruta
 * koja prima ime igre iz tela zahteva mora da proveri šta joj je stvarno stiglo.
 */
export const SVE_IGRE: readonly Igra[] = [
  "brzo-biranje",
  "rod",
  "skakac",
  "mnozina",
  "diktat",
  "parovi",
];

export function jeIgra(vrednost: unknown): vrednost is Igra {
  return typeof vrednost === "string" && (SVE_IGRE as readonly string[]).includes(vrednost);
}

/** Igre koje se hrane pitanjima o rodu, bez obzira na to kako izgledaju. */
function jeIgraRoda(igra: Igra): boolean {
  return igra === "rod" || igra === "skakac";
}

/**
 * Dokle skakač ume da se popne. NIJE dužina partije: partija se završava kad se
 * potroše srca, a ovo je samo kočnica da tok pitanja ne bude beskonačna petlja.
 * Namerno visoko - dete sa tri srca realno ne stiže dotle, pa granicu ne oseti.
 *
 * Stoji ovde, a ne u telu igre, jer istu vrednost mora da zna i ruta za rekord:
 * sprat veći od ovoga nije mogao da bude odigran.
 */
export const SPRATOVA_NAJVISE = 60;

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

/**
 * Isti spisak, u krug, dok se ne skupi traženi broj stavki.
 *
 * ZAŠTO POSTOJI: skakač se penje dok ima srca, a ne dok ima reči. Sa običnim
 * sečenjem na dužinu spiska partija bi stala na broju imenica u lekciji, pa bi
 * rekord bio taj isti broj zauvek i ne bi imao šta da se obori.
 *
 * SVAKI KRUG SE MEŠA IZNOVA, da drugi prolaz ne bude isti redosled napamet.
 * Dve iste reči jedna za drugom se ne puštaju: detetu to izgleda kao da se igra
 * zaglavila. Kad novi krug počne rečju kojom se prethodni završio, ta reč menja
 * mesto sa sledećom u tom krugu - time se ništa ne izbacuje ni ne duplira.
 *
 * Jedina reč sa kojom se to ne može izbeći je spisak od jedne stavke; tada
 * ponavljanje jeste sve što postoji.
 */
export function uKrugovima<T>(stavke: readonly T[], koliko: number, rng: () => number): T[] {
  if (stavke.length === 0 || koliko <= 0) return [];

  const tok: T[] = [];
  while (tok.length < koliko) {
    const krug = promesaj(stavke, rng);
    if (krug.length > 1 && krug[0] === tok.at(-1)) {
      [krug[0], krug[1]] = [krug[1], krug[0]];
    }
    tok.push(...krug);
  }
  return tok.slice(0, koliko);
}

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
    if (jeIgraRoda(igra)) return r.rod !== "nema";
    if (igra === "mnozina") return Boolean(r.mnozina);
    return true;
  });

  // Skakač jedini dobija tok koji se ponavlja: njegova partija ne staje na broju
  // reči nego na srcima. Ostale igre prođu spisak jednom i tu je kraj.
  const izabrane =
    igra === "skakac" ? uKrugovima(podobne, koliko, rng) : promesaj(podobne, rng).slice(0, koliko);

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
    if (jeIgraRoda(igra)) {
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
