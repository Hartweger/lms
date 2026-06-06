# Migracija LearnDash pristupa na novi LMS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodeliti svim aktivnim LearnDash kupcima pristup tačnim sadržajnim kursevima na novom LMS-u, sa rokom = datum kupovine + 365 dana, tiho (bez mejlova).

**Architecture:** Jednokratna Node skripta (`npx tsx`) koja povlači WooCommerce narudžbine preko REST API-ja, mapira `product_id`/naziv → sadržajne slugove (čista, testirana logika u zasebnom modulu), dedupira po (email, kurs) sa najdaljim rokom, i upsertuje u `course_access` (pravilo „nikad ne skraćuj"). Dry-run je podrazumevan; `--write` upisuje. Tag `source='wp-migration-2026-06'` za rollback.

**Tech Stack:** TypeScript + `npx tsx`, `@supabase/supabase-js` (service-role), WooCommerce REST API v3, vitest za unit testove čiste logike.

**Spec:** `docs/superpowers/specs/2026-06-06-migracija-learndash-pristup-design.md`

---

## File Structure

- `supabase/migrations/034_course_access_source.sql` — **Create.** Dodaje `source TEXT` kolonu na `course_access`.
- `scripts/ld-access-mapping.ts` — **Create.** Čista logika: konstante (LD id→slug, NAME_MAP, EXCL) + funkcije `normalizeEmail`, `expiryFromPaid`, `mergeExpiry`, `relatedIdsToSlugs`, `resolveSlugs`. Bez IO — testabilno.
- `scripts/ld-access-mapping.test.ts` — **Create.** vitest unit testovi za gornje funkcije.
- `scripts/migrate-ld-access.ts` — **Create.** Driver: env, WC fetch (proizvodi + narudžbine), dedup, resolve slug→course.id, dry-run izveštaj, `--write` (find-or-create user + upsert sa MAX rokom).

Konvencije iz postojećih skripti: env iz `.env.local` ručno (`fs.readFileSync`), `createClient(URL, SERVICE_ROLE)`, `run().catch()` obrazac, `__dirname` (tsx CJS). WC kredencijali (`WC_CONSUMER_KEY`/`WC_CONSUMER_SECRET`) i WP basic kroz env varijable pri pokretanju.

---

## Task 1: SQL migracija — `source` kolona

**Files:**
- Create: `supabase/migrations/034_course_access_source.sql`

- [ ] **Step 1: Napiši migraciju**

Create `supabase/migrations/034_course_access_source.sql`:

```sql
-- Tag za migrirane redove (rollback: DELETE ... WHERE source='wp-migration-2026-06').
ALTER TABLE public.course_access ADD COLUMN IF NOT EXISTS source TEXT;
CREATE INDEX IF NOT EXISTS idx_course_access_source ON public.course_access(source);
```

- [ ] **Step 2: Primeni na bazu**

Primeniti preko Supabase SQL Editora (vidi memoriju `reference_supabase_ddl`). Nalepiti sadržaj fajla i pokrenuti.
Verifikacija (u SQL Editoru):

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name='course_access' AND column_name='source';
```
Expected: jedan red `source`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/034_course_access_source.sql
git commit -m "feat(db): course_access.source kolona za migraciju (rollback tag)"
```

---

## Task 2: Čista mapiranje-logika + testovi (TDD)

**Files:**
- Create: `scripts/ld-access-mapping.ts`
- Test: `scripts/ld-access-mapping.test.ts`

- [ ] **Step 1: Napiši padajući test**

Create `scripts/ld-access-mapping.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  normalizeEmail, expiryFromPaid, mergeExpiry, relatedIdsToSlugs, resolveSlugs,
} from "./ld-access-mapping";

describe("normalizeEmail", () => {
  it("lowercase + trim", () => {
    expect(normalizeEmail("  Ana@Gmail.COM ")).toBe("ana@gmail.com");
  });
  it("nevalidan → null", () => {
    expect(normalizeEmail("nije-mejl")).toBeNull();
    expect(normalizeEmail("ana@gmail.con")).toBeNull(); // tipfeler .con
    expect(normalizeEmail("")).toBeNull();
  });
});

describe("expiryFromPaid / mergeExpiry", () => {
  it("dodaje 365 dana", () => {
    const paid = Date.parse("2026-01-01T00:00:00Z");
    expect(expiryFromPaid(paid)).toBe(paid + 365 * 86400000);
  });
  it("mergeExpiry uzima veći (nikad ne skraćuje)", () => {
    expect(mergeExpiry(100, 200)).toBe(200);
    expect(mergeExpiry(300, 200)).toBe(300);
    expect(mergeExpiry(null, 200)).toBe(200);
  });
});

describe("relatedIdsToSlugs", () => {
  it("prevodi LD id → slug, nepoznate izbacuje", () => {
    expect(relatedIdsToSlugs([25340, 28450, 99999])).toEqual(["nemacki-a1-1", "nemacki-a1-2"]);
  });
});

describe("resolveSlugs", () => {
  const related = { 100: ["nemacki-a1-1", "nemacki-a1-2"] }; // VIDEO A1 (preko _related_course)

  it("naziv-override ima prioritet (individualni A1.1 → video)", () => {
    expect(resolveSlugs(0, "INDIVIDUALNI KURS  nemačkog jezika A1.1 - Nataša Hartweger", related))
      .toEqual(["nemacki-a1-1"]);
  });
  it("konverzacije → kurs-konverzacije", () => {
    expect(resolveSlugs(0, "GRUPNI KURS konverzacije na nemačkom jeziku 2", related))
      .toEqual(["kurs-konverzacije"]);
  });
  it("Masterclass Sprechen B1 → polozi-goethe-b1", () => {
    expect(resolveSlugs(0, "Masterclass - SPRECHEN i SCHREIBEN B1", related))
      .toEqual(["polozi-goethe-b1"]);
  });
  it("isključeni (free/usluga/obnavljanje) → [] ", () => {
    expect(resolveSlugs(123, "Testiranje", related)).toEqual([]);
    expect(resolveSlugs(0, "INDIVIDUALNI KURS A2 – obnavljanje", related)).toEqual([]);
    expect(resolveSlugs(0, "📘 Paket individualnih časova KTŽ – Kako ti želiš", related)).toEqual([]);
    expect(resolveSlugs(0, "Deklinacija prideva", related)).toEqual([]); // port kasnije
  });
  it("preko _related_course kad nema override/excl", () => {
    expect(resolveSlugs(100, "VIDEO kurs nemačkog jezika A1", related))
      .toEqual(["nemacki-a1-1", "nemacki-a1-2"]);
  });
  it("nepoznat proizvod (nije u mapi) → null", () => {
    expect(resolveSlugs(555, "Neki novi proizvod", related)).toBeNull();
  });
});
```

- [ ] **Step 2: Pokreni test — mora da padne**

Run: `npx vitest run scripts/ld-access-mapping.test.ts`
Expected: FAIL — `Cannot find module './ld-access-mapping'`.

- [ ] **Step 3: Implementiraj modul**

Create `scripts/ld-access-mapping.ts`:

```ts
// Čista logika mapiranja WooCommerce proizvoda → sadržajni slugovi na novom LMS-u.
// Bez IO. Testirano u ld-access-mapping.test.ts.

export const YEAR_MS = 365 * 86400000;

// LearnDash course id → novi slug
export const LD_TO_SLUG: Record<number, string> = {
  25340: "nemacki-a1-1", 28450: "nemacki-a1-2",
  30649: "nemacki-a2-1", 33399: "nemacki-a2-2",
  35855: "nemacki-b1-1", 37375: "nemacki-b1-2",
  45327: "nemacki-b2-1", 40821: "nemacki-b2-2",
  47215: "polozi-goethe-c1", 31516: "polozi-goethe-b1", 31515: "polozi-goethe-b2",
  45501: "polozi-fide", 40305: "fsp", 47790: "gramatika-a2-b1",
  50096: "kurs-za-mame-i-trudnice",
};

// Override po NAZIVU (radi i za legacy product_id=0). Ima prioritet nad svim ostalim.
export const NAME_MAP: Array<[RegExp, string[]]> = [
  [/INDIVIDUALNI KURS\s+nema.*A1\.1/i, ["nemacki-a1-1"]],
  [/INDIVIDUALNI KURS\s+nema.*A1\.2/i, ["nemacki-a1-2"]],
  [/INDIVIDUALNI KURS\s+nema.*A2\.1/i, ["nemacki-a2-1"]],
  [/INDIVIDUALNI KURS\s+nema.*A2\.2/i, ["nemacki-a2-2"]],
  [/INDIVIDUALNI KURS\s+nema.*B1\.1/i, ["nemacki-b1-1"]],
  [/INDIVIDUALNI KURS\s+nema.*B1\.2/i, ["nemacki-b1-2"]],
  [/Paket nivo A1.*INDIVIDUALNI/i, ["nemacki-a1-1", "nemacki-a1-2"]],
  [/mame i trudnice/i, ["kurs-za-mame-i-trudnice"]],
  [/konverzacije/i, ["kurs-konverzacije"]],
  [/GRUPNI KURS nema.*B1\.1\s*\+\s*B1\.2/i, ["nemacki-b1-1", "nemacki-b1-2"]],
  [/GRUPNI KURS nema.*B2\.1\s*\+\s*B2\.2/i, ["nemacki-b2-1", "nemacki-b2-2"]],
  [/KURS U PARU.*A1\.1/i, ["nemacki-a1-1"]],
  [/KURS U PARU.*B1\.2/i, ["nemacki-b1-2"]],
  [/Premium A2|Goethe A2 Priprema/i, ["nemacki-a2-1", "nemacki-a2-2"]],
  [/Masterclass.*SPRECHEN/i, ["polozi-goethe-b1"]],
];

// Eksplicitno isključeni (free + 1:1 usluge + obnavljanje + port-kasnije). → [] (poznato, ne pravi nalog).
export const EXCL: RegExp[] = [
  /Testiranje/i, /Zašto ti nema/i, /Kako da .*u.i. re.i/i,
  /mese.ni paketi/i, /Prevo.enje/i, /Izrada biografije/i, /NH Academy/i, /Kreiranje ponude/i,
  /obnavljanje/i, /Poslednji korak/i, /Kako ti želiš|KTŽ/i, /^INDIVIDUALNI KURS$/i, /KURS U PARU/i,
  /Deklinacija prideva/i, /Savladajte Osnove|Gramatika nema.kog jezika\s+A1/i,
];

export function normalizeEmail(raw: string): string | null {
  const e = (raw || "").toLowerCase().trim();
  if (!e.includes("@") || e.endsWith(".con")) return null;
  return e;
}

export function expiryFromPaid(paidMs: number): number {
  return paidMs + YEAR_MS;
}

export function mergeExpiry(existing: number | null, next: number): number {
  return existing != null && existing > next ? existing : next;
}

export function relatedIdsToSlugs(ids: number[]): string[] {
  return ids.map((id) => LD_TO_SLUG[id]).filter(Boolean);
}

// Vrati: string[] slugova (može prazan = poznato bez sadržaja) ili null (nepoznat proizvod).
// NAPOMENA: KURS U PARU je i u NAME_MAP i u EXCL — NAME_MAP se proverava PRVI, pa pobeđuje.
export function resolveSlugs(
  productId: number,
  name: string,
  relatedSlugMap: Record<number, string[]>,
): string[] | null {
  for (const [re, slugs] of NAME_MAP) if (re.test(name)) return slugs;
  for (const re of EXCL) if (re.test(name)) return [];
  if (relatedSlugMap[productId] !== undefined) return relatedSlugMap[productId];
  return null;
}
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npx vitest run scripts/ld-access-mapping.test.ts`
Expected: PASS (svi testovi zeleni).

- [ ] **Step 5: Commit**

```bash
git add scripts/ld-access-mapping.ts scripts/ld-access-mapping.test.ts
git commit -m "feat(migracija): cista mapiranje-logika LD proizvod->slug + testovi"
```

---

## Task 3: Driver skripta — fetch + dedup + dry-run izveštaj

**Files:**
- Create: `scripts/migrate-ld-access.ts`

- [ ] **Step 1: Napiši driver (dry-run deo)**

Create `scripts/migrate-ld-access.ts`:

```ts
/**
 * Migracija LearnDash pristupa → course_access na novom LMS-u.
 * Izvor: WooCommerce narudžbine (completed+processing, after=2025-06-07), rok = date_paid + 365.
 * Podrazumevano DRY-RUN. --write upisuje (find-or-create user, upsert sa MAX rokom, bez mejlova).
 *
 *   WC_CONSUMER_KEY=... WC_CONSUMER_SECRET=... npx tsx scripts/migrate-ld-access.ts [--write]
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import {
  normalizeEmail, expiryFromPaid, mergeExpiry, relatedIdsToSlugs, resolveSlugs,
} from "./ld-access-mapping";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const WRITE = process.argv.includes("--write");
const SOURCE = "wp-migration-2026-06";
const AFTER = "2025-06-07T00:00:00";
const WC = "https://hartweger.rs/wp-json/wc/v3";
const wcAuth = "Basic " + Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function wcGet(pathQs: string) {
  const r = await fetch(`${WC}${pathQs}`, { headers: { Authorization: wcAuth } });
  if (!r.ok) throw new Error(`WC ${r.status} ${pathQs}`);
  return r.json();
}

// product_id → [slug] preko _related_course
async function buildRelatedMap(): Promise<{ map: Record<number, string[]>; name: Record<number, string> }> {
  const map: Record<number, string[]> = {}; const name: Record<number, string> = {};
  let page = 1;
  while (true) {
    const d = await wcGet(`/products?per_page=100&page=${page}&status=publish`);
    if (!Array.isArray(d) || !d.length) break;
    for (const p of d) {
      name[p.id] = p.name;
      const rel = (p.meta_data || []).find((m: { key: string }) => m.key === "_related_course")?.value;
      map[p.id] = Array.isArray(rel) ? relatedIdsToSlugs(rel.map(Number)) : [];
    }
    page++; await sleep(2500);
    if (page > 8) break;
  }
  return { map, name };
}

type Plan = Map<string, { name: string; perCourse: Map<string, number> }>; // email → {name, slug→expiryMs}

async function buildPlan(related: Record<number, string[]>, pname: Record<number, string>) {
  const plan: Plan = new Map();
  const unmapped = new Map<string, number>();
  const now = Date.now();
  let bad = 0, expired = 0, orders = 0;
  for (const status of ["completed", "processing"]) {
    let page = 1;
    while (true) {
      const d = await wcGet(`/orders?status=${status}&per_page=100&page=${page}&after=${AFTER}`);
      if (!Array.isArray(d) || !d.length) break;
      for (const ord of d) {
        orders++;
        const email = normalizeEmail(ord.billing?.email || "");
        if (!email) { bad++; continue; }
        const exp = expiryFromPaid(new Date(ord.date_paid || ord.date_created).getTime());
        const full = `${ord.billing?.first_name || ""} ${ord.billing?.last_name || ""}`.trim();
        for (const it of ord.line_items || []) {
          if ((it.quantity || 0) <= 0) continue;
          const slugs = resolveSlugs(it.product_id, it.name || pname[it.product_id] || "", related);
          if (slugs === null) { const k = it.name || `pid${it.product_id}`; unmapped.set(k, (unmapped.get(k) || 0) + 1); continue; }
          if (!slugs.length) continue;
          if (exp < now) { expired++; continue; }
          if (!plan.has(email)) plan.set(email, { name: full, perCourse: new Map() });
          const m = plan.get(email)!.perCourse;
          for (const s of slugs) m.set(s, mergeExpiry(m.get(s) ?? null, exp));
        }
      }
      page++; await sleep(2500);
      if (page > 60) break;
    }
  }
  return { plan, unmapped, bad, expired, orders };
}

function report(plan: Plan, unmapped: Map<string, number>, existing: Set<string>, meta: { bad: number; expired: number; orders: number }) {
  const per: Record<string, number> = {}; let grants = 0, neu = 0;
  for (const [email, v] of plan) {
    if (!existing.has(email)) neu++;
    for (const [s] of v.perCourse) { per[s] = (per[s] || 0) + 1; grants++; }
  }
  console.log(`\n=== ${WRITE ? "WRITE" : "DRY-RUN"} ===`);
  console.log(`Narudžbina: ${meta.orders} | loš mejl: ${meta.bad} | isteklih dodela: ${meta.expired}`);
  console.log(`Korisnika: ${plan.size} | novih naloga: ${neu} | dodela: ${grants}`);
  console.log("Po kursu:");
  Object.entries(per).sort((a, b) => b[1] - a[1]).forEach(([s, n]) => console.log(`  ${s.padEnd(26)}${n}`));
  console.log("NEMAPIRANO:");
  if (!unmapped.size) console.log("  — nema —");
  [...unmapped.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ×${n}  ${k}`));
}

