# Grupne beleške na platformi (kriška 3) - plan implementacije

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Profesorka vodi belešku grupnog časa na platformi (isti obrazac sa 7 sekcija kao 1:1), svi polaznici grupe je čitaju na `/beleske` i uče reči na `/moje-reci`, a nova B1.1 grupa od 16.11.2026 kreće bez Google Doc-a.

**Architecture:** Šema iz migracije 109 već ima `class_notes.group_session_id` i `student_wordsets.group_id`. Dodajemo prekidač po grupi (`groups.notes_on_platform`), RLS za polaznike grupe, zaštitu da brisanje grupne sesije ne povuče belešku, i novu rutu `/api/profesor/class-notes/grupa` koja deli upis beleške i seta reči sa 1:1 rutom preko zajedničkog modula. `NotesEditor` dobija `target` (1:1 ili grupa). Polaznikovo čitanje (`beleske-student.ts`) spaja 1:1 i grupne beleške.

**Tech Stack:** Next.js App Router, Supabase (service-role klijent + RLS kao drugi sloj), vitest.

**Spec:** `docs/superpowers/specs/2026-09-30-beleske-u-platformi-i-licne-kartice-design.md` (kriška 3). Kriška 1: `docs/superpowers/plans/2026-09-30-beleske-platforma-kriska1.md`.

---

## Pravila za izvršioca (pročitaj pre prvog zadatka)

1. **Radi na grani `beleske-grupe` u worktree-ju, NE na `main`.** Na trunk-based `main` svaki tuđi push objavljuje i tvoje commitove (zamka 30.09: kriška 1 je tako nenamerno otišla na produkciju). Spajanje u `main` i deploy idu tek kad Nataša kaže.
   ```bash
   cd /Users/natasahartweger/Documents/Claude/sajt/LMS/lms
   git worktree add ../lms-beleske-grupe -b beleske-grupe
   cd ../lms-beleske-grupe && cp ../lms/.env.local . && npm install
   ```
2. Tipovi: `./node_modules/.bin/tsc --noEmit` (ne `npx tsc`). Testovi: `npx vitest run <putanja>`.
3. U vidljivom tekstu nikad em-crta ni en-crta, samo obična crtica `-`. Ti forma prema polazniku i profesorki.
4. `upsert` sa `onConflict` NE RADI nad `class_notes` i `student_wordsets` (parcijalni jedinstveni indeksi) - uvek select pa insert/update.
5. Supabase tiho seče upite na 1000 redova - kad čitaš liste koje mogu da rastu, paginiraj `.range()`.
6. **Prelaz:** platforma važi samo za grupe sa `notes_on_platform = true`. Tekuće grupe ostaju na Google Doc-u, ništa se ne migrira.

## Struktura fajlova

| Fajl | Šta | Odgovornost |
|---|---|---|
| `supabase/migrations/111_class_notes_grupe.sql` | nov | kolona-prekidač, FK restrict, RLS za polaznike grupe, indeks |
| `src/lib/supabase/database.types.ts` | izmena | `groups.notes_on_platform` |
| `src/lib/group-notes.ts` (+ test) | nov | čiste funkcije: izbor sesije za belešku, filtriranje sesija sa beleškom |
| `src/lib/group-sessions.ts` | izmena | sync ne briše sesije koje imaju belešku |
| `src/app/api/profesor/grupna-sesija/route.ts` | izmena | DELETE odbija sesiju sa beleškom |
| `src/lib/class-notes-store.ts` | nov | `upsertNote`, `replaceWordset` - zajedničko za 1:1 i grupu |
| `src/app/api/profesor/class-notes/route.ts` | izmena | koristi `class-notes-store` (ponašanje isto) |
| `src/app/api/profesor/class-notes/grupa/route.ts` | nov | GET/PUT grupne beleške |
| `src/components/beleska/NotesEditor.tsx` | izmena | `target` umesto `enrollmentId` |
| `src/app/profesor/individualni/IndividualniClient.tsx` | izmena | prosleđuje `target` |
| `src/app/profesor/sesije/page.tsx`, `SesijeClient.tsx` | izmena | dugme „Beleške za čas" za grupe na platformi |
| `src/lib/beleske-student.ts` | izmena | polaznik vidi i grupne beleške i setove |
| `src/app/api/student/account/route.ts`, `src/app/nalog/Sekcije.tsx` | izmena | linkovi „Beleške" / „Moje reči" na grupnoj kartici |
| `src/lib/grant-access.ts` | izmena | welcome mejl vodi na `/beleske` za grupe na platformi |
| `src/app/api/admin/grupe/[id]/osvezi-termin/route.ts`, `nova-generacija/route.ts` | izmena | ne upisuju Google Doc link grupi na platformi |
| `scripts/b11-novembar-beleske-platforma.mjs` | nov | uključi prekidač za B1.1 od 16.11 |

---

### Task 1: Migracija 111 - prekidač, zaštita beleške, RLS za grupe

**Files:**
- Create: `supabase/migrations/111_class_notes_grupe.sql`
- Modify: `src/lib/supabase/database.types.ts` (blok `groups:` oko reda 1416 - `Row`, `Insert`, `Update`)

- [ ] **Step 1: Napiši migraciju**

