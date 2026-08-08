# Privatni kanal „Gen II" + push obaveštenja — plan implementacije

> **Za agentske izvršioce:** OBAVEZNI POD-SKILL: koristi superpowers:subagent-driven-development (preporuka) ili superpowers:executing-plans za izvršavanje zadatak po zadatak. Koraci koriste checkbox (`- [ ]`) sintaksu za praćenje.

**Cilj:** Polaznice NH Academy Generacije II dobijaju privatan chat kanal koji vide samo one, i push obaveštenje (uz mejl kao rezervu) kad u njemu stigne nova poruka.

**Arhitektura:** Vidljivost chat kanala prelazi sa „je li članica" na „ima li pristup kursu iz `chat_kanali.pristup_slug`", pa Gen II kanal dobija svoj gate bez ijedne nove polise na porukama. Obaveštenja šalje cron koji svaki minut češlja nove poruke, grupiše ih po primaocu i šalje jedan push preko Web Push (VAPID) — a onome ko nema push pretplatu, mejl posle 10 minuta nepročitanosti.

**Tehnologije:** Next.js 16 (App Router), Supabase (Postgres + RLS + Realtime), `web-push`, Resend, Vitest, Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-08-08-gen2-kanal-push-design.md`

---

## Mapa fajlova

| Fajl | Odgovornost |
|---|---|
| `supabase/migrations/083_chat_kanal_gen2.sql` | `pristup_slug`, `ima_pristup_kanalu()`, Gen II kanal |
| `supabase/migrations/084_gen2_membership_unlock.sql` | `course_unlocks` gen2 → članstvo |
| `supabase/migrations/085_push_pretplate.sql` | `push_pretplate`, `chat_obavestenja` |
| `src/lib/gen2-push.ts` | Čista logika: tiha zona, grupisanje, tekst, prag za mejl |
| `src/lib/gen2-push.test.ts` | Testovi za gore |
| `src/lib/push.ts` | Omotač oko `web-push` (slanje + 404/410) |
| `src/lib/push-klijent.ts` | Čiste funkcije za browser: VAPID ključ, detekcija iOS-a bez PWA |
| `src/lib/push-klijent.test.ts` | Testovi za gore |
| `src/lib/email.ts` | + `sendGen2NovePorukeEmail` (izmena) |
| `src/lib/cron-log.ts` | + red u `EXPECTED_CRONS` (izmena) |
| `src/app/api/cron/gen2-push/route.ts` | Cron: čita bazu, zove čiste funkcije, šalje |
| `public/clanstvo-sw.js` | Service worker: prikaz obaveštenja i klik |
| `src/components/clanstvo/PushPrijava.tsx` | Dozvola i pretplata |
| `src/components/clanstvo/ChatKlijent.tsx` | + prikaz `PushPrijava` u Gen II kanalu (izmena) |
| `vercel.json` | + zakazivanje `* * * * *` (izmena) |

**Pokretanje testova:** `npm test` (Vitest, `environment: node`, hvata `src/**/*.test.ts`).
**Migracije** se primenjuju kroz Supabase MCP `apply_migration` (nema lokalnog runner-a u repou).

---

### Zadatak 1: Potvrditi da proizvod Gen II stoji

`083` i `084` se kače na proizvod `nh-academy-gen2` — bez njega u bazi nemaju na šta.

Migracije `081`/`082` su commit-ovane u `f9c2e2d` i, prema poruci tog commita, već primenjene na produkciji. Ovaj zadatak je zato samo provera, ne posao.

**Fajlovi:** nijedan (provera)

- [ ] **Korak 1: Provera da proizvod postoji sa očekivanom cenom**

```sql
select slug, price, is_purchasable, category from public.courses where slug = 'nh-academy-gen2';
```

Očekivano: jedan red, `price = 57300`, `is_purchasable = true`, `category = 'program'`.

Ako red ne postoji, `081` i `082` nisu primenjene na toj bazi — primeni ih kroz Supabase MCP `apply_migration` (imena `081_nh_academy_gen2_proizvod`, `082_nh_academy_gen2_cena`) pa ponovi upit.

- [ ] **Korak 2: Provera da kurs članstva postoji (na njega pokazuje 084)**

```sql
select slug from public.courses where slug = 'nh-clanstvo-sadrzaj';
```

Očekivano: jedan red. Ako ga nema, `084` bi tiho upisala nula redova — stani i proveri stanje baze.

---

### Zadatak 2: Migracija 083 — vidljivost kanala po `pristup_slug`

**Fajlovi:**
- Create: `supabase/migrations/083_chat_kanal_gen2.sql`

- [ ] **Korak 1: Napiši migraciju**

```sql
-- Privatni kanal Gen II. Vidljivost kanala prestaje da bude „je li članica"
-- (075) i postaje „ima li važeći course_access na kurs iz pristup_slug".
-- Postojeća 4 kanala zadržavaju ponašanje kroz podrazumevanu vrednost kolone.
--
-- Polise na chat_poruke i chat_procitano se NE diraju: one već nasleđuju
-- vidljivost kroz podupit na chat_kanali (obrazac 067), pa je izmena na jednom
-- mestu dovoljna. To je i razlog zašto Gen II ne dobija zasebnu polisu.

alter table public.chat_kanali
  add column pristup_slug text not null default 'nh-clanstvo-sadrzaj';

-- Parametrizovana verzija je_aktivna_clanica (074): isti oblik, samo je slug
-- kursa argument umesto zakucane vrednosti.
create or replace function public.ima_pristup_kanalu(uid uuid, kanal uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_kanali k
    join public.courses c on c.slug = k.pristup_slug
    join public.course_access ca on ca.course_id = c.id
    where k.id = kanal
      and ca.user_id = uid
      and (ca.expires_at is null or ca.expires_at > now())
  )
  or exists (
    select 1 from public.user_profiles up
    where up.id = uid and up.role = 'admin'
  );
$$;

drop policy chat_kanali_select_clanice on public.chat_kanali;

create policy chat_kanali_select_pristup
  on public.chat_kanali for select
  using (public.ima_pristup_kanalu(auth.uid(), id));

-- sort = -1: Gen II stoji prvi, jer je polaznici to glavni kanal.
insert into public.chat_kanali (slug, naziv, opis, samo_admin_pise, sort, pristup_slug) values
  ('gen2', 'Gen II',
   'Naša generacija - pitanja, domaći i sve između. Vidi ga samo Generacija II.',
   false, -1, 'nh-academy-gen2')
on conflict (slug) do nothing;

-- Grantovi po ugledu na 079: funkciju izvršavaju RLS polise kao upitivač, pa
-- authenticated MORA zadržati EXECUTE; anon-u ne treba.
revoke execute on function public.ima_pristup_kanalu(uuid, uuid) from public, anon;
grant execute on function public.ima_pristup_kanalu(uuid, uuid) to authenticated, service_role;
```

- [ ] **Korak 2: Primeni migraciju**

Kroz Supabase MCP `apply_migration`, ime `083_chat_kanal_gen2`.

- [ ] **Korak 3: Provera da stari kanali nisu promenili ponašanje**

```sql
select slug, sort, pristup_slug from public.chat_kanali order by sort;
```

Očekivano: `gen2` (sort -1, `nh-academy-gen2`), zatim `novosti`, `pitanja`, `ai-alati`, `pohvale` — svi sa `pristup_slug = 'nh-clanstvo-sadrzaj'`.

- [ ] **Korak 4: Provera izolacije (obavezna, ovo je srž zadatka)**

Nađi aktivnu članicu koja nije admin, pa proveri šta funkcija vraća za nju:

```sql
select ca.user_id
from public.course_access ca
join public.courses c on c.id = ca.course_id
join public.user_profiles up on up.id = ca.user_id
where c.slug = 'nh-clanstvo-sadrzaj'
  and (ca.expires_at is null or ca.expires_at > now())
  and up.role <> 'admin'