async function loadExisting(): Promise<Set<string>> {
  const set = new Set<string>(); let from = 0;
  while (true) {
    const { data } = await sb.from("user_profiles").select("email").range(from, from + 999);
    if (!data || !data.length) break;
    data.forEach((r) => r.email && set.add(r.email.toLowerCase().trim()));
    if (data.length < 1000) break; from += 1000;
  }
  return set;
}

async function run() {
  const { map, name } = await buildRelatedMap();
  const { plan, unmapped, bad, expired, orders } = await buildPlan(map, name);
  const existing = await loadExisting();
  report(plan, unmapped, existing, { bad, expired, orders });
  if (!WRITE) { console.log("\n[DRY] --write za upis."); return; }
  // upis: Task 4
}
run().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Pokreni dry-run**

Run: `WC_CONSUMER_KEY=<key> WC_CONSUMER_SECRET=<secret> npx tsx scripts/migrate-ld-access.ts`
(Ključevi iz memorije `reference_wc_api`.)
Expected: izveštaj sa **~577 korisnika, ~143 nova naloga, ~1472 dodele, NEMAPIRANO: — nema —**. Raspodela: a1-1≈248, a1-2≈232, … konverzacije≈7.

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate-ld-access.ts
git commit -m "feat(migracija): driver WC->course_access (dry-run izvestaj)"
```

---

## Task 4: `--write` logika — find-or-create + upsert sa MAX rokom

**Files:**
- Modify: `scripts/migrate-ld-access.ts` (funkcija `run`, zameni komentar `// upis: Task 4`)

