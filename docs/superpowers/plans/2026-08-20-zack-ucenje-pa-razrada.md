# zack! „učenje pa razrada" + igre iz rečenica - plan izrade

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Svaka zack! lekcija dobija fazu učenja (reči pa rečenice) pre vežbi, plus dve nove rečenične igre (slagalica reda reči i dopuna), sa ~120 rečenica za 5. razred.

**Architecture:** Nova tabela `zack_recenice` hrani sve tri rečenične stavke iz istog zapisa; faze učenja ne uvode nove vrste pitanja nego blaži režim postojećih. Nagrade i greške idu preko glavne reči (`rec_id`), pa kesica, album i ponavljanje rade bez izmena. Dva mirna katanca: učenje reči otključava vežbe, učenje rečenica otključava slagalicu i dopunu; prolaz se pamti u `zack_ucenje_prolazi`.

**Tech Stack:** Next.js (App Router) + Supabase (service-role kroz /api/zack/*) + vitest. Repo: `sajt/LMS/lms`, trunk-based na `main`. **Push na main = produkcija - ne push-ovati bez Natašine najave.**

**Spec:** `docs/superpowers/specs/2026-08-20-zack-ucenje-pa-razrada-design.md`

**Vrhovna pravila koja svaki task mora da poštuje** (iz memorije projekta):
- Detetu se NIKAD ne oduzima zarađeno; pokvaren podatak pada u korist deteta.
- Nema prekora nigde; greška u igri = „Ups!" + odmah tačan odgovor.
- Obraćanje bez roda (sadašnje vreme ili preko imenice).
- Slika nikad u pitanju.
- Napredak se šalje ODMAH posle svakog tačnog odgovora (pošalji-i-zaboravi) + JOŠ JEDNOM na kraju partije uz čekanje (idempotentna ruta).
- PRVO SQL, PA DEPLOY.

---

## Task 1: SQL migracija - `zack_recenice` + `zack_ucenje_prolazi`

**Files:**
- Create: `supabase/migrations/094_zack_recenice.sql`

- [ ] **Step 1: Napiši migraciju**

```sql
-- Igre iz rečenica + faza učenja (spec 2026-08-20-zack-ucenje-pa-razrada).
--
-- zack_recenice: jedan zapis hrani SVE TRI rečenične stavke (učenje rečenica,
-- slagalicu i dopunu) - ništa se ne unosi posebno po igri, kao i kod reči.
-- rec_id je „glavna reč": na nju se knjiže tačno (zaradi) i greška, pa kesica,
-- album i ponavljanje rade bez ijedne izmene.
--
-- PAZI: rec_id ima ON DELETE CASCADE - brisanje reči iz lekcije nosi i njene
-- rečenice. To je ispravno (rečenica bez glavne reči nema na šta da knjiži),
-- ali admin upis reči sa brisanjem treba da zna da uz reč odlaze i rečenice.
--
-- zack_ucenje_prolazi: da je dete JEDNOM prošlo fazu učenja (reči odnosno
-- rečenice) na lekciji. Otključava vežbe. Red se samo dodaje, nikad ne briše -
-- nestanak reda bi zaključao vežbe, a kvar uvek pada u korist deteta.

CREATE TABLE public.zack_recenice (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lekcija_id  UUID NOT NULL REFERENCES public.zack_lekcije(id) ON DELETE CASCADE,
  redni_broj  SMALLINT NOT NULL CHECK (redni_broj > 0),
  de          TEXT NOT NULL,
  sr          TEXT NOT NULL,
  praznina    TEXT NOT NULL,
  distraktori JSONB NOT NULL,
  rec_id      UUID NOT NULL REFERENCES public.zack_reci(id) ON DELETE CASCADE,
  samo_dopuna BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (lekcija_id, redni_broj),
  -- Ključ ponovnog upisa, kao (lekcija_id, de) kod reči.
  UNIQUE (lekcija_id, de)
);

CREATE INDEX idx_zack_recenice_lekcija ON public.zack_recenice(lekcija_id);

CREATE TABLE public.zack_ucenje_prolazi (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dete_id    UUID NOT NULL REFERENCES public.zack_deca(id) ON DELETE CASCADE,
  lekcija_id UUID NOT NULL REFERENCES public.zack_lekcije(id) ON DELETE CASCADE,
  faza       TEXT NOT NULL CHECK (faza IN ('reci', 'recenice')),
  prosao_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dete_id, lekcija_id, faza)
);

CREATE INDEX idx_zack_ucenje_prolazi_dete ON public.zack_ucenje_prolazi(dete_id);

-- RLS potpuno zatvoren kao na svim zack_* tabelama: dečji deo čita isključivo
-- kroz /api/zack/* rute service-role klijentom.
ALTER TABLE public.zack_recenice       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zack_ucenje_prolazi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage zack_recenice" ON public.zack_recenice
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins manage zack_ucenje_prolazi" ON public.zack_ucenje_prolazi
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- DROP TABLE public.zack_ucenje_prolazi, public.zack_recenice;
```

- [ ] **Step 2: Primeni migraciju na Supabase (rzmyglynjcygsbicssbt)**

Kroz Supabase MCP `apply_migration` (ime: `094_zack_recenice`), sa sadržajem gore. PRVO SQL, PA DEPLOY - kod koji čita ove tabele ne sme na produkciju pre njih (naučena lekcija sa course_unlocks).

- [ ] **Step 3: Proveri da tabele postoje**

Kroz Supabase MCP `execute_sql`:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('zack_recenice', 'zack_ucenje_prolazi');
```
Očekivano: oba reda.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/094_zack_recenice.sql
git commit -m "feat(zack): tabele za rečenice i prolaz učenja (094)"
```

---

## Task 2: `lib/zack/recenice.ts` - čista logika rečeničnih igara

**Files:**
- Create: `src/lib/zack/recenice.ts`
- Test: `src/lib/zack/recenice.test.ts`
- Modify: `src/lib/zack/pitanja.ts` (proširenje `Igra` i `Pitanje`)

Odluke koje ovaj task sprovodi (iz spec-a):
- Pločica = reč rečenice; završni znak (`.`, `!`, `?`) van pločica.
- Prva reč malim slovom na pločici, OSIM imenica (iz spiska reči) i imena iz
  malog ugrađenog spiska - da veliko slovo ne oda rešenje. Pogrešna procena
  pada u korist deteta (samo lakši nagoveštaj), nikad ne kvari igru.
- Provera slaganja poredi TEKST pločica po redosledu (prva pozicija bez obzira
  na veliko/malo slovo), ne indekse - dve iste pločice („die … die") su
  ravnopravne i dete ne sme da bude kažnjeno što je uzelo „pogrešnu" od dve iste.
- Dopuna: praznina se prikazuje kao tačno 6 crta (postojeća konvencija).

- [ ] **Step 1: Proširi `Igra` i `Pitanje` u `src/lib/zack/pitanja.ts`**

U `pitanja.ts` zameni postojeći tip `Igra` i `SVE_IGRE`:

```ts
export type Igra =
  | "brzo-biranje"
  | "rod"
  | "skakac"
  | "mnozina"
  | "diktat"
  | "parovi"
  // Rečenični blok. „ucenje-reci" i „ucenje-recenica" NISU nove vrste pitanja
  // nego blaži režimi prikaza (kao skakač prema rodu): učenje reči koristi
  // pitanja brzog biranja, učenje rečenica pitanja slagalice.
  | "ucenje-reci"
  | "ucenje-recenica"
  | "slagalica"
  | "dopuna";

export const SVE_IGRE: readonly Igra[] = [
  "brzo-biranje",
  "rod",
  "skakac",
  "mnozina",
  "diktat",
  "parovi",
  "ucenje-reci",
  "ucenje-recenica",
  "slagalica",
  "dopuna",
];
```

i dodaj dve varijante u `Pitanje` (posle `parovi` varijante):

```ts
export type Pitanje =
  | { igra: "brzo-biranje"; recId: string; pitanje: string; opcije: string[]; tacan: string }
  | { igra: "rod"; recId: string; imenica: string; tacan: Rod }
  | { igra: "mnozina"; recId: string; jednina: string; opcije: string[]; tacan: string }
  | { igra: "diktat"; recId: string; prevod: string; tacan: string }
  | { igra: "parovi"; parovi: { recId: string; de: string; sr: string }[] }
  // Rečenična pitanja pravi lib/zack/recenice.ts; ovde su samo zbog
  // zajedničke sesije (srca, tačni, tok) i zajedničke ljuske igre.
  | {
      igra: "slagalica";
      recenicaId: string;
      recId: string;
      /** Izmešani prikazni oblici pločica (prva reč po pravilu malog slova). */
      plocice: string[];
      /** Reči rečenice u tačnom redosledu, originalnim zapisom. */
      tacan: string[];
      /** Završni znak: ., ! ili ? - stoji van pločica. */
      znak: string;
      prevod: string;
    }
  | {
      igra: "dopuna";
      recenicaId: string;
      recId: string;
      /** Cela rečenica sa tačno 6 crta umesto izvađenog oblika. */
      saPrazninom: string;
      opcije: string[];
      tacan: string;
      prevod: string;
    };
```

`podobnaZaIgru` i `napraviPitanja` se NE menjaju: rečenična pitanja ne idu kroz
njih. `tacniRecIdovi` u `sesija.ts` već radi (nove varijante imaju `recId`).

- [ ] **Step 2: Napiši padajuće testove za `recenice.ts`**

`src/lib/zack/recenice.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { Rec } from "./rec";
import {
  rastaviRecenicu,
  prikazPlocica,
  proveriSlaganje,
  napraviPitanjaRecenica,
  PRAZNINA_PRIKAZ,
  type Recenica,
} from "./recenice";

/** Deterministički rng za testove, isti obrazac kao u pitanja.test.ts. */
function rngNiz(vrednosti: number[]): () => number {
  let i = 0;
  return () => vrednosti[i++ % vrednosti.length];
}

const rec = (delovi: Partial<Rec>): Rec => ({
  id: "r1",
  redni_broj: 1,
  de: "Hund",
  sr: "pas",
  rod: "der",
  mnozina: "die Hunde",
  vrsta: "imenica",
  izuzetak: false,
  ...delovi,
});

const recenica = (delovi: Partial<Recenica>): Recenica => ({
  id: "s1",
  redni_broj: 1,
  de: "Ich komme aus Serbien.",
  sr: "Dolazim iz Srbije.",
  praznina: "komme",
  distraktori: ["kommst", "kommt", "kommen"],
  rec_id: "r1",
  samo_dopuna: false,
  ...delovi,
});

describe("rastaviRecenicu", () => {
  it("odvaja završni znak od pločica", () => {
    expect(rastaviRecenicu("Mach das Buch auf!")).toEqual({
      reci: ["Mach", "das", "Buch", "auf"],
      znak: "!",
    });
  });

  it("rečenica bez znaka dobija tačku", () => {
    expect(rastaviRecenicu("Ich komme aus Serbien")).toEqual({
      reci: ["Ich", "komme", "aus", "Serbien"],
      znak: ".",
    });
  });

  it("višak razmaka ne pravi prazne pločice", () => {
    expect(rastaviRecenicu("  Wie  geht's?  ").reci).toEqual(["Wie", "geht's"]);
  });
});

describe("prikazPlocica", () => {
  const pool = [rec({ de: "Buch", vrsta: "imenica" }), rec({ id: "r2", de: "machen", vrsta: "glagol" })];

  it("prva reč ide malim slovom da ne oda rešenje", () => {
    expect(prikazPlocica(["Mach", "das", "Buch"], pool)).toEqual(["mach", "das", "Buch"]);
  });

  it("imenica na prvom mestu zadržava veliko slovo", () => {
    expect(prikazPlocica(["Buch", "und", "Heft"], pool)[0]).toBe("Buch");
  });

  it("ime iz ugrađenog spiska zadržava veliko slovo", () => {
    expect(prikazPlocica(["Anna", "ist", "nett"], pool)[0]).toBe("Anna");
  });

  it("reči posle prve se ne diraju", () => {
    expect(prikazPlocica(["Wo", "wohnst", "du"], pool)).toEqual(["wo", "wohnst", "du"]);
  });
});

describe("proveriSlaganje", () => {
  const tacan = ["Mach", "das", "Buch", "auf"];

  it("prihvata tačan redosled bez obzira na malo slovo prve pločice", () => {
    expect(proveriSlaganje(["mach", "das", "Buch", "auf"], tacan)).toBe(true);
  });

  it("odbija pogrešan redosled", () => {
    expect(proveriSlaganje(["das", "mach", "Buch", "auf"], tacan)).toBe(false);
  });

  it("dve iste pločice su ravnopravne (poredi se tekst, ne identitet)", () => {
    expect(proveriSlaganje(["die", "Frau", "und", "die", "Katze"], ["die", "Frau", "und", "die", "Katze"])).toBe(true);
  });

  it("nepotpun niz nije tačan", () => {
    expect(proveriSlaganje(["mach", "das"], tacan)).toBe(false);
  });
});