```sql
-- 111: Grupne beleške na platformi (kriška 3).
--
-- 1) Prekidač po grupi. Spec: platforma važi za NOVE grupe, tekuće ostaju na Google Doc-u.
--    Podrazumevano false - nijedna postojeća grupa ne menja ponašanje.
alter table public.groups
  add column if not exists notes_on_platform boolean not null default false;

-- 2) Beleška ne sme da nestane zajedno sa sesijom. 109 je imala ON DELETE CASCADE, a
--    syncGroupSessions („Napravi / osveži termin") briše buduće i DANAŠNJE 'auto' sesije i
--    pravi ih ponovo - klik admina istog dana posle časa bi tiho obrisao belešku.
--    Kod (Task 3, 4) sesije sa beleškom zaobilazi; RESTRICT je drugi sloj.
alter table public.class_notes drop constraint if exists class_notes_group_session_id_fkey;
alter table public.class_notes
  add constraint class_notes_group_session_id_fkey
  foreign key (group_session_id) references public.group_sessions(id) on delete restrict;

create index if not exists student_wordsets_group_idx
  on public.student_wordsets(group_id, lesson_date desc);

-- 3) RLS za polaznike grupe. Ista zamka kao 110: politika na class_notes pita
--    group_sessions i group_enrollments, a Postgres i u podupitu primenjuje RLS tih tabela.
--    Do sad su obe imale SAMO staff politike, pa bi politika za polaznika uvek padala.
create policy "grp_enroll student read own"
  on public.group_enrollments for select
  using (auth.uid() = user_id);

create policy "grp_sessions student read own group"
  on public.group_sessions for select
  using (
    exists (
      select 1 from public.group_enrollments ge
      where ge.group_id = group_sessions.group_id
        and ge.user_id = auth.uid()
        and ge.status = 'active'
    )
  );

-- Polaznik grupe vidi SVE beleške svoje grupe, i one pre svog upisa (spec).
-- Uslov je aktivan upis u grupu, NE istek pristupa platformi.
create policy "class_notes student read own group"
  on public.class_notes for select
  using (
    exists (
      select 1
      from public.group_sessions gs
      join public.group_enrollments ge on ge.group_id = gs.group_id
      where gs.id = class_notes.group_session_id
        and ge.user_id = auth.uid()
        and ge.status = 'active'
    )
  );

create policy "student_wordsets student read own group"
  on public.student_wordsets for select
  using (
    exists (
      select 1 from public.group_enrollments ge
      where ge.group_id = student_wordsets.group_id
        and ge.user_id = auth.uid()
        and ge.status = 'active'
    )
  );

create policy "student_wordset_items student read own group"
  on public.student_wordset_items for select
  using (
    exists (
      select 1
      from public.student_wordsets sw
      join public.group_enrollments ge on ge.group_id = sw.group_id
      where sw.id = student_wordset_items.wordset_id
        and ge.user_id = auth.uid()
        and ge.status = 'active'
    )
  );
```

- [ ] **Step 2: Dopuni tipove**

U `src/lib/supabase/database.types.ts`, blok `groups:` → `Row` dodaj `notes_on_platform: boolean`, `Insert` i `Update` dodaj `notes_on_platform?: boolean`. Abecedno, odmah posle `notes_doc_id`.

- [ ] **Step 3: Primeni na produkcionu bazu**

Migracija je aditivna (nova kolona sa default-om, nove politike, zamena FK-a istog imena). Primeni preko Supabase MCP `apply_migration` (projekat `rzmyglynjcygsbicssbt`, ime `111_class_notes_grupe`) ili preko service-role puta iz `reference_supabase_ddl`. Pre toga proveri da nijedna postojeća beleška nije grupna (inače RESTRICT ne menja ništa, ali dobro je znati):

```sql
select count(*) from class_notes where group_session_id is not null;
```
Expected: `0`.

Posle primene:
```sql
select column_default, is_nullable from information_schema.columns
 where table_name='groups' and column_name='notes_on_platform';
select confdeltype from pg_constraint where conname='class_notes_group_session_id_fkey';
```
Expected: `false | NO`, pa `r` (restrict).

- [ ] **Step 4: Tipovi prolaze**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/111_class_notes_grupe.sql src/lib/supabase/database.types.ts
git commit -m "feat(beleske): migracija za grupne beleske - prekidac, RESTRICT, RLS za polaznike grupe"
```

---

### Task 2: Čiste funkcije za grupnu belešku

**Files:**
- Create: `src/lib/group-notes.ts`
- Test: `src/lib/group-notes.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
import { describe, expect, it } from "vitest";
import { pickSessionForNote, withoutNotedSessions } from "./group-notes";

describe("pickSessionForNote", () => {
  it("nema sesije za datum -> none", () => {
    expect(pickSessionForNote([])).toEqual({ kind: "none" });
  });
  it("aktivna sesija -> found", () => {
    expect(pickSessionForNote([{ id: "s1", cancelled: false }])).toEqual({ kind: "found", sessionId: "s1" });
  });
  it("sesija označena kao otkazana -> cancelled (beleška se ne veže na otkazan čas)", () => {
    expect(pickSessionForNote([{ id: "s1", cancelled: true }])).toEqual({ kind: "cancelled" });
  });
});

describe("withoutNotedSessions", () => {
  it("izbacuje sesije koje imaju belešku, ostale vraća", () => {
    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(withoutNotedSessions(rows, new Set(["b"]))).toEqual([{ id: "a" }, { id: "c" }]);
  });
  it("prazan skup beleški ne menja listu", () => {
    expect(withoutNotedSessions([{ id: "a" }], new Set())).toEqual([{ id: "a" }]);
  });
});
```

- [ ] **Step 2: Pokreni test**

Run: `npx vitest run src/lib/group-notes.test.ts`
Expected: FAIL - `Cannot find module './group-notes'`.

- [ ] **Step 3: Implementacija**

```ts
/**
 * Čista logika grupnih beleški - bez baze, da se testira bez mock-ova.
 *
 * group_sessions ima unique(group_id, session_date), pa za (grupa, datum) postoji najviše
 * jedan red; zato ulaz za pickSessionForNote ima 0 ili 1 element.
 */

export type SessionPick =
  | { kind: "none" }
  | { kind: "found"; sessionId: string }
  | { kind: "cancelled" };

export function pickSessionForNote(rows: { id: string; cancelled: boolean }[]): SessionPick {
  const row = rows[0];
  if (!row) return { kind: "none" };
  if (row.cancelled) return { kind: "cancelled" };
  return { kind: "found", sessionId: row.id };
}