- [ ] **Step 1: Dodaj write logiku**

U `scripts/migrate-ld-access.ts` zameni red `  // upis: Task 4` ovim blokom (unutar `run`, posle `if (!WRITE)`):

```ts
  // resolve slug → course.id (cache)
  const wantSlugs = new Set<string>();
  for (const v of plan.values()) for (const s of v.perCourse.keys()) wantSlugs.add(s);
  const { data: courses } = await sb.from("courses").select("id,slug").in("slug", [...wantSlugs]);
  const slugToId = new Map((courses || []).map((c) => [c.slug, c.id]));
  const missing = [...wantSlugs].filter((s) => !slugToId.has(s));
  if (missing.length) { console.error("✗ Nedostaju kursevi u bazi:", missing); process.exit(1); }

  let neu = 0, grants = 0;
  for (const [email, v] of plan) {
    // find-or-create user
    const { data: prof } = await sb.from("user_profiles").select("id").eq("email", email).maybeSingle();
    let uid = prof?.id as string | undefined;
    if (!uid) {
      const { data: nu, error } = await sb.auth.admin.createUser({ email, email_confirm: true });
      if (error || !nu?.user) { console.error(`  ✗ ${email}: ${error?.message}`); continue; }
      uid = nu.user.id; neu++;
      await sb.from("user_profiles").upsert({ id: uid, email, full_name: v.name, role: "student" });
    }
    for (const [slug, exp] of v.perCourse) {
      const courseId = slugToId.get(slug)!;
      // pravilo "nikad ne skraćuj": uzmi MAX(postojeći, novi)
      const { data: cur } = await sb.from("course_access")
        .select("expires_at").eq("user_id", uid).eq("course_id", courseId).maybeSingle();
      const curMs = cur?.expires_at ? new Date(cur.expires_at).getTime() : null;
      const finalExp = new Date(mergeExpiry(curMs, exp)).toISOString();
      await sb.from("course_access").upsert(
        { user_id: uid, course_id: courseId, expires_at: finalExp, source: SOURCE },
        { onConflict: "user_id,course_id" },
      );
      grants++;
    }
  }
  console.log(`\n✓ Upisano: ${grants} dodela, ${neu} novih naloga. BEZ mejlova. source='${SOURCE}'.`);
```