limit 1;

select k.slug, public.ima_pristup_kanalu('<uuid-iz-gornjeg-upita>', k.id) as vidi
from public.chat_kanali k order by k.sort;
```

Očekivano: `gen2 → false`, ostala četiri `→ true`. (Za admina je sve `true` — zato gornji upit izuzima admine.)

- [ ] **Korak 5: Commit**

```bash
git add supabase/migrations/083_chat_kanal_gen2.sql
git commit -m "Chat: vidljivost kanala po pristup_slug + privatni kanal Gen II"
```

---

### Zadatak 3: Migracija 084 — Gen II otvara članstvo

Bez ovoga polaznica ne može ni da uđe u `/clanstvo` (layout propušta samo `jeAktivnaClanica`), pa joj privatni kanal ne vredi.

**Fajlovi:**
- Create: `supabase/migrations/084_gen2_membership_unlock.sql`

- [ ] **Korak 1: Napiši migraciju**

```sql
-- Kupovina Gen II otvara i NH Membership. Bez ovog reda grant-access.ts pada
-- na granu sa console.warn („No course_unlocks ... granting product itself"),
-- pa polaznica dobija pristup samo proizvodu - a /clanstvo/layout.tsx je ne
-- pušta unutra, iako joj je Membership obećan uz program.
--
-- Trajanje: grant-access jednokratnoj kupovini daje godinu dana. Namerno se ne
-- skraćuje na kraj programa (16.12.) - pristup bi pukao usred decembarskog
-- okupljanja, a godina dana radi u korist naplate članarine u januaru.
--
-- Ne prepravlja unazad već obrađene narudžbine. Provereno 8.8.2026: kupovina
-- Gen II još nema.

insert into public.course_unlocks (purchasable_course_id, content_course_id)
select p.id, s.id
from public.courses p, public.courses s
where p.slug = 'nh-academy-gen2'
  and s.slug = 'nh-clanstvo-sadrzaj'
on conflict do nothing;
```

- [ ] **Korak 2: Primeni migraciju**

Kroz Supabase MCP `apply_migration`, ime `084_gen2_membership_unlock`.

- [ ] **Korak 3: Provera**

```sql
select p.slug as kupljeno, s.slug as otkljucano
from public.course_unlocks u
join public.courses p on p.id = u.purchasable_course_id
join public.courses s on s.id = u.content_course_id
where p.slug = 'nh-academy-gen2';
```

Očekivano: jedan red — `nh-academy-gen2 | nh-clanstvo-sadrzaj`.

Ako upit vrati nula redova, `on conflict do nothing` je progutao problem sa kolonama — proveri stvarna imena kolona:
`select column_name from information_schema.columns where table_name = 'course_unlocks';`

- [ ] **Korak 4: Commit**

```bash
git add supabase/migrations/084_gen2_membership_unlock.sql
git commit -m "Gen II kupovina otvara i NH Membership"
```

---

### Zadatak 4: Migracija 085 — tabele za push

**Fajlovi:**
- Create: `supabase/migrations/085_push_pretplate.sql`

- [ ] **Korak 1: Napiši migraciju**

```sql
-- Web Push pretplate + vodostaj obaveštenja po (kanal, korisnik).
--
-- push_pretplate: endpoint je primarni ključ jer ista osoba ima više uređaja,
-- a isti uređaj ne sme da se upiše dvaput. Cron čita service_role ključem
-- (zaobilazi RLS); članica vidi i briše samo svoje redove.
--
-- chat_obavestenja: DVA odvojena vodostaja. push_do se pomera i kad push nije
-- poslat (nema pretplate), da prozor pretrage poruka ne raste beskonačno;
-- mejl_do se pomera tek kad mejl ode ili kad je push uspeo - tako mejl pokriva
-- baš one koje push nije stigao.

create table public.push_pretplate (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  poslednja_greska text
);

create index push_pretplate_user_idx on public.push_pretplate (user_id);

alter table public.push_pretplate enable row level security;

create policy push_pretplate_select_own
  on public.push_pretplate for select
  using (auth.uid() = user_id);

create policy push_pretplate_insert_own
  on public.push_pretplate for insert
  with check (auth.uid() = user_id);

create policy push_pretplate_delete_own
  on public.push_pretplate for delete
  using (auth.uid() = user_id);

create table public.chat_obavestenja (
  kanal_id uuid not null references public.chat_kanali(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  push_do timestamptz not null default now(),
  mejl_do timestamptz not null default now(),
  primary key (kanal_id, user_id)
);

-- Bez polisa za authenticated: tabelu dira isključivo cron service_role
-- ključem. RLS uključen da anon/authenticated ne mogu ništa (default deny).
alter table public.chat_obavestenja enable row level security;
```

- [ ] **Korak 2: Primeni migraciju**

Kroz Supabase MCP `apply_migration`, ime `085_push_pretplate`.

- [ ] **Korak 3: Provera**

```sql
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('push_pretplate', 'chat_obavestenja');
```

Očekivano: oba reda sa `rowsecurity = true`.

- [ ] **Korak 4: Commit**

```bash
git add supabase/migrations/085_push_pretplate.sql
git commit -m "Tabele za push pretplate i vodostaj obaveštenja"
```

---

### Zadatak 5: Osveži tipove baze

**Fajlovi:**
- Modify: `src/lib/supabase/database.types.ts`

- [ ] **Korak 1: Generiši tipove**

Kroz Supabase MCP `generate_typescript_types` i upiši rezultat preko postojećeg fajla.

- [ ] **Korak 2: Provera da su nove tabele unutra**

```bash
grep -c "push_pretplate\|chat_obavestenja\|pristup_slug" src/lib/supabase/database.types.ts
```

Očekivano: broj veći od 0.

- [ ] **Korak 3: Provera da ništa nije puklo**

```bash
npx tsc --noEmit
```

Očekivano: bez grešaka.

- [ ] **Korak 4: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "Osveženi tipovi baze posle 083-085"
```

---

### Zadatak 6: Tiha zona (TDD)

22–07 po beogradskom vremenu. Mora da radi preko ponoći i preko prelaza na zimsko vreme (poslednja nedelja oktobra — 25.10.2026).

**Fajlovi:**
- Create: `src/lib/gen2-push.ts`
- Test: `src/lib/gen2-push.test.ts`

- [ ] **Korak 1: Napiši test koji pada**

`src/lib/gen2-push.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { uTihimSatima } from "./gen2-push";

// Leto (CEST, UTC+2): beogradski sat = UTC + 2.
describe("uTihimSatima - leto", () => {
  it("21:59 nije tiha zona", () => {
    expect(uTihimSatima(new Date("2026-08-08T19:59:00Z"))).toBe(false);
  });

  it("22:01 jeste tiha zona", () => {
    expect(uTihimSatima(new Date("2026-08-08T20:01:00Z"))).toBe(true);
  });

  it("00:30 (preko ponoći) jeste tiha zona", () => {
    expect(uTihimSatima(new Date("2026-08-08T22:30:00Z"))).toBe(true);
  });

  it("06:59 jeste tiha zona", () => {
    expect(uTihimSatima(new Date("2026-08-08T04:59:00Z"))).toBe(true);
  });

  it("07:01 nije tiha zona", () => {
    expect(uTihimSatima(new Date("2026-08-08T05:01:00Z"))).toBe(false);
  });
});

// Zima (CET, UTC+1) - posle prelaza 25.10.2026: beogradski sat = UTC + 1.
describe("uTihimSatima - zima", () => {
  it("21:30 nije tiha zona", () => {
    expect(uTihimSatima(new Date("2026-11-10T20:30:00Z"))).toBe(false);
  });

  it("22:30 jeste tiha zona", () => {
    expect(uTihimSatima(new Date("2026-11-10T21:30:00Z"))).toBe(true);
  });
});
```

- [ ] **Korak 2: Pokreni test i potvrdi da pada**

```bash
npm test -- src/lib/gen2-push.test.ts
```

Očekivano: FAIL — `Failed to resolve import "./gen2-push"`.

- [ ] **Korak 3: Najmanja implementacija**

`src/lib/gen2-push.ts`:

```ts
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
```

- [ ] **Korak 4: Pokreni test i potvrdi da prolazi**

```bash
npm test -- src/lib/gen2-push.test.ts
```

Očekivano: PASS, 7 testova.

- [ ] **Korak 5: Commit**

```bash
git add src/lib/gen2-push.ts src/lib/gen2-push.test.ts
git commit -m "Tiha zona 22-07 za Gen II obaveštenja"
```

---

### Zadatak 7: Grupisanje po primaocu (TDD)

**Fajlovi:**
- Modify: `src/lib/gen2-push.ts`
- Test: `src/lib/gen2-push.test.ts`

- [ ] **Korak 1: Dopiši testove koji padaju**

Dodaj na kraj `src/lib/gen2-push.test.ts` (i proširi `import` na vrhu fajla):

```ts
import {
  uTihimSatima,
  grupisiPoPrimaocu,
  type PorukaZaObavestenje,
  type Primalac,
} from "./gen2-push";

function p(id: string, autor: string, minut: number): PorukaZaObavestenje {
  return {
    id,
    user_id: autor,
    ime: autor === "ana" ? "Ana" : "Mila",
    tekst: `poruka ${id}`,
    created_at: `2026-10-01T10:${String(minut).padStart(2, "0")}:00Z`,
  };
}

function primalac(id: string, push_do: string, last_read_at: string | null = null): Primalac {
  return { user_id: id, push_do, mejl_do: push_do, last_read_at };
}

describe("grupisiPoPrimaocu", () => {
  const poruke = [p("m1", "ana", 5), p("m2", "mila", 7), p("m3", "ana", 9)];

  it("spaja sve nove poruke u jedno obaveštenje po primaocu", () => {
    const out = grupisiPoPrimaocu(poruke, [primalac("jelena", "2026-10-01T10:00:00Z")], "push_do");
    expect(out).toHaveLength(1);
    expect(out[0].poruke.map((x) => x.id)).toEqual(["m1", "m2", "m3"]);
    expect(out[0].najnovija).toBe("2026-10-01T10:09:00Z");
  });

  it("pošiljalac ne dobija svoju poruku", () => {
    const out = grupisiPoPrimaocu(poruke, [primalac("ana", "2026-10-01T10:00:00Z")], "push_do");
    expect(out[0].poruke.map((x) => x.id)).toEqual(["m2"]);
  });

  it("izostavlja poruke starije od vodostaja", () => {
    const out = grupisiPoPrimaocu(poruke, [primalac("jelena", "2026-10-01T10:07:00Z")], "push_do");
    expect(out[0].poruke.map((x) => x.id)).toEqual(["m3"]);
  });

  it("izostavlja poruke koje je primalac već pročitao", () => {
    const out = grupisiPoPrimaocu(
      poruke,
      [primalac("jelena", "2026-10-01T10:00:00Z", "2026-10-01T10:08:00Z")],
      "push_do"
    );
    expect(out[0].poruke.map((x) => x.id)).toEqual(["m3"]);
  });

  it("primalac bez ijedne nove poruke se izostavlja iz rezultata", () => {
    const out = grupisiPoPrimaocu(poruke, [primalac("jelena", "2026-10-01T10:09:00Z")], "push_do");
    expect(out).toEqual([]);
  });

  it("koristi mejl_do kad se traži vodostaj mejla", () => {
    const prima: Primalac = {
      user_id: "jelena",
      push_do: "2026-10-01T10:09:00Z",
      mejl_do: "2026-10-01T10:00:00Z",
      last_read_at: null,
    };
    const out = grupisiPoPrimaocu(poruke, [prima], "mejl_do");
    expect(out[0].poruke).toHaveLength(3);
  });
});
```

- [ ] **Korak 2: Pokreni test i potvrdi da pada**

```bash
npm test -- src/lib/gen2-push.test.ts
```

Očekivano: FAIL — `grupisiPoPrimaocu is not a function`.

- [ ] **Korak 3: Implementacija**

Dodaj u `src/lib/gen2-push.ts`:

```ts
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
```

- [ ] **Korak 4: Pokreni test i potvrdi da prolazi**

```bash
npm test -- src/lib/gen2-push.test.ts
```

Očekivano: PASS, 13 testova.

- [ ] **Korak 5: Commit**

```bash
git add src/lib/gen2-push.ts src/lib/gen2-push.test.ts
git commit -m "Grupisanje poruka po primaocu za Gen II obaveštenja"
```

---

### Zadatak 8: Tekst obaveštenja i prag za mejl (TDD)

**Fajlovi:**
- Modify: `src/lib/gen2-push.ts`
- Test: `src/lib/gen2-push.test.ts`

- [ ] **Korak 1: Dopiši testove koji padaju**

Proširi `import` na vrhu na `tekstObavestenja, trebaMejl, mnozina` i dodaj na kraj fajla:

```ts
describe("mnozina", () => {
  it("srpski oblici: 1 / 2-4 / 5+", () => {
    expect(mnozina(1, "poruka", "poruke", "poruka")).toBe("poruka");
    expect(mnozina(3, "poruka", "poruke", "poruka")).toBe("poruke");
    expect(mnozina(7, "poruka", "poruke", "poruka")).toBe("poruka");
  });

  it("11-14 idu na oblik za 5+, ne na oblik za 1", () => {
    expect(mnozina(11, "poruka", "poruke", "poruka")).toBe("poruka");
    expect(mnozina(12, "poruka", "poruke", "poruka")).toBe("poruka");
  });

  it("21 ide na oblik za 1, 22 na oblik za 2-4", () => {
    expect(mnozina(21, "poruka", "poruke", "poruka")).toBe("poruka");
    expect(mnozina(22, "poruka", "poruke", "poruka")).toBe("poruke");
  });
});

describe("tekstObavestenja", () => {
  it("jedna poruka: ime i tekst", () => {
    const t = tekstObavestenja([p("m1", "ana", 5)]);
    expect(t.naslov).toBe("Gen II");
    expect(t.telo).toBe("Ana: poruka m1");
  });

  it("više poruka: brojač i poslednja", () => {
    const t = tekstObavestenja([p("m1", "ana", 5), p("m2", "mila", 7), p("m3", "ana", 9)]);
    expect(t.telo).toBe("3 nove poruke - Ana: poruka m3");
  });

  it("skraćuje dugačak tekst", () => {
    const duga = { ...p("m1", "ana", 5), tekst: "x".repeat(200) };
    const t = tekstObavestenja([duga]);
    expect(t.telo.length).toBeLessThanOrEqual(130);
    expect(t.telo.endsWith("…")).toBe(true);
  });
});

describe("trebaMejl", () => {
  const sada = new Date("2026-10-01T10:20:00Z");

  it("poruka stara 9 minuta - još ne", () => {
    expect(trebaMejl([p("m1", "ana", 11)], sada)).toBe(false);
  });

  it("poruka stara 11 minuta - da", () => {
    expect(trebaMejl([p("m1", "ana", 9)], sada)).toBe(true);
  });

  it("prazan spisak - ne", () => {
    expect(trebaMejl([], sada)).toBe(false);
  });
});
```

- [ ] **Korak 2: Pokreni test i potvrdi da pada**

```bash
npm test -- src/lib/gen2-push.test.ts
```

Očekivano: FAIL — `tekstObavestenja is not a function`.

- [ ] **Korak 3: Implementacija**

Dodaj u `src/lib/gen2-push.ts`:

```ts
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
export function trebaMejl(poruke: PorukaZaObavestenje[], sada: Date, pragMin = MEJL_PRAG_MIN): boolean {
  return poruke.some((m) => sada.getTime() - new Date(m.created_at).getTime() >= pragMin * 60_000);
}
```

- [ ] **Korak 4: Pokreni test i potvrdi da prolazi**

```bash
npm test -- src/lib/gen2-push.test.ts
```

Očekivano: PASS, 22 testa.

- [ ] **Korak 5: Commit**

```bash
git add src/lib/gen2-push.ts src/lib/gen2-push.test.ts
git commit -m "Tekst push obaveštenja i prag za mejl-rezervu"
```

---

### Zadatak 9: VAPID ključevi i `web-push` omotač

**Fajlovi:**
- Modify: `package.json`
- Create: `src/lib/push.ts`

- [ ] **Korak 1: Instaliraj zavisnost**

```bash
npm install web-push && npm install --save-dev @types/web-push
```

- [ ] **Korak 2: Generiši VAPID par**

```bash
npx web-push generate-vapid-keys
```

Ispisuje `Public Key:` i `Private Key:`. **Ovi ključevi se generišu jednom i nikad ne menjaju** — promena poništava sve postojeće pretplate.

- [ ] **Korak 3: Upiši ih u okruženje**

U `.env.local` (za razvoj) i u Vercel Environment Variables (Production + Preview):

```
VAPID_PUBLIC_KEY=<javni>
VAPID_PRIVATE_KEY=<privatni>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<isti javni>
VAPID_SUBJECT=mailto:info@hartweger.rs
```

Javni ključ stoji dvaput namerno: `NEXT_PUBLIC_` varijantu čita browser pri pretplati, a onu bez prefiksa server pri slanju.

- [ ] **Korak 4: Napiši omotač**

`src/lib/push.ts`:

```ts
// Omotač oko web-push: jedna tačka kroz koju ide svako slanje, sa tumačenjem
// odgovora push servisa. 404/410 znači da pretplata više ne postoji (obrisan
// browser, deinstalirana PWA) - pozivalac tada briše red iz push_pretplate.
import webpush from "web-push";
import * as Sentry from "@sentry/nextjs";

export interface PushPretplata {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushTelo {
  naslov: string;
  telo: string;
  url: string;
}

export type IshodSlanja = "ok" | "mrtva" | "greska";

let podesen = false;

/** Lenjo podešavanje: bez ključeva push tiho miruje, kao što email.ts radi bez RESEND_API_KEY. */
function podesi(): boolean {
  if (podesen) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    console.warn("[push] VAPID ključevi nisu postavljeni - push isključen");
    return false;
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:info@hartweger.rs", pub, priv);
  podesen = true;
  return true;
}

export async function posaljiPush(p: PushPretplata, telo: PushTelo): Promise<IshodSlanja> {
  if (!podesi()) return "greska";
  try {
    await webpush.sendNotification(
      { endpoint: p.endpoint, keys: { p256dh: p.p256dh, auth: p.auth } },
      JSON.stringify(telo)
    );
    return "ok";
  } catch (e) {
    const kod = (e as { statusCode?: number }).statusCode;
    if (kod === 404 || kod === 410) return "mrtva";
    console.error(`[push] slanje palo (${kod ?? "bez koda"}):`, e);
    Sentry.captureException(e);
    return "greska";
  }
}
```

- [ ] **Korak 5: Provera da se prevodi**

```bash
npx tsc --noEmit
```

Očekivano: bez grešaka.

- [ ] **Korak 6: Commit**

```bash
git add package.json package-lock.json src/lib/push.ts
git commit -m "web-push omotač sa tumačenjem mrtvih pretplata"
```

---

### Zadatak 10: Mejl-rezerva

**Fajlovi:**
- Modify: `src/lib/email.ts` (dodati na kraj fajla)

- [ ] **Korak 1: Dodaj funkciju**

```ts
// Rezerva za polaznice bez push pretplate (npr. iPhone bez instalirane PWA).
// Šalje se tek kad poruka odstoji nepročitana - vidi trebaMejl u gen2-push.ts.
export async function sendGen2NovePorukeEmail(
  to: string,
  ime: string,
  opts: { broj: number; poslednjeIme: string; poslednjiTekst: string },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const prvo = ime ? ime.split(" ")[0] : "";
    const naslov =
      opts.broj === 1
        ? "Nova poruka u Gen II"
        : `${opts.broj} novih poruka u Gen II`;
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: "info@hartweger.rs",
      subject: naslov,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<h2>Zdravo${prvo ? ", " + esc(prvo) : ""}!</h2>
<p>U kanalu <strong>Gen II</strong> te čeka ${opts.broj === 1 ? "nova poruka" : `${opts.broj} novih poruka`}.</p>
<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #c94f6d;background:#faf9f6">
<strong>${esc(opts.poslednjeIme)}:</strong> ${esc(opts.poslednjiTekst)}
</blockquote>
<p style="margin:24px 0"><a href="${SITE_URL}/clanstvo/zajednica" style="background:#c94f6d;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">Otvori zajednicu</a></p>
<p style="margin-top:20px;font-size:13px;color:#666">Ovaj mejl stiže zato što na ovom uređaju nemaš uključena obaveštenja. Uključi ih u zajednici i mejlovi prestaju.</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendGen2NovePorukeEmail pao:", e);
  }
}
```

- [ ] **Korak 2: Provera da se prevodi**

```bash
npx tsc --noEmit
```

Očekivano: bez grešaka.

- [ ] **Korak 3: Commit**

```bash
git add src/lib/email.ts
git commit -m "Mejl-rezerva za nove poruke u Gen II kanalu"
```

---

### Zadatak 11: Cron ruta

**Fajlovi:**
- Create: `src/app/api/cron/gen2-push/route.ts`
- Modify: `vercel.json`
- Modify: `src/lib/cron-log.ts:12-38` (spisak `EXPECTED_CRONS`)

- [ ] **Korak 1: Napiši rutu**

`src/app/api/cron/gen2-push/route.ts`:

```ts
// Obaveštenja za privatni kanal Gen II. Svaki minut: pokupi nove poruke,
// grupiši po primaocu, pošalji jedan push - a onome ko nema pretplatu, mejl
// posle 10 minuta nepročitanosti. Sva odluka je u lib/gen2-push.ts; ovde je
// samo čitanje baze i slanje.
import { NextRequest, NextResponse } from "next/server";
import { withCronLog, must } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { posaljiPush } from "@/lib/push";
import { sendGen2NovePorukeEmail } from "@/lib/email";
import {
  uTihimSatima,
  grupisiPoPrimaocu,
  tekstObavestenja,
  trebaMejl,
  type PorukaZaObavestenje,
  type Primalac,
} from "@/lib/gen2-push";

const KANAL_SLUG = "gen2";
const URL_KANALA = "/clanstvo/zajednica";
// Zaštita od preplavljivanja: i da ostane bez nadzora preko vikenda, jedan
// prolaz obrađuje najviše ovoliko poruka.
const MAX_PORUKA = 200;

async function cronHandler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sada = new Date();
  // Tiha zona: ne šalje se i ne pomeraju se vodostaji, pa u 7 ujutru ide jedno
  // obaveštenje sa svime propuštenim.
  if (uTihimSatima(sada)) return NextResponse.json({ preskoceno: "tiha-zona" });

  const admin = createAdminClient();

  const kanal = must(
    await admin.from("chat_kanali").select("id, pristup_slug").eq("slug", KANAL_SLUG).maybeSingle(),
    "chat_kanali"
  );
  if (!kanal) return NextResponse.json({ preskoceno: "nema-kanala" });

  const kurs = must(
    await admin.from("courses").select("id").eq("slug", kanal.pristup_slug).maybeSingle(),
    "courses"
  );
  if (!kurs) return NextResponse.json({ preskoceno: "nema-kursa" });

  // Ko ima pristup kanalu = važeći course_access na kurs iz pristup_slug.
  // Admin se namerno ne dodaje ovde: Nataša ne treba push na svaku poruku.
  const pristupi = must(
    await admin.from("course_access").select("user_id, expires_at").eq("course_id", kurs.id),
    "course_access"
  );
  const korisnici = [
    ...new Set(
      pristupi
        .filter((p) => !p.expires_at || new Date(p.expires_at) > sada)
        .map((p) => p.user_id)
    ),
  ];
  if (korisnici.length === 0) return NextResponse.json({ obavesteno: 0 });

  // Prvi put viđen korisnik dobija vodostaj = sada, pa mu se istorija ne šalje unazad.
  must(
    await admin.from("chat_obavestenja").upsert(
      korisnici.map((user_id) => ({
        kanal_id: kanal.id,
        user_id,
        push_do: sada.toISOString(),
        mejl_do: sada.toISOString(),
      })),
      { onConflict: "kanal_id,user_id", ignoreDuplicates: true }
    ),
    "chat_obavestenja upsert"
  );

  const vodostaji = must(
    await admin
      .from("chat_obavestenja")
      .select("user_id, push_do, mejl_do")
      .eq("kanal_id", kanal.id)
      .in("user_id", korisnici),
    "chat_obavestenja"
  );
  if (vodostaji.length === 0) return NextResponse.json({ obavesteno: 0 });

  // Prozor pretrage: od najstarijeg vodostaja bilo kog primaoca, gledajući oba
  // (push_do i mejl_do). Poređenje ide preko Date, ne stringova - timestamptz
  // ume da stigne u više zapisa (+00:00 vs Z), pa leksikografsko poređenje nije
  // pouzdano.
  let najstarijiMs = Infinity;
  for (const v of vodostaji) {
    najstarijiMs = Math.min(najstarijiMs, new Date(v.push_do).getTime(), new Date(v.mejl_do).getTime());
  }
  const najstariji = new Date(najstarijiMs).toISOString();

  const poruke = must(
    await admin
      .from("chat_poruke")
      .select("id, user_id, ime, tekst, created_at")
      .eq("kanal_id", kanal.id)
      .gt("created_at", najstariji)
      .order("created_at", { ascending: true })
      .limit(MAX_PORUKA),
    "chat_poruke"
  ) as PorukaZaObavestenje[];
  if (poruke.length === 0) return NextResponse.json({ obavesteno: 0 });

  const procitano = must(
    await admin
      .from("chat_procitano")
      .select("user_id, last_read_at")
      .eq("kanal_id", kanal.id)
      .in("user_id", korisnici),
    "chat_procitano"
  );
  const citano = new Map(procitano.map((r) => [r.user_id, r.last_read_at]));

  const pretplate = must(
    await admin
      .from("push_pretplate")
      .select("endpoint, user_id, p256dh, auth")
      .in("user_id", korisnici),
    "push_pretplate"
  );
  const poKorisniku = new Map<string, typeof pretplate>();
  for (const s of pretplate) {
    poKorisniku.set(s.user_id, [...(poKorisniku.get(s.user_id) ?? []), s]);
  }

  const primaoci: Primalac[] = vodostaji.map((v) => ({
    user_id: v.user_id,
    push_do: v.push_do,
    mejl_do: v.mejl_do,
    last_read_at: citano.get(v.user_id) ?? null,
  }));

  let poslatoPush = 0;
  let poslatoMejl = 0;
  const mrtve: string[] = [];

  // --- Push ---
  for (const o of grupisiPoPrimaocu(poruke, primaoci, "push_do")) {
    const moje = poKorisniku.get(o.user_id) ?? [];
    const telo = { ...tekstObavestenja(o.poruke), url: URL_KANALA };
    let uspelo = false;
    for (const s of moje) {
      const ishod = await posaljiPush(s, telo);
      if (ishod === "ok") uspelo = true;
      if (ishod === "mrtva") mrtve.push(s.endpoint);
    }
    if (uspelo) poslatoPush++;
    // push_do se pomera i kad push nije poslat - inače bi prozor pretrage rastao
    // beskonačno za nekoga ko se nikad ne pretplati. mejl_do se pomera SAMO ako
    // je push stigao, da mejl-rezerva pokrije baš one koje push nije.
    await admin
      .from("chat_obavestenja")
      .update(uspelo ? { push_do: o.najnovija, mejl_do: o.najnovija } : { push_do: o.najnovija })
      .eq("kanal_id", kanal.id)
      .eq("user_id", o.user_id);
  }

  if (mrtve.length > 0) {
    await admin.from("push_pretplate").delete().in("endpoint", mrtve);
  }

  // --- Mejl-rezerva ---
  // Vodostaji su se gore promenili, pa se čitaju ponovo.
  const svezi = must(
    await admin
      .from("chat_obavestenja")
      .select("user_id, push_do, mejl_do")
      .eq("kanal_id", kanal.id)
      .in("user_id", korisnici),
    "chat_obavestenja (mejl)"
  );
  const zaMejl: Primalac[] = svezi.map((v) => ({
    user_id: v.user_id,
    push_do: v.push_do,
    mejl_do: v.mejl_do,
    last_read_at: citano.get(v.user_id) ?? null,
  }));

  for (const o of grupisiPoPrimaocu(poruke, zaMejl, "mejl_do")) {
    if (!trebaMejl(o.poruke, sada)) continue;
    const { data: korisnik } = await admin
      .from("user_profiles")
      .select("email, full_name")
      .eq("id", o.user_id)
      .maybeSingle();
    if (!korisnik?.email) continue;
    const poslednja = o.poruke[o.poruke.length - 1];
    await sendGen2NovePorukeEmail(korisnik.email, korisnik.full_name ?? "", {
      broj: o.poruke.length,
      poslednjeIme: poslednja.ime,
      poslednjiTekst: poslednja.tekst.slice(0, 200),
    });
    poslatoMejl++;
    await admin
      .from("chat_obavestenja")
      .update({ mejl_do: o.najnovija })
      .eq("kanal_id", kanal.id)
      .eq("user_id", o.user_id);
  }

  return NextResponse.json({
    poruka: poruke.length,
    push: poslatoPush,
    mejl: poslatoMejl,
    mrtvePretplate: mrtve.length,
  });
}

export const GET = withCronLog("gen2-push", cronHandler);
```

- [ ] **Korak 2: Proveri da `user_profiles` zaista ima kolonu `email`**

```sql
select column_name from information_schema.columns
where table_name = 'user_profiles' and column_name in ('email', 'full_name');
```

Očekivano: oba reda. Ako `email` ne postoji, mejl-adresa se čita iz `auth.users` kroz `admin.auth.admin.getUserById(o.user_id)` — zameni taj upit.

- [ ] **Korak 3: Dodaj cron u nadzor**

U `src/lib/cron-log.ts`, u niz `EXPECTED_CRONS`, ispod komentara o dnevnim cronovima dodaj novu grupu:

```ts
  // svaki minut (2h = velikodušan zazor za kratke ispade Vercel-a)
  { name: "gen2-push", maxAgeHours: 2 },
```

Zašto 2, a ne nešto blizu minuta: u tihoj zoni cron se vraća pre posla, ali
`withCronLog` svejedno upiše prolaz (401 je jedini koji se ne beleži) — pa je
razmak između upisa uvek ispod sata, i noću. Dva sata je dovoljno usko da uhvati
pravi ispad, a dovoljno široko da kratak Vercel prekid ne digne lažan alarm.

- [ ] **Korak 4: Zakaži cron**

U `vercel.json`, u niz `crons`, dodaj:

```json
    {
      "path": "/api/cron/gen2-push",
      "schedule": "* * * * *"
    }
```

- [ ] **Korak 5: Provera da se prevodi i da testovi i dalje prolaze**

```bash
npx tsc --noEmit && npm test && npm run lint
```

Očekivano: bez grešaka, svi testovi prolaze.

- [ ] **Korak 6: Ručna proba rute lokalno**

```bash
npm run dev
```

U drugom terminalu:

```bash
curl -s -H "Authorization: Bearer $(grep '^CRON_SECRET=' .env.local | cut -d= -f2)" http://localhost:3000/api/cron/gen2-push
```

Očekivano: JSON. Ako je beogradsko vreme između 22 i 7 → `{"preskoceno":"tiha-zona"}`. Inače `{"poruka":0,...}` dok u kanalu nema poruka.

Provera da autorizacija stoji:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/cron/gen2-push
```

Očekivano: `401`.

- [ ] **Korak 7: Commit**

```bash
git add src/app/api/cron/gen2-push/route.ts src/lib/cron-log.ts vercel.json
git commit -m "Cron za Gen II obaveštenja: push + mejl-rezerva"
```

---

### Zadatak 12: Service worker

**Fajlovi:**
- Create: `public/clanstvo-sw.js`

- [ ] **Korak 1: Napiši service worker**

```js
// Service worker NH Membershipa - isključivo za push obaveštenja Gen II kanala.
// BEZ keširanja i offline režima: to nosi svoje rizike od zastarelog sadržaja
// i zaslužuje zaseban posao.
//
// Registruje se sa scope "/clanstvo/" (vidi PushPrijava.tsx). Fajl stoji u
// korenu, pa mu je najširi mogući doseg "/" - uži doseg je dozvoljen i
// Service-Worker-Allowed zaglavlje ne treba.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let p;
  try {
    p = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(p.naslov || "Gen II", {
      body: p.telo || "",
      icon: "/nh-icon-192.png",
      badge: "/nh-icon-192.png",
      // Isti tag: novo obaveštenje zamenjuje staro umesto da se ređaju u nizu.
      // renotify traži da telefon ipak zavibrira na zamenu.
      tag: "gen2",
      renotify: true,
      data: { url: p.url || "/clanstvo/zajednica" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const cilj = (event.notification.data && event.notification.data.url) || "/clanstvo/zajednica";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabovi) => {
      for (const t of tabovi) {
        if (t.url.includes("/clanstvo/zajednica")) return t.focus();
      }
      return self.clients.openWindow(cilj);
    })
  );
});
```

- [ ] **Korak 2: Provera da ESLint ne pokušava da ga lintuje**

```bash
npm run lint
```

Očekivano: bez grešaka. `public/` nije u ESLint obuhvatu (`eslint.config.mjs` gleda `src/` i `scripts/`); ako se ipak javi greška o `self` ili `clients`, dodaj `public/` u `ignores` u `eslint.config.mjs`.

- [ ] **Korak 3: Commit**

```bash
git add public/clanstvo-sw.js
git commit -m "Service worker za push obaveštenja članstva"
```

---

### Zadatak 13: Čiste funkcije za browser (TDD)

Pretvaranje VAPID ključa i detekcija iOS-a bez PWA izdvajaju se iz komponente da bi se testirale bez browsera.

**Fajlovi:**
- Create: `src/lib/push-klijent.ts`
- Test: `src/lib/push-klijent.test.ts`

- [ ] **Korak 1: Napiši testove koji padaju**

`src/lib/push-klijent.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { base64UrlUBajtove, jeIosBezPwa } from "./push-klijent";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD_DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

describe("base64UrlUBajtove", () => {
  it("dekodira base64url bez dopune", () => {
    // "Ma" -> base64 "TWE=", base64url bez dopune "TWE"
    expect(Array.from(base64UrlUBajtove("TWE"))).toEqual([77, 97]);
  });

  it("prevodi - i _ u + i /", () => {
    // bajtovi [251, 255] -> base64 "+/8=" -> base64url "-_8"
    expect(Array.from(base64UrlUBajtove("-_8"))).toEqual([251, 255]);
  });

  it("vraća Uint8Array", () => {
    expect(base64UrlUBajtove("TWE")).toBeInstanceOf(Uint8Array);
  });
});

describe("jeIosBezPwa", () => {
  it("iPhone u tabu - da", () => {
    expect(jeIosBezPwa(IPHONE, false, 5)).toBe(true);
  });

  it("iPhone kao instalirana PWA - ne", () => {
    expect(jeIosBezPwa(IPHONE, true, 5)).toBe(false);
  });

  it("iPad koji se predstavlja kao desktop Safari - da", () => {
    expect(jeIosBezPwa(IPAD_DESKTOP_UA, false, 5)).toBe(true);
  });

  it("pravi Mac (bez dodira) - ne", () => {
    expect(jeIosBezPwa(IPAD_DESKTOP_UA, false, 0)).toBe(false);
  });

  it("Android - ne", () => {
    expect(jeIosBezPwa(ANDROID, false, 5)).toBe(false);
  });
});
```

- [ ] **Korak 2: Pokreni test i potvrdi da pada**

```bash
npm test -- src/lib/push-klijent.test.ts
```

Očekivano: FAIL — `Failed to resolve import "./push-klijent"`.

- [ ] **Korak 3: Implementacija**

`src/lib/push-klijent.ts`:

```ts
// Čiste funkcije za pretplatu na push u browseru (PushPrijava.tsx),
// izdvojene radi testiranja bez browsera.

/**
 * PushManager.subscribe traži applicationServerKey kao bajtove, a VAPID javni
 * ključ stiže kao base64url string iz okruženja.
 */
export function base64UrlUBajtove(base64url: string): Uint8Array {
  const dopuna = "=".repeat((4 - (base64url.length % 4)) % 4);
  const b64 = (base64url + dopuna).replace(/-/g, "+").replace(/_/g, "/");
  const sirovo = atob(b64);
  const out = new Uint8Array(sirovo.length);
  for (let i = 0; i < sirovo.length; i++) out[i] = sirovo.charCodeAt(i);
  return out;
}

/**
 * iOS/iPadOS u običnom tabu: Web Push tu ne postoji - radi samo iz aplikacije
 * dodate na početni ekran. Umesto pokvarenog dugmeta prikazuje se uputstvo.
 *
 * iPad od iPadOS 13 šalje Macintosh user agent, pa se razlikuje po tome što
 * Mac nema dodirni ekran (maxTouchPoints === 0).
 */
export function jeIosBezPwa(ua: string, standalone: boolean, maxTouchPoints: number): boolean {
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
  return ios && !standalone;
}
```

- [ ] **Korak 4: Pokreni test i potvrdi da prolazi**

```bash
npm test -- src/lib/push-klijent.test.ts
```

Očekivano: PASS, 8 testova.

- [ ] **Korak 5: Commit**

```bash
git add src/lib/push-klijent.ts src/lib/push-klijent.test.ts
git commit -m "Čiste funkcije za push pretplatu u browseru"
```

---

### Zadatak 14: Komponenta za dozvolu i pretplatu

**Fajlovi:**
- Create: `src/components/clanstvo/PushPrijava.tsx`

- [ ] **Korak 1: Napiši komponentu**

```tsx
"use client";
// Uključivanje push obaveštenja za Gen II kanal.
//
// Dozvola se traži ISKLJUČIVO iz onClick - browseri odbijaju
// Notification.requestPermission() koji ne dolazi iz korisničkog gesta.
//
// Na iOS-u u običnom tabu Notification/PushManager uopšte ne postoje (Web Push
// radi samo iz aplikacije dodate na početni ekran), pa se umesto dugmeta
// prikazuje uputstvo. Detekcija je u lib/push-klijent.ts.
//
// Pretplata se upisuje direktnim insertom pod RLS-om (085), isto kako
// ChatKlijent upisuje poruke.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { base64UrlUBajtove, jeIosBezPwa } from "@/lib/push-klijent";

type Stanje = "ucitava" | "ios-uputstvo" | "nepodrzano" | "iskljuceno" | "ukljuceno" | "odbijeno";

export default function PushPrijava({ mojId }: { mojId: string }) {
  const [stanje, setStanje] = useState<Stanje>("ucitava");
  const [radi, setRadi] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    if (jeIosBezPwa(nav.userAgent, nav.standalone === true, nav.maxTouchPoints)) {
      setStanje("ios-uputstvo");
      return;
    }
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window) ||
      !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ) {
      setStanje("nepodrzano");
      return;
    }
    if (Notification.permission === "denied") {
      setStanje("odbijeno");
      return;
    }
    let aktivan = true;
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration("/clanstvo/");
      const sub = await reg?.pushManager.getSubscription();
      if (aktivan) setStanje(sub ? "ukljuceno" : "iskljuceno");
    })();
    return () => {
      aktivan = false;
    };
  }, []);

  async function ukljuci() {
    setRadi(true);
    try {
      const dozvola = await Notification.requestPermission();
      if (dozvola !== "granted") {
        setStanje(dozvola === "denied" ? "odbijeno" : "iskljuceno");
        return;
      }
      const reg = await navigator.serviceWorker.register("/clanstvo-sw.js", { scope: "/clanstvo/" });
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlUBajtove(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const json = sub.toJSON();
      await createClient().from("push_pretplate").upsert({
        endpoint: sub.endpoint,
        user_id: mojId,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      });
      setStanje("ukljuceno");
    } catch (e) {
      console.error("[push] uključivanje palo:", e);
      setStanje("iskljuceno");
    } finally {
      setRadi(false);
    }
  }

  async function iskljuci() {
    setRadi(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/clanstvo/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await createClient().from("push_pretplate").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setStanje("iskljuceno");
    } finally {
      setRadi(false);
    }
  }

  if (stanje === "ucitava" || stanje === "nepodrzano") return null;

  const okvir = "mb-3 rounded-xl border border-nh-pink-light bg-nh-pink-bg px-4 py-3 text-sm";

  if (stanje === "ios-uputstvo") {
    return (
      <div className={okvir}>
        <strong>Da ne propustiš odgovor:</strong> dodaj NH Membership na početni ekran — dugme{" "}
        <em>Podeli</em> u Safariju, pa <em>Dodaj na početni ekran</em>. Zatim otvori zajednicu iz te
        ikonice i uključi obaveštenja.
      </div>
    );
  }

  if (stanje === "odbijeno") {
    return (
      <div className={okvir}>
        Obaveštenja su blokirana u podešavanjima browsera za ovaj sajt. Uključi ih tamo, pa osveži
        stranicu.
      </div>
    );
  }

  if (stanje === "ukljuceno") {
    return (
      <div className={`${okvir} flex items-center justify-between gap-3`}>
        <span>Obaveštenja su uključena na ovom uređaju.</span>
        <button
          onClick={iskljuci}
          disabled={radi}
          className="whitespace-nowrap rounded-full border border-nh-pink-light bg-white px-4 py-1.5 font-semibold text-nh-dark disabled:opacity-50"
        >
          Isključi
        </button>
      </div>
    );
  }

  return (
    <div className={`${okvir} flex items-center justify-between gap-3`}>
      <span>Uključi obaveštenja da znaš kad ti neko odgovori.</span>
      <button
        onClick={ukljuci}
        disabled={radi}
        className="whitespace-nowrap rounded-full bg-nh-pink px-4 py-1.5 font-semibold text-white disabled:opacity-50"
      >
        Uključi
      </button>
    </div>
  );
}
```

- [ ] **Korak 2: Provera da se prevodi i lintuje**

```bash
npx tsc --noEmit && npm run lint
```

Očekivano: bez grešaka.

- [ ] **Korak 3: Commit**

```bash
git add src/components/clanstvo/PushPrijava.tsx
git commit -m "Komponenta za uključivanje push obaveštenja"
```

---

### Zadatak 15: Uvezati komponentu u chat

**Fajlovi:**
- Modify: `src/components/clanstvo/ChatKlijent.tsx` (dodati import na vrh i prikaz iznad spiska poruka, oko linije 232)

- [ ] **Korak 1: Dodaj import**

Ispod postojećeg `import { createClient } from "@/lib/supabase/client";`:

```tsx
import PushPrijava from "@/components/clanstvo/PushPrijava";
```

- [ ] **Korak 2: Prikaži komponentu samo u Gen II kanalu**

Zameni postojeći red (oko linije 232):

```tsx
      {aktivni?.opis && <p className="pb-2 text-sm text-nh-dark/60">{aktivni.opis}</p>}