/** Sesije bez beleške - samo njih sme da obriše osvežavanje rasporeda. */
export function withoutNotedSessions<T extends { id: string }>(rows: T[], notedIds: Set<string>): T[] {
  return rows.filter((r) => !notedIds.has(r.id));
}
```

- [ ] **Step 4: Test prolazi**

Run: `npx vitest run src/lib/group-notes.test.ts`
Expected: PASS (5 testova).

- [ ] **Step 5: Commit**

```bash
git add src/lib/group-notes.ts src/lib/group-notes.test.ts
git commit -m "feat(beleske): izbor grupne sesije za belesku + filter sesija sa beleskom"
```

---

### Task 3: Osvežavanje rasporeda ne dira sesije sa beleškom

**Files:**
- Modify: `src/lib/group-sessions.ts` (telo `syncGroupSessions`)

- [ ] **Step 1: Zameni bulk delete selektivnim**

Umesto jednog `delete()` sa filterima: prvo pročitaj kandidate, izbaci one sa beleškom, pa obriši po id-ju.

```ts
import { withoutNotedSessions } from "@/lib/group-notes";
// ...
    const today = new Date().toISOString().slice(0, 10);
    // Kandidati za brisanje: SAMO buduće/današnje, ne-otkazane 'auto' sesije (prošlost = istorija
    // honorara; otkazane ostaju otkazane) - i to SAMO one bez beleške. Beleška je vezana za sesiju
    // (FK RESTRICT od 111) i ne sme da nestane zato što je admin istog dana kliknuo „Osveži termin".
    const { data: candidates } = await admin.from("group_sessions").select("id")
      .eq("group_id", g.id).eq("source", "auto").eq("cancelled", false).gte("session_date", today);
    const candidateIds = (candidates ?? []).map((r) => r.id as string);
    if (candidateIds.length) {
      const { data: noted } = await admin.from("class_notes").select("group_session_id")
        .in("group_session_id", candidateIds);
      const notedIds = new Set((noted ?? []).map((n) => n.group_session_id as string));
      const toDelete = withoutNotedSessions(candidates as { id: string }[], notedIds).map((r) => r.id);
      if (toDelete.length) await admin.from("group_sessions").delete().in("id", toDelete);
    }
```

Ostatak funkcije (`upsert` sa `ignoreDuplicates`) ostaje isti - sesija sa beleškom ostaje na svom datumu, a upsert je za taj datum preskoči.

- [ ] **Step 2: Postojeći testovi i tipovi**

Run: `npx vitest run src/lib && ./node_modules/.bin/tsc --noEmit`
Expected: PASS, bez grešaka tipova.

- [ ] **Step 3: Commit**

```bash
git add src/lib/group-sessions.ts
git commit -m "fix(grupe): osvezavanje termina ne brise sesiju koja ima belesku"
```

---

### Task 4: Skidanje sesije sa beleškom se odbija

**Files:**
- Modify: `src/app/api/profesor/grupna-sesija/route.ts` (DELETE)

- [ ] **Step 1: Provera pre brisanja/otkazivanja**

U `DELETE`, posle `ownedGroup` provere, a pre grananja `auto`/`manual`:

```ts
  // Sesija sa beleškom je održan čas - ne skida se (ni 'manual' brisanjem, ni 'auto' otkazivanjem),
  // jer bi beleška ostala vezana za čas koji „nije održan" ili bi brisanje palo na FK RESTRICT (111).
  const { data: note } = await staff.admin.from("class_notes").select("id").eq("group_session_id", sessionId).maybeSingle();
  if (note) {
    return NextResponse.json({ error: "Ovaj čas ima belešku - ne može da se skine. Ako je greška, javi Nataši." }, { status: 409 });
  }
```

- [ ] **Step 2: Tipovi**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/profesor/grupna-sesija/route.ts
git commit -m "fix(grupe): sesija sa beleskom ne moze da se skine"
```

---

### Task 5: Zajednički upis beleške i seta reči (refaktor 1:1 rute)

**Files:**
- Create: `src/lib/class-notes-store.ts`
- Modify: `src/app/api/profesor/class-notes/route.ts`

Cilj: `upsertNote` i `replaceWordset` iz 1:1 rute prelaze u modul i dobijaju „metu" kao parametar. **Ponašanje 1:1 se ne menja** - samo se premešta kod.

- [ ] **Step 1: Napravi modul**