- [ ] **Step 2: Tipska/sintaksna provera (bez upisa)**

Run: `npx tsc --noEmit -p tsconfig.json` (ili `npm run lint`)
Expected: bez grešaka u `scripts/migrate-ld-access.ts`.

- [ ] **Step 3: Commit (još BEZ pokretanja --write)**

```bash
git add scripts/migrate-ld-access.ts
git commit -m "feat(migracija): --write find-or-create + upsert sa MAX rokom"
```

---

## Task 5: Spot-check + bezbedan `--write` + verifikacija

**Files:** nema izmena koda — operativni koraci.

- [ ] **Step 1: Spot-check 3-4 korisnika protiv LearnDash-a**

Iz dry-run izveštaja izaberi po jedan: video, grupni, individualni, paket kupca. Za svaki, pozovi WP/LD (memorija `reference_wp_api`, Basic auth) i proveri da li ima taj kurs i da rok ≈ kupovina+365:

```bash
curl -s -u "Nati:<app-pass>" \
  "https://www.hartweger.rs/wp-json/ldlms/v2/users/<wp_user_id>/courses"
```
Expected: kursevi se poklapaju sa onim što bi migracija dodelila. Ako NE — stani i ispravi mapu pre upisa.

- [ ] **Step 2: Pokreni `--write`**