```

sa:

```tsx
      {aktivni?.opis && <p className="pb-2 text-sm text-nh-dark/60">{aktivni.opis}</p>}
      {/* Push samo u Gen II - tamo zamenjuje WhatsApp grupu. Ostali kanali
          ostaju na bedžu i tačkici u navigaciji. */}
      {aktivni?.slug === "gen2" && <PushPrijava mojId={mojId} />}
```

- [ ] **Korak 3: Provera da se prevodi, lintuje i da testovi prolaze**

```bash
npx tsc --noEmit && npm run lint && npm test
```

Očekivano: bez grešaka, svi testovi prolaze.

- [ ] **Korak 4: Provera u browseru**

```bash
npm run dev
```

Prijavi se kao admin (admin vidi sve kanale kroz `ima_pristup_kanalu`), otvori `http://localhost:3000/clanstvo/zajednica`.

Očekivano: kanal **Gen II** stoji prvi u nizu dugmadi; kad se izabere, iznad spiska poruka stoji ružičasti okvir sa dugmetom „Uključi". U ostalim kanalima okvira nema.

- [ ] **Korak 5: Commit**

```bash
git add src/components/clanstvo/ChatKlijent.tsx
git commit -m "Prikaz uključivanja obaveštenja u Gen II kanalu"
```