```ts
/**
 * Upis beleške i njenog seta reči - zajedničko za 1:1 (individual_lesson_id / individual_enrollment_id)
 * i grupu (group_session_id / group_id). Premešteno iz api/profesor/class-notes/route.ts bez izmene
 * ponašanja; komentari o zamkama su sačuvani tamo gde su važni.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { NoteContent } from "@/lib/class-notes";
import { wordsetTitle, type WordsetItem } from "@/lib/wordset-derive";

type Admin = ReturnType<typeof createAdminClient>;
export type Failure = { error: string; status: number; code?: string };

/** Za šta je beleška vezana. */
export type NoteTarget =
  | { column: "individual_lesson_id"; id: string }
  | { column: "group_session_id"; id: string };

/** Čiji je set reči. */
export type WordsetOwner =
  | { individual_enrollment_id: string }
  | { group_id: string };

// select pa update/insert - upsert sa onConflict NE RADI jer su class_notes_*_uq parcijalni indeksi.
export async function upsertNote(
  admin: Admin,
  target: NoteTarget,
  professorId: string,
  content: NoteContent,
  contentText: string
): Promise<{ noteId: string } | Failure> {
  const findExisting = () =>
    admin.from("class_notes").select("id").eq(target.column, target.id).maybeSingle();
  const updateById = (id: string) =>
    admin
      .from("class_notes")
      .update({ content: content as unknown as Json, content_text: contentText, updated_at: new Date().toISOString() })
      .eq("id", id);

  const { data: existing, error: selectError } = await findExisting();
  if (selectError) return { error: selectError.message, status: 500 };

  if (existing) {
    const { error } = await updateById(existing.id);
    if (error) return { error: error.message, status: 500 };
    return { noteId: existing.id };
  }

  const { data: inserted, error } = await admin
    .from("class_notes")
    .insert({
      [target.column]: target.id,
      professor_id: professorId,
      content: content as unknown as Json,
      content_text: contentText,
    } as never)
    .select("id")
    .single();
  if (!error && inserted) return { noteId: inserted.id };

  // Trka: dva istovremena PUT-a oba prođu select pa oba pokušaju insert - jedinstveni indeks obori
  // drugi kodom 23505. Preuzmi belešku koju je konkurentski zahtev napravio (poslednje snimanje važi).
  if (error?.code === "23505") {
    const { data: raced } = await findExisting();
    if (raced) {
      const { error: updateError } = await updateById(raced.id);
      if (updateError) return { error: updateError.message, status: 500 };
      return { noteId: raced.id };
    }
  }
  return { error: error?.message ?? "Beleška nije mogla da se snimi", status: 500 };
}

// Set reči izveden iz WORTSCHATZ: puna zamena stavki, ili brisanje seta ako je reči nestalo.
export async function replaceWordset(
  admin: Admin,
  noteId: string,
  owner: WordsetOwner,
  date: string,
  position: number,
  items: WordsetItem[]
): Promise<Failure | null> {
  const { data: existing, error: selectError } = await admin
    .from("student_wordsets")
    .select("id")
    .eq("note_id", noteId)
    .maybeSingle();
  if (selectError) return { error: selectError.message, status: 500 };

  if (items.length === 0) {
    if (existing) {
      const { error: delItemsErr } = await admin.from("student_wordset_items").delete().eq("wordset_id", existing.id);
      if (delItemsErr) return { error: delItemsErr.message, status: 500 };
      const { error: delSetErr } = await admin.from("student_wordsets").delete().eq("id", existing.id);
      if (delSetErr) return { error: delSetErr.message, status: 500 };
    }
    return null;
  }

  const title = wordsetTitle(position, date);
  let wordsetId: string;
  if (existing) {
    const { error } = await admin
      .from("student_wordsets")
      .update({ title, lesson_date: date, position, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: error.message, status: 500 };
    wordsetId = existing.id;
  } else {
    const { data: inserted, error } = await admin
      .from("student_wordsets")
      .insert({ note_id: noteId, ...owner, title, lesson_date: date, position })
      .select("id")
      .single();
    if (error || !inserted) return { error: error?.message ?? "Set reči nije mogao da se napravi", status: 500 };
    wordsetId = inserted.id;
  }

  // Prvo upsert novih (PK (wordset_id, idx) NIJE parcijalan pa onConflict radi), pa tek onda
  // brisanje viška - obrnut redosled bi pri padu insert-a polazniku obrisao ceo set.
  const { error: upsertErr } = await admin
    .from("student_wordset_items")
    .upsert(
      items.map((it) => ({ wordset_id: wordsetId, idx: it.idx, front: it.front, back: it.back })),
      { onConflict: "wordset_id,idx" }
    );
  if (upsertErr) return { error: upsertErr.message, status: 500 };

  const { error: trimErr } = await admin
    .from("student_wordset_items")
    .delete()
    .eq("wordset_id", wordsetId)
    .gte("idx", items.length);
  if (trimErr) return { error: trimErr.message, status: 500 };

  return null;
}
```

- [ ] **Step 2: 1:1 ruta koristi modul**

U `src/app/api/profesor/class-notes/route.ts`:
- obriši lokalne `upsertNote`, `replaceWordset` i `type Failure`; uvezi ih iz `@/lib/class-notes-store`;
- obriši sada neiskorišćene uvoze (`Json`, `wordsetTitle`, `WordsetItem` ako više nisu potrebni - `deriveWordsetItems` ostaje);
- poziv beleške: `upsertNote(admin, { column: "individual_lesson_id", id: lessonId }, professorId, content, contentText)`;
- poziv seta: `replaceWordset(admin, noteId, { individual_enrollment_id: enrollmentId }, date, position, items)`.

- [ ] **Step 3: Testovi i tipovi**

Run: `npx vitest run && ./node_modules/.bin/tsc --noEmit`
Expected: svi testovi PASS (broj isti kao pre refaktora), bez grešaka tipova.

- [ ] **Step 4: Commit**

```bash
git add src/lib/class-notes-store.ts src/app/api/profesor/class-notes/route.ts
git commit -m "refactor(beleske): upis beleske i seta reci u zajednicki modul"
```

---

### Task 6: API za grupnu belešku

**Files:**
- Create: `src/app/api/profesor/class-notes/grupa/route.ts`

Pravila:
- GET ne piše ništa.
- PUT: sesija za (grupa, datum) se nađe; ako je nema, upiše se `manual` sesija (isto kao dugme „Dodaj sesiju" - profesorka je održala čas); ako je otkazana, 409 `code: "otkazan"`.
- Grupa mora imati `notes_on_platform = true`, inače 409 `code: "nije_na_platformi"` (tekuće grupe ostaju na Doc-u).
- Set reči pripada grupi (`group_id`), naslov „Termin N" gde je N broj neotkazanih sesija do tog datuma.

- [ ] **Step 1: Napiši rutu**

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emptyNoteContent, noteToPlainText, sanitizeNoteContent } from "@/lib/class-notes";
import { deriveWordsetItems } from "@/lib/wordset-derive";
import { pickSessionForNote } from "@/lib/group-notes";
import { replaceWordset, upsertNote, type Failure } from "@/lib/class-notes-store";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
type Admin = ReturnType<typeof createAdminClient>;

// Isti obrazac kao api/profesor/class-notes/route.ts.
async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "professor" && profile?.role !== "admin") return null;
  return { admin, userId: user.id, isAdmin: profile.role === "admin" };
}

async function loadOwnedGroup(admin: Admin, groupId: string, userId: string, isAdmin: boolean) {
  const { data: g } = await admin
    .from("groups")
    .select("id, professor_id, notes_on_platform")
    .eq("id", groupId)
    .single();
  if (!g) return { error: "Grupa nije pronađena", status: 404 as const };
  if (!isAdmin && g.professor_id !== userId) return { error: "Nije tvoja grupa", status: 403 as const };
  if (!g.notes_on_platform) {
    return { error: "Beleške ove grupe se vode u Google Doc-u.", status: 409 as const, code: "nije_na_platformi" };
  }
  return { g };
}

