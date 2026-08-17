# zack! prva celina, plan implementacije

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dete otvori `/zack/<id>`, vidi stazu lekcija svog udžbenika, uđe u lekciju, pročita podsetnik, odigra igru iz spiska reči, dobije kesicu sa sličicama i zalepi ih u album.

**Architecture:** Sve živi u postojećem LMS Next.js projektu, pod `/zack` (dete) i `/admin/zack` (unos sadržaja). Sva logika koja se može testirati je čista i stoji u `src/lib/zack/*.ts` uz vitest testove; React komponente su tanke i samo prikazuju to stanje. Dečji deo nikad ne pipa Supabase direktno iz pretraživača, nego isključivo kroz `/api/zack/*` rute koje koriste service-role klijent, pa RLS ostaje potpuno zatvoren.

**Tech Stack:** Next.js 16.2.10 (App Router), React 19.2.4, TypeScript, Tailwind v4, Supabase (Postgres + service-role klijent), vitest 4 u `node` okruženju.

---

## Opseg i jedno svesno sužavanje

Specifikacija (`docs/superpowers/specs/2026-08-17-decji-nemacki-design.md`) predviđa da prvi plan pokrije korake 1-4. **Ovaj plan pokriva korake 1-3.** Nagradna arkada (korak 4) je izdvojena u sledeći plan.

Razlog: specifikacija sama kaže da je *„prva prava provera posle koraka 3"*, jer se tada može pokazati detetu i videti da li se vraća. Arkada je nagradni sloj iznad svega ostalog i ne menja ništa u sadržajnom modelu, igrama ni albumu, pa je čistije da se doda kad se osnovni tok pokaže dobar. Ako želiš arkadu u istoj isporuci, reci i dopisujem taskove 15-17.

## Šta ovaj plan NAMERNO ne radi

- **Nema PIN prijave deteta.** To je korak 8 u specifikaciji. Do tada se dete identifikuje UUID-om u adresi (`/zack/<childId>`). Za pilot sa desetak dece je prihvatljivo, ali **u bazi ne sme da stoji ništa osim imena deteta** i to se izričito proverava u Tasku 1.
- **Nema igara iz rečenica** (Slaganje, Popuni prazninu, Čat, Konjugacija). To je korak 5.
- **Nema bledenja sličica u pozadinskom poslu.** Bledenje se računa u trenutku čitanja (`stanjeAlbuma`), što je dovoljno i ne traži cron.
- **Nema roditeljskog dela, naplate, duela ni Milionera.**

Dva mesta gde je prva verzija namerno jednostavnija od specifikacije:

- **Der-Die-Das je tapkanje, ne svlačenje u tri korpe.** Svlačenje traži rad sa
  dodirom i pokretom koji se ne može pokriti postojećim testovima, a pedagoški
  efekat je isti. Prava mehanika sa svlačenjem dolazi zajedno sa Der-Die-Das
  skakačem (korak 6), gde je i pravo mesto za nju.
- **Lepljenje imenice još nije vežba roda.** Specifikacija traži da se album pri
  lepljenju skupi na tri polja po rodu i da dete spusti sličicu u tačno. Ovde se
  sličica samo tapne. Razlog je isti, svlačenje, i dodaje se u istom koraku.

## Struktura fajlova

**Čista logika, testira se (`src/lib/zack/`):**

| Fajl | Odgovornost |
|---|---|
| `rec.ts` | Tipovi reči, boja po rodu, `promesaj` sa ubrizganim slučajnim brojem |
| `pitanja.ts` | Pravljenje pitanja za pet igara iz spiska reči, uključujući izbor pogrešnih ponuđenih odgovora |
| `sesija.ts` | Tok jedne odigrane igre: redosled pitanja, srca, kraj |
| `album.ts` | Stanje albuma: prazno, u ruci, zalepljeno, izbledelo, i brojač |
| `kesica.ts` | Šta ulazi u kesicu posle odigrane igre |
| `niz.ts` | Niz dana zaredom sa bar jednom odigranom igrom |
| `upiti.ts` | Zajednički Supabase upiti dečjeg dela (jedino ovde ima mreže) |

**Serverske rute (`src/app/api/`):**

| Fajl | Odgovornost |
|---|---|
| `admin/zack/lekcija/route.ts` | POST: upis lekcije sa spiskom reči (samo admin) |
| `zack/[childId]/staza/route.ts` | GET: udžbenik deteta, lekcije, koliko sličica po lekciji |
| `zack/[childId]/lekcija/[broj]/route.ts` | GET: podsetnik i reči lekcije, GET stanje albuma |
| `zack/[childId]/odgovor/route.ts` | POST: beleži tačan odgovor, osvežava `poslednje_tacno_at` |
| `zack/[childId]/kesica/route.ts` | POST: otvara kesicu posle igre, vraća sličice u ruci |
| `zack/[childId]/zalepi/route.ts` | POST: lepi sličicu u album |

**Ekrani:**

| Fajl | Odgovornost |
|---|---|
| `src/app/admin/zack/page.tsx` + `ZackClient.tsx` | Unos lekcije |
| `src/app/zack/[childId]/page.tsx` + `StazaClient.tsx` | Staza lekcija |
| `src/app/zack/[childId]/lekcija/[broj]/page.tsx` + `LekcijaClient.tsx` | Podsetnik i izbor igre |
| `src/components/zack/Igra.tsx` | Zajednička ljuska igre: srca, napredak, tok |
| `src/components/zack/igre/*.tsx` | Pet igara |
| `src/components/zack/Album.tsx` | Album i lepljenje |
| `src/components/zack/Slicica.tsx` | Jedna sličica, sva stanja |

---

## Task 1: Baza, tabele i RLS

**Files:**
- Create: `supabase/migrations/083_zack.sql`

- [ ] **Step 1: Napiši migraciju**

Poslednja numerisana migracija u projektu je `082_nh_academy_gen2_cena.sql`, pa nova nosi broj 083.

```sql
-- zack: dečja aplikacija za nemački (5-8. razred), prva celina.
-- Sadržajni model + album sa sličicama. Igre iz rečenica dolaze kasnije.
--
-- VAŽNO o privatnosti: zack_deca sme da sadrži SAMO ime deteta. Bez prezimena,
-- bez mejla, bez datuma rođenja. Dete se u ovoj fazi identifikuje UUID-om u
-- adresi, pa je svaki dodatni lični podatak nepotreban rizik.

CREATE TYPE zack_rod AS ENUM ('der', 'die', 'das', 'nema');
CREATE TYPE zack_vrsta AS ENUM ('imenica', 'glagol', 'pridev', 'ostalo');

CREATE TABLE public.zack_udzbenici (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  izdavac    TEXT NOT NULL,
  naziv      TEXT NOT NULL,
  razred     SMALLINT NOT NULL CHECK (razred BETWEEN 5 AND 8),
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.zack_lekcije (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  udzbenik_id    UUID NOT NULL REFERENCES public.zack_udzbenici(id) ON DELETE CASCADE,
  broj           SMALLINT NOT NULL CHECK (broj > 0),
  naziv          TEXT NOT NULL,
  pravilo_naslov TEXT,
  pravilo_tekst  TEXT,
  pravilo_primer TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (udzbenik_id, broj)
);

CREATE TABLE public.zack_reci (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lekcija_id UUID NOT NULL REFERENCES public.zack_lekcije(id) ON DELETE CASCADE,
  redni_broj SMALLINT NOT NULL CHECK (redni_broj > 0),
  de         TEXT NOT NULL,
  sr         TEXT NOT NULL,
  rod        zack_rod NOT NULL DEFAULT 'nema',
  mnozina    TEXT,
  vrsta      zack_vrsta NOT NULL DEFAULT 'ostalo',
  izuzetak   BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (lekcija_id, redni_broj)
);

CREATE INDEX idx_zack_reci_lekcija ON public.zack_reci(lekcija_id);

CREATE TABLE public.zack_deca (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ime         TEXT NOT NULL,
  udzbenik_id UUID NOT NULL REFERENCES public.zack_udzbenici(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.zack_slicice (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dete_id            UUID NOT NULL REFERENCES public.zack_deca(id) ON DELETE CASCADE,
  rec_id             UUID NOT NULL REFERENCES public.zack_reci(id) ON DELETE CASCADE,
  zaradjena_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  zalepljena_at      TIMESTAMPTZ,
  poslednje_tacno_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dete_id, rec_id)
);

CREATE INDEX idx_zack_slicice_dete ON public.zack_slicice(dete_id);

-- RLS: potpuno zatvoreno za anon i authenticated. Dečja aplikacija čita
-- ISKLJUČIVO kroz /api/zack/* rute koje koriste service-role klijent i time
-- zaobilaze RLS. Ovo je namerno, da se ne ponovi slučaj sa javno čitljivim
-- vežbama.
ALTER TABLE public.zack_udzbenici ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zack_lekcije   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zack_reci      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zack_deca      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zack_slicice   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage zack_udzbenici" ON public.zack_udzbenici
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins manage zack_lekcije" ON public.zack_lekcije
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins manage zack_reci" ON public.zack_reci
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins manage zack_deca" ON public.zack_deca
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins manage zack_slicice" ON public.zack_slicice
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
```

- [ ] **Step 2: Primeni migraciju**

Migracije se u ovom projektu primenjuju service-role vezom, ne `supabase db push`. Otvori SQL editor u Supabase konzoli, nalepi ceo sadržaj fajla i pokreni.

Očekivano: `Success. No rows returned.`

- [ ] **Step 3: Proveri da su tabele nastale**

U SQL editoru pokreni:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'zack_%'
ORDER BY table_name;
```

Očekivano: pet redova, `zack_deca`, `zack_lekcije`, `zack_reci`, `zack_slicice`, `zack_udzbenici`.

- [ ] **Step 4: Proveri da je RLS zatvoren za anon**

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'zack_%';
```

Očekivano: `rowsecurity = true` za svih pet tabela.

- [ ] **Step 5: Osveži tipove**

```bash
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" --schema public > src/lib/supabase/database.types.ts
```

Očekivano: fajl sadrži `zack_reci`. Proveri sa `grep -c zack_reci src/lib/supabase/database.types.ts`, očekivano broj veći od nule.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/083_zack.sql src/lib/supabase/database.types.ts
git commit -m "feat(zack): sadržajni model i album, tabele sa zatvorenim RLS"
```

---

## Task 2: Tipovi reči, boja po rodu, mešanje

**Files:**
- Create: `src/lib/zack/rec.ts`
- Test: `src/lib/zack/rec.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
import { describe, it, expect } from "vitest";
import { bojaZaRod, promesaj, ROD_BOJA } from "./rec";

describe("bojaZaRod", () => {
  it("der je plava, die crvena, das žuta", () => {
    expect(bojaZaRod("der")).toBe("#0B54C9");
    expect(bojaZaRod("die")).toBe("#E5342A");
    expect(bojaZaRod("das")).toBe("#FFC400");
  });

  it("reč bez roda dobija mastilo", () => {
    expect(bojaZaRod("nema")).toBe("#16161A");
  });

  it("paleta ima tačno četiri unosa", () => {
    expect(Object.keys(ROD_BOJA)).toHaveLength(4);
  });
});