---

### Zadatak 16: Ručna matrica pred 30.9.

Ovo testovi ne pokrivaju. Radi se na deploy-ovanoj Preview ili Production adresi — `localhost` nije dovoljan jer push zahteva HTTPS (izuzetak je `localhost`, ali iOS PWA se ne može instalirati sa njega).

**Fajlovi:** nijedan (provera)

- [ ] **Korak 1: Deploy i provera okruženja**

Potvrdi da su sve četiri VAPID promenljive u Vercel Production okruženju i da je deploy prošao.

- [ ] **Korak 2: Desktop Chrome**

Otvori zajednicu → Gen II → „Uključi" → prihvati dozvolu. Iz drugog naloga pošalji poruku u Gen II. Sačekaj do 2 minuta.
Očekivano: obaveštenje se pojavi; klik na njega fokusira već otvoren tab zajednice umesto da otvori novi.

- [ ] **Korak 3: Android Chrome (bez instalacije)**

Isto kao gore, u običnom browseru na telefonu.
Očekivano: dozvola se traži i push stiže — instalacija PWA nije potrebna.

- [ ] **Korak 4: iPhone, Safari u tabu**

Otvori zajednicu → Gen II.
Očekivano: **nema dugmeta**, stoji uputstvo „Podeli → Dodaj na početni ekran". Ništa ne puca u konzoli.