function parseParams(groupId: unknown, date: unknown) {
  const id = String(groupId ?? "").trim();
  const d = String(date ?? "").trim();
  if (!id || !d) return { error: "groupId i date su obavezni" };
  if (!DATE_RE.test(d)) return { error: "date mora biti u obliku YYYY-MM-DD" };
  return { id, date: d };
}

async function findSession(admin: Admin, groupId: string, date: string) {
  const { data, error } = await admin
    .from("group_sessions")
    .select("id, cancelled")
    .eq("group_id", groupId)
    .eq("session_date", date)
    .limit(1);
  if (error) return { error: error.message, status: 500 } as Failure;
  return pickSessionForNote((data ?? []) as { id: string; cancelled: boolean }[]);
}

const OTKAZAN: Failure = {
  error: "Ovaj čas je označen kao otkazan - beleška ne može da se veže za njega.",
  status: 409,
  code: "otkazan",
};

// GET ?groupId=...&date=YYYY-MM-DD - postojeća beleška ili prazan obrazac. Ne piše ništa.
export async function GET(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const parsed = parseParams(searchParams.get("groupId"), searchParams.get("date"));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const owned = await loadOwnedGroup(staff.admin, parsed.id, staff.userId, staff.isAdmin);
  if ("error" in owned) return NextResponse.json({ error: owned.error, code: owned.code }, { status: owned.status });

  const pick = await findSession(staff.admin, parsed.id, parsed.date);
  if ("error" in pick) return NextResponse.json({ error: pick.error }, { status: pick.status });
  if (pick.kind === "cancelled") return NextResponse.json({ error: OTKAZAN.error, code: OTKAZAN.code }, { status: 409 });
  if (pick.kind === "none") return NextResponse.json({ content: emptyNoteContent(), noteId: null, sessionId: null });

  const { data: note } = await staff.admin
    .from("class_notes")
    .select("id, content")
    .eq("group_session_id", pick.sessionId)
    .maybeSingle();
  return NextResponse.json({
    content: note ? sanitizeNoteContent(note.content) : emptyNoteContent(),
    noteId: note?.id ?? null,
    sessionId: pick.sessionId,
  });
}