describe("promesaj", () => {
  it("ne menja polazni niz", () => {
    const polazni = ["a", "b", "c"];
    promesaj(polazni, () => 0);
    expect(polazni).toEqual(["a", "b", "c"]);
  });

  it("je predvidljiv kad je slučajni broj uvek nula", () => {
    expect(promesaj(["a", "b", "c"], () => 0)).toEqual(["b", "c", "a"]);
  });

  it("zadržava sve elemente", () => {
    const rezultat = promesaj([1, 2, 3, 4, 5], () => 0.5);
    expect([...rezultat].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
```

- [ ] **Step 2: Pokreni test i potvrdi da pada**

Run: `npx vitest run src/lib/zack/rec.test.ts`
Expected: FAIL, `Failed to resolve import "./rec"`

- [ ] **Step 3: Napiši implementaciju**

```ts
// Osnovni tipovi i sitni alati za zack. Sve ostalo u lib/zack se oslanja na ovo.

export type Rod = "der" | "die" | "das" | "nema";
export type Vrsta = "imenica" | "glagol" | "pridev" | "ostalo";

export type Rec = {
  id: string;
  redni_broj: number;
  de: string;
  sr: string;
  rod: Rod;
  mnozina: string | null;
  vrsta: Vrsta;
  izuzetak: boolean;
};

/** Boja sličice po rodu. Iste tri boje se koriste u nemačkim učionicama. */
export const ROD_BOJA: Record<Rod, string> = {
  der: "#0B54C9",
  die: "#E5342A",
  das: "#FFC400",
  nema: "#16161A",
};

export function bojaZaRod(rod: Rod): string {
  return ROD_BOJA[rod];
}

/**
 * Fisher-Yates, sa ubrizganim izvorom slučajnosti da bi se moglo testirati.
 * Polazni niz ostaje netaknut.
 */
export function promesaj<T>(niz: readonly T[], rng: () => number): T[] {
  const kopija = [...niz];
  for (let i = kopija.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [kopija[i], kopija[j]] = [kopija[j], kopija[i]];
  }
  return kopija;
}
```

- [ ] **Step 4: Pokreni test i potvrdi da prolazi**

Run: `npx vitest run src/lib/zack/rec.test.ts`
Expected: PASS, 6 testova

- [ ] **Step 5: Commit**

```bash
git add src/lib/zack/rec.ts src/lib/zack/rec.test.ts
git commit -m "feat(zack): tipovi reči, boja po rodu, mešanje sa ubrizganom slučajnošću"
```

---

## Task 3: Pravljenje pitanja za igre iz spiska reči

Ovo je srce prve celine. Pet igara se hrani iz iste tabele reči, bez ijednog dodatnog unosa.

**Files:**
- Create: `src/lib/zack/pitanja.ts`
- Test: `src/lib/zack/pitanja.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
import { describe, it, expect } from "vitest";
import type { Rec } from "./rec";
import { napraviPitanja, ponudjeni } from "./pitanja";

const R = (i: number, over: Partial<Rec> = {}): Rec => ({
  id: `r${i}`,
  redni_broj: i,
  de: `de${i}`,
  sr: `sr${i}`,
  rod: "der",
  mnozina: `mn${i}`,
  vrsta: "imenica",
  izuzetak: false,
  ...over,
});

const RECI = [R(1), R(2), R(3), R(4), R(5), R(6)];
const nula = () => 0;

describe("ponudjeni", () => {
  it("stavlja tačan odgovor i tri pogrešna", () => {
    const opcije = ponudjeni("sr1", ["sr2", "sr3", "sr4", "sr5"], 4, nula);
    expect(opcije).toHaveLength(4);
    expect(opcije).toContain("sr1");
  });

  it("nikad ne ponavlja tačan odgovor među pogrešnima", () => {
    const opcije = ponudjeni("sr1", ["sr1", "sr2", "sr3"], 4, nula);
    expect(opcije.filter((o) => o === "sr1")).toHaveLength(1);
  });

  it("kad nema dovoljno pogrešnih, vraća koliko ih ima", () => {
    const opcije = ponudjeni("sr1", ["sr2"], 4, nula);
    expect(opcije).toHaveLength(2);
  });

  it("izbacuje duplikate među pogrešnima", () => {
    const opcije = ponudjeni("sr1", ["sr2", "sr2", "sr3"], 4, nula);
    expect(opcije).toHaveLength(3);
  });
});

describe("napraviPitanja, brzo-biranje", () => {
  it("pravi traženi broj pitanja sa četiri ponuđena odgovora", () => {
    const p = napraviPitanja(RECI, "brzo-biranje", 3, nula);
    expect(p).toHaveLength(3);
    expect(p[0]).toMatchObject({ igra: "brzo-biranje" });
    if (p[0].igra !== "brzo-biranje") throw new Error("pogrešna igra");
    expect(p[0].opcije).toHaveLength(4);
    expect(p[0].opcije).toContain(p[0].tacan);
  });
});

describe("napraviPitanja, rod", () => {
  it("uzima samo imenice koje imaju rod", () => {
    const reci = [R(1, { rod: "der" }), R(2, { rod: "nema", vrsta: "glagol" }), R(3, { rod: "das" })];
    const p = napraviPitanja(reci, "rod", 10, nula);
    expect(p).toHaveLength(2);
    if (p[0].igra !== "rod") throw new Error("pogrešna igra");
    expect(["der", "die", "das"]).toContain(p[0].tacan);
  });
});

describe("napraviPitanja, mnozina", () => {
  it("preskače reči bez upisane množine", () => {
    const reci = [R(1, { mnozina: "Häuser" }), R(2, { mnozina: null }), R(3, { mnozina: "Bäume" })];
    const p = napraviPitanja(reci, "mnozina", 10, nula);
    expect(p).toHaveLength(2);
  });
});

describe("napraviPitanja, diktat", () => {
  it("pita prevod i očekuje nemačku reč", () => {
    const p = napraviPitanja([R(1)], "diktat", 1, nula);
    expect(p[0]).toEqual({ igra: "diktat", recId: "r1", prevod: "sr1", tacan: "de1" });
  });
});

describe("napraviPitanja, parovi", () => {
  it("vraća jedno pitanje sa najviše šest parova", () => {
    const p = napraviPitanja(RECI, "parovi", 6, nula);
    expect(p).toHaveLength(1);
    if (p[0].igra !== "parovi") throw new Error("pogrešna igra");
    expect(p[0].parovi).toHaveLength(6);
  });
});

describe("napraviPitanja, granice", () => {
  it("na prazan spisak reči vraća prazno", () => {
    expect(napraviPitanja([], "brzo-biranje", 5, nula)).toEqual([]);
  });

  it("ne pravi više pitanja nego što ima reči", () => {
    expect(napraviPitanja([R(1), R(2)], "brzo-biranje", 10, nula)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Pokreni test i potvrdi da pada**

Run: `npx vitest run src/lib/zack/pitanja.test.ts`
Expected: FAIL, `Failed to resolve import "./pitanja"`

- [ ] **Step 3: Napiši implementaciju**

```ts
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
```

- [ ] **Step 4: Pokreni test i potvrdi da prolazi**

Run: `npx vitest run src/lib/zack/pitanja.test.ts`
Expected: PASS, 11 testova

- [ ] **Step 5: Commit**

```bash
git add src/lib/zack/pitanja.ts src/lib/zack/pitanja.test.ts
git commit -m "feat(zack): pravljenje pitanja za pet igara iz spiska reči"
```

---

## Task 4: Tok jedne odigrane igre i srca

**Files:**
- Create: `src/lib/zack/sesija.ts`
- Test: `src/lib/zack/sesija.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
import { describe, it, expect } from "vitest";
import type { Pitanje } from "./pitanja";
import { novaSesija, odgovori, SRCA, tacniRecIdovi } from "./sesija";

const P = (i: number): Pitanje => ({
  igra: "diktat",
  recId: `r${i}`,
  prevod: `sr${i}`,
  tacan: `de${i}`,
});

describe("novaSesija", () => {
  it("kreće od prvog pitanja sa punim srcima", () => {
    const s = novaSesija([P(1), P(2), P(3)]);
    expect(s.indeks).toBe(0);
    expect(s.srca).toBe(SRCA);
    expect(s.gotovo).toBe(false);
    expect(s.tacni).toEqual([]);
  });

  it("prazna igra je odmah gotova", () => {
    expect(novaSesija([]).gotovo).toBe(true);
  });
});

describe("odgovori", () => {
  it("tačan odgovor pomera na sledeće pitanje i pamti reč", () => {
    const s = odgovori(novaSesija([P(1), P(2)]), true);
    expect(s.indeks).toBe(1);
    expect(s.srca).toBe(SRCA);
    expect(s.tacni).toEqual(["r1"]);
  });

  it("netačan odgovor uzima srce ali takođe ide dalje", () => {
    const s = odgovori(novaSesija([P(1), P(2)]), false);
    expect(s.indeks).toBe(1);
    expect(s.srca).toBe(SRCA - 1);
    expect(s.tacni).toEqual([]);
  });

  it("igra se završava kad se odgovori na poslednje pitanje", () => {
    let s = novaSesija([P(1), P(2)]);
    s = odgovori(s, true);
    s = odgovori(s, true);
    expect(s.gotovo).toBe(true);
    expect(s.tacni).toEqual(["r1", "r2"]);
  });

  it("igra se završava kad nestanu srca", () => {
    let s = novaSesija([P(1), P(2), P(3), P(4), P(5)]);
    for (let i = 0; i < SRCA; i++) s = odgovori(s, false);
    expect(s.srca).toBe(0);
    expect(s.gotovo).toBe(true);
  });

  it("odgovor na gotovu igru ništa ne menja", () => {
    const gotova = { ...novaSesija([P(1)]), gotovo: true };
    expect(odgovori(gotova, true)).toEqual(gotova);
  });

  it("ista reč se ne upisuje dvaput", () => {
    let s = novaSesija([P(1), P(1)]);
    s = odgovori(s, true);
    s = odgovori(s, true);
    expect(s.tacni).toEqual(["r1"]);
  });
});

describe("tacniRecIdovi", () => {
  it("parovi upisuju sve reči odjednom kad su svi parovi spojeni", () => {
    const parovi: Pitanje = {
      igra: "parovi",
      parovi: [
        { recId: "r1", de: "a", sr: "b" },
        { recId: "r2", de: "c", sr: "d" },
      ],
    };
    expect(tacniRecIdovi(parovi)).toEqual(["r1", "r2"]);
  });

  it("ostale igre daju jednu reč", () => {
    expect(tacniRecIdovi(P(7))).toEqual(["r7"]);
  });
});
```

- [ ] **Step 2: Pokreni test i potvrdi da pada**

Run: `npx vitest run src/lib/zack/sesija.test.ts`
Expected: FAIL, `Failed to resolve import "./sesija"`

- [ ] **Step 3: Napiši implementaciju**

```ts
// Tok jedne odigrane igre. Čista funkcija stanja, bez ijednog poziva ka mreži,
// da bi komponenta igre mogla da bude tanka.
import type { Pitanje } from "./pitanja";

/** Srca su životi unutar igre, ne dnevni limit. Aplikacija je plaćena. */
export const SRCA = 3;

export type Sesija = {
  pitanja: Pitanje[];
  indeks: number;
  srca: number;
  tacni: string[];
  gotovo: boolean;
};

/** Koje reči jedno pitanje pokriva. Parovi pokrivaju sve svoje odjednom. */
export function tacniRecIdovi(p: Pitanje): string[] {
  return p.igra === "parovi" ? p.parovi.map((x) => x.recId) : [p.recId];
}

export function novaSesija(pitanja: Pitanje[]): Sesija {
  return {
    pitanja,
    indeks: 0,
    srca: SRCA,
    tacni: [],
    gotovo: pitanja.length === 0,
  };
}

export function odgovori(s: Sesija, tacno: boolean): Sesija {
  if (s.gotovo) return s;

  const srca = tacno ? s.srca : s.srca - 1;
  const tacni = tacno
    ? [...s.tacni, ...tacniRecIdovi(s.pitanja[s.indeks]).filter((id) => !s.tacni.includes(id))]
    : s.tacni;
  const indeks = s.indeks + 1;

  return {
    ...s,
    indeks,
    srca,
    tacni,
    gotovo: srca <= 0 || indeks >= s.pitanja.length,
  };
}
```

- [ ] **Step 4: Pokreni test i potvrdi da prolazi**

Run: `npx vitest run src/lib/zack/sesija.test.ts`
Expected: PASS, 10 testova

- [ ] **Step 5: Commit**

```bash
git add src/lib/zack/sesija.ts src/lib/zack/sesija.test.ts
git commit -m "feat(zack): tok igre i srca kao čisto stanje"
```

---

## Task 5: Stanje albuma i bledenje

**Files:**
- Create: `src/lib/zack/album.ts`
- Test: `src/lib/zack/album.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
import { describe, it, expect } from "vitest";
import type { Rec } from "./rec";
import { brojac, DANA_DO_BLEDENJA, stanjeAlbuma, type ZapisSlicice } from "./album";

const R = (i: number, over: Partial<Rec> = {}): Rec => ({
  id: `r${i}`,
  redni_broj: i,
  de: `de${i}`,
  sr: `sr${i}`,
  rod: "der",
  mnozina: null,
  vrsta: "imenica",
  izuzetak: false,
  ...over,
});

const SADA = new Date("2026-08-17T12:00:00Z");
const preDana = (n: number) =>
  new Date(SADA.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

const Z = (recId: string, over: Partial<ZapisSlicice> = {}): ZapisSlicice => ({
  rec_id: recId,
  zalepljena_at: preDana(1),
  poslednje_tacno_at: preDana(1),
  ...over,
});

describe("stanjeAlbuma", () => {
  it("reč bez zapisa je prazno mesto", () => {
    const [s] = stanjeAlbuma([R(1)], [], SADA);
    expect(s.stanje).toBe("prazno");
    expect(s.rec.de).toBe("de1");
  });

  it("zarađena a nezalepljena sličica je u ruci", () => {
    const [s] = stanjeAlbuma([R(1)], [Z("r1", { zalepljena_at: null })], SADA);
    expect(s.stanje).toBe("u-ruci");
  });

  it("skoro ponovljena sličica je zalepljena", () => {
    const [s] = stanjeAlbuma([R(1)], [Z("r1")], SADA);
    expect(s.stanje).toBe("zalepljena");
  });

  it("sličica bledi posle praga bez ponavljanja", () => {
    const [s] = stanjeAlbuma(
      [R(1)],
      [Z("r1", { poslednje_tacno_at: preDana(DANA_DO_BLEDENJA + 1) })],
      SADA
    );
    expect(s.stanje).toBe("izbledela");
  });

  it("tačno na pragu još ne bledi", () => {
    const [s] = stanjeAlbuma(
      [R(1)],
      [Z("r1", { poslednje_tacno_at: preDana(DANA_DO_BLEDENJA) })],
      SADA
    );
    expect(s.stanje).toBe("zalepljena");
  });

  it("nezalepljena sličica ne bledi, jer je dete još nije ni zalepilo", () => {
    const [s] = stanjeAlbuma(
      [R(1)],
      [Z("r1", { zalepljena_at: null, poslednje_tacno_at: preDana(90) })],
      SADA
    );
    expect(s.stanje).toBe("u-ruci");
  });

  it("čuva redosled iz lekcije", () => {
    const stanja = stanjeAlbuma([R(3), R(1), R(2)], [], SADA);
    expect(stanja.map((s) => s.rec.redni_broj)).toEqual([1, 2, 3]);
  });

  it("zapis za nepostojeću reč se ignoriše", () => {
    const stanja = stanjeAlbuma([R(1)], [Z("r1"), Z("r99")], SADA);
    expect(stanja).toHaveLength(1);
  });
});

describe("brojac", () => {
  it("broji samo zalepljene, izbledele se računaju kao zalepljene", () => {
    const stanja = stanjeAlbuma(
      [R(1), R(2), R(3), R(4)],
      [
        Z("r1"),
        Z("r2", { poslednje_tacno_at: preDana(DANA_DO_BLEDENJA + 5) }),
        Z("r3", { zalepljena_at: null }),
      ],
      SADA
    );
    expect(brojac(stanja)).toEqual({ zalepljene: 2, ukupno: 4 });
  });

  it("prazan album je nula od nula", () => {
    expect(brojac([])).toEqual({ zalepljene: 0, ukupno: 0 });
  });
});
```

- [ ] **Step 2: Pokreni test i potvrdi da pada**

Run: `npx vitest run src/lib/zack/album.test.ts`
Expected: FAIL, `Failed to resolve import "./album"`

- [ ] **Step 3: Napiši implementaciju**

```ts
// Stanje albuma se računa u trenutku čitanja, ne pozadinskim poslom.
// Bledenje je time besplatno i nema crona koji može da zakaže.
import type { Rec } from "./rec";

/** Posle koliko dana bez tačnog odgovora sličica posivi. */
export const DANA_DO_BLEDENJA = 21;

export type ZapisSlicice = {
  rec_id: string;
  zalepljena_at: string | null;
  poslednje_tacno_at: string;
};

export type Stanje = "prazno" | "u-ruci" | "zalepljena" | "izbledela";

export type StavkaAlbuma = { rec: Rec; stanje: Stanje };

const DAN = 24 * 60 * 60 * 1000;

export function stanjeAlbuma(
  reci: readonly Rec[],
  zapisi: readonly ZapisSlicice[],
  sada: Date
): StavkaAlbuma[] {
  const poRecId = new Map(zapisi.map((z) => [z.rec_id, z]));

  return [...reci]
    .sort((a, b) => a.redni_broj - b.redni_broj)
    .map((rec) => {
      const z = poRecId.get(rec.id);
      if (!z) return { rec, stanje: "prazno" as const };
      if (!z.zalepljena_at) return { rec, stanje: "u-ruci" as const };

      const dana = (sada.getTime() - new Date(z.poslednje_tacno_at).getTime()) / DAN;
      return { rec, stanje: dana > DANA_DO_BLEDENJA ? ("izbledela" as const) : ("zalepljena" as const) };
    });
}

/**
 * Brojač koji vidi i dete i roditelj. Izbledela sličica se i dalje broji kao
 * zalepljena, jer detetu ništa nije oduzeto, samo je pobledelo.
 */
export function brojac(stavke: readonly StavkaAlbuma[]): { zalepljene: number; ukupno: number } {
  return {
    zalepljene: stavke.filter((s) => s.stanje === "zalepljena" || s.stanje === "izbledela").length,
    ukupno: stavke.length,
  };
}
```

- [ ] **Step 4: Pokreni test i potvrdi da prolazi**

Run: `npx vitest run src/lib/zack/album.test.ts`
Expected: PASS, 10 testova

- [ ] **Step 5: Commit**

```bash
git add src/lib/zack/album.ts src/lib/zack/album.test.ts
git commit -m "feat(zack): stanje albuma sa bledenjem koje se računa pri čitanju"
```

---

## Task 6: Sadržaj kesice

**Files:**
- Create: `src/lib/zack/kesica.ts`
- Test: `src/lib/zack/kesica.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
import { describe, it, expect } from "vitest";
import type { Rec } from "./rec";
import { KESICA_NAJVISE, otvoriKesicu } from "./kesica";

const R = (i: number, izuzetak = false): Rec => ({
  id: `r${i}`,
  redni_broj: i,
  de: `de${i}`,
  sr: `sr${i}`,
  rod: "der",
  mnozina: null,
  vrsta: "imenica",
  izuzetak,
});

const nula = () => 0;

describe("otvoriKesicu", () => {
  it("daje samo reči koje je dete tačno odgovorilo", () => {
    const kesica = otvoriKesicu([R(1), R(2), R(3)], ["r1", "r2"], new Set(), nula);
    expect(kesica.map((r) => r.id).sort()).toEqual(["r1", "r2"]);
  });

  it("ne daje reč koju dete već ima", () => {
    const kesica = otvoriKesicu([R(1), R(2)], ["r1", "r2"], new Set(["r1"]), nula);
    expect(kesica.map((r) => r.id)).toEqual(["r2"]);
  });

  it("ne daje više od najvećeg broja po kesici", () => {
    const reci = [R(1), R(2), R(3), R(4), R(5), R(6), R(7)];
    const svi = reci.map((r) => r.id);
    expect(otvoriKesicu(reci, svi, new Set(), nula)).toHaveLength(KESICA_NAJVISE);
  });

  it("u jednoj kesici je najviše jedan izuzetak", () => {
    const reci = [R(1, true), R(2, true), R(3, true), R(4), R(5)];
    const kesica = otvoriKesicu(reci, reci.map((r) => r.id), new Set(), nula);
    expect(kesica.filter((r) => r.izuzetak)).toHaveLength(1);
  });

  it("kesica sme da bude samo izuzetak ako drugih reči nema", () => {
    const reci = [R(1, true)];
    expect(otvoriKesicu(reci, ["r1"], new Set(), nula)).toHaveLength(1);
  });

  it("prazna kesica kad je sve već sakupljeno", () => {
    expect(otvoriKesicu([R(1)], ["r1"], new Set(["r1"]), nula)).toEqual([]);
  });

  it("prazna kesica kad nije bilo nijednog tačnog odgovora", () => {
    expect(otvoriKesicu([R(1), R(2)], [], new Set(), nula)).toEqual([]);
  });
});
```

- [ ] **Step 2: Pokreni test i potvrdi da pada**

Run: `npx vitest run src/lib/zack/kesica.test.ts`
Expected: FAIL, `Failed to resolve import "./kesica"`

- [ ] **Step 3: Napiši implementaciju**

```ts
// Šta ulazi u kesicu posle odigrane igre.
// Pravilo: dobija se samo ono što je dete tačno odgovorilo i što još nema,
// a izuzeci (sjajne sličice) su namerno retki, najviše jedan po kesici.
import { promesaj, type Rec } from "./rec";

export const KESICA_NAJVISE = 5;

export function otvoriKesicu(
  reciLekcije: readonly Rec[],
  tacniRecIdovi: readonly string[],
  vecImam: ReadonlySet<string>,
  rng: () => number
): Rec[] {
  const zaradjene = reciLekcije.filter(
    (r) => tacniRecIdovi.includes(r.id) && !vecImam.has(r.id)
  );

  const obicne = promesaj(zaradjene.filter((r) => !r.izuzetak), rng);
  const izuzeci = promesaj(zaradjene.filter((r) => r.izuzetak), rng);

  const kesica = obicne.slice(0, KESICA_NAJVISE);
  if (izuzeci.length > 0) {
    if (kesica.length < KESICA_NAJVISE) kesica.push(izuzeci[0]);
    else kesica[KESICA_NAJVISE - 1] = izuzeci[0];
  }

  return kesica;
}
```

- [ ] **Step 4: Pokreni test i potvrdi da prolazi**

Run: `npx vitest run src/lib/zack/kesica.test.ts`
Expected: PASS, 7 testova

- [ ] **Step 5: Pokreni ceo paket testova**

Run: `npm test`
Expected: svi postojeći testovi i pet novih fajlova prolaze, bez nove greške

- [ ] **Step 6: Commit**

```bash
git add src/lib/zack/kesica.ts src/lib/zack/kesica.test.ts
git commit -m "feat(zack): sadržaj kesice, izuzeci najviše jedan po kesici"
```

---

## Task 6b: Delimičan napredak u igri Parovi

Ovaj task nije bio u prvobitnom planu. Dodat je pošto je pri izradi Taska 4 nađena
prava rupa.

**Problem.** Sve igre osim Parova imaju jedno pitanje po reči, pa je odgovor prosto
tačan ili netačan. Parovi su jedno jedino pitanje koje pokriva do šest reči.
Pošto `odgovori(s, tacno)` prima samo `boolean`, dete koje spoji pet od šest
parova pa stane ne dobija ništa. Uz to, pošto pogrešan spoj ne sme da prekine
igru (jedno pitanje, pa bi `odgovori(s, false)` odmah završio sve), dete koje se
zaglavi **nema nikakav izlaz**: igra se ne završava, kesica se ne otvara, i jedini
izlaz je zatvaranje stranice uz gubitak svega.

Oboje krši isto pravilo zbog kog izbledela sličica ne nestaje: **detetu se ne
oduzima ono što je zaradilo.**

**Rešenje.** `sesija.ts` dobija tri funkcije koje menjaju stanje bez prelaska na
sledeće pitanje, i jednu koja razlikuje dva načina završetka.

**Files:**
- Modify: `src/lib/zack/sesija.ts`
- Modify: `src/lib/zack/sesija.test.ts`

- [ ] **Step 1: Dopiši testove koji padaju**

Dodaj na kraj `src/lib/zack/sesija.test.ts` (postojeće testove ne diraj), i dopuni
uvoz na vrhu fajla tako da glasi:

```ts
import {
  novaSesija,
  odgovori,
  odustani,
  oduzmiSrce,
  palaZbogSrca,
  SRCA,
  tacniRecIdovi,
  zabeleziTacne,
} from "./sesija";
```

pa dodaj:

```ts
describe("zabeleziTacne", () => {
  it("upisuje reči bez prelaska na sledeće pitanje", () => {
    const s = zabeleziTacne(novaSesija([P(1), P(2)]), ["r1"]);
    expect(s.tacni).toEqual(["r1"]);
    expect(s.indeks).toBe(0);
    expect(s.srca).toBe(SRCA);
    expect(s.gotovo).toBe(false);
  });

  it("ne upisuje istu reč dvaput", () => {
    let s = zabeleziTacne(novaSesija([P(1)]), ["r1"]);
    s = zabeleziTacne(s, ["r1", "r2"]);
    expect(s.tacni).toEqual(["r1", "r2"]);
  });

  it("na gotovoj igri ništa ne menja", () => {
    const gotova = { ...novaSesija([P(1)]), gotovo: true };
    expect(zabeleziTacne(gotova, ["r9"])).toEqual(gotova);
  });
});

describe("oduzmiSrce", () => {
  it("uzima srce bez prelaska na sledeće pitanje", () => {
    const s = oduzmiSrce(novaSesija([P(1), P(2)]));
    expect(s.srca).toBe(SRCA - 1);
    expect(s.indeks).toBe(0);
    expect(s.gotovo).toBe(false);
  });

  it("završava igru kad srca nestanu, ali čuva zarađene reči", () => {
    let s = zabeleziTacne(novaSesija([P(1), P(2)]), ["r1"]);
    for (let i = 0; i < SRCA; i++) s = oduzmiSrce(s);
    expect(s.srca).toBe(0);
    expect(s.gotovo).toBe(true);
    expect(s.tacni).toEqual(["r1"]);
  });
});

describe("odustani", () => {
  it("završava igru na zahtev i čuva sve zabeleženo", () => {
    const s = odustani(zabeleziTacne(novaSesija([P(1), P(2)]), ["r1", "r2"]));
    expect(s.gotovo).toBe(true);
    expect(s.tacni).toEqual(["r1", "r2"]);
    expect(s.srca).toBe(SRCA);
  });
});

describe("palaZbogSrca", () => {
  it("razlikuje potrošena srca od pređenih svih pitanja", () => {
    let pala = novaSesija([P(1), P(2), P(3), P(4), P(5)]);
    for (let i = 0; i < SRCA; i++) pala = odgovori(pala, false);
    expect(palaZbogSrca(pala)).toBe(true);

    let presla = novaSesija([P(1)]);
    presla = odgovori(presla, true);
    expect(palaZbogSrca(presla)).toBe(false);
  });

  it("igra u toku nije pala", () => {
    expect(palaZbogSrca(novaSesija([P(1)]))).toBe(false);
  });
});
```

- [ ] **Step 2: Pokreni testove i potvrdi da padaju**

Run: `npx vitest run src/lib/zack/sesija.test.ts`
Expected: FAIL, `"zabeleziTacne" is not exported`

- [ ] **Step 3: Dopiši implementaciju**

Dodaj na kraj `src/lib/zack/sesija.ts` (postojeći kod ne diraj):

```ts
/**
 * Beleži tačno rešene reči BEZ prelaska na sledeće pitanje.
 * Postoji zbog igre Parovi, gde jedno pitanje pokriva više reči, pa dete mora da
 * zadrži svaki spojen par i onda kad ne spoji sve.
 */
export function zabeleziTacne(s: Sesija, recIdovi: readonly string[]): Sesija {
  if (s.gotovo) return s;
  const novi = recIdovi.filter((id) => !s.tacni.includes(id));
  return novi.length === 0 ? s : { ...s, tacni: [...s.tacni, ...novi] };
}

/**
 * Uzima srce BEZ prelaska na sledeće pitanje. Koristi Parovi kod pogrešnog spoja,
 * gde bi `odgovori(s, false)` odmah završio celu igru, jer je to jedno pitanje.
 */
export function oduzmiSrce(s: Sesija): Sesija {
  if (s.gotovo) return s;
  const srca = s.srca - 1;
  return { ...s, srca, gotovo: srca <= 0 };
}

/** Završava igru na zahtev deteta. Sve zabeleženo ostaje zarađeno. */
export function odustani(s: Sesija): Sesija {
  return s.gotovo ? s : { ...s, gotovo: true };
}

/**
 * Da li se igra završila zato što su nestala srca, za razliku od toga da je dete
 * prešlo sva pitanja. Kesica se dodeljuje u oba slučaja, ali ekran kraja treba da
 * kaže različitu stvar.
 */
export function palaZbogSrca(s: Sesija): boolean {
  return s.gotovo && s.srca <= 0;
}
```

- [ ] **Step 4: Pokreni testove i potvrdi da prolaze**

Run: `npx vitest run src/lib/zack/sesija.test.ts`
Expected: PASS, 18 testova (10 starih + 8 novih)

- [ ] **Step 5: Proveri tipove i celu svitu**

Run: `./node_modules/.bin/tsc --noEmit && npm test`
Expected: bez greške

- [ ] **Step 6: Commit**

```bash
git add src/lib/zack/sesija.ts src/lib/zack/sesija.test.ts
git commit -m "fix(zack): Parovi čuvaju svaki spojen par i imaju izlaz"
```

- [ ] **Step 7: Sličica ne sme da uđe u album već siva**

Druga rupa, nađena pri izradi Taska 5, ista principijelna greška.

Ako dete zaradi sličicu, ostavi je u ruci duže od `DANA_DO_BLEDENJA`, pa je tek
onda zalepi, bledenje se računa od poslednjeg tačnog odgovora, pa se sličica
pojavi u albumu **odmah siva**. Detetu to izgleda kao da se nagrada pokvarila u
sekundi kad ju je dobilo.

Rešenje: sat bledenja kreće od **kasnijeg** od dva datuma. Vreme provedeno u ruci
se ne broji, jer sličica tada nije ni bila u albumu.

Dodaj u `src/lib/zack/album.test.ts`:

```ts
describe("bledenje kreće od ulaska u album", () => {
  it("sličica dugo držana u ruci ne ulazi u album već siva", () => {
    const [s] = stanjeAlbuma(
      [R(1)],
      [Z("r1", { zalepljena_at: preDana(1), poslednje_tacno_at: preDana(90) })],
      SADA
    );
    expect(s.stanje).toBe("zalepljena");
  });

  it("davno zalepljena i davno neponovljena i dalje bledi", () => {
    const [s] = stanjeAlbuma(
      [R(1)],
      [Z("r1", { zalepljena_at: preDana(90), poslednje_tacno_at: preDana(90) })],
      SADA
    );
    expect(s.stanje).toBe("izbledela");
  });

  it("pokvaren datum nikad ne bledi sličicu", () => {
    const [s] = stanjeAlbuma(
      [R(1)],
      [Z("r1", { poslednje_tacno_at: "ovo-nije-datum" })],
      SADA
    );
    expect(s.stanje).toBe("zalepljena");
  });
});
```

U `src/lib/zack/album.ts` zameni telo koje računa `dana` ovim:

```ts
      // Sat bledenja kreće od kasnijeg od dva datuma. Vreme koje je sličica
      // provela u ruci se ne broji, jer tada nije ni bila u albumu.
      const odKada = Math.max(
        Date.parse(z.zalepljena_at),
        Date.parse(z.poslednje_tacno_at)
      );
      // Pokvaren ili neprepoznat datum daje NaN. Namerno pada u korist deteta:
      // Number.isFinite hvata to eksplicitno, da ne zavisi od toga što je
      // poređenje sa NaN slučajno false.
      if (!Number.isFinite(odKada)) return { rec, stanje: "zalepljena" as const };

      const dana = (sada.getTime() - odKada) / DAN;
      return { rec, stanje: dana > DANA_DO_BLEDENJA ? ("izbledela" as const) : ("zalepljena" as const) };
```

- [ ] **Step 8: Pokreni i commit**

Run: `npx vitest run src/lib/zack/album.test.ts && ./node_modules/.bin/tsc --noEmit && npm test`
Expected: 13 testova u `album.test.ts`, cela svita prolazi

```bash
git add src/lib/zack/album.ts src/lib/zack/album.test.ts
git commit -m "fix(zack): sličica ne ulazi u album već siva"
```

---

## Task 7: Admin ruta za upis lekcije

**Files:**
- Create: `src/app/api/admin/zack/lekcija/route.ts`

- [ ] **Step 1: Napiši rutu**

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

// Upis jedne lekcije sa spiskom reči. Namerno je sve u jednom pozivu, jer je
// lekcija najmanja celina koju Nataša unosi i nema smisla da se pola upiše.

type UlaznaRec = {
  de: string;
  sr: string;
  rod?: "der" | "die" | "das" | "nema";
  mnozina?: string | null;
  vrsta?: "imenica" | "glagol" | "pridev" | "ostalo";
  izuzetak?: boolean;
};

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  const body = await request.json();
  const { udzbenikId, broj, naziv, praviloNaslov, praviloTekst, praviloPrimer } = body;
  const reci: UlaznaRec[] = Array.isArray(body.reci) ? body.reci : [];

  if (!udzbenikId || !naziv || !Number.isInteger(broj) || broj < 1) {
    return NextResponse.json(
      { error: "udzbenikId, broj i naziv su obavezni" },
      { status: 400 }
    );
  }
  if (reci.length === 0) {
    return NextResponse.json({ error: "Lekcija mora imati bar jednu reč" }, { status: 400 });
  }
  const prazna = reci.findIndex((r) => !r.de?.trim() || !r.sr?.trim());
  if (prazna !== -1) {
    return NextResponse.json(
      { error: `Reč broj ${prazna + 1} nema nemački ili naš oblik` },
      { status: 400 }
    );
  }

  const { data: lekcija, error: greskaLekcije } = await admin
    .from("zack_lekcije")
    .upsert(
      {
        udzbenik_id: udzbenikId,
        broj,
        naziv,
        pravilo_naslov: praviloNaslov ?? null,
        pravilo_tekst: praviloTekst ?? null,
        pravilo_primer: praviloPrimer ?? null,
      },
      { onConflict: "udzbenik_id,broj" }
    )
    .select("id")
    .single();

  if (greskaLekcije || !lekcija) {
    return NextResponse.json(
      { error: greskaLekcije?.message ?? "Lekcija nije upisana" },
      { status: 500 }
    );
  }

  // Ponovni unos iste lekcije zamenjuje spisak reči u celosti. To je namerno:
  // Nataša ispravlja spisak u tabeli i ponovo ga nalepi, a ne dopunjava red po red.
  await admin.from("zack_reci").delete().eq("lekcija_id", lekcija.id);

  const { error: greskaReci } = await admin.from("zack_reci").insert(
    reci.map((r, i) => ({
      lekcija_id: lekcija.id,
      redni_broj: i + 1,
      de: r.de.trim(),
      sr: r.sr.trim(),
      rod: r.rod ?? "nema",
      mnozina: r.mnozina?.trim() || null,
      vrsta: r.vrsta ?? "ostalo",
      izuzetak: Boolean(r.izuzetak),
    }))
  );

  if (greskaReci) {
    return NextResponse.json({ error: greskaReci.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, lekcijaId: lekcija.id, upisanoReci: reci.length });
}
```

- [ ] **Step 2: Proveri da se projekat prevodi**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez greške. (Napomena: `npx tsc` u ovom projektu ume da pokupi drugu verziju, uvek se koristi putanja iz `node_modules`.)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/zack/lekcija/route.ts
git commit -m "feat(zack): admin ruta za upis lekcije sa spiskom reči"
```

---

## Task 8: Admin ekran za unos lekcije

**Files:**
- Create: `src/app/admin/zack/page.tsx`
- Create: `src/app/admin/zack/ZackClient.tsx`

- [ ] **Step 1: Napiši serversku stranicu**

```tsx
import { createAdminClient } from "@/lib/supabase/admin";
import ZackClient from "./ZackClient";

export const dynamic = "force-dynamic";

export default async function AdminZackPage() {
  const supabase = createAdminClient();
  const { data: udzbenici } = await supabase
    .from("zack_udzbenici")
    .select("id, izdavac, naziv, razred")
    .order("razred");

  return <ZackClient udzbenici={udzbenici ?? []} />;
}
```

- [ ] **Step 2: Napiši klijentsku komponentu**

Unos ide nalepljivanjem iz tabele, jer je to način na koji Nataša stvarno radi: jedna reč po redu, kolone razdvojene tabulatorom.

```tsx
"use client";

import { useState } from "react";

type Udzbenik = { id: string; izdavac: string; naziv: string; razred: number };

type Red = {
  de: string;
  sr: string;
  rod: "der" | "die" | "das" | "nema";
  mnozina: string;
  izuzetak: boolean;
};

/** Red iz tabele: de <tab> sr <tab> rod <tab> množina <tab> izuzetak */
function parsirajRed(linija: string): Red | null {
  const d = linija.split("\t").map((x) => x.trim());
  if (!d[0] || !d[1]) return null;
  const rod = ["der", "die", "das"].includes(d[2]) ? (d[2] as Red["rod"]) : "nema";
  return {
    de: d[0],
    sr: d[1],
    rod,
    mnozina: d[3] ?? "",
    izuzetak: (d[4] ?? "").toLowerCase() === "da",
  };
}

export default function ZackClient({ udzbenici }: { udzbenici: Udzbenik[] }) {
  const [udzbenikId, setUdzbenikId] = useState(udzbenici[0]?.id ?? "");
  const [broj, setBroj] = useState(1);
  const [naziv, setNaziv] = useState("");
  const [praviloNaslov, setPraviloNaslov] = useState("");
  const [praviloTekst, setPraviloTekst] = useState("");
  const [praviloPrimer, setPraviloPrimer] = useState("");
  const [sirovo, setSirovo] = useState("");
  const [poruka, setPoruka] = useState<string | null>(null);
  const [salje, setSalje] = useState(false);

  const redovi = sirovo
    .split("\n")
    .map(parsirajRed)
    .filter((r): r is Red => r !== null);

  async function sacuvaj() {
    setSalje(true);
    setPoruka(null);
    const odgovor = await fetch("/api/admin/zack/lekcija", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        udzbenikId,
        broj,
        naziv,
        praviloNaslov,
        praviloTekst,
        praviloPrimer,
        reci: redovi.map((r) => ({
          de: r.de,
          sr: r.sr,
          rod: r.rod,
          mnozina: r.mnozina || null,
          vrsta: r.rod === "nema" ? "ostalo" : "imenica",
          izuzetak: r.izuzetak,
        })),
      }),
    });
    const rezultat = await odgovor.json();
    setPoruka(
      odgovor.ok ? `Upisano ${rezultat.upisanoReci} reči.` : `Greška: ${rezultat.error}`
    );
    setSalje(false);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">zack, unos lekcije</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Udžbenik
          <select
            value={udzbenikId}
            onChange={(e) => setUdzbenikId(e.target.value)}
            className="rounded border border-gray-300 p-2"
          >
            {udzbenici.map((u) => (
              <option key={u.id} value={u.id}>
                {u.razred}. razred, {u.naziv}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Broj lekcije
          <input
            type="number"
            min={1}
            value={broj}
            onChange={(e) => setBroj(Number(e.target.value))}
            className="rounded border border-gray-300 p-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Naziv lekcije
          <input
            value={naziv}
            onChange={(e) => setNaziv(e.target.value)}
            className="rounded border border-gray-300 p-2"
          />
        </label>
      </div>

      <fieldset className="space-y-3 rounded border border-gray-200 p-4">
        <legend className="px-1 text-sm font-semibold">Podsetnik na pola ekrana</legend>
        <input
          placeholder="Naslov pravila"
          value={praviloNaslov}
          onChange={(e) => setPraviloNaslov(e.target.value)}
          className="w-full rounded border border-gray-300 p-2"
        />
        <textarea
          placeholder="Pravilo u tri rečenice"
          rows={3}
          value={praviloTekst}
          onChange={(e) => setPraviloTekst(e.target.value)}
          className="w-full rounded border border-gray-300 p-2"
        />
        <input
          placeholder="Primer"
          value={praviloPrimer}
          onChange={(e) => setPraviloPrimer(e.target.value)}
          className="w-full rounded border border-gray-300 p-2"
        />
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        Reči, jedna po redu, kolone razdvojene tabulatorom:
        <span className="text-gray-500">
          nemački &rarr; naš &rarr; der/die/das &rarr; množina &rarr; izuzetak (upiši
          &bdquo;da&ldquo;)
        </span>
        <textarea
          rows={12}
          value={sirovo}
          onChange={(e) => setSirovo(e.target.value)}
          placeholder={"Haus\tkuća\tdas\tHäuser\tda"}
          className="w-full rounded border border-gray-300 p-2 font-mono text-sm"
        />
      </label>

      <p className="text-sm text-gray-600">
        Prepoznato reči: <strong>{redovi.length}</strong>, od toga izuzetaka:{" "}
        <strong>{redovi.filter((r) => r.izuzetak).length}</strong>
      </p>

      <button
        onClick={sacuvaj}
        disabled={salje || redovi.length === 0 || !naziv || !udzbenikId}
        className="rounded bg-[#E5342A] px-5 py-2 font-semibold text-white disabled:opacity-40"
      >
        {salje ? "Čuvam..." : "Sačuvaj lekciju"}
      </button>

      {poruka && <p className="text-sm font-semibold">{poruka}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Ubaci prvi udžbenik i jedno dete za probu**

U Supabase SQL editoru:

```sql
INSERT INTO public.zack_udzbenici (izdavac, naziv, razred, slug)
VALUES ('Klett', 'Wir 1', 5, 'klett-wir-1-r5')
RETURNING id;

INSERT INTO public.zack_deca (ime, udzbenik_id)
SELECT 'Proba', id FROM public.zack_udzbenici WHERE slug = 'klett-wir-1-r5'
RETURNING id;
```

Zapiši oba UUID-a, `dete.id` treba za `/zack/<childId>`.

- [ ] **Step 4: Probaj unos u pretraživaču**

Pokreni preview server projekta, otvori `/admin/zack` kao admin, nalepi tri reda:

```
Haus	kuća	das	Häuser	da
Tafel	tabla	die	Tafeln
Lehrer	nastavnik	der	Lehrer
```

Klikni Sačuvaj.
Expected: poruka `Upisano 3 reči.`

- [ ] **Step 5: Proveri u bazi**

```sql
SELECT redni_broj, de, sr, rod, mnozina, izuzetak
FROM public.zack_reci ORDER BY redni_broj;
```

Expected: tri reda, `Haus` ima `izuzetak = true` i `rod = das`.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/zack/page.tsx src/app/admin/zack/ZackClient.tsx
git commit -m "feat(zack): admin ekran za unos lekcije nalepljivanjem iz tabele"
```

---

## Task 9: Dečje rute za stazu i lekciju

**Files:**
- Create: `src/lib/zack/upiti.ts`
- Create: `src/app/api/zack/[childId]/staza/route.ts`
- Create: `src/app/api/zack/[childId]/lekcija/[broj]/route.ts`

- [ ] **Step 1: Napiši zajedničke upite**

```ts
// Zajednički upiti dečjeg dela. Uvek service-role, jer je RLS na zack_* tabelama
// potpuno zatvoren i dete nema svoj Supabase nalog u ovoj fazi.
import { createAdminClient } from "@/lib/supabase/admin";
import type { Rec } from "./rec";
import type { ZapisSlicice } from "./album";

export type Dete = { id: string; ime: string; udzbenik_id: string };

export async function nadjiDete(childId: string): Promise<Dete | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("zack_deca")
    .select("id, ime, udzbenik_id")
    .eq("id", childId)
    .single();
  return data ?? null;
}

export async function reciLekcije(lekcijaId: string): Promise<Rec[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("zack_reci")
    .select("id, redni_broj, de, sr, rod, mnozina, vrsta, izuzetak")
    .eq("lekcija_id", lekcijaId)
    .order("redni_broj");
  return (data ?? []) as Rec[];
}

export async function zapisiSlicica(deteId: string): Promise<ZapisSlicice[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("zack_slicice")
    .select("rec_id, zalepljena_at, poslednje_tacno_at")
    .eq("dete_id", deteId);
  return (data ?? []) as ZapisSlicice[];
}
```

- [ ] **Step 2: Napiši rutu za stazu**

Napomena o ugnježdenom upitu `zack_reci(...)`: u ovom projektu je već jednom
ugnježdeni upit tiho vraćao nulu redova zato što između tabela nije postojao
strani ključ. Ovde radi, jer `zack_reci.lekcija_id` ima `REFERENCES
zack_lekcije(id)` iz Taska 1. Ako se u Step 5 dobije `"ukupno":0`, prvo proveri
da li je strani ključ zaista nastao.

```ts
import { NextResponse } from "next/server";
import { brojac, stanjeAlbuma } from "@/lib/zack/album";
import { createAdminClient } from "@/lib/supabase/admin";
import { nadjiDete, zapisiSlicica } from "@/lib/zack/upiti";
import type { Rec } from "@/lib/zack/rec";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;

  const dete = await nadjiDete(childId);
  if (!dete) return NextResponse.json({ error: "Nema takvog deteta" }, { status: 404 });

  const admin = createAdminClient();
  const { data: lekcije } = await admin
    .from("zack_lekcije")
    .select("id, broj, naziv, zack_reci(id, redni_broj, de, sr, rod, mnozina, vrsta, izuzetak)")
    .eq("udzbenik_id", dete.udzbenik_id)
    .order("broj");

  const zapisi = await zapisiSlicica(dete.id);
  const sada = new Date();

  return NextResponse.json({
    ime: dete.ime,
    lekcije: (lekcije ?? []).map((l) => {
      const reci = (l.zack_reci ?? []) as unknown as Rec[];
      return {
        broj: l.broj,
        naziv: l.naziv,
        ...brojac(stanjeAlbuma(reci, zapisi, sada)),
      };
    }),
  });
}
```

- [ ] **Step 3: Napiši rutu za jednu lekciju**

```ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stanjeAlbuma } from "@/lib/zack/album";
import { nadjiDete, reciLekcije, zapisiSlicica } from "@/lib/zack/upiti";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ childId: string; broj: string }> }
) {
  const { childId, broj } = await params;

  const dete = await nadjiDete(childId);
  if (!dete) return NextResponse.json({ error: "Nema takvog deteta" }, { status: 404 });

  const admin = createAdminClient();
  const { data: lekcija } = await admin
    .from("zack_lekcije")
    .select("id, broj, naziv, pravilo_naslov, pravilo_tekst, pravilo_primer")
    .eq("udzbenik_id", dete.udzbenik_id)
    .eq("broj", Number(broj))
    .single();

  if (!lekcija) return NextResponse.json({ error: "Nema takve lekcije" }, { status: 404 });

  const reci = await reciLekcije(lekcija.id);
  const zapisi = await zapisiSlicica(dete.id);

  return NextResponse.json({
    lekcija,
    reci,
    album: stanjeAlbuma(reci, zapisi, new Date()),
  });
}
```

- [ ] **Step 4: Proveri prevođenje**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez greške

- [ ] **Step 5: Proveri rute uživo**

Sa pokrenutim preview serverom i UUID-om deteta iz Taska 8:

```bash
curl -s "http://localhost:3000/api/zack/<childId>/staza" | head -c 400
```

Expected: JSON sa `"ime":"Proba"` i nizom `lekcije` u kome prva lekcija ima `"ukupno":3`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/zack/upiti.ts src/app/api/zack
git commit -m "feat(zack): dečje rute za stazu lekcija i pojedinačnu lekciju"
```

---

## Task 10: Rute za odgovor, kesicu i lepljenje

**Files:**
- Create: `src/app/api/zack/[childId]/odgovor/route.ts`
- Create: `src/app/api/zack/[childId]/kesica/route.ts`
- Create: `src/app/api/zack/[childId]/zalepi/route.ts`

- [ ] **Step 1: Napiši rutu za tačan odgovor**

```ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nadjiDete } from "@/lib/zack/upiti";

// Osvežava poslednje_tacno_at postojećim sličicama. Time izbledela sličica
// vraća boju. Reči koje dete još nema se ovde NE upisuju, one dolaze kroz kesicu.

export async function POST(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;
  const dete = await nadjiDete(childId);
  if (!dete) return NextResponse.json({ error: "Nema takvog deteta" }, { status: 404 });

  const { recIdovi } = await request.json();
  if (!Array.isArray(recIdovi) || recIdovi.length === 0) {
    return NextResponse.json({ ok: true, osvezeno: 0 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("zack_slicice")
    .update({ poslednje_tacno_at: new Date().toISOString() })
    .eq("dete_id", dete.id)
    .in("rec_id", recIdovi)
    .select("id");

  return NextResponse.json({ ok: true, osvezeno: data?.length ?? 0 });
}
```

- [ ] **Step 2: Napiši rutu za kesicu**

```ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { otvoriKesicu } from "@/lib/zack/kesica";
import { nadjiDete, reciLekcije, zapisiSlicica } from "@/lib/zack/upiti";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;
  const dete = await nadjiDete(childId);
  if (!dete) return NextResponse.json({ error: "Nema takvog deteta" }, { status: 404 });

  const { lekcijaId, tacniRecIdovi } = await request.json();
  if (!lekcijaId) {
    return NextResponse.json({ error: "lekcijaId je obavezan" }, { status: 400 });
  }

  const reci = await reciLekcije(lekcijaId);
  const vecImam = new Set((await zapisiSlicica(dete.id)).map((z) => z.rec_id));
  const kesica = otvoriKesicu(reci, tacniRecIdovi ?? [], vecImam, Math.random);

  if (kesica.length > 0) {
    const admin = createAdminClient();
    // zalepljena_at ostaje null: sličica je u ruci dok je dete samo ne zalepi.
    await admin.from("zack_slicice").insert(
      kesica.map((r) => ({ dete_id: dete.id, rec_id: r.id, zalepljena_at: null }))
    );
  }

  return NextResponse.json({ kesica });
}
```

- [ ] **Step 3: Napiši rutu za lepljenje**

```ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nadjiDete } from "@/lib/zack/upiti";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;
  const dete = await nadjiDete(childId);
  if (!dete) return NextResponse.json({ error: "Nema takvog deteta" }, { status: 404 });

  const { recIdovi } = await request.json();
  if (!Array.isArray(recIdovi) || recIdovi.length === 0) {
    return NextResponse.json({ error: "recIdovi su obavezni" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("zack_slicice")
    .update({ zalepljena_at: new Date().toISOString() })
    .eq("dete_id", dete.id)
    .in("rec_id", recIdovi)
    .is("zalepljena_at", null)
    .select("rec_id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, zalepljeno: data?.map((d) => d.rec_id) ?? [] });
}
```

- [ ] **Step 4: Proveri prevođenje**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez greške

- [ ] **Step 5: Commit**

```bash
git add src/app/api/zack/\[childId\]/odgovor src/app/api/zack/\[childId\]/kesica src/app/api/zack/\[childId\]/zalepi
git commit -m "feat(zack): rute za tačan odgovor, otvaranje kesice i lepljenje"
```

---

## Task 11: Sličica kao komponenta

**Files:**
- Create: `src/components/zack/Slicica.tsx`

- [ ] **Step 1: Napiši komponentu**

```tsx
"use client";

import { bojaZaRod, type Rec } from "@/lib/zack/rec";
import type { Stanje } from "@/lib/zack/album";

const SJAJ =
  "linear-gradient(118deg,#FF9ECF 0%,#B98CFF 22%,#7FE8E0 46%,#FFE08A 68%,#FF9ECF 100%)";

export default function Slicica({
  rec,
  stanje,
  broj,
  onClick,
}: {
  rec: Rec;
  stanje: Stanje;
  broj: number;
  onClick?: () => void;
}) {
  if (stanje === "prazno") {
    return (
      <div className="flex aspect-[3/4] flex-col justify-between rounded-[5px] border-2 border-dashed border-[#DED8C8] p-2 text-[#6E6A5E]">
        <span className="text-[10.5px] font-extrabold tabular-nums opacity-60">
          {String(broj).padStart(2, "0")}
        </span>
        <span className="text-sm font-bold opacity-50">?</span>
      </div>
    );
  }

  const sjajna = rec.izuzetak;
  const izbledela = stanje === "izbledela";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        background: sjajna ? SJAJ : bojaZaRod(rec.rod),
        color: sjajna || rec.rod === "das" ? "#16161A" : "#fff",
        filter: izbledela ? "grayscale(1)" : undefined,
        opacity: izbledela ? 0.55 : 1,
      }}
      className="flex aspect-[3/4] flex-col justify-between rounded-[5px] border-[3px] border-[#FCFBF7] p-2 text-left shadow-[0_1px_2px_rgba(22,22,26,.2),0_5px_12px_rgba(22,22,26,.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16161A] disabled:cursor-default"
    >
      <span className="text-[10.5px] font-extrabold tabular-nums opacity-60">
        {String(broj).padStart(2, "0")}
        {sjajna && <span className="ml-1">&#9733;</span>}
      </span>
      <span>
        <span className="block text-sm font-extrabold leading-tight">{rec.de}</span>
        <span className="block text-[11.5px] font-semibold opacity-70">{rec.sr}</span>
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Proveri prevođenje**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez greške

- [ ] **Step 3: Commit**

```bash
git add src/components/zack/Slicica.tsx
git commit -m "feat(zack): sličica sa sva četiri stanja"
```

---

## Task 12: Staza lekcija

**Files:**
- Create: `src/app/zack/[childId]/page.tsx`
- Create: `src/app/zack/[childId]/StazaClient.tsx`
- Create: `src/app/zack/layout.tsx`

- [ ] **Step 1: Napiši raspored dečjeg dela**

```tsx
// Dečji deo ima svoj papirni raspored, odvojen od ostatka platforme.
export default function ZackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F1E9] text-[#16161A]">
      <div className="mx-auto max-w-2xl px-4 py-6">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Napiši serversku stranicu**

```tsx
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { brojac, stanjeAlbuma } from "@/lib/zack/album";
import { nadjiDete, zapisiSlicica } from "@/lib/zack/upiti";
import type { Rec } from "@/lib/zack/rec";
import StazaClient from "./StazaClient";

export const dynamic = "force-dynamic";

export default async function StazaPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const dete = await nadjiDete(childId);
  if (!dete) notFound();

  const admin = createAdminClient();
  const { data: lekcije } = await admin
    .from("zack_lekcije")
    .select("broj, naziv, zack_reci(id, redni_broj, de, sr, rod, mnozina, vrsta, izuzetak)")
    .eq("udzbenik_id", dete.udzbenik_id)
    .order("broj");

  const zapisi = await zapisiSlicica(dete.id);
  const sada = new Date();

  return (
    <StazaClient
      childId={childId}
      ime={dete.ime}
      lekcije={(lekcije ?? []).map((l) => ({
        broj: l.broj,
        naziv: l.naziv,
        ...brojac(stanjeAlbuma((l.zack_reci ?? []) as unknown as Rec[], zapisi, sada)),
      }))}
    />
  );
}
```

- [ ] **Step 3: Napiši klijentsku komponentu**

```tsx
"use client";

import Link from "next/link";

type StavkaStaze = { broj: number; naziv: string; zalepljene: number; ukupno: number };

export default function StazaClient({
  childId,
  ime,
  lekcije,
}: {
  childId: string;
  ime: string;
  lekcije: StavkaStaze[];
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11.5px] font-extrabold uppercase tracking-[.16em] text-[#6E6A5E]">
          Zdravo, {ime}
        </p>
        <h1 className="text-2xl font-black tracking-tight">Tvoji albumi</h1>
      </header>

      {lekcije.length === 0 && (
        <p className="text-[#6E6A5E]">Još nema nijedne lekcije. Vrati se malo kasnije.</p>
      )}

      <ol className="space-y-3">
        {lekcije.map((l) => {
          const gotova = l.ukupno > 0 && l.zalepljene === l.ukupno;
          return (
            <li key={l.broj}>
              <Link
                href={`/zack/${childId}/lekcija/${l.broj}`}
                className="flex items-center gap-4 rounded-lg border border-[#DED8C8] bg-[#FCFBF7] p-4 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16161A]"
              >
                <span
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-md text-lg font-black text-white"
                  style={{ background: gotova ? "#0B54C9" : "#E5342A" }}
                >
                  {l.broj}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{l.naziv}</span>
                  <span className="block text-sm tabular-nums text-[#6E6A5E]">
                    {l.zalepljene} od {l.ukupno} sličica
                  </span>
                </span>
                <span aria-hidden className="text-xl text-[#6E6A5E]">
                  &rsaquo;
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

- [ ] **Step 4: Proveri u pretraživaču**

Otvori `/zack/<childId>`.
Expected: naslov `Zdravo, Proba`, jedna lekcija sa tekstom `0 od 3 sličica`.

- [ ] **Step 5: Commit**

```bash
git add src/app/zack/layout.tsx "src/app/zack/[childId]/page.tsx" "src/app/zack/[childId]/StazaClient.tsx"
git commit -m "feat(zack): staza lekcija sa brojačem sličica"
```

---

## Task 13: Ljuska igre i pet igara

**Files:**
- Create: `src/components/zack/Igra.tsx`

- [ ] **Step 1: Napiši ljusku sa svim igrama**

Sve igre dele isto stanje iz `sesija.ts`, pa je razlika samo u tome šta se crta i kako se javlja tačno ili netačno.

Dve stvari koje je isplivalo pri izradi Taska 3 i na koje ovde moraš da paziš:

- **Ne pretpostavljaj tačno četiri ponuđena odgovora.** Na lekciji od tri reči
  brzo-biranje daje tri opcije, a ako dve reči imaju isti naš prevod, i manje.
  Kod ispod zato mapira preko `pitanje.opcije` umesto da crta četiri fiksna
  dugmeta. Isto važi za množinu, gde je skup kandidata još manji jer otpadaju
  reči bez upisane množine.
- **Tip `tacan` kod igre `rod` je `Rod`, što uključuje i `"nema"`.** Filter u
  `napraviPitanja` čini taj slučaj nemogućim, ali TypeScript to ne zna. Pošto se
  ovde crtaju tri fiksna dugmeta (der, die, das), reč sa rodom `"nema"` bi
  značila pitanje bez tačnog odgovora. Ako ikad promeniš filter, promeni i ovo.

```tsx
"use client";

import { useMemo, useState } from "react";
import { napraviPitanja, type Igra as VrstaIgre, type Pitanje } from "@/lib/zack/pitanja";
import type { Rec } from "@/lib/zack/rec";
import { novaSesija, odgovori, SRCA, type Sesija } from "@/lib/zack/sesija";

const PITANJA_PO_IGRI = 8;

export const NAZIVI: Record<VrstaIgre, string> = {
  "brzo-biranje": "Brzo biranje",
  rod: "Der, die ili das",
  mnozina: "Množina",
  diktat: "Diktat",
  parovi: "Parovi",
};

export default function Igra({
  reci,
  vrsta,
  onKraj,
}: {
  reci: Rec[];
  vrsta: VrstaIgre;
  onKraj: (tacniRecIdovi: string[]) => void;
}) {
  const pitanja = useMemo(
    () => napraviPitanja(reci, vrsta, PITANJA_PO_IGRI, Math.random),
    [reci, vrsta]
  );
  const [s, setS] = useState<Sesija>(() => novaSesija(pitanja));
  const [odziv, setOdziv] = useState<string | null>(null);

  function javi(tacno: boolean, tacanTekst: string) {
    setOdziv(tacno ? "Zack!" : `Ups! ${tacanTekst}`);
    setTimeout(() => {
      setOdziv(null);
      setS((prethodno) => {
        const sledeci = odgovori(prethodno, tacno);
        if (sledeci.gotovo) onKraj(sledeci.tacni);
        return sledeci;
      });
    }, 900);
  }

  if (s.gotovo) return null;

  const p = s.pitanja[s.indeks];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-extrabold uppercase tracking-[.16em] text-[#6E6A5E]">
          {NAZIVI[vrsta]}
        </span>
        <span aria-label={`Preostalo srca: ${s.srca}`} className="text-lg">
          {"♥".repeat(s.srca)}
          <span className="opacity-25">{"♥".repeat(SRCA - s.srca)}</span>
        </span>
      </div>

      <div
        className="h-2 rounded bg-[#EAE5D8]"
        role="progressbar"
        aria-valuenow={s.indeks}
        aria-valuemin={0}
        aria-valuemax={s.pitanja.length}
      >
        <div
          className="h-full rounded bg-[#E5342A] transition-[width]"
          style={{ width: `${(s.indeks / s.pitanja.length) * 100}%` }}
        />
      </div>

      {odziv ? (
        <p className="py-10 text-center text-2xl font-black">{odziv}</p>
      ) : (
        <TeloIgre pitanje={p} javi={javi} />
      )}
    </div>
  );
}

function Dugme({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[#DED8C8] bg-[#FCFBF7] p-4 text-left font-bold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16161A]"
    >
      {children}
    </button>
  );
}

function TeloIgre({
  pitanje,
  javi,
}: {
  pitanje: Pitanje;
  javi: (tacno: boolean, tacanTekst: string) => void;
}) {
  if (pitanje.igra === "brzo-biranje" || pitanje.igra === "mnozina") {
    const naslov = pitanje.igra === "brzo-biranje" ? pitanje.pitanje : pitanje.jednina;
    const uvod = pitanje.igra === "brzo-biranje" ? "Šta znači" : "Kako glasi množina";
    return (
      <div className="space-y-4">
        <p className="text-[#6E6A5E]">{uvod}</p>
        <p className="text-3xl font-black tracking-tight">{naslov}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {pitanje.opcije.map((o) => (
            <Dugme key={o} onClick={() => javi(o === pitanje.tacan, pitanje.tacan)}>
              {o}
            </Dugme>
          ))}
        </div>
      </div>
    );
  }

  if (pitanje.igra === "rod") {
    return (
      <div className="space-y-4">
        <p className="text-[#6E6A5E]">Koji je rod?</p>
        <p className="text-3xl font-black tracking-tight">{pitanje.imenica}</p>
        <div className="grid grid-cols-3 gap-3">
          {(["der", "die", "das"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => javi(r === pitanje.tacan, pitanje.tacan)}
              style={{ background: { der: "#0B54C9", die: "#E5342A", das: "#FFC400" }[r] }}
              className="rounded-lg p-4 text-lg font-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16161A]"
            >
              <span className={r === "das" ? "text-[#16161A]" : undefined}>{r}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (pitanje.igra === "diktat") {
    return <Diktat pitanje={pitanje} javi={javi} />;
  }

  return <Parovi pitanje={pitanje} javi={javi} />;
}

function Diktat({
  pitanje,
  javi,
}: {
  pitanje: Extract<Pitanje, { igra: "diktat" }>;
  javi: (tacno: boolean, tacanTekst: string) => void;
}) {
  const [uneto, setUneto] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        javi(uneto.trim().toLowerCase() === pitanje.tacan.toLowerCase(), pitanje.tacan);
      }}
    >
      <p className="text-[#6E6A5E]">Napiši na nemačkom</p>
      <p className="text-3xl font-black tracking-tight">{pitanje.prevod}</p>
      <input
        autoFocus
        value={uneto}
        onChange={(e) => setUneto(e.target.value)}
        className="w-full rounded-lg border border-[#DED8C8] bg-[#FCFBF7] p-4 text-xl font-bold"
      />
      <button
        type="submit"
        className="rounded-lg bg-[#E5342A] px-5 py-3 font-bold text-white"
      >
        Proveri
      </button>
    </form>
  );
}

function Parovi({
  pitanje,
  javi,
}: {
  pitanje: Extract<Pitanje, { igra: "parovi" }>;
  javi: (tacno: boolean, tacanTekst: string) => void;
}) {
  const [izabran, setIzabran] = useState<string | null>(null);
  const [spojeni, setSpojeni] = useState<string[]>([]);

  const desna = useMemo(
    () => [...pitanje.parovi].sort((a, b) => a.sr.localeCompare(b.sr, "sr")),
    [pitanje]
  );

  function kliknuoDesno(recId: string) {
    if (!izabran) return;
    if (izabran === recId) {
      const noviSpojeni = [...spojeni, recId];
      setSpojeni(noviSpojeni);
      setIzabran(null);
      if (noviSpojeni.length === pitanje.parovi.length) javi(true, "");
    } else {
      // Pogrešan par NE troši srce i NE prekida igru. Parovi su jedno jedino
      // pitanje, pa bi javi(false) odmah završio celu igru. Dete pokuša ponovo.
      setIzabran(null);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        {pitanje.parovi.map((p) => (
          <button
            key={p.recId}
            type="button"
            disabled={spojeni.includes(p.recId)}
            onClick={() => setIzabran(p.recId)}
            className={`w-full rounded-lg border p-3 font-bold ${
              izabran === p.recId ? "border-[#E5342A] bg-[#FDECEA]" : "border-[#DED8C8] bg-[#FCFBF7]"
            } disabled:opacity-30`}
          >
            {p.de}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {desna.map((p) => (
          <button
            key={p.recId}
            type="button"
            disabled={spojeni.includes(p.recId)}
            onClick={() => kliknuoDesno(p.recId)}
            className="w-full rounded-lg border border-[#DED8C8] bg-[#FCFBF7] p-3 font-bold disabled:opacity-30"
          >
            {p.sr}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Proveri prevođenje**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez greške

- [ ] **Step 3: Commit**

```bash
git add src/components/zack/Igra.tsx
git commit -m "feat(zack): ljuska igre sa srcima i pet igara iz spiska reči"
```

---

## Task 14: Ekran lekcije, kesica i lepljenje

> **ODLUKA KOJA SE MORA DONETI PRE OVOG TASKA.**
>
> Nađeno pri izradi Taska 6b. `tacni` iz `sesija.ts` živi samo u memoriji do kraja
> igre. Kod kako je dole napisan šalje napredak na server tek u `onKraj`. Znači
> dete koje zatvori karticu, osveži stranicu ili ostane bez mreže nasred igre
> **gubi sve što je do tada zaradilo.**
>
> To je isti prekršaj vrhovnog pravila zbog kog su rađene ispravke u Tasku 6b,
> samo na drugom mestu. Ispravka unutar `sesija.ts` je zatvorila gubitak unutar
> igre, ali ne i gubitak pri izlasku iz aplikacije.
>
> Dve mogućnosti, treba izabrati jednu:
>
> **A. Sličica se dodeljuje odmah po tačnom odgovoru.** Svaki tačan odgovor
> upisuje red u `zack_slicice` sa `zalepljena_at = null`. Kesica na kraju je onda
> samo svečano otkrivanje onoga što je već u bazi. Ako dete ispadne, sličice ga
> čekaju sledeći put kao „u ruci". Potpuno uklanja gubitak. Mana: pravilo iz
> `kesica.ts` da je najviše jedan izuzetak po kesici gubi smisao, jer kesice više
> nema kao trenutka odlučivanja, pa se retkost sjajnih sličica mora rešiti
> drugačije.
>
> **B. Ostaje kesica na kraju, ali se zarađene reči usput čuvaju.** Posle svakog
> tačnog odgovora se šalje poziv koji pamti reč kao „zarađenu, još neisporučenu".
> Pri sledećem otvaranju lekcije dete zatekne neotvorenu kesicu. Čuva svečanost i
> pravilo o izuzecima, ali traži jednu kolonu ili tabelu više.
>
> **ODLUČENO 17.08.2026: ide B.** Kesica i jurenje sjajnih sličica su ono što tera
> dete da odigra još jednu igru, a to je najvrednija mehanika u proizvodu. Jedna
> kolona je jeftinija od njenog gubitka.
>
> Kako B izgleda konkretno, i šta menja u ostalim taskovima, opisano je odmah
> ispod. Kod dalje u ovom tasku je pisan za staru varijantu i mora se prilagoditi.

### Odluka B: zarađeno se pamti odmah, kesica se otvara kasnije

**Šema.** Jedna nova kolona na `zack_slicice`:

```sql
ALTER TABLE public.zack_slicice ADD COLUMN isporucena_at TIMESTAMPTZ;
```

Time red u `zack_slicice` dobija četiri jasna stanja:

| Stanje reda | Šta znači | Kako izgleda detetu |
|---|---|---|
| reda nema | reč nije zarađena | prazno mesto u albumu |
| `isporucena_at IS NULL` | zarađena tačnim odgovorom, čeka u neotvorenoj kesici | prazno mesto, plus obaveštenje da ga čeka kesica |
| `isporucena_at` upisan, `zalepljena_at IS NULL` | izašla iz kesice, u ruci | sličica u ruci, čeka lepljenje |
| `zalepljena_at` upisan | zalepljena | sličica u albumu, siva ako je davno |

**Tok.**

1. **Posle svakog tačnog odgovora**, ne na kraju igre, klijent šalje reč na server.
   Upisuje se red sa `isporucena_at = NULL`. Ako red već postoji, samo se osveži
   `poslednje_tacno_at`. Time dete koje zatvori karticu nasred igre **ne gubi
   ništa**, jer je sve već u bazi.
2. **Na kraju igre ili pri sledećem otvaranju lekcije** dete otvara kesicu. Tek
   tada se do pet reči označi sa `isporucena_at = NOW()`, po pravilima iz
   `kesica.ts`, uključujući najviše jedan izuzetak.
3. **Lepljenje** ostaje isto, upisuje `zalepljena_at`.

**Šta se ovim rešava usput.** Reči koje preteknu preko pet ne nestaju nego ostaju
neisporučene i dolaze u sledećoj kesici. Time otpada bojazan da kesica izbacuje
zarađenu reč kad je puna a postoji i izuzetak.

**Šta se NE menja.** `stanjeAlbuma` i `brojac` ostaju netaknuti. Upit koji ih
hrani samo dodaje uslov `isporucena_at IS NOT NULL`, pa album nikad ne prikazuje
reč koju dete još nije videlo. Čista logika se ne dira, filtrira se u upitu.

**Šta se menja u ostalim taskovima:**

- **Nova migracija `085_zack_isporucena.sql`** sa gornjim `ALTER TABLE`.
- **Task 10** dobija novu rutu `POST /api/zack/[childId]/zaradi` koja prima
  `recIdovi` i radi upsert redova sa `isporucena_at = NULL`.
- **Task 10**, ruta `kesica` više ne prima `tacniRecIdovi` iz sesije, nego sama
  čita neisporučene redove za tu lekciju, propušta ih kroz `otvoriKesicu` i
  označava izabrane kao isporučene.
- **Task 9**, upiti `zapisiSlicica` dobijaju `.not("isporucena_at", "is", null)`.
- **Task 14**, klijent zove `zaradi` posle svakog tačnog odgovora, a `kesica` na
  kraju. Ekran lekcije pri otvaranju proverava ima li neotvorenih kesica.

**Files:**
- Create: `src/app/zack/[childId]/lekcija/[broj]/page.tsx`
- Create: `src/app/zack/[childId]/lekcija/[broj]/LekcijaClient.tsx`

- [ ] **Step 1: Napiši serversku stranicu**

```tsx
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { stanjeAlbuma } from "@/lib/zack/album";
import { nadjiDete, reciLekcije, zapisiSlicica } from "@/lib/zack/upiti";
import LekcijaClient from "./LekcijaClient";

export const dynamic = "force-dynamic";

export default async function LekcijaPage({
  params,
}: {
  params: Promise<{ childId: string; broj: string }>;
}) {
  const { childId, broj } = await params;
  const dete = await nadjiDete(childId);
  if (!dete) notFound();

  const admin = createAdminClient();
  const { data: lekcija } = await admin
    .from("zack_lekcije")
    .select("id, broj, naziv, pravilo_naslov, pravilo_tekst, pravilo_primer")
    .eq("udzbenik_id", dete.udzbenik_id)
    .eq("broj", Number(broj))
    .single();

  if (!lekcija) notFound();

  const reci = await reciLekcije(lekcija.id);
  const zapisi = await zapisiSlicica(dete.id);

  return (
    <LekcijaClient
      childId={childId}
      lekcija={lekcija}
      reci={reci}
      pocetnoStanje={stanjeAlbuma(reci, zapisi, new Date())}
    />
  );
}
```

- [ ] **Step 2: Napiši klijentsku komponentu**

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import type { StavkaAlbuma } from "@/lib/zack/album";
import type { Rec } from "@/lib/zack/rec";
import type { Igra as VrstaIgre } from "@/lib/zack/pitanja";
import Igra, { NAZIVI } from "@/components/zack/Igra";
import Slicica from "@/components/zack/Slicica";

type Lekcija = {
  id: string;
  broj: number;
  naziv: string;
  pravilo_naslov: string | null;
  pravilo_tekst: string | null;
  pravilo_primer: string | null;
};

const IGRE: VrstaIgre[] = ["parovi", "brzo-biranje", "rod", "mnozina", "diktat"];

export default function LekcijaClient({
  childId,
  lekcija,
  reci,
  pocetnoStanje,
}: {
  childId: string;
  lekcija: Lekcija;
  reci: Rec[];
  pocetnoStanje: StavkaAlbuma[];
}) {
  const [stanje, setStanje] = useState(pocetnoStanje);
  const [igra, setIgra] = useState<VrstaIgre | null>(null);
  const [uRuci, setURuci] = useState<Rec[]>([]);

  async function kraj(tacniRecIdovi: string[]) {
    setIgra(null);

    await fetch(`/api/zack/${childId}/odgovor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recIdovi: tacniRecIdovi }),
    });

    const odgovor = await fetch(`/api/zack/${childId}/kesica`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lekcijaId: lekcija.id, tacniRecIdovi }),
    });
    const { kesica } = await odgovor.json();
    setURuci(kesica as Rec[]);
    setStanje((s) =>
      s.map((x) =>
        (kesica as Rec[]).some((k) => k.id === x.rec.id) ? { ...x, stanje: "u-ruci" } : x
      )
    );
  }

  async function zalepi(recId: string) {
    await fetch(`/api/zack/${childId}/zalepi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recIdovi: [recId] }),
    });
    setURuci((r) => r.filter((x) => x.id !== recId));
    setStanje((s) =>
      s.map((x) => (x.rec.id === recId ? { ...x, stanje: "zalepljena" } : x))
    );
  }

  async function zalepiSve() {
    const idovi = uRuci.map((r) => r.id);
    await fetch(`/api/zack/${childId}/zalepi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recIdovi: idovi }),
    });
    setURuci([]);
    setStanje((s) =>
      s.map((x) => (idovi.includes(x.rec.id) ? { ...x, stanje: "zalepljena" } : x))
    );
  }

  const zalepljene = stanje.filter(
    (s) => s.stanje === "zalepljena" || s.stanje === "izbledela"
  ).length;

  if (igra) {
    return <Igra reci={reci} vrsta={igra} onKraj={kraj} />;
  }

  return (
    <div className="space-y-7">
      <header className="space-y-1">
        <Link href={`/zack/${childId}`} className="text-sm font-bold text-[#6E6A5E]">
          &lsaquo; Nazad
        </Link>
        <h1 className="text-2xl font-black tracking-tight">
          {lekcija.broj}. {lekcija.naziv}
        </h1>
        <p className="text-sm tabular-nums text-[#6E6A5E]">
          {zalepljene} od {stanje.length} sličica
        </p>
      </header>

      {lekcija.pravilo_tekst && (
        <section className="rounded-lg border-l-[3px] border-[#0B54C9] bg-[#FCFBF7] p-4">
          <h2 className="font-extrabold">{lekcija.pravilo_naslov}</h2>
          <p className="mt-1 text-[15.5px] leading-relaxed">{lekcija.pravilo_tekst}</p>
          {lekcija.pravilo_primer && (
            <p className="mt-2 font-bold">{lekcija.pravilo_primer}</p>
          )}
        </section>
      )}

      {uRuci.length > 0 && (
        <section className="space-y-3 rounded-lg border-2 border-[#E5342A] bg-[#FCFBF7] p-4">
          <h2 className="font-extrabold">
            Kesica: {uRuci.length}{" "}
            {uRuci.length === 1 ? "nova sličica" : "nove sličice"}
          </h2>
          <p className="text-sm text-[#6E6A5E]">Tapni sličicu da je zalepiš.</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {uRuci.map((r) => (
              <Slicica
                key={r.id}
                rec={r}
                stanje="u-ruci"
                broj={r.redni_broj}
                onClick={() => zalepi(r.id)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={zalepiSve}
            className="text-sm font-bold underline"
          >
            Zalepi sve
          </button>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-[11.5px] font-extrabold uppercase tracking-[.16em] text-[#6E6A5E]">
          Igre
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {IGRE.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setIgra(v)}
              className="rounded-lg border border-[#DED8C8] bg-[#FCFBF7] p-4 text-left font-bold shadow-sm"
            >
              {NAZIVI[v]}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[11.5px] font-extrabold uppercase tracking-[.16em] text-[#6E6A5E]">
          Album
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {stanje.map((s) => (
            <Slicica
              key={s.rec.id}
              rec={s.rec}
              stanje={s.stanje === "u-ruci" ? "prazno" : s.stanje}
              broj={s.rec.redni_broj}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Proveri prevođenje i testove**

Run: `./node_modules/.bin/tsc --noEmit && npm test`
Expected: bez greške, svi testovi prolaze

- [ ] **Step 4: Prođi ceo tok u pretraživaču**

1. Otvori `/zack/<childId>`, klikni prvu lekciju
2. Klikni `Brzo biranje`, odgovori na sva pitanja
3. Expected: posle poslednjeg pitanja pojavi se kesica sa novim sličicama
4. Tapni jednu sličicu
5. Expected: sličica nestaje iz kesice i pojavljuje se u albumu ispod, brojač raste
6. Osveži stranicu
7. Expected: zalepljena sličica je i dalje u albumu, brojač isti

- [ ] **Step 5: Proveri da tačan odgovor javlja Zack a greška Ups**

U igri `Der, die ili das` namerno pogreši jednom.
Expected: ispiše se `Ups!` sa tačnim odgovorom, ne `Netačno`, i gubi se jedno srce.

- [ ] **Step 6: Commit**

```bash
git add "src/app/zack/[childId]/lekcija"
git commit -m "feat(zack): ekran lekcije sa podsetnikom, igrama, kesicom i lepljenjem"
```

---

## Task 15: Niz dana

Poslednji deo koraka 3 iz specifikacije. Nezavisan je od svega prethodnog, pa ide
na kraj.

**Files:**
- Create: `supabase/migrations/084_zack_niz.sql`
- Create: `src/lib/zack/niz.ts`
- Test: `src/lib/zack/niz.test.ts`
- Modify: `src/app/api/zack/[childId]/odgovor/route.ts`

- [ ] **Step 1: Napiši migraciju**

```sql
-- Niz dana zaredom sa bar jednom odigranom igrom. Dve kolone na detetu su
-- dovoljne, ne treba posebna tabela jer se čuva samo tekuće stanje.
ALTER TABLE public.zack_deca
  ADD COLUMN niz SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN poslednji_dan DATE;
```

- [ ] **Step 2: Primeni migraciju i osveži tipove**

Pokreni SQL u Supabase editoru.
Expected: `Success. No rows returned.`

Zatim:

```bash
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" --schema public > src/lib/supabase/database.types.ts
```

- [ ] **Step 3: Napiši test koji pada**

```ts
import { describe, it, expect } from "vitest";
import { azurirajNiz } from "./niz";

describe("azurirajNiz", () => {
  it("prvi put u životu daje niz od jedan", () => {
    expect(azurirajNiz(null, 0, "2026-08-17")).toEqual({ niz: 1, poslednji_dan: "2026-08-17" });
  });

  it("juče pa danas produžava niz", () => {
    expect(azurirajNiz("2026-08-16", 4, "2026-08-17")).toEqual({
      niz: 5,
      poslednji_dan: "2026-08-17",
    });
  });

  it("drugi put istog dana ništa ne menja", () => {
    expect(azurirajNiz("2026-08-17", 5, "2026-08-17")).toEqual({
      niz: 5,
      poslednji_dan: "2026-08-17",
    });
  });

  it("preskočen dan počinje ispočetka", () => {
    expect(azurirajNiz("2026-08-15", 9, "2026-08-17")).toEqual({
      niz: 1,
      poslednji_dan: "2026-08-17",
    });
  });

  it("radi preko granice meseca", () => {
    expect(azurirajNiz("2026-07-31", 2, "2026-08-01")).toEqual({
      niz: 3,
      poslednji_dan: "2026-08-01",
    });
  });
});
```

- [ ] **Step 4: Pokreni test i potvrdi da pada**

Run: `npx vitest run src/lib/zack/niz.test.ts`
Expected: FAIL, `Failed to resolve import "./niz"`

- [ ] **Step 5: Napiši implementaciju**

```ts
// Niz dana zaredom. Radi se sa datumima u obliku GGGG-MM-DD, bez vremena i bez
// vremenske zone, jer je za dete bitno samo da li je danas igralo.

const DAN = 24 * 60 * 60 * 1000;

export function azurirajNiz(
  poslednjiDan: string | null,
  niz: number,
  danas: string
): { niz: number; poslednji_dan: string } {
  if (poslednjiDan === danas) return { niz, poslednji_dan: danas };
  if (poslednjiDan === null) return { niz: 1, poslednji_dan: danas };

  const razmak = (Date.parse(danas) - Date.parse(poslednjiDan)) / DAN;
  return { niz: razmak === 1 ? niz + 1 : 1, poslednji_dan: danas };
}
```

- [ ] **Step 6: Pokreni test i potvrdi da prolazi**

Run: `npx vitest run src/lib/zack/niz.test.ts`
Expected: PASS, 5 testova

- [ ] **Step 7: Pozovi to iz rute za odgovor**

U `src/app/api/zack/[childId]/odgovor/route.ts` dodaj uvoz:

```ts
import { azurirajNiz } from "@/lib/zack/niz";
```

pa neposredno pre `return NextResponse.json({ ok: true, osvezeno: ... })` ubaci:

```ts
  const { data: stanjeNiza } = await admin
    .from("zack_deca")
    .select("niz, poslednji_dan")
    .eq("id", dete.id)
    .single();

  const noviNiz = azurirajNiz(
    stanjeNiza?.poslednji_dan ?? null,
    stanjeNiza?.niz ?? 0,
    new Date().toISOString().slice(0, 10)
  );

  await admin.from("zack_deca").update(noviNiz).eq("id", dete.id);
```

pa promeni sam `return` u:

```ts
  return NextResponse.json({ ok: true, osvezeno: data?.length ?? 0, niz: noviNiz.niz });
```

- [ ] **Step 8: Prikaži niz na stazi**

U `src/app/zack/[childId]/page.tsx` promeni upit za dete tako da vrati i niz.
Zameni `const dete = await nadjiDete(childId);` sa:

```tsx
  const admin0 = createAdminClient();
  const { data: dete } = await admin0
    .from("zack_deca")
    .select("id, ime, udzbenik_id, niz")
    .eq("id", childId)
    .single();
```

pa prosledi `niz={dete.niz}` u `<StazaClient ... />`.

U `StazaClient.tsx` dodaj `niz: number` u tipove svojstava i ispod naslova ubaci:

```tsx
      {niz > 0 && (
        <p className="text-sm font-bold tabular-nums text-[#6E6A5E]">
          {niz} {niz === 1 ? "dan" : "dana"} zaredom
        </p>
      )}
```

- [ ] **Step 9: Provera**

Run: `./node_modules/.bin/tsc --noEmit && npm test`
Expected: bez greške, svi testovi prolaze

Odigraj jednu igru u pretraživaču pa otvori `/zack/<childId>`.
Expected: ispisuje `1 dan zaredom`

- [ ] **Step 10: Commit**

```bash
git add supabase/migrations/084_zack_niz.sql src/lib/zack/niz.ts src/lib/zack/niz.test.ts "src/app/api/zack/[childId]/odgovor/route.ts" "src/app/zack/[childId]/page.tsx" "src/app/zack/[childId]/StazaClient.tsx" src/lib/supabase/database.types.ts
git commit -m "feat(zack): niz dana zaredom"
```

---

## Task 16: Zaštita dečjih ruta i završna provera

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1: Pogledaj postojeći matcher**

Run: `grep -n "matcher" -A 12 src/proxy.ts`
Expected: vidiš niz putanja, među njima `/admin/:path*`

- [ ] **Step 2: Potvrdi da `/zack` NIJE u matcheru**

Dečje rute namerno ostaju van proxyja, jer dete nema Supabase sesiju. Ako se `/zack` doda u matcher, svaki poziv bi radio `supabase.auth.getUser()` bez potrebe i usporio bi stranicu. Isto pravilo zbog kog `/` nikad ne sme u matcher.

Ako `grep -n "zack" src/proxy.ts` išta vrati, ukloni to.

- [ ] **Step 3: Dodaj napomenu u kod, da se ne doda greškom**

Nađi `export const config = {` u `src/proxy.ts` i neposredno iznad dodaj:

```ts
// NE dodavati "/zack/:path*" ovde. Dečji deo nema Supabase sesiju, pa bi svaki
// poziv radio suvišan auth upit. Zaštita dečjih podataka je u tome što sve ide
// kroz /api/zack/* rute sa service-role klijentom, uz zatvoren RLS.
```

- [ ] **Step 4: Puna provera**

Run: `./node_modules/.bin/tsc --noEmit && npm test && npm run lint`
Expected: sve tri komande prolaze bez greške

- [ ] **Step 5: Provera privatnosti**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'zack_deca';
```

Expected: tačno `id`, `ime`, `udzbenik_id`, `created_at`. Ako se pojavio bilo koji dodatni lični podatak, ukloni ga pre nego što bilo koje pravo dete uđe u sistem.

- [ ] **Step 6: Commit**

```bash
git add src/proxy.ts
git commit -m "docs(zack): napomena zašto dečje rute ne idu kroz proxy"
```

---

## Šta posle ovog plana

Sledeći plan pokriva **korak 4 iz specifikacije, nagradnu arkadu**: pet tačnih odgovora daje penal ili skok, tri do četiri sekunde, iznad svake igre. Sve što mu treba već postoji u `sesija.ts`, jer se niz tačnih odgovora tamo već prati.

Posle toga, redom iz specifikacije: igre iz rečenica (korak 5), Der-Die-Das skakač (6), Test pred kontrolni i Milioner (7), roditeljski nalog sa PIN prijavom deteta (8).

**Pre nego što bilo koje pravo dete uđe:** mora da prođe provera žiga za ime Zack, i mora da se zameni UUID u adresi pravom PIN prijavom.