- [ ] **Korak 5: iPhone, instalirana PWA**

Podeli → Dodaj na početni ekran → otvori iz ikonice → Gen II → „Uključi" → prihvati.
Iz drugog naloga pošalji poruku.
Očekivano: push stiže na zaključan ekran.

- [ ] **Korak 6: Sažimanje**

Pošalji tri poruke zaredom iz drugog naloga.
Očekivano: **jedno** obaveštenje oblika „3 nove poruke - <ime>: <tekst>", ne tri.

- [ ] **Korak 7: Onaj ko gleda kanal ne dobija push**

Drži Gen II otvoren u prvom planu i neka drugi nalog pošalje poruku.
Očekivano: poruka se pojavi u chatu kroz Realtime, push **ne** stiže.

- [ ] **Korak 8: Mejl-rezerva**

Na nalogu koji nema nijednu push pretplatu neka stigne poruka; ne otvaraj zajednicu 11 minuta.
Očekivano: mejl „Nova poruka u Gen II" stiže na adresu naloga. Ako se zajednica otvori pre isteka 10 minuta — mejl **ne** stiže.

- [ ] **Korak 9: Izolacija kanala (najvažnije)**

Prijavi se kao aktivna članica koja **nije** admin i **nema** Gen II.

Očekivano: kanal Gen II se ne vidi u nizu dugmadi.