// PUT { groupId, date, content }
export async function PUT(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  let body: { groupId?: unknown; date?: unknown; content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neispravan JSON" }, { status: 400 });
  }
  const parsed = parseParams(body.groupId, body.date);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { id: groupId, date } = parsed;
  const content = sanitizeNoteContent(body.content);
  const admin = staff.admin;

  const owned = await loadOwnedGroup(admin, groupId, staff.userId, staff.isAdmin);
  if ("error" in owned) return NextResponse.json({ error: owned.error, code: owned.code }, { status: owned.status });
  const professorId = owned.g.professor_id ?? staff.userId;

  // 1. Sesija - nađi ili upiši 'manual' (isti upis kao „Dodaj sesiju" u grupna-sesija POST).
  let pick = await findSession(admin, groupId, date);
  if ("error" in pick) return NextResponse.json({ error: pick.error }, { status: pick.status });
  if (pick.kind === "cancelled") return NextResponse.json({ error: OTKAZAN.error, code: OTKAZAN.code }, { status: 409 });
  if (pick.kind === "none") {
    const { error } = await admin.from("group_sessions").upsert(
      { group_id: groupId, professor_id: owned.g.professor_id, session_date: date, source: "manual" },
      { onConflict: "group_id,session_date", ignoreDuplicates: true },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    pick = await findSession(admin, groupId, date); // ponovo čitamo - trka sa sync-om ili drugom karticom
    if ("error" in pick) return NextResponse.json({ error: pick.error }, { status: pick.status });
    if (pick.kind !== "found") return NextResponse.json({ error: "Čas nije mogao da se upiše" }, { status: 500 });
  }
  const sessionId = pick.sessionId;

  // 2. Beleška.
  const noteResult = await upsertNote(
    admin, { column: "group_session_id", id: sessionId }, professorId, content, noteToPlainText(content),
  );
  if ("error" in noteResult) return NextResponse.json({ error: noteResult.error }, { status: noteResult.status });
  const { noteId } = noteResult;

  // 3. Set reči grupe - position = redni broj neotkazanih sesija do ovog datuma (kozmetički broj
  // u naslovu „Termin N", ne utiče na napredak).
  const items = deriveWordsetItems(content.wortschatz);
  const { count } = await admin
    .from("group_sessions")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("cancelled", false)
    .lte("session_date", date);
  const wsError = await replaceWordset(admin, noteId, { group_id: groupId }, date, count ?? 1, items);
  if (wsError) return NextResponse.json({ error: wsError.error }, { status: wsError.status });

  return NextResponse.json({ ok: true, noteId, sessionId, words: items.length });
}
```

- [ ] **Step 2: Tipovi**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/profesor/class-notes/grupa/route.ts
git commit -m "feat(beleske): API za grupnu belesku (GET/PUT)"
```

---

### Task 7: `NotesEditor` radi i za grupu

**Files:**
- Modify: `src/components/beleska/NotesEditor.tsx`
- Modify: `src/app/profesor/individualni/IndividualniClient.tsx:211-220`

- [ ] **Step 1: Uvedi `target`**

Na vrhu fajla:

```ts
export type NotesTarget =
  | { kind: "individual"; enrollmentId: string }
  | { kind: "group"; groupId: string };

function targetId(t: NotesTarget): string {
  return t.kind === "individual" ? t.enrollmentId : t.groupId;
}

function apiUrl(t: NotesTarget): string {
  return t.kind === "individual" ? "/api/profesor/class-notes" : "/api/profesor/class-notes/grupa";
}

function apiQuery(t: NotesTarget, date: string): string {
  const p = t.kind === "individual" ? `enrollmentId=${encodeURIComponent(t.enrollmentId)}` : `groupId=${encodeURIComponent(t.groupId)}`;
  return `${apiUrl(t)}?${p}&date=${encodeURIComponent(date)}`;
}

function apiBody(t: NotesTarget, date: string, content: NoteContent) {
  return JSON.stringify(
    t.kind === "individual" ? { enrollmentId: t.enrollmentId, date, content } : { groupId: t.groupId, date, content }
  );
}

// 1:1 ključ ostaje isti kao u kriški 1 (nacrti zatečeni u pregledaču se ne gube); grupa ima prefiks g_.
function draftKey(t: NotesTarget, date: string): string {
  return t.kind === "individual" ? `beleska_nacrt_${t.enrollmentId}_${date}` : `beleska_nacrt_g_${t.groupId}_${date}`;
}
```

Zatim:
- `readDraft`, `writeDraft`, `clearDraft` primaju `(t: NotesTarget, date)` umesto `(enrollmentId, date)`;
- props: `{ target, title, date, onClose }` umesto `{ enrollmentId, studentName, date, onClose }` - `title` je „ime polaznika" za 1:1, „Grupa B1.1" za grupu; zaglavlje prikazuje `{title} · datum`;
- GET: `fetch(apiQuery(target, date))`; `setLessonId(j.lessonId ?? j.sessionId ?? null)`;
- PUT i beforeunload: `fetch(apiUrl(target), { method: "PUT", ..., body: apiBody(target, date, contentRef.current) })`; posle uspeha `setLessonId(j.lessonId ?? j.sessionId ?? null)`;
- zavisnosti efekata: `[targetId(target), target.kind, date]` umesto `[enrollmentId, date]` (objekat `target` se pravi u svakom renderu roditelja, pa ga ne stavljaj direktno u niz);
- greška pri učitavanju sa `j.code === "otkazan"` ili `"nije_na_platformi"`: postavi nov `blockedMessage` state na `j.error` i tretiraj obrazac kao blokiran (`blocked = blockedMessage !== null || (!lessonId && !canCreate)`); u blokiranom prikazu ispiši `blockedMessage ?? <postojeći tekst za pun paket>`.

- [ ] **Step 2: 1:1 poziv**

```tsx
          <NotesEditor
            target={{ kind: "individual", enrollmentId: row.id }}
            title={row.studentName || "Polaznik"}
            date={dateById[row.id] || todayISO()}
            onClose={...isto kao sad...}
          />
```

- [ ] **Step 3: Tipovi i testovi**

Run: `./node_modules/.bin/tsc --noEmit && npx vitest run`
Expected: bez grešaka, svi testovi PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/beleska/NotesEditor.tsx src/app/profesor/individualni/IndividualniClient.tsx
git commit -m "feat(beleske): obrazac radi i za grupu (target umesto enrollmentId)"
```

---

### Task 8: Dugme „Beleške za čas" na `/profesor/sesije`

**Files:**
- Modify: `src/app/profesor/sesije/page.tsx`
- Modify: `src/app/profesor/sesije/SesijeClient.tsx`

- [ ] **Step 1: Stranica čita prekidač**

U `page.tsx` select grupa dobija `notes_on_platform`, a red `GroupSessions` dobija `notesOnPlatform: !!g.notes_on_platform`.

- [ ] **Step 2: Klijent**

U `SesijeClient.tsx`:
- interfejs: `notesOnPlatform: boolean`;
- state: `const [notesFor, setNotesFor] = useState<string | null>(null);`
- u zaglavlju grupe: ako je `g.notesOnPlatform`, umesto linka na Google Doc / „➕ Dodaj beleške" prikaži:

```tsx
<button type="button" onClick={() => setNotesFor(g.id)} className="text-xs text-plava hover:underline ml-2">
  📝 Beleške za čas
</button>
```
  Datum je onaj iz postojećeg `input type="date"` pored „Dodaj sesiju" (`dateById[g.id] ?? todayISO()`).
- čip sesije: klik na datum otvara belešku za taj datum (`setDateById({ ...dateById, [g.id]: s.date }); setNotesFor(g.id);`) - samo za `notesOnPlatform`;
- na dnu komponente, isto kao u `IndividualniClient`:

```tsx
{notesFor && (() => {
  const g = rows.find((r) => r.id === notesFor);
  if (!g) return null;
  return (
    <NotesEditor
      target={{ kind: "group", groupId: g.id }}
      title={`Grupa ${g.level}`}
      date={dateById[g.id] ?? todayISO()}
      onClose={() => { setNotesFor(null); router.refresh(); }}
    />
  );
})()}
```

- [ ] **Step 3: Tipovi**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 4: Commit**

```bash
git add src/app/profesor/sesije/page.tsx src/app/profesor/sesije/SesijeClient.tsx
git commit -m "feat(beleske): profesorka pise grupnu belesku sa /profesor/sesije"
```

---

### Task 9: Polaznik vidi grupne beleške i reči

**Files:**
- Modify: `src/lib/beleske-student.ts`

- [ ] **Step 1: Grupe polaznika**

```ts
/** Grupe u kojima polaznik ima AKTIVAN upis (storno i izbacivanje su 'cancelled'). */
async function ownedGroupIds(admin: Admin, userId: string): Promise<string[]> {
  const { data } = await admin.from("group_enrollments").select("group_id").eq("user_id", userId).eq("status", "active");
  return (data ?? []).map((r) => r.group_id as string);
}
```

- [ ] **Step 2: `listStudentNotes` spaja 1:1 i grupu**

Razdvoji postojeći kod u `listIndividualNotes(admin, userId)` (telo kakvo je sad), dodaj `listGroupNotes(admin, userId)`:

```ts
async function listGroupNotes(admin: Admin, userId: string): Promise<StudentNoteListItem[]> {
  const groupIds = await ownedGroupIds(admin, userId);
  if (groupIds.length === 0) return [];
  const { data: sessionRows } = await admin
    .from("group_sessions").select("id, session_date").in("group_id", groupIds);
  const sessionIds = (sessionRows ?? []).map((r) => r.id as string);
  if (sessionIds.length === 0) return [];
  const dateById = new Map(sessionRows!.map((r) => [r.id as string, r.session_date as string]));

  const { data: noteRows } = await admin
    .from("class_notes")
    .select("id, group_session_id, content, professor:professor_id(full_name)")
    .in("group_session_id", sessionIds);
  const noteIds = (noteRows ?? []).map((r) => r.id as string);
  const withWords = new Set<string>();
  if (noteIds.length) {
    const { data: ws } = await admin.from("student_wordsets").select("note_id").in("note_id", noteIds);
    for (const w of ws ?? []) if (w.note_id) withWords.add(w.note_id as string);
  }
  return (noteRows ?? []).map((n) => {
    const content = sanitizeNoteContent(n.content);
    const prof = one<{ full_name: string | null }>(n.professor as never);
    return {
      id: n.id as string,
      lessonDate: dateById.get(n.group_session_id as string) ?? "",
      professorName: prof?.full_name ?? null,
      preview: notePreview(content),
      hasWords: withWords.has(n.id as string),
    };
  });
}

export async function listStudentNotes(userId: string): Promise<StudentNoteListItem[]> {
  const admin = createAdminClient();
  const [ind, grp] = await Promise.all([listIndividualNotes(admin, userId), listGroupNotes(admin, userId)]);
  return [...ind, ...grp].sort((a, b) => b.lessonDate.localeCompare(a.lessonDate));
}
```

Grupa ima 14-15 sesija, pa `.in()` liste ostaju daleko ispod 1000 redova.

- [ ] **Step 3: `getStudentNote` za grupnu belešku**

Select beleške dobija `group_session_id`. Ako je `individual_lesson_id` postavljen - postojeća grana. Ako je postavljen `group_session_id`:

```ts
  if (note.group_session_id) {
    const { data: session } = await admin
      .from("group_sessions").select("session_date, group_id").eq("id", note.group_session_id).maybeSingle();
    if (!session) return null;
    const groupIds = await ownedGroupIds(admin, userId);
    if (!groupIds.includes(session.group_id as string)) return null; // nije njegova grupa -> 404
    const { data: wordset } = await admin.from("student_wordsets").select("id").eq("note_id", note.id).maybeSingle();
    const prof = one<{ full_name: string | null }>(note.professor as never);
    return {
      id: note.id as string,
      lessonDate: session.session_date as string,
      professorName: prof?.full_name ?? null,
      content: sanitizeNoteContent(note.content),
      wordsetId: wordset?.id ?? null,
    };
  }
```

Ažuriraj JSDoc iznad funkcije (više nije „samo individualne").

- [ ] **Step 4: `listStudentWordsets` čita i grupne setove**

Umesto `.in("individual_enrollment_id", enrollIds)`:

```ts
  const [enrollIds, groupIds] = await Promise.all([ownedEnrollmentIds(admin, userId), ownedGroupIds(admin, userId)]);
  if (enrollIds.length === 0 && groupIds.length === 0) return [];
  const ors = [
    enrollIds.length ? `individual_enrollment_id.in.(${enrollIds.join(",")})` : null,
    groupIds.length ? `group_id.in.(${groupIds.join(",")})` : null,
  ].filter(Boolean).join(",");
  const { data: setRows } = await admin
    .from("student_wordsets")
    .select("id, title, lesson_date")
    .or(ors)
    .order("lesson_date", { ascending: false });
```

(id-jevi su uuid-ovi iz baze, ne korisnički unos - bezbedno za `.or()` string.)

- [ ] **Step 5: Tipovi**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 6: Commit**

```bash
git add src/lib/beleske-student.ts
git commit -m "feat(beleske): polaznik grupe cita beleske i uci reci svoje grupe"
```

---

### Task 10: Linkovi na `/nalog` za grupu na platformi

**Files:**
- Modify: `src/app/api/student/account/route.ts:30-62`
- Modify: `src/app/nalog/Sekcije.tsx` (tip `GroupRow` i kartica grupe oko reda 172)

- [ ] **Step 1: API vraća prekidač**

Select grupa: dodaj `notes_on_platform`; u mapiranju `notesOnPlatform: !!g.notes_on_platform`; u tipu niza `notesOnPlatform: boolean`.

- [ ] **Step 2: Kartica grupe**

`GroupRow` dobija `notesOnPlatform: boolean`. Ispod linka „Otvori Meet":

```tsx
{g.notesOnPlatform && (
  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
    <Link href="/beleske" className="text-sm text-plava">Beleške sa časova</Link>
    <Link href="/moje-reci" className="text-sm text-plava">Moje reči</Link>
  </div>
)}
```

- [ ] **Step 3: Tipovi i testovi**

Run: `./node_modules/.bin/tsc --noEmit && npx vitest run src/lib/account.test.ts`
Expected: bez grešaka, PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/student/account/route.ts src/app/nalog/Sekcije.tsx
git commit -m "feat(nalog): grupna kartica vodi na beleske i reci kad je grupa na platformi"
```

---

### Task 11: Mejl i admin rute poštuju prekidač

**Files:**
- Modify: `src/lib/grant-access.ts` (~512 select, ~573 poziv mejla)
- Modify: `src/app/api/admin/grupe/[id]/osvezi-termin/route.ts:78`
- Modify: `src/app/api/admin/grupe/[id]/nova-generacija/route.ts:43`

- [ ] **Step 1: Welcome mejl**

Select grupe u `grant-access.ts` dobija `notes_on_platform`. Poziv:

```ts
      // Grupa na platformi: link vodi na /beleske (polaznik se prijavljuje istim mejlom), ne na Google Doc.
      const notesUrl = (group as { notes_on_platform?: boolean }).notes_on_platform
        ? `${SITE_URL}/beleske`
        : group.notes_url ?? undefined;
      await sendGrupniWelcomeEmail(order.email, order.full_name, {
        nivo, profIme, meetLink: group.meet_link ?? undefined, notesUrl,
      });
```
(uvezi `SITE_URL` iz `@/lib/site-url` ako već nije uvezen).

- [ ] **Step 2: Osveži termin / nova generacija**

U obe rute select grupe dobija `notes_on_platform`, a upis `notes_url`/`notes_doc_id` iz GAS odgovora ide samo kad je `!g.notes_on_platform`:

```ts
  if (gas.notesUrl && !g.notes_on_platform) { update.notes_url = gas.notesUrl; update.notes_doc_id = gas.notesDocId ?? null; }
```
(u `nova-generacija` isti uslov oko `notes_url: gas.notesUrl ?? null` - za grupu na platformi upiši `null`).

Poznato ograničenje: GAS `openTerm` i dalje napravi prazan Doc na Drive-u kad se za grupu na platformi otvara nov event. Doc se nigde ne prikazuje. GAS prekidač (`bezBeleski`) je zaseban posao - ne ulazi u ovu krišku.

- [ ] **Step 3: Tipovi i testovi**

Run: `./node_modules/.bin/tsc --noEmit && npx vitest run`
Expected: bez grešaka, svi PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/grant-access.ts "src/app/api/admin/grupe/[id]/osvezi-termin/route.ts" "src/app/api/admin/grupe/[id]/nova-generacija/route.ts"
git commit -m "feat(grupe): mejl i admin rute postuju notes_on_platform"
```

---

### Task 12: B1.1 od 16.11 prelazi na platformu

**Files:**
- Create: `scripts/b11-novembar-beleske-platforma.mjs`

- [ ] **Step 1: Skripta (suvo/--apply)**

```js
// B1.1 od 16.11.2026 (Milica) - beleške na platformi umesto Google Doc-a.
// Pokretanje: node scripts/b11-novembar-beleske-platforma.mjs [--apply]
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const GROUP_ID = "894f5bde-c677-4d0b-a459-39780b739b3f";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: g, error } = await sb.from("groups")
  .select("id, level, start_date, notes_on_platform, notes_url, notes_doc_id").eq("id", GROUP_ID).single();