describe("napraviPitanjaRecenica - slagalica", () => {
  it("preskače rečenice označene samo_dopuna", () => {
    const p = napraviPitanjaRecenica(
      [recenica({ samo_dopuna: true })],
      "slagalica",
      5,
      rngNiz([0.1, 0.5, 0.9]),
      []
    );
    expect(p).toEqual([]);
  });

  it("pločice su permutacija reči i nikad tačan redosled iz prve", () => {
    const p = napraviPitanjaRecenica([recenica({})], "slagalica", 1, rngNiz([0, 0, 0, 0]), []);
    expect(p).toHaveLength(1);
    if (p[0].igra !== "slagalica") throw new Error("očekivana slagalica");
    expect([...p[0].plocice].sort()).toEqual(["aus", "ich", "komme", "Serbien"].sort());
    expect(p[0].plocice.map((x) => x.toLowerCase())).not.toEqual(
      p[0].tacan.map((x) => x.toLowerCase())
    );
    expect(p[0].znak).toBe(".");
    expect(p[0].recId).toBe("r1");
  });
});

describe("napraviPitanjaRecenica - dopuna", () => {
  it("pravi prazninu od tačno 6 crta i nudi 4 opcije", () => {
    const p = napraviPitanjaRecenica([recenica({})], "dopuna", 1, rngNiz([0.3, 0.7, 0.2]), []);
    expect(p).toHaveLength(1);
    if (p[0].igra !== "dopuna") throw new Error("očekivana dopuna");
    expect(p[0].saPrazninom).toBe(`Ich ${PRAZNINA_PRIKAZ} aus Serbien.`);
    expect(p[0].opcije).toHaveLength(4);
    expect(p[0].opcije).toContain("komme");
    expect(p[0].tacan).toBe("komme");
    expect(p[0].prevod).toBe("Dolazim iz Srbije.");
  });

  it("rečenicu čija se praznina ne javlja tačno jednom preskače (pada u korist deteta)", () => {
    const p = napraviPitanjaRecenica(
      [recenica({ de: "Komm, komm her!", praznina: "komm" })],
      "dopuna",
      5,
      rngNiz([0.5]),
      []
    );
    expect(p).toEqual([]);
  });

  it("samo_dopuna rečenice ulaze u dopunu", () => {
    const p = napraviPitanjaRecenica([recenica({ samo_dopuna: true })], "dopuna", 5, rngNiz([0.5]), []);
    expect(p).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Pokreni testove - moraju da PADNU**

```bash
npm test -- recenice
```
Očekivano: FAIL (modul ne postoji).

- [ ] **Step 4: Napiši `src/lib/zack/recenice.ts`**

```ts
// Rečenične igre: iz jednog zapisa rečenice se prave pitanja i za slagalicu
// i za dopunu (i za učenje rečenica, koje je blaži prikaz slagalice).
// Ista filozofija kao pitanja.ts: čiste funkcije, ubrizgan rng, bez mreže.
import { ponudjeni, type Pitanje } from "./pitanja";
import { promesaj, type Rec } from "./rec";

export type Recenica = {
  id: string;
  redni_broj: number;
  /** Cela nemačka rečenica, sa završnim znakom. */
  de: string;
  sr: string;
  /** Oblik koji se vadi za dopunu; mora se javiti tačno jednom u `de`. */
  praznina: string;
  distraktori: string[];
  /** Glavna reč - na nju se knjiže tačno i greška. */
  rec_id: string;
  /** Rečenice sa više ispravnih redosleda ne ulaze u slagalicu. */
  samo_dopuna: boolean;
};

/** Prikaz praznine: tačno 6 crta, postojeća konvencija projekta. */
export const PRAZNINA_PRIKAZ = "______";

/** Koliko pločica sme da ima slagalica. Van toga rečenica ide samo u dopunu. */
export const PLOCICA_NAJMANJE = 3;
export const PLOCICA_NAJVISE = 6;

/**
 * Imena i oslovljavanja koja na pločici zadržavaju veliko slovo i kad su prva
 * reč rečenice. Spisak namerno mali i vezan za naš korpus rečenica (imena iz
 * primera Pravilnika); test sadržaja (Task 12) proverava da je svaka velika
 * prva reč korpusa ili imenica lekcije ili odavde. Pogrešna procena samo
 * ostavi veliko slovo - lakši nagoveštaj, nikad pokvarena igra.
 */
export const VELIKA_UVEK: ReadonlySet<string> = new Set([
  "Sie", "Ihnen", "Frau", "Herr",
  "Anna", "Petra", "Markus", "Lina", "Maria", "Barbara", "Mimi", "Novak",
  "Serbien", "Deutschland", "Österreich", "Bonn", "Berlin", "Belgrad",
  "Niš", "Smederevo",
]);

/**
 * Rečenica bez završnog znaka + znak. Rečenica bez znaka dobija tačku, da
 * prikaz kraja ne zavisi od toga da li je autor otkucao znak.
 */
export function rastaviRecenicu(de: string): { reci: string[]; znak: string } {
  const sredjeno = de.trim().replace(/\s+/g, " ");
  const poklapanje = sredjeno.match(/([.!?]+)$/);
  const znak = poklapanje ? poklapanje[1] : ".";
  const bezZnaka = poklapanje ? sredjeno.slice(0, -poklapanje[1].length).trim() : sredjeno;
  return { reci: bezZnaka.length === 0 ? [] : bezZnaka.split(" "), znak };
}

/**
 * Prikazni oblici pločica: prva reč rečenice ide malim slovom, da veliko slovo
 * ne oda rešenje (kod imperativa bi „Mach" odalo poentu). Veliko slovo
 * zadržavaju imenice (nemačke imenice ga ionako nose) i imena iz VELIKA_UVEK.
 * `pool` su reči iz kojih je rečenica sastavljena (lekcija + stare).
 */
export function prikazPlocica(reci: readonly string[], pool: readonly Rec[]): string[] {
  return reci.map((r, i) => {
    if (i > 0) return r;
    if (VELIKA_UVEK.has(r)) return r;
    const jeImenica = pool.some(
      (p) => p.vrsta === "imenica" && p.de.toLocaleLowerCase("de") === r.toLocaleLowerCase("de")
    );
    return jeImenica ? r : r.toLocaleLowerCase("de");
  });
}

/**
 * Da li su pločice složene tačno. Poredi se TEKST po redosledu, ne identitet
 * pločice: dve iste pločice su ravnopravne. Veliko/malo slovo se ne razlikuje,
 * jer je prva pločica namerno prikazana malim slovom.
 */
export function proveriSlaganje(slozeno: readonly string[], tacan: readonly string[]): boolean {
  if (slozeno.length !== tacan.length) return false;
  return slozeno.every(
    (s, i) => s.toLocaleLowerCase("de") === tacan[i].toLocaleLowerCase("de")
  );
}

/** Broj pojavljivanja `oblik` kao cele reči u rečenici. */
function brojPojavljivanja(de: string, oblik: string): number {
  const { reci } = rastaviRecenicu(de);
  const trazeni = oblik.toLocaleLowerCase("de");
  return reci.filter((r) => r.toLocaleLowerCase("de") === trazeni).length;
}

/** Da li rečenica sme u slagalicu (i u učenje rečenica, koje je isti mehanizam). */
export function podobnaZaSlagalicu(r: Recenica): boolean {
  if (r.samo_dopuna) return false;
  const { reci } = rastaviRecenicu(r.de);
  return reci.length >= PLOCICA_NAJMANJE && reci.length <= PLOCICA_NAJVISE;
}

/** Da li rečenica sme u dopunu: praznina mora da se javi tačno jednom. */
export function podobnaZaDopunu(r: Recenica): boolean {
  return brojPojavljivanja(r.de, r.praznina) === 1;
}

/** Mešanje pločica koje nikad ne vrati tačan redosled (osim niza od jedne). */
function promesajPlocice(prikaz: readonly string[], rng: () => number): string[] {
  if (prikaz.length <= 1) return [...prikaz];
  let izmesano = promesaj(prikaz, rng);
  if (izmesano.every((x, i) => x === prikaz[i])) {
    izmesano = [...izmesano];
    [izmesano[0], izmesano[1]] = [izmesano[1], izmesano[0]];
  }
  return izmesano;
}

/**
 * Pitanja za jednu rečeničnu igru. `pool` su reči (lekcija + stare) za pravilo
 * velikog slova; dopuna vadi pogrešne odgovore iz sopstvenih distraktora, pa
 * joj pool ne treba.
 *
 * Nepodobne rečenice se TIHO preskaču (kao pokvareni redovi u gramatici):
 * pokvaren zapis ne sme da stigne do deteta, a partija se pravi od ostalih.
 */
export function napraviPitanjaRecenica(
  recenice: readonly Recenica[],
  igra: "slagalica" | "dopuna",
  koliko: number,
  rng: () => number,
  pool: readonly Rec[]
): Pitanje[] {
  if (recenice.length === 0 || koliko <= 0) return [];

  if (igra === "slagalica") {
    const podobne = recenice.filter(podobnaZaSlagalicu);
    return promesaj(podobne, rng)
      .slice(0, koliko)
      .map((r): Pitanje => {
        const { reci, znak } = rastaviRecenicu(r.de);
        const prikaz = prikazPlocica(reci, pool);
        return {
          igra: "slagalica",
          recenicaId: r.id,
          recId: r.rec_id,
          plocice: promesajPlocice(prikaz, rng),
          tacan: reci,
          znak,
          prevod: r.sr,
        };
      });
  }

  const podobne = recenice.filter(podobnaZaDopunu);
  return promesaj(podobne, rng)
    .slice(0, koliko)
    .map((r): Pitanje => {
      const { reci, znak } = rastaviRecenicu(r.de);
      const trazeni = r.praznina.toLocaleLowerCase("de");
      const saPrazninom =
        reci.map((x) => (x.toLocaleLowerCase("de") === trazeni ? PRAZNINA_PRIKAZ : x)).join(" ") +
        znak;
      return {
        igra: "dopuna",
        recenicaId: r.id,
        recId: r.rec_id,
        saPrazninom,
        opcije: ponudjeni(r.praznina, r.distraktori, 4, rng),
        tacan: r.praznina,
        prevod: r.sr,
      };
    });
}
```

- [ ] **Step 5: Pokreni testove - moraju da PROĐU**

```bash
npm test -- recenice
```
Očekivano: PASS. Pokreni i ceo paket da proširenje `Igra`/`Pitanje` nije ništa slomilo:
```bash
npm test && ./node_modules/.bin/tsc --noEmit
```
(Pravi tsc je `./node_modules/.bin/tsc` - naučena lekcija.)

Napomena: proširenje `Igra` tipa tera `NAZIVI` (Record<VrstaIgre, string>) u
`Igra.tsx` da dobije nove ključeve - dodaj ih odmah da tsc prođe:

```ts
export const NAZIVI: Record<VrstaIgre, string> = {
  "brzo-biranje": "Brzo biranje",
  rod: "Der, die ili das",
  skakac: "Der-Die-Das skakač",
  mnozina: "Množina",
  diktat: "Diktat",
  parovi: "Parovi",
  "ucenje-reci": "Nauči reči",
  "ucenje-recenica": "Nauči rečenice",
  slagalica: "Složi rečenicu",
  dopuna: "Dopuni rečenicu",
};
```
(`VINJETA` u LekcijaClient.tsx je takođe Record po `VrstaIgre` - ako tsc
zatraži, dodaj privremeno `VinjetaOlovka` za nove ključeve; prave vinjete
stižu u Tasku 8.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/zack/recenice.ts src/lib/zack/recenice.test.ts src/lib/zack/pitanja.ts src/components/zack/Igra.tsx src/app/zack/\[childId\]/lekcija/\[broj\]/LekcijaClient.tsx
git commit -m "feat(zack): logika rečeničnih pitanja (slagalica, dopuna)"
```

---

## Task 3: `lib/zack/ucenje.ts` - grupe kartica i mini provera

**Files:**
- Create: `src/lib/zack/ucenje.ts`
- Test: `src/lib/zack/ucenje.test.ts`

- [ ] **Step 1: Napiši padajuće testove**

`src/lib/zack/ucenje.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { Rec } from "./rec";
import { napraviGrupe, miniProvera, GRUPA_NAJVISE } from "./ucenje";

function rngNiz(vrednosti: number[]): () => number {
  let i = 0;
  return () => vrednosti[i++ % vrednosti.length];
}

const rec = (id: string, redni: number): Rec => ({
  id,
  redni_broj: redni,
  de: `Wort${redni}`,
  sr: `reč${redni}`,
  rod: "das",
  mnozina: null,
  vrsta: "imenica",
  izuzetak: false,
});

const spisak = (n: number) => Array.from({ length: n }, (_, i) => rec(`r${i + 1}`, i + 1));

describe("napraviGrupe", () => {
  it("čuva didaktički redosled (redni_broj), ne meša", () => {
    const grupe = napraviGrupe(spisak(12));
    expect(grupe.flat().map((r) => r.redni_broj)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("nijedna grupa nije veća od GRUPA_NAJVISE", () => {
    for (const n of [1, 5, 6, 7, 13, 26, 31]) {
      for (const g of napraviGrupe(spisak(n))) {
        expect(g.length).toBeLessThanOrEqual(GRUPA_NAJVISE);
        expect(g.length).toBeGreaterThan(0);
      }
    }
  });

  it("grupe su ujednačene: 7 reči daje 4+3, ne 6+1", () => {
    expect(napraviGrupe(spisak(7)).map((g) => g.length)).toEqual([4, 3]);
  });

  it("prazan spisak daje prazan niz grupa", () => {
    expect(napraviGrupe([])).toEqual([]);
  });
});

describe("miniProvera", () => {
  it("pravi najviše 3 pitanja brzog biranja iz reči grupe", () => {
    const sve = spisak(12);
    const grupa = sve.slice(0, 6);
    const pitanja = miniProvera(grupa, sve, rngNiz([0.2, 0.5, 0.8, 0.1]));
    expect(pitanja).toHaveLength(3);
    for (const p of pitanja) {
      expect(p.igra).toBe("brzo-biranje");
      if (p.igra === "brzo-biranje") {
        expect(grupa.some((r) => r.id === p.recId)).toBe(true);
      }
    }
  });

  it("grupa od jedne reči daje jedno pitanje", () => {
    const sve = spisak(5);
    expect(miniProvera(sve.slice(0, 1), sve, rngNiz([0.5]))).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Pokreni - FAIL**

```bash
npm test -- ucenje
```

- [ ] **Step 3: Napiši `src/lib/zack/ucenje.ts`**

```ts
// Faza učenja reči: kartice u malim grupama, posle svake grupe kratka provera.
// Bez srca i bez upisa grešaka - uči se rukama, greška ovde nije podatak.
import { napraviPitanja, type Pitanje } from "./pitanja";
import type { Rec } from "./rec";

/** Najviše kartica u jednoj grupi. Preko toga učenje postaje čitanje. */
export const GRUPA_NAJVISE = 6;

/** Koliko pitanja nosi mini provera jedne grupe. */
export const PROVERA_PITANJA = 3;

/**
 * Reči lekcije u grupama za učenje. Redosled se NE meša: redni_broj je
 * didaktički redosled koji je autor lekcije odredio. Grupe su ujednačene
 * (7 reči je 4+3, ne 6+1), da poslednja grupa ne bude patrljak.
 */
export function napraviGrupe(reci: readonly Rec[]): Rec[][] {
  if (reci.length === 0) return [];
  const poRedu = [...reci].sort((a, b) => a.redni_broj - b.redni_broj);
  const brojGrupa = Math.ceil(poRedu.length / GRUPA_NAJVISE);
  const osnovna = Math.ceil(poRedu.length / brojGrupa);

  const grupe: Rec[][] = [];
  for (let i = 0; i < poRedu.length; i += osnovna) {
    grupe.push(poRedu.slice(i, i + osnovna));
  }
  return grupe;
}

/**
 * Mini provera grupe: pitanja brzog biranja o UPRAVO viđenim rečima, sa
 * pogrešnim odgovorima iz cele lekcije, da izbor ne bude prozirno mali.
 * Nije nova vrsta pitanja - isti tip pokreće i pravu igru brzog biranja.
 */
export function miniProvera(
  grupa: readonly Rec[],
  pool: readonly Rec[],
  rng: () => number
): Pitanje[] {
  return napraviPitanja(grupa, "brzo-biranje", Math.min(PROVERA_PITANJA, grupa.length), rng, pool);
}
```

- [ ] **Step 4: Pokreni - PASS**

```bash
npm test -- ucenje
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/zack/ucenje.ts src/lib/zack/ucenje.test.ts
git commit -m "feat(zack): grupe kartica i mini provera za učenje reči"
```

---

## Task 4: `lib/zack/recenica-upis.ts` - provera spiska rečenica pri upisu

**Files:**
- Create: `src/lib/zack/recenica-upis.ts`
- Test: `src/lib/zack/recenica-upis.test.ts`

Upis ODBIJA pokvaren zapis (spec): praznina se ne javlja tačno jednom,
distraktor jednak praznini ili dupliran, manje/više od 3 distraktora, glavna
reč nije reč te lekcije, slagalična rečenica van 3-6 pločica (te se
automatski označavaju `samo_dopuna`), duplirana rečenica.

- [ ] **Step 1: Napiši padajuće testove**

`src/lib/zack/recenica-upis.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { pripremiRecenice } from "./recenica-upis";

/** Reči lekcije kakve ruta pročita iz baze: de → id. */
const reciLekcije = new Map([
  ["kommen", "id-kommen"],
  ["Serbien", "id-serbien"],
  ["wohnen", "id-wohnen"],
]);

const red = (delovi: Partial<Record<string, unknown>> = {}) => ({
  de: "Ich komme aus Serbien.",
  sr: "Dolazim iz Srbije.",
  praznina: "komme",
  distraktori: ["kommst", "kommt", "kommen"],
  glavna: "kommen",
  samoDopuna: false,
  ...delovi,
});

describe("pripremiRecenice", () => {
  it("ispravan spisak prolazi i dobija redne brojeve i rec_id", () => {
    const ishod = pripremiRecenice([red()], reciLekcije);
    expect(ishod).toEqual({
      ok: true,
      recenice: [
        {
          redni_broj: 1,
          de: "Ich komme aus Serbien.",
          sr: "Dolazim iz Srbije.",
          praznina: "komme",
          distraktori: ["kommst", "kommt", "kommen"],
          rec_id: "id-kommen",
          samo_dopuna: false,
        },
      ],
    });
  });

  it("odbija prazninu koja se ne javlja tačno jednom", () => {
    const ishod = pripremiRecenice([red({ de: "Komm, komm her!", praznina: "komm" })], reciLekcije);
    expect(ishod.ok).toBe(false);
    if (!ishod.ok) expect(ishod.greska).toContain("tačno jednom");
  });

  it("odbija distraktor jednak praznini", () => {
    const ishod = pripremiRecenice(
      [red({ distraktori: ["komme", "kommt", "kommen"] })],
      reciLekcije
    );
    expect(ishod.ok).toBe(false);
  });

  it("odbija duplirane distraktore i pogrešan broj distraktora", () => {
    expect(pripremiRecenice([red({ distraktori: ["kommst", "kommst", "kommt"] })], reciLekcije).ok).toBe(false);
    expect(pripremiRecenice([red({ distraktori: ["kommst", "kommt"] })], reciLekcije).ok).toBe(false);
  });

  it("odbija glavnu reč koja nije reč te lekcije", () => {
    const ishod = pripremiRecenice([red({ glavna: "essen" })], reciLekcije);
    expect(ishod.ok).toBe(false);
    if (!ishod.ok) expect(ishod.greska).toContain("essen");
  });

  it("rečenica sa više od 6 pločica se sama označi samo_dopuna", () => {
    const ishod = pripremiRecenice(
      [red({ de: "Ich wohne ganz oben im Haus im fünften Stock.", praznina: "wohne", glavna: "wohnen" })],
      reciLekcije
    );
    expect(ishod.ok).toBe(true);
    if (ishod.ok) expect(ishod.recenice[0].samo_dopuna).toBe(true);
  });

  it("odbija dupliranu rečenicu, sa brojem reda", () => {
    const ishod = pripremiRecenice([red(), red()], reciLekcije);
    expect(ishod.ok).toBe(false);
    if (!ishod.ok) expect(ishod.greska).toContain("2");
  });

  it("odbija prazan spisak", () => {
    expect(pripremiRecenice([], reciLekcije).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Pokreni - FAIL**

```bash
npm test -- recenica-upis
```

- [ ] **Step 3: Napiši `src/lib/zack/recenica-upis.ts`**

```ts
// Provera i priprema spiska rečenica za upis, bez baze i bez HTTP-a, po uzoru
// na lekcija-upis.ts. Prva greška prekida, sa brojem reda, da Nataša zna šta
// da popravi. Pokvaren zapis se ODBIJA na upisu - do deteta ne sme da stigne.
import { normalizujDe } from "./lekcija-upis";
import { podobnaZaSlagalicu, rastaviRecenicu } from "./recenice";

/** Gornja granica jednog spiska, ista zaštita kao kod reči. */
export const NAJVISE_RECENICA = 200;

export const DISTRAKTORA = 3;

export type PripremljenaRecenica = {
  redni_broj: number;
  de: string;
  sr: string;
  praznina: string;
  distraktori: string[];
  rec_id: string;
  samo_dopuna: boolean;
};

export type PripremaRecenicaIshod =
  | { ok: true; recenice: PripremljenaRecenica[] }
  | { ok: false; greska: string };

function jeNeprazanTekst(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Broj pojavljivanja oblika kao cele reči u rečenici. */
function pojavljivanja(de: string, oblik: string): number {
  const { reci } = rastaviRecenicu(de);
  const trazeni = oblik.toLocaleLowerCase("de");
  return reci.filter((r) => r.toLocaleLowerCase("de") === trazeni).length;
}

/**
 * Proverava i priprema ceo spisak rečenica jedne lekcije.
 * `reciLekcije` mapira normalizovan nemački oblik reči lekcije na njen id -
 * glavna reč se u spisku navodi tekstom (Nataša lepi tabelu, ne ključeve).
 */
export function pripremiRecenice(
  ulaz: unknown,
  reciLekcije: ReadonlyMap<string, string>
): PripremaRecenicaIshod {
  if (!Array.isArray(ulaz)) return { ok: false, greska: "Spisak rečenica mora biti niz" };
  if (ulaz.length === 0) return { ok: false, greska: "Spisak mora imati bar jednu rečenicu" };
  if (ulaz.length > NAJVISE_RECENICA) {
    return { ok: false, greska: `Spisak ima ${ulaz.length} rečenica, a najviše sme ${NAJVISE_RECENICA}` };
  }

  const recenice: PripremljenaRecenica[] = [];
  const videnoDe = new Map<string, number>();

  for (let i = 0; i < ulaz.length; i++) {
    const red = i + 1;
    const sirova: unknown = ulaz[i];
    if (typeof sirova !== "object" || sirova === null || Array.isArray(sirova)) {
      return { ok: false, greska: `Rečenica broj ${red}: red nije ispravno popunjen` };
    }
    const r = sirova as Record<string, unknown>;

    if (!jeNeprazanTekst(r.de)) return { ok: false, greska: `Rečenica broj ${red}: nedostaje nemačka rečenica` };
    if (!jeNeprazanTekst(r.sr)) return { ok: false, greska: `Rečenica broj ${red}: nedostaje prevod na naš jezik` };
    if (!jeNeprazanTekst(r.praznina)) return { ok: false, greska: `Rečenica broj ${red}: nedostaje oblik za prazninu` };
    if (!jeNeprazanTekst(r.glavna)) return { ok: false, greska: `Rečenica broj ${red}: nedostaje glavna reč` };

    const de = normalizujDe(r.de);
    const vecVidena = videnoDe.get(de);
    if (vecVidena !== undefined) {
      return { ok: false, greska: `Rečenica broj ${red}: ista rečenica već stoji pod brojem ${vecVidena}` };
    }
    videnoDe.set(de, red);

    const praznina = r.praznina.trim();
    if (pojavljivanja(de, praznina) !== 1) {
      return {
        ok: false,
        greska: `Rečenica broj ${red}: oblik „${praznina}" mora da se javi tačno jednom u rečenici`,
      };
    }

    if (!Array.isArray(r.distraktori) || r.distraktori.length !== DISTRAKTORA) {
      return { ok: false, greska: `Rečenica broj ${red}: mora imati tačno ${DISTRAKTORA} pogrešna oblika` };
    }
    const distraktori = r.distraktori.map((d) => (typeof d === "string" ? d.trim() : ""));
    if (distraktori.some((d) => d.length === 0)) {
      return { ok: false, greska: `Rečenica broj ${red}: pogrešni oblici ne smeju biti prazni` };
    }
    const svi = [praznina.toLocaleLowerCase("de"), ...distraktori.map((d) => d.toLocaleLowerCase("de"))];
    if (new Set(svi).size !== svi.length) {
      return {
        ok: false,
        greska: `Rečenica broj ${red}: pogrešni oblici moraju biti različiti međusobno i od tačnog`,
      };
    }

    const glavnaKljuc = normalizujDe(r.glavna as string);
    const recId = reciLekcije.get(glavnaKljuc);
    if (!recId) {
      return {
        ok: false,
        greska: `Rečenica broj ${red}: glavna reč „${r.glavna}" nije reč ove lekcije`,
      };
    }

    // samo_dopuna: ono što autor označi, plus automatski sve što ne staje u
    // slagalicu (van 3-6 pločica) - takva rečenica nije greška, samo ne ulazi
    // u slaganje.
    const rucno = r.samoDopuna === true;
    const kandidat = {
      redni_broj: red,
      de,
      sr: (r.sr as string).trim(),
      praznina,
      distraktori,
      rec_id: recId,
      samo_dopuna: rucno,
    };
    if (!rucno && !podobnaZaSlagalicu({ ...kandidat, id: "" })) {
      kandidat.samo_dopuna = true;
    }

    recenice.push(kandidat);
  }

  return { ok: true, recenice };
}
```

- [ ] **Step 4: Pokreni - PASS**

```bash
npm test -- recenica-upis
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/zack/recenica-upis.ts src/lib/zack/recenica-upis.test.ts
git commit -m "feat(zack): provera spiska rečenica pri upisu"
```

---

## Task 5: Upiti - rečenice i prolazi učenja

**Files:**
- Modify: `src/lib/zack/upiti.ts` (dodaj na kraj datoteke)

- [ ] **Step 1: Dodaj tri upita u `upiti.ts`**

```ts
import type { Recenica } from "./recenice";

/** Rečenice jedne lekcije, didaktičkim redosledom. */
export async function receniceLekcije(lekcijaId: string): Promise<Recenica[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_recenice")
    .select("id, redni_broj, de, sr, praznina, distraktori, rec_id, samo_dopuna")
    .eq("lekcija_id", lekcijaId)
    .order("redni_broj");
  if (error) throw new Error(`Ne mogu da pročitam rečenice lekcije: ${error.message}`);

  // `distraktori` je JSONB - sve što je u bazu upisano. Red koji nije spisak
  // stringova se ne popravlja nego vraća prazan, a generator ga tiho preskoči
  // (podobnaZaDopunu/ponudjeni rade i sa praznim) - pokvaren podatak pada u
  // korist deteta, nikad do pokvarene igre.
  return (data ?? []).map((red) => ({
    ...red,
    distraktori: Array.isArray(red.distraktori)
      ? red.distraktori.filter((d: unknown): d is string => typeof d === "string")
      : [],
  }));
}

/**
 * Rečenice SVIH ranijih lekcija udžbenika, za ponavljanje kroz rečenične igre.
 * Isti obrazac kao stareReciUdzbenika.
 */
export async function stareReceniceUdzbenika(
  udzbenikId: string,
  brojLekcije: number
): Promise<Recenica[]> {
  if (brojLekcije <= 1) return [];

  const sb = createAdminClient();
  const { data: lekcije, error } = await sb
    .from("zack_lekcije")
    .select("id")
    .eq("udzbenik_id", udzbenikId)
    .lt("broj", brojLekcije);
  if (error) throw new Error(`Ne mogu da pročitam ranije lekcije: ${error.message}`);
  if (!lekcije || lekcije.length === 0) return [];

  const { data, error: greskaRecenica } = await sb
    .from("zack_recenice")
    .select("id, redni_broj, de, sr, praznina, distraktori, rec_id, samo_dopuna")
    .in("lekcija_id", lekcije.map((l) => l.id))
    .order("redni_broj");
  if (greskaRecenica) throw new Error(`Ne mogu da pročitam stare rečenice: ${greskaRecenica.message}`);

  return (data ?? []).map((red) => ({
    ...red,
    distraktori: Array.isArray(red.distraktori)
      ? red.distraktori.filter((d: unknown): d is string => typeof d === "string")
      : [],
  }));
}

/**
 * Koje je faze učenja dete prošlo na lekciji. Skup imena faza („reci",
 * „recenice"). Pad čitanja NE sme da zaključa vežbe - zvaoci na grešku
 * tretiraju fazu kao prođenu (kvar pada u korist deteta).
 */
export async function ucenjeProlazi(deteId: string, lekcijaId: string): Promise<Set<string>> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_ucenje_prolazi")
    .select("faza")
    .eq("dete_id", deteId)
    .eq("lekcija_id", lekcijaId);
  if (error) throw new Error(`Ne mogu da pročitam prolaze učenja: ${error.message}`);
  return new Set((data ?? []).map((r) => r.faza));
}
```

- [ ] **Step 2: Proveri tipove**

```bash
./node_modules/.bin/tsc --noEmit
```
Očekivano: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/lib/zack/upiti.ts
git commit -m "feat(zack): upiti za rečenice i prolaze učenja"
```

---

## Task 6: Ruta `/api/zack/[childId]/ucenje` - beleženje prolaza

**Files:**
- Create: `src/app/api/zack/[childId]/ucenje/route.ts`

- [ ] **Step 1: Napiši rutu**

```ts
// Beleženje da je dete JEDNOM prošlo fazu učenja na lekciji. Otključava vežbe.
//
// Idempotentno (ON CONFLICT DO NOTHING preko ignoreDuplicates): ponovljen
// prolaz ne piše ništa novo. Red se nikad ne briše - vraćanje na učenje je
// poželjno i ne zaključava ništa nazad.
//
// Klijent posle uspešnog prolaza otključava vežbe ODMAH, ne čekajući ovaj
// odgovor: pad ovog upisa znači samo da će sledeće otvaranje lekcije opet
// tražiti učenje - dosadno, ali ništa nije oduzeto.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PORUKA_ZAKLJUCANO } from "@/lib/zack/clanstvo";
import { clanstvoAktivno, jeUuid, lekcijaUUdzbeniku, nadjiDete } from "@/lib/zack/upiti";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

const FAZE = ["reci", "recenice"] as const;
type Faza = (typeof FAZE)[number];

function jeFaza(v: unknown): v is Faza {
  return typeof v === "string" && (FAZE as readonly string[]).includes(v);
}

export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;

  const dete = await nadjiDete(childId);
  if (!dete) return greska("Nema takvog deteta", 404);
  if (!(await clanstvoAktivno(dete.id))) return greska(PORUKA_ZAKLJUCANO, 403);

  let telo: unknown;
  try {
    telo = await request.json();
  } catch {
    return greska("Telo zahteva nije ispravan JSON", 400);
  }
  if (typeof telo !== "object" || telo === null || Array.isArray(telo)) {
    return greska("Telo zahteva mora biti objekat", 400);
  }
  const { lekcijaId, faza } = telo as Record<string, unknown>;

  if (typeof lekcijaId !== "string" || !jeUuid(lekcijaId)) {
    return greska("lekcijaId nije ispravan", 400);
  }
  if (!jeFaza(faza)) return greska("faza mora biti reci ili recenice", 400);

  // Tuđa lekcija se ne beleži - isti stav kao u zaradi/greska.
  if (!(await lekcijaUUdzbeniku(lekcijaId, dete.udzbenik_id))) {
    return greska("Nema takve lekcije", 404);
  }

  const sb = createAdminClient();
  const { error } = await sb
    .from("zack_ucenje_prolazi")
    .upsert(
      { dete_id: dete.id, lekcija_id: lekcijaId, faza },
      { onConflict: "dete_id,lekcija_id,faza", ignoreDuplicates: true }
    );
  if (error) {
    console.error("[zack/ucenje] upis prolaza:", error);
    return greska("Prolaz nije upisan", 500);
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Proveri tipove i testove**

```bash
./node_modules/.bin/tsc --noEmit && npm test
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/zack/[childId]/ucenje/route.ts"
git commit -m "feat(zack): ruta za beleženje prolaza faze učenja"
```

---

## Task 7: Admin ruta `/api/admin/zack/recenice` - upis rečenica lekcije

**Files:**
- Create: `src/app/api/admin/zack/recenice/route.ts`

Za razliku od reči, brisanje rečenice detetu NIŠTA ne oduzima (sličice i
greške žive na rec_id, ne na rečenici), pa upis sme da bude prost: obriši
rečenice lekcije pa upiši nove, bez 409 potvrde.

- [ ] **Step 1: Napiši rutu**

```ts
// Upis SVIH rečenica jedne lekcije odjednom, iz nalepljene tabele.
//
// ZAŠTO OVDE SME delete + insert (a kod reči NE SME): na rečenici ne živi
// ništa dečje. Sličice i greške se knjiže na glavnu REČ (rec_id), pa zamena
// rečenica ne dira ništa zarađeno. Ključ (lekcija_id, de) postoji radi
// jedinstvenosti u spisku, ne radi preživljavanja upisa.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { normalizujDe } from "@/lib/zack/lekcija-upis";
import { pripremiRecenice } from "@/lib/zack/recenica-upis";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  let telo: unknown;
  try {
    telo = await request.json();
  } catch {
    return greska("Telo zahteva nije ispravan JSON", 400);
  }
  if (typeof telo !== "object" || telo === null || Array.isArray(telo)) {
    return greska("Telo zahteva mora biti objekat", 400);
  }
  const body = telo as Record<string, unknown>;

  const udzbenikId = body.udzbenikId;
  const broj = body.broj;
  if (typeof udzbenikId !== "string" || !UUID.test(udzbenikId.trim())) {
    return greska("udzbenikId nije ispravan", 400);
  }
  if (typeof broj !== "number" || !Number.isInteger(broj) || broj < 1 || broj > 32767) {
    return greska("Broj lekcije mora biti ceo broj između 1 i 32767", 400);
  }

  // Lekcija mora da postoji - rečenice se ne upisuju u prazno.
  const { data: lekcija, error: greskaLekcije } = await admin
    .from("zack_lekcije")
    .select("id")
    .eq("udzbenik_id", udzbenikId.trim())
    .eq("broj", broj)
    .maybeSingle();
  if (greskaLekcije) {
    console.error("[zack/recenice] traženje lekcije:", greskaLekcije);
    return greska("Lekcija nije pročitana", 500);
  }
  if (!lekcija) return greska(`Lekcija ${broj} ne postoji - prvo upiši reči lekcije`, 400);

  // Reči lekcije, da se glavna reč iz teksta prevede u ključ.
  const { data: reci, error: greskaReci } = await admin
    .from("zack_reci")
    .select("id, de")
    .eq("lekcija_id", lekcija.id);
  if (greskaReci) {
    console.error("[zack/recenice] čitanje reči:", greskaReci);
    return greska("Reči lekcije nisu pročitane", 500);
  }
  const poDe = new Map((reci ?? []).map((r) => [normalizujDe(r.de), r.id]));

  const priprema = pripremiRecenice(body.recenice, poDe);
  if (!priprema.ok) return greska(priprema.greska, 400);

  // Zamena: staro dole, novo gore. Ako upis novih padne posle brisanja, lekcija
  // ostane bez rečenica do ponovnog upisa - rečenični blok se tada prosto ne
  // prikazuje, ništa dečje nije dirnuto.
  const { error: greskaBrisanja } = await admin
    .from("zack_recenice")
    .delete()
    .eq("lekcija_id", lekcija.id);
  if (greskaBrisanja) {
    console.error("[zack/recenice] brisanje starih:", greskaBrisanja);
    return greska("Stare rečenice nisu obrisane", 500);
  }

  const { error: greskaUpisa } = await admin.from("zack_recenice").insert(
    priprema.recenice.map((r) => ({ lekcija_id: lekcija.id, ...r }))
  );
  if (greskaUpisa) {
    console.error("[zack/recenice] upis:", greskaUpisa);
    return greska("Rečenice nisu upisane", 500);
  }

  return NextResponse.json({ ok: true, upisano: priprema.recenice.length });
}
```

- [ ] **Step 2: Proveri tipove**

```bash
./node_modules/.bin/tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/zack/recenice/route.ts
git commit -m "feat(zack): admin upis rečenica lekcije"
```

---

## Task 8: Tela igara - Slagalica i Dopuna u ljusci `Igra.tsx`

**Files:**
- Create: `src/components/zack/Recenice.tsx` (tela `Slagalica` i `Dopuna`)
- Modify: `src/components/zack/Igra.tsx` (grananje po novim vrstama + props)

Ponašanje (spec + postojeći obrasci ljuske):
- **Dopuna** je po toku ista kao brzo biranje: rečenica sa 6 crta, prevod
  ispod, 4 dugmeta; posle odgovora tačan se oboji, `naOdgovor` standardno.
- **Slagalica**: dete tapka pločice redom u red za slaganje; tap na složenu
  pločicu je vraća. Kad su sve pločice u redu, dugme „Proveri" → jedan
  odgovor za `naOdgovor` (tačan tekst za „Ups!" = cela tačna rečenica).
- **Vođeni režim** (`vodjeno`, koristi ga učenje rečenica): prvo se pokaže
  cela rečenica sa prevodom + dugme „Složi je"; pri slaganju se svaka pločica
  proverava ODMAH - pogrešna se zatrese i vrati, bez srca i bez upisa greške;
  složena rečenica javlja tačno kroz `naOdgovor`-ekvivalent bez kazne.

- [ ] **Step 1: Napiši `src/components/zack/Recenice.tsx`**

```tsx
"use client";

// Tela rečeničnih igara: Slagalica (i njen vođeni režim za učenje) i Dopuna.
// Stanje partije (srca, tačni) i dalje vodi isključivo sesija u ljusci -
// ovde je samo ono što sesija ne zna: koje su pločice gde.
import { useState } from "react";
import type { Pitanje } from "@/lib/zack/pitanja";
import { proveriSlaganje } from "@/lib/zack/recenice";

const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const MASTILO = "#16161A";
const PRIGUSEN = "#6E6A5E";
const ZELENA = "#1E7A4B";
const CRVENA = "#E5342A";

const DUGME =
  "rounded-2xl outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:cursor-default";

type PitanjeSlagalice = Extract<Pitanje, { igra: "slagalica" }>;
type PitanjeDopune = Extract<Pitanje, { igra: "dopuna" }>;

/**
 * Pločica u slagalici se identifikuje INDEKSOM u izmešanom nizu, ne tekstom:
 * dve iste reči („die … die") su dve različite pločice i svaka sme u red
 * tačno jednom. Tačnost se pri proveri poredi po tekstu (proveriSlaganje),
 * pa su duplikati ravnopravni.
 */
export function Slagalica({
  pitanje,
  vodjeno,
  zakljucano,
  naOdgovor,
  naVodjenoSlozena,
}: {
  pitanje: PitanjeSlagalice;
  /** Učenje rečenica: prvo se pokaže cela rečenica, greška vraća pločicu. */
  vodjeno: boolean;
  zakljucano: boolean;
  /** Vežba: jedan odgovor po rečenici, standardni tok ljuske. */
  naOdgovor: (tacno: boolean, tacanTekst: string, pitanje: Pitanje) => void;
  /** Učenje: rečenica složena (uvek tačno, bez kazne usput). */
  naVodjenoSlozena?: (pitanje: Pitanje) => void;
}) {
  // Faza vođenog režima: prvo gledanje, pa slaganje.
  const [gleda, setGleda] = useState(vodjeno);
  // Indeksi izmešanih pločica u redu za slaganje, redom.
  const [uRedu, setURedu] = useState<number[]>([]);
  // Pločica koja se u vođenom režimu upravo zatresla (pogrešan pokušaj).
  const [tresem, setTresem] = useState<number | null>(null);
  const [odgovoreno, setOdgovoreno] = useState(false);

  const cela = `${velikoPrvo(pitanje.tacan.join(" "))}${pitanje.znak}`;

  if (gleda) {
    return (
      <div>
        <div
          className="rounded-2xl border px-5 py-7 text-center"
          style={{ background: PAPIR, borderColor: IVICA }}
        >
          <p className="font-heading text-[12px] font-bold uppercase tracking-[.18em]" style={{ color: PRIGUSEN }}>
            Pogledaj i zapamti
          </p>
          <p lang="de" className="font-heading mt-2 text-[26px] font-bold leading-tight" style={{ color: MASTILO }}>
            {cela}
          </p>
          <p className="mt-2 text-[16px] leading-snug" style={{ color: PRIGUSEN }}>
            {pitanje.prevod}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setGleda(false)}
          className={`${DUGME} font-heading mt-4 block min-h-[60px] w-full text-[19px] font-bold`}
          style={{ background: MASTILO, color: "#FFFFFF" }}
        >
          Složi je
        </button>
      </div>
    );
  }

  const slobodne = pitanje.plocice.map((_, i) => i).filter((i) => !uRedu.includes(i));
  const sveSlozeno = uRedu.length === pitanje.plocice.length;

  const tapniSlobodnu = (i: number) => {
    if (zakljucano || odgovoreno) return;
    if (vodjeno) {
      // Vođeni režim: pločica mora da bude sledeća tačna. Pogrešna se zatrese
      // i vrati - bez srca, bez upisa, bez prekora.
      const ocekivana = pitanje.tacan[uRedu.length].toLocaleLowerCase("de");
      if (pitanje.plocice[i].toLocaleLowerCase("de") !== ocekivana) {
        setTresem(i);
        setTimeout(() => setTresem(null), 400);
        return;
      }
    }
    const novi = [...uRedu, i];
    setURedu(novi);
    if (vodjeno && novi.length === pitanje.plocice.length) {
      setOdgovoreno(true);
      naVodjenoSlozena?.(pitanje);
    }
  };

  const vratiIzReda = (i: number) => {
    if (zakljucano || odgovoreno || vodjeno) return;
    setURedu(uRedu.filter((x) => x !== i));
  };

  const proveri = () => {
    if (zakljucano || odgovoreno || !sveSlozeno) return;
    setOdgovoreno(true);
    const slozeno = uRedu.map((i) => pitanje.plocice[i]);
    naOdgovor(proveriSlaganje(slozeno, pitanje.tacan), cela, pitanje);
  };

  return (
    <div>
      <div
        className="rounded-2xl border px-5 py-5 text-center"
        style={{ background: PAPIR, borderColor: IVICA }}
      >
        <p className="font-heading text-[12px] font-bold uppercase tracking-[.18em]" style={{ color: PRIGUSEN }}>
          Složi rečenicu
        </p>
        <p className="mt-1 text-[15px] leading-snug" style={{ color: PRIGUSEN }}>
          {pitanje.prevod}
        </p>
        {/* Red za slaganje: složene pločice + znak koji čeka na kraju. */}
        <p lang="de" className="mt-3 flex min-h-[52px] flex-wrap items-center justify-center gap-2">
          {uRedu.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => vratiIzReda(i)}
              disabled={zakljucano || odgovoreno || vodjeno}
              className={`${DUGME} font-heading border-2 px-3 py-2 text-[19px] font-bold`}
              style={{ background: "#E4F0E9", borderColor: ZELENA, color: MASTILO }}
            >
              {pitanje.plocice[i]}
            </button>
          ))}
          <span aria-hidden="true" className="font-heading text-[22px] font-bold" style={{ color: PRIGUSEN }}>
            {pitanje.znak}
          </span>
        </p>
      </div>

      <ul lang="de" className="mt-4 flex flex-wrap justify-center gap-2.5">
        {slobodne.map((i) => (
          <li key={i} className={tresem === i ? "motion-safe:animate-[zack-tresi_0.4s]" : undefined}>
            <button
              type="button"
              onClick={() => tapniSlobodnu(i)}
              disabled={zakljucano || odgovoreno}
              className={`${DUGME} font-heading min-h-[56px] border-2 px-4 py-3 text-[19px] font-bold motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.97]`}
              style={{
                background: tresem === i ? "#FBE7E5" : PAPIR,
                borderColor: tresem === i ? CRVENA : IVICA,
                color: MASTILO,
              }}
            >
              {pitanje.plocice[i]}
            </button>
          </li>
        ))}
      </ul>

      {!vodjeno && (
        <button
          type="button"
          onClick={proveri}
          disabled={zakljucano || odgovoreno || !sveSlozeno}
          className={`${DUGME} font-heading mt-4 block min-h-[60px] w-full text-[19px] font-bold disabled:opacity-45`}
          style={{ background: MASTILO, color: "#FFFFFF" }}
        >
          Proveri
        </button>
      )}
    </div>
  );
}

/** Prvo slovo veliko - za prikaz cele rečenice posle pravila malog slova. */
function velikoPrvo(s: string): string {
  return s.length === 0 ? s : s[0].toLocaleUpperCase("de") + s.slice(1);
}

export function Dopuna({
  pitanje,
  zakljucano,
  naOdgovor,
}: {
  pitanje: PitanjeDopune;
  zakljucano: boolean;
  naOdgovor: (tacno: boolean, tacanTekst: string, pitanje: Pitanje) => void;
}) {
  const [izabrano, setIzabrano] = useState<string | null>(null);

  return (
    <div>
      <div
        className="rounded-2xl border px-5 py-7 text-center"
        style={{ background: PAPIR, borderColor: IVICA }}
      >
        <p className="font-heading text-[12px] font-bold uppercase tracking-[.18em]" style={{ color: PRIGUSEN }}>
          Šta ide u prazninu
        </p>
        <p lang="de" className="font-heading mt-2 text-[24px] font-bold leading-snug [overflow-wrap:anywhere]" style={{ color: MASTILO }}>
          {pitanje.saPrazninom}
        </p>
        <p className="mt-2 text-[15px] leading-snug" style={{ color: PRIGUSEN }}>
          {pitanje.prevod}
        </p>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2.5">
        {pitanje.opcije.map((opcija) => {
          const jeTacna = opcija === pitanje.tacan;
          const jeIzabrana = opcija === izabrano;
          const stil = !izabrano
            ? { background: PAPIR, borderColor: IVICA, color: MASTILO }
            : jeTacna
              ? { background: "#E4F0E9", borderColor: ZELENA, color: MASTILO }
              : jeIzabrana
                ? { background: "#FBE7E5", borderColor: CRVENA, color: MASTILO }
                : { background: PAPIR, borderColor: IVICA, color: PRIGUSEN };
          return (
            <li key={opcija}>
              <button
                type="button"
                lang="de"
                disabled={zakljucano}
                onClick={() => {
                  setIzabrano(opcija);
                  naOdgovor(jeTacna, pitanje.tacan, pitanje);
                }}
                className={`${DUGME} font-heading block min-h-[60px] w-full border-2 px-4 py-3.5 text-center text-[19px] font-bold leading-snug motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
                style={stil}
              >
                {opcija}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

Dodaj i animaciju tresenja u globalni CSS (`src/app/globals.css`, uz postojeće
zack animacije):

```css
@keyframes zack-tresi {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
```

- [ ] **Step 2: Ugradi u ljusku `Igra.tsx`**

U `Igra({ ... })` dodaj props (posle `stare`):

```ts
  /** Rečenice lekcije - hrane slagalicu, dopunu i učenje rečenica. */
  recenice?: Recenica[];
  /** Stare rečenice ranijih lekcija, za ponavljanje u rečeničnim igrama. */
  stareRecenice?: Recenica[];
```

sa uvozima:

```ts
import { napraviPitanjaRecenica, type Recenica } from "@/lib/zack/recenice";
import { Dopuna, Slagalica } from "@/components/zack/Recenice";
```

U efektu koji pravi sesiju (postojeći `useEffect` po `vrsta`), grananje:

```ts
  useEffect(() => {
    const jeRecenicna = vrsta === "slagalica" || vrsta === "dopuna" || vrsta === "ucenje-recenica";
    if (jeRecenicna) {
      // Rečenične igre: lekcijske rečenice + do kvote starih (prioritet
      // ide preko glavne reči: greške > izbledele, kao i kod reči).
      const igra = vrsta === "ucenje-recenica" ? "slagalica" : vrsta;
      const pool = [...reciRef.current, ...stareRef.current.map((s) => s.rec)];
      setSesija(
        novaSesija(
          recenicnaPitanja(
            receniceRef.current,
            stareReceniceRef.current,
            stareRef.current,
            igra,
            vrsta === "ucenje-recenica" ? receniceRef.current.length : PITANJA_PO_PARTIJI,
            Math.random,
            pool
          )
        )
      );
    } else {
      setSesija(
        novaSesija(
          pitanjaSaStarima(reciRef.current, stareRef.current, vrsta, kolikoPitanja(vrsta), Math.random)
        )
      );
    }
    setOdziv(null);
    setZamrznuto(null);
    setKorak((k) => k + 1);
    visina.current = 0;
  }, [vrsta]);
```

uz ref-ove po istom obrascu kao `reciRef`:

```ts
  const receniceRef = useRef(recenice ?? []);
  useEffect(() => {
    receniceRef.current = recenice ?? [];
  }, [recenice]);
  const stareReceniceRef = useRef(stareRecenice ?? []);
  useEffect(() => {
    stareReceniceRef.current = stareRecenice ?? [];
  }, [stareRecenice]);
```

i pomoćnom funkcijom u `recenice.ts` (dodaj u Task 2 datoteku, uz test):

```ts
import { izaberiStare, kvotaStarih, type StaraRec } from "./ponavljanje";

/**
 * Pitanja rečenične partije sa ponavljanjem: lekcijske rečenice + rečenice
 * starih reči (izbor starih ide ISTIM pravilom kao kod reči: greške >
 * izbledele, preko glavne reči). Učenje rečenica ne meša stare - uči se OVA
 * lekcija.
 */
export function recenicnaPitanja(
  recenice: readonly Recenica[],
  stareRecenice: readonly Recenica[],
  stare: readonly StaraRec[],
  igra: "slagalica" | "dopuna",
  koliko: number,
  rng: () => number,
  pool: readonly Rec[]
): Pitanje[] {
  const izabraneStare = izaberiStare(stare, kvotaStarih(koliko), rng);
  const stareIdovi = new Set(izabraneStare.map((r) => r.id));
  const kandidati = stareRecenice.filter((s) => stareIdovi.has(s.rec_id));

  const osnovna = napraviPitanjaRecenica(recenice, igra, koliko - Math.min(kandidati.length, kvotaStarih(koliko)), rng, pool);
  const staraPitanja = napraviPitanjaRecenica(kandidati, igra, kvotaStarih(koliko), rng, pool);

  const sva = [...osnovna];
  for (const p of staraPitanja) {
    sva.splice(Math.floor(rng() * (sva.length + 1)), 0, p);
  }
  return sva;
}
```

Test za `recenicnaPitanja` (dodaj u `recenice.test.ts`):

```ts
describe("recenicnaPitanja", () => {
  it("bez starih vraća samo lekcijske rečenice", () => {
    const p = recenicnaPitanja([recenica({})], [], [], "dopuna", 8, rngNiz([0.5]), []);
    expect(p).toHaveLength(1);
  });

  it("stara rečenica ulazi samo ako je njena glavna reč izabrana", () => {
    const stara: StaraRec = { rec: rec({ id: "r9" }), izbledela: true, gresaka: 2 };
    const staraRecenica = recenica({ id: "s9", rec_id: "r9", de: "Wo wohnst du?", praznina: "wohnst" });
    const p = recenicnaPitanja(
      Array.from({ length: 8 }, (_, i) => recenica({ id: `s${i}`, de: `Ich komme aus Serbien${i}.` })),
      [staraRecenica],
      [stara],
      "dopuna",
      8,
      rngNiz([0.1, 0.9, 0.4, 0.6]),
      []
    );
    expect(p.some((x) => x.igra === "dopuna" && x.recenicaId === "s9")).toBe(true);
  });
});
```

(Za taj test dopuni uvoz: `recenicnaPitanja` iz `./recenice`, `type StaraRec`
iz `./ponavljanje`.)

U JSX grananju ljuske (posle `diktat` grane, pre podrazumevanog `IgraBiranje`):

```tsx
      ) : p.igra === "slagalica" ? (
        <Slagalica
          key={korak}
          pitanje={p}
          vodjeno={vrsta === "ucenje-recenica"}
          zakljucano={zakljucano}
          naOdgovor={naOdgovor}
          naVodjenoSlozena={(pit) => {
            // Učenje: složena rečenica je tačan odgovor, bez mogućnosti kazne.
            naOdgovor(true, "", pit);
          }}
        />
      ) : p.igra === "dopuna" ? (
        <Dopuna key={korak} pitanje={p} zakljucano={zakljucano} naOdgovor={naOdgovor} />
```

VAŽNO za vođeni režim: greška se u njemu ne javlja nikad (`naOdgovor` se zove
samo sa `tacno: true`), pa srca ne padaju i `posaljiGresku` se ne zove - to je
tačno ponašanje iz spec-a, bez ijedne izmene ljuske.

- [ ] **Step 3: Proveri tipove i testove**

```bash
./node_modules/.bin/tsc --noEmit && npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/components/zack/Recenice.tsx src/components/zack/Igra.tsx src/lib/zack/recenice.ts src/lib/zack/recenice.test.ts src/app/globals.css
git commit -m "feat(zack): slagalica i dopuna u ljusci igre, sa vođenim režimom"
```

---

## Task 9: Komponenta `UcenjeReci.tsx` - kartice u grupama + mini provera

**Files:**
- Create: `src/components/zack/UcenjeReci.tsx`

Tok: grupa kartica (lista, sa bojom roda, množinom i oznakom izuzetka) →
„Idemo na proveru" → mini provera (tela brzog biranja, bez srca; pogrešan
odgovor pokaže tačan i ide dalje, ništa se ne upisuje kao greška) → sledeća
grupa → na kraju `onKraj(tacni)` + javljanje prolaza. Tačan odgovor u proveri
se šalje kroz `zaradi` odmah (pošalji-i-zaboravi), kao u igri.

- [ ] **Step 1: Napiši komponentu**

```tsx
"use client";

// Faza učenja reči: kartice u malim grupama, posle svake grupe kratka provera
// dodirom. Bez srca i bez upisa grešaka - ovde se uči, ne meri. Tačan odgovor
// u proveri ZARAĐUJE (šalje se odmah + ponovo na kraju kroz onKraj), jer je
// tačan odgovor tačan odgovor ma kako se faza zvala.
import { useCallback, useMemo, useRef, useState } from "react";
import { miniProvera, napraviGrupe } from "@/lib/zack/ucenje";
import { bojaZaRod, BOJA_MNOZINA, type Rec } from "@/lib/zack/rec";
import type { Pitanje } from "@/lib/zack/pitanja";

const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const MASTILO = "#16161A";
const PRIGUSEN = "#6E6A5E";
const ZELENA = "#1E7A4B";
const CRVENA = "#E5342A";

const DUGME =
  "rounded-2xl outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:cursor-default";

type Korak = { grupa: number; faza: "kartice" | "provera" };

export default function UcenjeReci({
  childId,
  reci,
  onKraj,
}: {
  childId: string;
  reci: Rec[];
  /** Kraj učenja: spisak tačnih iz proverâ + da li je prošlo do kraja. */
  onKraj: (tacniRecIdovi: string[], prosloSve: boolean) => void;
}) {
  // Grupe i pitanja se prave jednom po montiranju - posle hidracije, pa
  // Math.random ovde ne pravi neslaganje servera i pretraživača.
  const grupe = useMemo(() => napraviGrupe(reci), [reci]);
  const provere = useMemo(
    () => grupe.map((g) => miniProvera(g, reci, Math.random)),
    [grupe, reci]
  );

  const [korak, setKorak] = useState<Korak>({ grupa: 0, faza: "kartice" });
  const [pitanjeBr, setPitanjeBr] = useState(0);
  const [izabrano, setIzabrano] = useState<string | null>(null);
  const tacni = useRef<string[]>([]);

  const posaljiZaradjeno = useCallback(
    (recIdovi: string[]) => {
      if (recIdovi.length === 0) return;
      void fetch(`/api/zack/${childId}/zaradi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recIdovi }),
        keepalive: true,
      }).catch(() => {
        /* Učenje se ne prekida zbog mreže; kraj šalje sve ponovo. */
      });
    },
    [childId]
  );

  if (grupe.length === 0) return null;

  const dalje = () => {
    const poslednjePitanje = pitanjeBr >= provere[korak.grupa].length - 1;
    setIzabrano(null);
    if (korak.faza === "provera" && poslednjePitanje) {
      const sledecaGrupa = korak.grupa + 1;
      if (sledecaGrupa >= grupe.length) {
        onKraj([...tacni.current], true);
        return;
      }
      setKorak({ grupa: sledecaGrupa, faza: "kartice" });
      setPitanjeBr(0);
      return;
    }
    setPitanjeBr((n) => n + 1);
  };

  if (korak.faza === "kartice") {
    const grupa = grupe[korak.grupa];
    return (
      <div>
        <p className="font-heading text-[12px] font-bold uppercase tracking-[.18em]" style={{ color: PRIGUSEN }}>
          {`Nove reči, grupa ${korak.grupa + 1} od ${grupe.length}`}
        </p>
        <ul className="mt-3 space-y-2.5">
          {grupa.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-2xl border-2 px-4 py-3"
              style={{ background: PAPIR, borderColor: IVICA }}
            >
              {/* Boja roda kao traka sa strane - učionička konvencija; reči
                  bez roda dobijaju mastilo, koje ne laže ni o čemu. */}
              <span
                aria-hidden="true"
                className="block h-10 w-1.5 flex-none rounded-full"
                style={{ background: bojaZaRod(r.rod) }}
              />
              <span className="min-w-0 flex-1">
                <span lang="de" className="font-heading block text-[19px] font-bold leading-tight" style={{ color: MASTILO }}>
                  {r.rod !== "nema" ? `${r.rod} ${r.de}` : r.de}
                </span>
                <span className="block text-[15px] leading-snug" style={{ color: PRIGUSEN }}>
                  {r.sr}
                </span>
                {r.mnozina && (
                  <span lang="de" className="mt-0.5 inline-block rounded px-1.5 text-[13px] font-bold" style={{ background: BOJA_MNOZINA, color: MASTILO }}>
                    {r.mnozina}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setKorak({ grupa: korak.grupa, faza: "provera" })}
          className={`${DUGME} font-heading mt-4 block min-h-[60px] w-full text-[19px] font-bold`}
          style={{ background: MASTILO, color: "#FFFFFF" }}
        >
          Idemo na proveru
        </button>
      </div>
    );
  }

  const p = provere[korak.grupa][pitanjeBr];
  if (!p || p.igra !== "brzo-biranje") {
    // Odbrana od nemogućeg stanja (grupe su neprazne, pa provera uvek ima bar
    // jedno pitanje). NE zvati dalje() u toku crtanja - samo mirno ništa.
    return null;
  }

  return (
    <div>
      <p className="font-heading text-[12px] font-bold uppercase tracking-[.18em]" style={{ color: PRIGUSEN }}>
        {`Brza provera ${pitanjeBr + 1} od ${provere[korak.grupa].length}`}
      </p>
      <div className="mt-3 rounded-2xl border px-5 py-7 text-center" style={{ background: PAPIR, borderColor: IVICA }}>
        <p lang="de" className="font-heading text-[30px] font-bold leading-tight" style={{ color: MASTILO }}>
          {p.pitanje}
        </p>
      </div>
      <ul className="mt-4 space-y-2.5">
        {p.opcije.map((opcija) => {
          const jeTacna = opcija === p.tacan;
          const jeIzabrana = opcija === izabrano;
          const stil = !izabrano
            ? { background: PAPIR, borderColor: IVICA, color: MASTILO }
            : jeTacna
              ? { background: "#E4F0E9", borderColor: ZELENA, color: MASTILO }
              : jeIzabrana
                ? { background: "#FBE7E5", borderColor: CRVENA, color: MASTILO }
                : { background: PAPIR, borderColor: IVICA, color: PRIGUSEN };
          return (
            <li key={opcija}>
              <button
                type="button"
                disabled={izabrano !== null}
                onClick={() => {
                  setIzabrano(opcija);
                  if (jeTacna && !tacni.current.includes(p.recId)) {
                    tacni.current.push(p.recId);
                    posaljiZaradjeno([p.recId]);
                  }
                  // Bez srca i bez upisa greške: posle kratke pauze dalje.
                  setTimeout(dalje, jeTacna ? 850 : 1900);
                }}
                className={`${DUGME} font-heading block min-h-[60px] w-full border-2 px-4 py-3.5 text-left text-[19px] font-bold leading-snug motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
                style={stil}
              >
                {opcija}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => onKraj([...tacni.current], false)}
        className={`${DUGME} font-heading mt-6 block min-h-[52px] w-full border-2 text-[17px] font-bold`}
        style={{ background: "transparent", borderColor: IVICA, color: PRIGUSEN }}
      >
        Dosta za sad
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Proveri tipove**

```bash
./node_modules/.bin/tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/zack/UcenjeReci.tsx
git commit -m "feat(zack): učenje reči - kartice u grupama sa mini proverom"
```

---

## Task 10: Ekran lekcije - novi raspored, dva katanca, prolazi

**Files:**
- Modify: `src/app/zack/[childId]/lekcija/[broj]/page.tsx`
- Modify: `src/app/zack/[childId]/lekcija/[broj]/LekcijaClient.tsx`

- [ ] **Step 1: `page.tsx` - učitaj rečenice i prolaze**

Uz postojeće pozive dodaj (paralelno, u postojeći `Promise.all` ako ga ima,
inače redom):

```ts
import { receniceLekcije, stareReceniceUdzbenika, ucenjeProlazi } from "@/lib/zack/upiti";
```

```ts
  // Rečenice i prolazi učenja. Pad čitanja prolaza NE sme da zaključa vežbe:
  // kvar pada u korist deteta, pa se u tom slučaju obe faze smatraju prođenim.
  const recenice = await receniceLekcije(lekcija.id);
  const stareRecenice = await stareReceniceUdzbenika(dete.udzbenik_id, lekcija.broj);
  let prolazi: Set<string>;
  try {
    prolazi = await ucenjeProlazi(dete.id, lekcija.id);
  } catch (e) {
    console.error("[zack/lekcija] čitanje prolaza:", e);
    prolazi = new Set(["reci", "recenice"]);
  }
```

i prosledi u klijenta:

```tsx
      <LekcijaClient
        /* ...postojeći props... */
        recenice={recenice}
        stareRecenice={stareRecenice}
        pocetniProsaoReci={prolazi.has("reci")}
        pocetniProsaoRecenice={prolazi.has("recenice")}
      />
```

- [ ] **Step 2: `LekcijaClient.tsx` - novi props i stanje**

Dodaj u props tip (uz komentar u stilu datoteke):

```ts
  /** Rečenice lekcije; prazan spisak znači da lekcija nema rečenični blok. */
  recenice: Recenica[];
  stareRecenice: Recenica[];
  /**
   * Da li je dete već prošlo fazu učenja (reči odnosno rečenice). Iz baze,
   * jednom po učitavanju; unutar sesije se otključava optimistički - upis
   * prolaza sme da padne, dete zbog toga ne sme da čeka.
   */
  pocetniProsaoReci: boolean;
  pocetniProsaoRecenice: boolean;
```

sa uvozima:

```ts
import type { Recenica } from "@/lib/zack/recenice";
import UcenjeReci from "@/components/zack/UcenjeReci";
```

i stanjem:

```ts
  const [prosaoReci, setProsaoReci] = useState(pocetniProsaoReci);
  const [prosaoRecenice, setProsaoRecenice] = useState(pocetniProsaoRecenice);
  // Učenje reči ima svoj ekran, kao Milioner.
  const [ucenjeReci, setUcenjeReci] = useState(false);

  /** Upis prolaza, pošalji-i-zaboravi: otključavanje se ne naplaćuje čekanjem. */
  const posaljiProlaz = useCallback(
    (faza: "reci" | "recenice") => {
      void fetch(`/api/zack/${childId}/ucenje`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lekcijaId: lekcija.id, faza }),
        keepalive: true,
      }).catch(() => {
        /* Sledeće otvaranje će opet tražiti učenje - ništa nije oduzeto. */
      });
    },
    [childId, lekcija.id]
  );
```

- [ ] **Step 3: `LekcijaClient.tsx` - ekran učenja reči i kraj učenja**

Odmah posle Milionerove grane (`if (milioner) ...`) dodaj:

```tsx
  // ── Učenje reči zauzima ceo ekran ────────────────────────────────────────
  if (ucenjeReci) {
    return (
      <UcenjeReci
        childId={childId}
        reci={reci}
        onKraj={(tacniRecIdovi, prosloSve) => {
          setUcenjeReci(false);
          if (prosloSve) {
            // Optimistički: otključaj odmah, upis ide u pozadini.
            setProsaoReci(true);
            posaljiProlaz("reci");
          }
          void zavrsiIgru(tacniRecIdovi);
        }}
      />
    );
  }
```

Učenje rečenica ide kroz postojeću granu `if (igra)` (vrsta
`"ucenje-recenica"` u ljusci `Igra`); u `naKrajIgre` dodaj otključavanje:

```ts
  const naKrajIgre = useCallback(
    (tacniRecIdovi: string[], sprat: number) => {
      const odigrana = igra;
      setIgra(null);
      setDomet(sprat);
      if (odigrana === "skakac") void upisiRekord(sprat);
      if (odigrana === "ucenje-recenica") {
        setProsaoRecenice(true);
        posaljiProlaz("recenice");
      }
      void zavrsiIgru(tacniRecIdovi);
    },
    [igra, upisiRekord, zavrsiIgru, posaljiProlaz]
  );
```

Grana `if (igra)` prosleđuje i rečenice:

```tsx
      <Igra
        childId={childId}
        reci={reci}
        stare={stareReci}
        recenice={recenice}
        stareRecenice={stareRecenice}
        vrsta={igra}
        rekord={rekord > 0 ? rekord : null}
        onKraj={naKrajIgre}
      />
```

Napomena o „prosloSve" kod učenja rečenica: partija učenja obuhvata sve
slagalične rečenice lekcije i sesija se završava kad se sve prođu ILI kad dete
ode na „Dosta za sad". `odustani` postavlja `gotovo` bez prolaska svega - zato
prolaz „recenice" beležimo u `naKrajIgre` SAMO kad je dete stvarno stiglo do
kraja. Ljusci zato treba i podatak „da li je sesija prošla sva pitanja":
najjednostavnije - `onKraj` već prima `sprat`; dodaj TREĆI argument
`prosloSve: boolean` u potpis `onKraj` u `Igra.tsx`:

```ts
  onKraj: (tacniRecIdovi: string[], sprat: number, prosloSve: boolean) => void;
```

i u efektu kraja ljuske:

```ts
    onKrajRef.current(sesija.tacni, visina.current, sesija.indeks >= sesija.pitanja.length);
```

pa u `naKrajIgre` uslov glasi:

```ts
      if (odigrana === "ucenje-recenica" && prosloSve) {
        setProsaoRecenice(true);
        posaljiProlaz("recenice");
      }
```

(`naKrajIgre` prima `(tacniRecIdovi, sprat, prosloSve)`.)

- [ ] **Step 4: `LekcijaClient.tsx` - novi raspored sekcija**

Postojeća sekcija „Igre" se deli na tri sekcije. Redosled na ekranu:
kesica/ruka/poruke (netaknuto) → naslov → pravilo → **Učenje** → **Vežbe** →
**Rečenice** → Milioner → Album.

```tsx
      {/* ── Učenje ──────────────────────────────────────────────────────────
          Prvi korak svake lekcije: kartice u grupama pa brza provera. Uvek
          dostupno, i posle prolaska - vraćanje je poželjno, ne korak unazad. */}
      <section className="mb-8">
        <NaslovSekcije>Učenje</NaslovSekcije>
        {zakljucano ? (
          <PlocicaZakljucana naziv={NAZIVI["ucenje-reci"]} vinjeta={VINJETA["ucenje-reci"]} />
        ) : reci.length === 0 ? (
          <p
            className="rounded-2xl border border-dashed p-5 text-center text-[15px] leading-relaxed"
            style={{ borderColor: IVICA, background: PAPIR, color: PRIGUSEN }}
          >
            U ovoj lekciji još nema reči. Vrati se malo kasnije.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            <PlocicaIgre
              naziv={NAZIVI["ucenje-reci"]}
              vinjeta={VINJETA["ucenje-reci"]}
              onClick={() => {
                setPoruka(null);
                setUcenjeReci(true);
              }}
            />
            {recenice.length > 0 &&
              (prosaoReci ? (
                <PlocicaIgre
                  naziv={NAZIVI["ucenje-recenica"]}
                  vinjeta={VINJETA["ucenje-recenica"]}
                  onClick={() => {
                    setPoruka(null);
                    setDomet(0);
                    setNovRekord(false);
                    setIgra("ucenje-recenica");
                  }}
                />
              ) : (
                <PlocicaCeka naziv={NAZIVI["ucenje-recenica"]} vinjeta={VINJETA["ucenje-recenica"]} />
              ))}
          </ul>
        )}
      </section>

      {/* ── Vežbe od reči ───────────────────────────────────────────────────
          Otključava ih jednom prođeno učenje reči. Katanac je miran: kaže
          odakle se otključava, ne šta detetu fali. */}
      <section className="mb-8">
        <NaslovSekcije>Vežbe</NaslovSekcije>
        {zakljucano ? (
          /* Postojeći blok zaključanog članstva, netaknut (PORUKA_ZAKLJUCANO + pločice). */
        ) : reci.length === 0 ? (
          /* Postojeća poruka o lekciji bez reči, netaknuta. */
        ) : !prosaoReci ? (
          <>
            <p
              className="flex items-center gap-2.5 rounded-2xl border p-4 text-[15px] leading-relaxed"
              style={{ background: PAPIR, borderColor: IVICA, color: MASTILO }}
            >
              <span aria-hidden="true" className="flex-none" style={{ color: PRIGUSEN }}>
                <Katanac />
              </span>
              <span>Vežbe se otključavaju kad jednom pređeš Učenje.</span>
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-3">
              {IGRE.map((vrsta) => (
                <PlocicaZakljucana key={vrsta} naziv={NAZIVI[vrsta]} vinjeta={VINJETA[vrsta]} />
              ))}
            </ul>
          </>
        ) : (
          /* Postojeća mreža šest pločica igara, netaknuta. */
        )}
      </section>

      {/* ── Rečenice (vežbe) ────────────────────────────────────────────────
          Samo kad lekcija ima rečenice. Otključava ih učenje rečenica. */}
      {recenice.length > 0 && !zakljucano && (
        <section className="mb-8">
          <NaslovSekcije>Rečenice</NaslovSekcije>
          {!prosaoRecenice ? (
            <>
              <p
                className="flex items-center gap-2.5 rounded-2xl border p-4 text-[15px] leading-relaxed"
                style={{ background: PAPIR, borderColor: IVICA, color: MASTILO }}
              >
                <span aria-hidden="true" className="flex-none" style={{ color: PRIGUSEN }}>
                  <Katanac />
                </span>
                <span>Otključava se kad jednom pređeš Nauči rečenice.</span>
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-3">
                <PlocicaZakljucana naziv={NAZIVI.slagalica} vinjeta={VINJETA.slagalica} />
                <PlocicaZakljucana naziv={NAZIVI.dopuna} vinjeta={VINJETA.dopuna} />
              </ul>
            </>
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {(["slagalica", "dopuna"] as const).map((vrsta) => (
                <PlocicaIgre
                  key={vrsta}
                  naziv={NAZIVI[vrsta]}
                  vinjeta={VINJETA[vrsta]}
                  onClick={() => {
                    setPoruka(null);
                    setDomet(0);
                    setNovRekord(false);
                    setIgra(vrsta);
                  }}
                />
              ))}
            </ul>
          )}
        </section>
      )}
```

Za ovo izvuci iz postojeće mreže tri male komponente (u istoj datoteci, iznad
`LekcijaClient`), da se pločica ne kopira na četiri mesta:

```tsx
/** Pločica igre - dugme sa vinjetom i nazivom, isti izgled kao dosadašnja mreža. */
function PlocicaIgre({ naziv, vinjeta, onClick }: { naziv: string; vinjeta: React.ReactNode; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`${FOKUS} flex min-h-[120px] w-full flex-col items-center justify-center gap-2.5 rounded-2xl border p-3 text-center shadow-[0_3px_0_0_#DED8C8] motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]`}
        style={{ background: PAPIR, borderColor: IVICA }}
      >
        <span aria-hidden="true" className="flex h-12 items-center justify-center">{vinjeta}</span>
        <span className="block text-[15px] leading-tight" style={{ color: MASTILO, fontFamily: DISPLAY }}>
          {naziv}
        </span>
      </button>
    </li>
  );
}

/** Zaključana pločica - bledi crtež, katanac i reč „Zaključano". */
function PlocicaZakljucana({ naziv, vinjeta }: { naziv: string; vinjeta: React.ReactNode }) {
  return (
    <li>
      <div
        className="flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center"
        style={{ background: PAPIR, borderColor: IVICA }}
      >
        <span aria-hidden="true" className="flex h-12 items-center justify-center opacity-40">{vinjeta}</span>
        <span className="block text-[15px] leading-tight" style={{ color: PRIGUSEN, fontFamily: DISPLAY }}>
          {naziv}
        </span>
        <span className="font-heading flex items-center gap-1 text-[13px] font-bold" style={{ color: PRIGUSEN }}>
          <Katanac />
          Zaključano
        </span>
      </div>
    </li>
  );
}

/** Pločica koja čeka prethodni korak - kao zaključana, sa mirnim objašnjenjem. */
function PlocicaCeka({ naziv, vinjeta }: { naziv: string; vinjeta: React.ReactNode }) {
  return (
    <li>
      <div
        className="flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center"
        style={{ background: PAPIR, borderColor: IVICA }}
      >
        <span aria-hidden="true" className="flex h-12 items-center justify-center opacity-40">{vinjeta}</span>
        <span className="block text-[15px] leading-tight" style={{ color: PRIGUSEN, fontFamily: DISPLAY }}>
          {naziv}
        </span>
        <span className="font-heading text-[13px] font-bold" style={{ color: PRIGUSEN }}>
          Posle učenja reči
        </span>
      </div>
    </li>
  );
}
```

Postojeću mrežu šest igara i zaključani blok članstva prevedi na ove
komponente (ponašanje isto, koda manje). Vinjete za nove stavke u `VINJETA`
(sada `Record` po svih deset vrsta):

```tsx
/** Učenje reči: kartica sa trakom roda - ista kartica koju dete lista. */
function VinjetaUcenjeReci() {
  return (
    <span className="flex h-12 items-center">
      <span className="flex h-10 w-16 items-center gap-1.5 rounded-lg border-2 px-1.5" style={{ background: PAPIR, borderColor: IVICA }}>
        <span className="block h-6 w-1 rounded-full" style={{ background: PLAVA }} />
        <span className="block h-1.5 w-8 rounded-full" style={{ background: IVICA }} />
      </span>
    </span>
  );
}

/** Učenje rečenica i slagalica: tri pločice u redu. */
function VinjetaSlagalica() {
  return (
    <span className="flex h-12 items-center gap-1">
      {[PLAVA, CRVENA_ZNAK, ZELENA_DAS].map((boja, i) => (
        <span key={i} className="block h-7 w-9 rounded-md border-2" style={{ background: PAPIR, borderColor: boja, transform: `rotate(${i % 2 === 0 ? -3 : 3}deg)` }} />
      ))}
    </span>
  );
}

/** Dopuna: rečenica sa prazninom - dve crte i žuti umetak. */
function VinjetaDopuna() {
  return (
    <span className="flex h-12 items-center gap-1.5">
      <span className="block h-1.5 w-6 rounded-full" style={{ background: MASTILO }} />
      <span className="block h-7 w-9 rounded-md border-2" style={{ background: ZUTA, borderColor: "#FFFFFF" }} />
      <span className="block h-1.5 w-6 rounded-full" style={{ background: MASTILO }} />
    </span>
  );
}

const VINJETA: Record<VrstaIgre, React.ReactNode> = {
  parovi: <VinjetaParovi />,
  "brzo-biranje": <VinjetaMunja />,
  skakac: <VinjetaSkakac />,
  rod: <VinjetaRod />,
  mnozina: <VinjetaMnozina />,
  diktat: <VinjetaOlovka />,
  "ucenje-reci": <VinjetaUcenjeReci />,
  "ucenje-recenica": <VinjetaSlagalica />,
  slagalica: <VinjetaSlagalica />,
  dopuna: <VinjetaDopuna />,
};
```

- [ ] **Step 5: Proveri tipove, testove i lint**

```bash
./node_modules/.bin/tsc --noEmit && npm test && npm run lint
```

- [ ] **Step 6: Ručna provera u pregledaču (dev server kroz preview alat)**

Otvori lekciju probnog deteta (ZK-UDAM, „Proba 5") i proveri redom:
1. Sekcija Učenje stoji prva; Vežbe pod katancem sa porukom o učenju.
2. Prođi učenje reči do kraja → Vežbe se otključavaju bez osvežavanja.
3. Osveži stranicu → Vežbe OSTAJU otključane (prolaz upisan u bazu).
4. Lekcija bez rečenica (Maximal probna) → nema sekcije Rečenice, nema
   pločice „Nauči rečenice".
5. „Dosta za sad" usred učenja → vežbe ostaju zaključane, zarađeno iz
   provere stiže u kesicu (ništa nije propalo).

- [ ] **Step 7: Commit**

```bash
git add "src/app/zack/[childId]/lekcija/[broj]/page.tsx" "src/app/zack/[childId]/lekcija/[broj]/LekcijaClient.tsx" src/components/zack/Igra.tsx
git commit -m "feat(zack): lekcija ide učenje pa razrada, sa dva mirna katanca"
```

---

## Task 11: Admin ekran - upis rečenica

**Files:**
- Modify: `src/app/admin/zack/ZackClient.tsx`

- [ ] **Step 1: Dodaj odeljak „Rečenice lekcije" u ZackClient**

Ispod postojećeg obrasca za reči, novi odeljak sa istim udžbenikom/brojem
lekcije (koristi već izabrane `udzbenikId` i `broj`), textarea i dugme.
Format lepljenja, jedan red po rečenici, kolone tabulatorom:

```
nemačka rečenica  <TAB>  naš prevod  <TAB>  praznina  <TAB>  distraktor1; distraktor2; distraktor3  <TAB>  glavna reč  <TAB>  samo dopuna (upiši „da")
```

Parsiranje po uzoru na `parsirajSpisak` (prazan red preskoči, red bez
tabulatora upozori), pa POST na `/api/admin/zack/recenice`:

```ts
type RedRecenice = {
  de: string;
  sr: string;
  praznina: string;
  distraktori: string[];
  glavna: string;
  samoDopuna: boolean;
};

function parsirajRecenice(tekst: string): { redovi: RedRecenice[]; problemi: Problem[] } {
  const redovi: RedRecenice[] = [];
  const problemi: Problem[] = [];
  const linije = tekst.split(/\r?\n/);
  for (let i = 0; i < linije.length; i++) {
    const linija = linije[i];
    const broj = i + 1;
    if (linija.trim() === "") continue;
    const d = linija.split("\t").map((x) => x.trim());
    if (!d[0] || !d[1] || !d[2] || !d[3] || !d[4]) {
      problemi.push({ broj, poruka: "red mora imati bar 5 kolona: rečenica, prevod, praznina, pogrešni oblici, glavna reč" });
      continue;
    }
    const distraktori = d[3].split(";").map((x) => x.trim()).filter(Boolean);
    if (distraktori.length !== 3) {
      problemi.push({ broj, poruka: `u koloni pogrešnih oblika mora biti tačno 3, razdvojena sa „;" - nađeno ${distraktori.length}` });
      continue;
    }
    redovi.push({
      de: d[0],
      sr: d[1],
      praznina: d[2],
      distraktori,
      glavna: d[4],
      samoDopuna: (d[5] ?? "").toLowerCase() === "da",
    });
  }
  return { redovi, problemi };
}
```

Slanje (novo stanje `recTekst`, `recStanje` po uzoru na postojeće čuvanje):

```ts
  const sacuvajRecenice = async () => {
    const { redovi, problemi } = parsirajRecenice(recTekst);
    if (problemi.length > 0 || redovi.length === 0) return; // problemi se već ispisuju
    setRecStanje("šaljem");
    try {
      const odgovor = await fetch("/api/admin/zack/recenice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ udzbenikId, broj: Number(broj), recenice: redovi }),
      });
      const telo = await odgovor.json();
      if (!odgovor.ok) {
        setRecStanje(`Greška: ${telo.error ?? odgovor.status}`);
        return;
      }
      setRecStanje(`Upisano ${telo.upisano} rečenica.`);
    } catch {
      setRecStanje("Greška: rečenice nisu poslate");
    }
  };
```

JSX odeljak (stil kopira postojeći obrazac reči - textarea sa monospace,
uputstvo iznad, dugme ispod, ispis problema po redu):

```tsx
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Rečenice lekcije {broj}</h2>
        <p className="mt-1 text-sm text-gray-600">
          nemačka rečenica → naš prevod → praznina → 3 pogrešna oblika (razdvoji sa „;") → glavna reč → samo dopuna (upiši „da")
        </p>
        <textarea
          value={recTekst}
          onChange={(e) => setRecTekst(e.target.value)}
          rows={10}
          className="mt-2 w-full rounded border p-2 font-mono text-sm"
        />
        {/* ispis problema kao kod reči */}
        <button type="button" onClick={() => void sacuvajRecenice()} className="mt-3 rounded bg-black px-4 py-2 text-white">
          Sačuvaj rečenice
        </button>
        {recStanje && <p className="mt-2 text-sm">{recStanje}</p>}
      </section>
```

(Tačne klase uskladi sa onim što u datoteci već stoji za obrazac reči -
ekran je Natašin interni alat, važno je da se ponaša isto kao upis reči.)

- [ ] **Step 2: Proveri tipove i lint**

```bash
./node_modules/.bin/tsc --noEmit && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/zack/ZackClient.tsx
git commit -m "feat(zack): admin ekran za upis rečenica lekcije"
```

---

## Task 12: Sadržaj - nacrt ~120 rečenica za 12 lekcija

**Files:**
- Create: `/Users/natasahartweger/Documents/Claude/sajt/peti-razred-recenice-nacrt.md` (VAN repoa, uz postojeći nacrt programa)

- [ ] **Step 1: Napiši nacrt rečenica**

Za svaku od 12 lekcija (`nemacki-5-razred`) ~10 rečenica u tab-formatu
admin upisa. Pravila sastavljanja (sva su OBAVEZNA):
- Samo reči obrađene DO te lekcije (uključivo) - proveri svaku reč prema
  spiskovima u `sajt/peti-razred-program-nacrt.md`.
- Samo gramatika obrađena do te lekcije (npr. lekcija 2 sme red reči i
  W-pitanja, ne sme imperativ; dativ tek od lekcije 6).
- Gde god može, doslovni primeri iz Pravilnika 15/2018 (nacrt ih navodi).
- Slagalične rečenice: 3-6 reči, JEDAN ispravan redosled; sve sa više
  redosleda označi „da" u koloni samo dopuna.
- Praznina cilja gramatičku poentu lekcije (nastavak glagola, član,
  prisvojni...), distraktori su oblici iste reči, ne druge reči.
- Glavna reč = reč TE lekcije koja je težište rečenice.
- Rečenice ne oslovljavaju dete i ne pretpostavljaju rod čitaoca.
- Svaka velika prva reč mora biti ili imenica te lekcije ili u `VELIKA_UVEK`
  (recenice.ts) - ako zatreba novo ime, dodaj ga u `VELIKA_UVEK` u istom
  commitu.
- Nesigurna mesta označi „PROVERITI" na kraju reda, kao u nacrtu programa.

Primer bloka za lekciju 2 (Das bin ich), format spreman za lepljenje:

```
Ich komme aus Serbien.	Dolazim iz Srbije.	komme	kommst; kommt; kommen	kommen	
Wie heißt du?	Kako se zoveš?	heißt	heiße; heißen; heißest	heißen	
Wo wohnst du?	Gde stanuješ?	wohnst	wohne; wohnt; wohnen	wohnen	
Das ist Frau Simin.	Ovo je gospođa Simin.	ist	bin; bist; sind	sein	
Ich bin elf Jahre alt.	Imam jedanaest godina.	bin	bist; ist; sind	sein	PROVERITI: „elf" nije u spisku reči lekcije
Woher kommst du?	Odakle dolaziš?	kommst	komme; kommt; kommen	kommen	
Ich wohne in Smederevo.	Stanujem u Smederevu.	wohne	wohnst; wohnt; wohnen	wohnen	
Wer ist das?	Ko je to?	ist	bin; bist; seid	sein	
Ich lebe in Serbien.	Živim u Srbiji.	lebe	lebst; lebt; leben	leben	
Wie alt bist du?	Koliko imaš godina?	bist	bin; ist; sind	alt	PROVERITI: glavna reč
```

- [ ] **Step 2: Test sadržaja - velika prva slova**

Dodaj test u `src/lib/zack/recenice.test.ts` koji nad korpusom (kad bude
upisan u bazu - do tada nad primerima iz nacrta zalepljenim u test fixture)
proverava da `prikazPlocica` za svaku rečenicu spušta prvu reč ili je
opravdano ostavlja velikom. Minimalno:

```ts
it("nijedna velika prva reč korpusa nije neobjašnjena", () => {
  // Fixture: prve reči iz nacrta rečenica koje počinju velikim slovom,
  // a nisu imenice - sve moraju biti u VELIKA_UVEK.
  const prve = ["Sie", "Anna", "Frau", "Herr"];
  for (const r of prve) expect(VELIKA_UVEK.has(r)).toBe(true);
});
```

- [ ] **Step 3: Pošalji nacrt Nataši na pregled**

SendUserFile sa nacrtom. **STOP - dalje se ne ide dok Nataša ne pregleda i
ne odobri spisak.** Ispravke se unose u nacrt, pa tek onda upis u bazu kroz
admin ekran (Task 13).

- [ ] **Step 4: Commit (samo test; nacrt živi van repoa)**

```bash
git add src/lib/zack/recenice.test.ts
git commit -m "test(zack): provera velikih prvih slova korpusa rečenica"
```

---

## Task 13: Upis sadržaja + deploy + smoke test

**Preduslovi:** Nataša odobrila nacrt rečenica (Task 12); migracija iz Taska 1
davno primenjena.

- [ ] **Step 1: NAJAVA** - pre push-a na main obavezno najaviti Nataši
  (pravilo toka: save/commit/push/deploy se najavljuje PRE). Push na main je
  produkcija.

- [ ] **Step 2: Deploy**

```bash
git push origin main
```
pa `vercel --prod` iz `LMS/lms` ako auto-deploy ne pokrije (postojeća praksa).

- [ ] **Step 3: Upis rečenica kroz admin ekran**

Za svaku od 12 lekcija: nalepi blok iz odobrenog nacrta u „Rečenice lekcije",
sačuvaj, proveri odgovor „Upisano N rečenica."

- [ ] **Step 4: Smoke test na produkciji (OBAVEZAN)**

Na ZK-UDAM („Proba 5"):
1. Lekcija 1: Učenje reči → grupe → provere → vežbe se otključavaju →
   kesica stiže → album se puni.
2. Nauči rečenice → pokaži pa složi → slagalica i dopuna se otključavaju.
3. Slagalica: pogrešan redosled troši srce i pokazuje tačnu rečenicu;
   tačan daje „Zack!" i sličicu glavne reči u kesici.
4. Dopuna: praznina od 6 crta, 4 opcije, prevod ispod.
5. Osveži stranicu: sve otključano OSTAJE otključano.
6. Lekcija bez rečenica: nema sekcije Rečenice, ništa ne puca.
7. Kasnija lekcija (npr. 3): u slagalici/dopuni se povremeno pojavi stara
   rečenica (ponavljanje preko glavne reči).
8. Konzola pregledača i Vercel logovi: bez grešaka.

- [ ] **Step 5: Ažuriraj memoriju projekta**

U `memory/project_zack_decja_aplikacija.md` dopuni stanje: nova struktura
lekcije (učenje → vežbe → rečenice), nove tabele, gde stoji nacrt rečenica,
šta je otvoreno (pilot!).

---

## Redosled i zavisnosti

```
Task 1 (SQL) ──┬─→ Task 5 (upiti) ─→ Task 10 (ekran lekcije)
Task 2 (recenice.ts) ─┬─→ Task 4 (upis-provera) ─→ Task 7 (admin ruta) ─→ Task 11 (admin ekran)
                      └─→ Task 8 (tela igara) ─→ Task 10
Task 3 (ucenje.ts) ─→ Task 9 (UcenjeReci) ─→ Task 10
Task 6 (ruta prolaza) ─→ Task 10
Task 12 (sadržaj + Natašin pregled) ─→ Task 13 (upis + deploy + smoke)
```

Taskovi 2, 3, 4, 6 mogu paralelno posle Taska 1. Task 13 tek posle Natašinog
odobrenja sadržaja i najave deploya.