Da se potvrdi da to nije samo skriveno u UI-ju nego zaista odbijeno RLS-om,
proveri iz baze šta funkcija vraća za taj nalog (uzmi `user_id` iz upita ispod):

```sql
-- nađi aktivnu članicu koja nije admin i nema Gen II
select ca.user_id
from public.course_access ca
join public.courses c on c.id = ca.course_id
join public.user_profiles up on up.id = ca.user_id
where c.slug = 'nh-clanstvo-sadrzaj'
  and (ca.expires_at is null or ca.expires_at > now())
  and up.role <> 'admin'
  and not exists (
    select 1 from public.course_access g
    join public.courses gc on gc.id = g.course_id
    where g.user_id = ca.user_id and gc.slug = 'nh-academy-gen2'
  )
limit 1;

-- šta ta osoba sme da vidi
select k.slug, public.ima_pristup_kanalu('<uuid-iz-gornjeg-upita>', k.id) as vidi
from public.chat_kanali k order by k.sort;
```

Očekivano: `gen2 → false`, ostala četiri `→ true`.

- [ ] **Korak 10: Tiha zona**

Posle 22h pošalji poruku u Gen II.
Očekivano: push ne stiže te večeri; sutradan posle 7h stiže jedno obaveštenje sa brojem propuštenih.

- [ ] **Korak 11: Nadzor crona**

```sql
select name, ok, status, created_at from public.cron_runs
where name = 'gen2-push' order by created_at desc limit 5;
```

Očekivano: redovi na svaki minut, `ok = true`, `status = 200`.

---

### Zadatak 17: Uputstvo za polaznice

Bez ovoga polaznice na iPhone-u ostaju samo na mejlu — a to je tačno rupa zbog koje je WhatsApp postojao. Ovo je Natašin zadatak, ne razvojni.

**Fajlovi:** nijedan (sadržaj)

- [ ] **Korak 1:** Dodati uputstvo „Podeli → Dodaj na početni ekran → uključi obaveštenja" u welcome mejl Gen II.
- [ ] **Korak 2:** Pokazati isto uživo na prvom susretu 30.9. i sačekati da svaka polaznica to uradi na svom telefonu.

---

## Van obima

Odgovori (`reply_to`) i @pominjanja. Push za ostala 4 kanala. Podešavanja obaveštenja po kanalu. Offline režim u service worker-u. Obaveštenja o bilo čemu osim poruka.