if (error) throw error;
console.log("pre:", g);
if (g.level !== "B1.1" || g.start_date !== "2026-11-16") { console.log("STOP: nije očekivana grupa"); process.exit(1); }
const { count } = await sb.from("group_enrollments").select("*", { count: "exact", head: true }).eq("group_id", GROUP_ID).eq("status", "active");
console.log("aktivnih upisa:", count, count ? "(PAZI: oni su već dobili mejl sa Google Doc linkom)" : "");
if (!APPLY) { console.log("(suvo - dodaj --apply)"); process.exit(0); }

const { error: e2 } = await sb.from("groups")
  .update({ notes_on_platform: true, notes_url: null, notes_doc_id: null, updated_at: new Date().toISOString() })
  .eq("id", GROUP_ID);
if (e2) throw e2;
console.log("GOTOVO. Google Doc ostaje na Drive-u (nije obrisan):", g.notes_url);
```

- [ ] **Step 2: Suvo pokretanje**

Run: `node scripts/b11-novembar-beleske-platforma.mjs`
Expected: `pre:` sa `notes_on_platform: false`, `aktivnih upisa: 0`, `(suvo - dodaj --apply)`.

**`--apply` se pokreće tek posle deploya (Task 13)** - pre toga produkcioni kod ne zna za prekidač i polaznik bi dobio mejl bez linka na beleške.

- [ ] **Step 3: Commit**

```bash
git add scripts/b11-novembar-beleske-platforma.mjs
git commit -m "chore(grupe): skripta - B1.1 16.11 na beleske u platformi"
```

---

### Task 13: Provera, pa deploy tek uz Natašino odobrenje

- [ ] **Step 1: Ceo paket**

```bash
./node_modules/.bin/tsc --noEmit && npx vitest run && npm run build
```
Expected: bez grešaka, svi testovi PASS, build prolazi.

- [ ] **Step 2: Ručna proba lokalno** (preview server iz `.claude/launch.json`, prava baza)

Na probnoj grupi (privremeno `notes_on_platform=true` na test-grupi bez polaznika, vrati posle):
1. `/profesor/sesije` → „📝 Beleške za čas" → otkucaj TEMA + 3 reči → „snimljeno".
2. U bazi: `class_notes` sa `group_session_id`, `student_wordsets` sa `group_id` i 3 stavke.
3. „Osveži termin" na toj grupi u `/admin/grupe` → beleška i današnja sesija OSTAJU.
4. „×" na čipu te sesije → poruka „Ovaj čas ima belešku...".
5. Kao polaznik upisan u tu grupu: `/beleske` pokazuje belešku, `/beleske/[id]` je prikazuje, `/moje-reci` ima set; polaznik druge grupe dobija 404 na isti `/beleske/[id]`.
6. 1:1 beleška (kriška 1) i dalje radi - otvori, kucaj, snimi.
7. Očisti probne redove (beleška, set, manual sesija) i vrati prekidač test-grupe na `false`.

- [ ] **Step 3: Javi Nataši i čekaj „da"**

Push na `main` = produkcija. Pre merge-a i push-a: kratak pregled šta izlazi + rezultat ručne probe. Posle odobrenja:

```bash
cd /Users/natasahartweger/Documents/Claude/sajt/LMS/lms
git merge --ff-only beleske-grupe   # ili rebase pa ff ako je main odmakao
git push origin main
```

- [ ] **Step 4: Smoke posle deploya** (obavezno, `feedback_deploy_smoke_test`)

`/profesor/sesije`, `/beleske`, `/moje-reci` vraćaju 200/redirect na prijavu; `/` 200. Zatim `node scripts/b11-novembar-beleske-platforma.mjs --apply` i provera da `/profesor/sesije` za B1.1 16.11 pokazuje „Beleške za čas".

---

## Van obima (namerno)

- Live tabla (Realtime broadcast), PDF i cron za brisanje posle 6 meseci - kriške 2 i 4 iz speca.
- GAS prekidač da `openTerm` ne pravi Doc za grupu na platformi.
- Admin čekboks „beleške na platformi" u `/admin/grupe` - za sad prekidač ide skriptom, po grupi.