Run: `WC_CONSUMER_KEY=<key> WC_CONSUMER_SECRET=<secret> npx tsx scripts/migrate-ld-access.ts --write`
Expected: `✓ Upisano: ~1472 dodela, ~143 novih naloga.`

- [ ] **Step 3: Verifikacija u bazi**

U Supabase SQL Editoru:

```sql
SELECT count(*) FILTER (WHERE source='wp-migration-2026-06') AS migrirano,
       count(DISTINCT user_id) FILTER (WHERE source='wp-migration-2026-06') AS korisnika
FROM course_access;
```
Expected: `migrirano` ≈ 1472, `korisnika` ≈ 577.

- [ ] **Step 4: Idempotentnost — ponovi `--write`**

Run isto kao Step 2 ponovo.
Expected: isti brojevi, bez novih naloga (neu≈0), bez duplikata (upsert).

- [ ] **Step 5: Rollback procedura (dokumentuj, ne izvršavaj)**

Ako treba poništiti:
```sql
-- vrati pristup
DELETE FROM public.course_access WHERE source='wp-migration-2026-06';
-- (opciono) tako kreirani nalozi bez druge aktivnosti — ručno, uz proveru
```

---

## Self-Review

**Spec coverage:**
- Izvor WC API + filter (completed/processing, after, refunded/0-qty) → Task 3 `buildPlan`. ✓
- Rok date_paid+365 → `expiryFromPaid` (Task 2). ✓
- Mapa `_related_course` + override po nazivu + isključeni + port-kasnije → Task 2 `LD_TO_SLUG`/`NAME_MAP`/`EXCL`, `resolveSlugs`. ✓
- Dedup po (email,slug) najdalji → Task 3 `mergeExpiry` u `buildPlan`. ✓
- `source` kolona + tag → Task 1 + Task 4. ✓
- Find-or-create bez mejla → Task 4. ✓
- Pravilo „nikad ne skraćuj" (MAX) → `mergeExpiry` + čitanje postojećeg u Task 4. ✓
- Dry-run izveštaj + NEMAPIRANO → Task 3 `report`. ✓
- Spot-check pre write → Task 5 Step 1. ✓
- Rollback → Task 5 Step 5. ✓

**Placeholder scan:** Nema TBD/TODO; sav kod je kompletan; komandi dat očekivani izlaz.

**Type consistency:** `resolveSlugs(productId, name, relatedSlugMap)` isti potpis u testu (Task 2) i driveru (Task 3). `mergeExpiry(number|null, number)` isti u Task 2/3/4. `relatedSlugMap` je `Record<number,string[]>` svuda. Slug konstante (`nemacki-a1-1` itd.) potvrđene da postoje u bazi (dry-run NEMAPIRANO prazno, resolve slug→id nema `missing`).

**Otvoreno:** Nema — sve spec stavke pokrivene.
