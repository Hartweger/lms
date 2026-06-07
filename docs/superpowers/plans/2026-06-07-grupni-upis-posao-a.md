# Grupni upis — Posao A (brojanje mesta, popunjeno, blokada, „obavesti me") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mesto u grupnom kursu se automatski oduzima po plaćanju; kad se grupa popuni (max_seats), stranica prikazuje „Popunjeno", checkout odbija kupovinu, a posetilac može da ostavi mejl za sledeći termin (mejl stiže adminu).

**Architecture:** Čista funkcija za računanje mesta (`computeSeats`) koja se koristi i u prikazu rasporeda i u checkout blokadi. Auto-upis u `group_enrollments` se dešava u `grantAccessForOrder` (best-effort, ne ruši plaćanje). `slugToNivo` mapa se izdvaja u deljeni lib jer je sada koriste tri fajla. Bez izmena baze — koriste se postojeće tabele (`groups`, `group_enrollments`, `manual_enrolled` iz migracije 037).

**Tech Stack:** Next.js (App Router, route handlers), TypeScript, Supabase (admin client), Resend (mejl), Vitest (testovi). Spec: `docs/superpowers/specs/2026-06-07-grupni-upis-automatizacija-design.md`.

> **NAPOMENA (AGENTS.md):** Ovo je modifikovana verzija Next.js-a. Pre pisanja route handler-a/server komponenti proveri `node_modules/next/dist/docs/` ako nešto odstupa, ali prati postojeće obrasce u repozitorijumu (npr. `src/app/api/orders/route.ts`, `src/app/api/admin/grupe/[id]/enroll/route.ts`).

---

## File Structure

- `src/lib/course-nivo.ts` *(novo)* — jedna mapa `slug → nivo` + `nivoForSlug(slug)`; izvor istine za sve fajlove.
- `src/lib/course-nivo.test.ts` *(novo)* — test za `nivoForSlug`.
- `src/lib/groups.ts` *(izmena)* — dodaje `computeSeats()` (čista funkcija), `pickOpenGroupForNivo()` (čista funkcija); `mapGroupToRaspored` koristi `computeSeats` i puni novo polje `full`.
- `src/lib/groups.test.ts` *(izmena)* — testovi za `computeSeats`, `pickOpenGroupForNivo`, i ažuriran `mapGroupToRaspored` test.
- `src/lib/raspored.ts` *(izmena)* — `GrupaRaspored` dobija `full: boolean`; poziva `mapGroupToRaspored` sa brojem aktivnih upisa.
- `src/lib/grant-access.ts` *(izmena)* — posle dodele pristupa, za grupni proizvod auto-upis u `group_enrollments` (best-effort).
- `src/app/api/orders/route.ts` *(izmena)* — za `category='grupni'` proveri popunjenost; ako je puna → `409`.
- `src/app/kursevi/[slug]/page.tsx` *(izmena)* — koristi `nivoForSlug` iz liba; kad je `grupa.full` prikaži „Popunjeno" i zameni CTA `InteresForm`-om.
- `src/app/kursevi/[slug]/InteresForm.tsx` *(novo, client)* — dugme/forma „Obavesti me za sledeći termin".
- `src/app/api/grupe/interes/route.ts` *(novo)* — prima { nivo, email, ime }, šalje mejl adminu.
- `src/lib/email.ts` *(izmena)* — `sendInteresNotification(...)`.

---

## Task 1: Izdvoji `slug → nivo` mapu u deljeni lib

**Files:**
- Create: `src/lib/course-nivo.ts`
- Create: `src/lib/course-nivo.test.ts`
- Modify: `src/app/kursevi/[slug]/page.tsx:12-30` (zameni lokalnu `slugToNivo` importom)

- [ ] **Step 1: Napiši test koji pada**

Create `src/lib/course-nivo.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { nivoForSlug, SLUG_TO_NIVO } from "./course-nivo";

describe("nivoForSlug", () => {
  it("vraća nivo za poznati grupni slug", () => {
    expect(nivoForSlug("grupni-kurs-nemackog-jezika-a1-1")).toBe("A1.1");
    expect(nivoForSlug("grupni-kurs-b2-1")).toBe("B2.1");
  });
  it("vraća null za nepoznat slug", () => {
    expect(nivoForSlug("nepostojeci-kurs")).toBeNull();
  });
  it("mapa sadrži sve grupne nivoe", () => {
    expect(SLUG_TO_NIVO["grupni-kurs-c1-2"]).toBe("C1.2");
  });
});
```

- [ ] **Step 2: Pokreni test — mora da padne**

Run: `npx vitest run src/lib/course-nivo.test.ts`
Expected: FAIL — „Cannot find module './course-nivo'".

- [ ] **Step 3: Napravi lib**

Create `src/lib/course-nivo.ts` (vrednosti prepisane iz postojeće mape u `page.tsx:12-30`):

```typescript
// Jedna mapa slug → nivo (CEFR), izvor istine za grupne/individualne kurseve.
export const SLUG_TO_NIVO: Record<string, string> = {
  "grupni-kurs-nemackog-jezika-a1-1": "A1.1",
  "grupni-kurs-nemackog-jezika-a1-2-2": "A1.2",
  "grupni-kurs-nemackog-jezika-a2": "A2.1",
  "grupni-kurs-nemackog-jezika-a2-2": "A2.2",
  "grupni-kurs-nemackog-jezika-b1-1-2": "B1.1",
  "grupni-kurs-nemackog-b1-2": "B1.2",
  "grupni-kurs-b2-1": "B2.1",
  "grupni-kurs-b2-2": "B2.2",
  "individualni-kurs-nemackog-jezika-a11": "A1.1",
  "individualni-kurs-nemackog-jezika-a1-2": "A1.2",
  "individualni-kurs-nemackog-jezika-a2": "A2.1",
  "individualni-kurs-nemackog-jezika-a2-2": "A2.2",
  "individualni-kurs-nemackog-jezika-b11": "B1.1",
  "individualni-kurs-nemackog-jezika-b1-2": "B1.2",
  "individualni-kurs-nemackog-jezika-b2-1": "B2.1",
  "grupni-kurs-c1-1": "C1.1",
  "grupni-kurs-c1-2": "C1.2",
};

export function nivoForSlug(slug: string): string | null {
  return SLUG_TO_NIVO[slug] ?? null;
}
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npx vitest run src/lib/course-nivo.test.ts`
Expected: PASS (3 testa).

- [ ] **Step 5: Zameni lokalnu mapu u `page.tsx`**

U `src/app/kursevi/[slug]/page.tsx` obriši lokalnu deklaraciju `const slugToNivo: Record<string, string> = { ... };` (linije 12-30) i dodaj import na vrh fajla (uz ostale importe):

```typescript
import { SLUG_TO_NIVO as slugToNivo } from "@/lib/course-nivo";
```

(Alias `slugToNivo` zadržava postojeće korišćenje u `page.tsx` netaknutim — `slugToNivo[slug]` na linijama 231, 237, 265, 322.)

- [ ] **Step 6: Provera build/tsc**

Run: `npx tsc --noEmit`
Expected: bez grešaka u `page.tsx` (`slugToNivo` i dalje definisan preko importa).

- [ ] **Step 7: Commit**

```bash
git add src/lib/course-nivo.ts src/lib/course-nivo.test.ts "src/app/kursevi/[slug]/page.tsx"
git commit -m "refactor: izdvoj slug->nivo mapu u deljeni lib (course-nivo)"
```

---

## Task 2: Čista funkcija `computeSeats` + `full` u rasporedu

**Files:**
- Modify: `src/lib/groups.ts` (dodaj `computeSeats`, izmeni `GroupRowForDisplay` i `mapGroupToRaspored`)
- Modify: `src/lib/raspored.ts` (dodaj `full` u `GrupaRaspored`, prosledi broj aktivnih upisa)
- Modify: `src/lib/groups.test.ts` (testovi)

Pravilo (iz spec-a, odluka 10): `enrolled = (manual_enrolled ?? 0) + activeEnrollments`. `manual_enrolled` je polazna osnova (realni postojeći polaznici), nove uplate (aktivni `group_enrollments`) se dodaju na nju. `slobodnih = max(0, max_seats - enrolled)`, `full = enrolled >= max_seats`.

- [ ] **Step 1: Napiši testove koji padaju**

U `src/lib/groups.test.ts` dodaj na kraj fajla:

```typescript
import { computeSeats, pickOpenGroupForNivo } from "./groups";

describe("computeSeats (osnova + nove uplate)", () => {
  it("manual kao osnova, bez novih uplata", () =>
    expect(computeSeats({ maxSeats: 6, manualEnrolled: 3, activeEnrollments: 0 }))
      .toEqual({ enrolled: 3, slobodnih: 3, full: false }));
  it("osnova + nove uplate popune grupu", () =>
    expect(computeSeats({ maxSeats: 6, manualEnrolled: 3, activeEnrollments: 3 }))
      .toEqual({ enrolled: 6, slobodnih: 0, full: true }));
  it("bez osnove (null) broji samo uplate", () =>
    expect(computeSeats({ maxSeats: 6, manualEnrolled: null, activeEnrollments: 2 }))
      .toEqual({ enrolled: 2, slobodnih: 4, full: false }));
  it("preko kapaciteta → slobodnih 0, full true", () =>
    expect(computeSeats({ maxSeats: 6, manualEnrolled: 5, activeEnrollments: 3 }))
      .toEqual({ enrolled: 8, slobodnih: 0, full: true }));
});
```

- [ ] **Step 2: Pokreni test — mora da padne**

Run: `npx vitest run src/lib/groups.test.ts`
Expected: FAIL — „computeSeats is not exported" / nije funkcija.

- [ ] **Step 3: Dodaj `computeSeats` u `groups.ts`**

U `src/lib/groups.ts` dodaj (iznad `mapGroupToRaspored`):

```typescript
export interface SeatInput { maxSeats: number; manualEnrolled: number | null; activeEnrollments: number; }
export interface SeatResult { enrolled: number; slobodnih: number; full: boolean; }

/** enrolled = osnova (manual_enrolled) + nove uplate (aktivni upisi). */
export function computeSeats({ maxSeats, manualEnrolled, activeEnrollments }: SeatInput): SeatResult {
  const enrolled = (manualEnrolled ?? 0) + activeEnrollments;
  return { enrolled, slobodnih: Math.max(0, maxSeats - enrolled), full: enrolled >= maxSeats };
}
```

- [ ] **Step 4: Pokreni test — `computeSeats` deo mora da prođe**

Run: `npx vitest run src/lib/groups.test.ts -t computeSeats`
Expected: PASS (4 testa).

- [ ] **Step 5: Izmeni `mapGroupToRaspored` da koristi `computeSeats` i puni `full`**

U `src/lib/groups.ts`:

1. U `GroupRowForDisplay` dodaj polje:

```typescript
  max_seats: number;
  manual_enrolled: number | null;
```

2. Zameni telo `mapGroupToRaspored` (treći parametar sada je broj AKTIVNIH upisa, a ne već-izračunat `enrolled`):

```typescript
export function mapGroupToRaspored(g: GroupRowForDisplay, profName: string, activeEnrollments: number): GrupaRaspored {
  const seats = computeSeats({ maxSeats: g.max_seats, manualEnrolled: g.manual_enrolled ?? null, activeEnrollments });
  return {
    nivo: g.level,
    prof: profName,
    status: STATUS_LABEL[g.status] ?? g.status,
    pocetak: formatPocetak(g.start_date),
    trajanje: g.duration_weeks != null ? String(g.duration_weeks) : "",
    dani: formatDays(g.days),
    sat: g.session_time ?? "",
    maks: String(g.max_seats),
    upisanih: String(seats.enrolled),
    slobodnih: String(seats.slobodnih),
    full: seats.full,
  };
}
```

- [ ] **Step 6: Dodaj `full` u `GrupaRaspored` (raspored.ts)**

U `src/lib/raspored.ts`, interfejs `GrupaRaspored`, dodaj posle `slobodnih: string;`:

```typescript
  full: boolean;
```

- [ ] **Step 7: Ažuriraj poziv u `raspored.ts`**

U `src/lib/raspored.ts`, u `.map((g) => { ... })` bloku, zameni postojeće računanje:

```typescript
  const rows = groups.map((g) => {
    const prof = Array.isArray(g.professor) ? g.professor[0] : g.professor;
    const activeEnrollments = counts[g.id] || 0;
    return mapGroupToRaspored(g, prof?.full_name || "", activeEnrollments);
  });
```

(Postojeća `counts` mapa već broji aktivne `group_enrollments` po grupi — vidi `raspored.ts`. `manual_enrolled` se već selektuje u upitu, pa `mapGroupToRaspored` ima sve.)

- [ ] **Step 8: Ažuriraj postojeći `mapGroupToRaspored` test**

U `src/lib/groups.test.ts`, postojeći test „mapira red grupe u GrupaRaspored oblik" — u objektu grupe dodaj `manual_enrolled`, a treći argument je sada broj aktivnih upisa. Zameni telo testa:

```typescript
  it("mapira red grupe u GrupaRaspored oblik", () => {
    const r = mapGroupToRaspored(
      { level: "A1.1", status: "otvoren", start_date: "2026-06-15", duration_weeks: 8, days: [1, 3], session_time: "18:00", max_seats: 6, manual_enrolled: null },
      "Nataša Hartweger", 2,
    );
    expect(r).toMatchObject({
      nivo: "A1.1", prof: "Nataša Hartweger", status: "Otvoren za upis",
      pocetak: "15.06.2026", trajanje: "8", dani: "pon, sre", sat: "18:00",
      maks: "6", upisanih: "2", slobodnih: "4", full: false,
    });
  });
```

- [ ] **Step 9: Pokreni sve groups testove**

Run: `npx vitest run src/lib/groups.test.ts`
Expected: PASS (svi, uključujući computeSeats i ažuriran map test).

- [ ] **Step 10: tsc provera (consumeri `GrupaRaspored`)**

Run: `npx tsc --noEmit`
Expected: bez grešaka. Ako `RasporedGrupa.tsx` ili `page.tsx` koriste objektni literal tipa `GrupaRaspored` bez `full`, dodaj `full` tamo; ako samo čitaju polja, nema greške.

- [ ] **Step 11: Commit**

```bash
git add src/lib/groups.ts src/lib/groups.test.ts src/lib/raspored.ts
git commit -m "feat: computeSeats (osnova + uplate) i full polje u rasporedu grupa"
```

---

## Task 3: Auto-upis u grupu po plaćanju

**Files:**
- Modify: `src/lib/groups.ts` (dodaj čistu `pickOpenGroupForNivo`)
- Modify: `src/lib/groups.test.ts` (test za picker)
- Modify: `src/lib/grant-access.ts` (auto-upis za grupni proizvod)

Cilj: kad se grupni order potvrdi (`grantAccessForOrder`), pored `course_access` napravi i `group_enrollments` red → time brojač mesta automatski raste. Best-effort: greška se loguje i ne ruši dodelu pristupa.

- [ ] **Step 1: Napiši test za `pickOpenGroupForNivo`**

U `src/lib/groups.test.ts` dodaj:

```typescript
describe("pickOpenGroupForNivo", () => {
  const groups = [
    { id: "a", level: "A1.1", status: "otvoren", start_date: "2026-07-01" },
    { id: "b", level: "A1.1", status: "otvoren", start_date: "2026-06-01" },
    { id: "c", level: "A1.1", status: "uskoro", start_date: "2026-05-01" },
    { id: "d", level: "B1.1", status: "otvoren", start_date: "2026-06-01" },
  ];
  it("bira otvorenu grupu za nivo sa najranijim datumom", () =>
    expect(pickOpenGroupForNivo(groups, "A1.1")?.id).toBe("b"));
  it("ignoriše ne-otvorene i druge nivoe", () =>
    expect(pickOpenGroupForNivo(groups, "C1.1")).toBeNull());
});
```

- [ ] **Step 2: Pokreni — mora da padne**

Run: `npx vitest run src/lib/groups.test.ts -t pickOpenGroupForNivo`
Expected: FAIL — „pickOpenGroupForNivo is not a function".

- [ ] **Step 3: Dodaj `pickOpenGroupForNivo` u `groups.ts`**

```typescript
export interface OpenGroupRow { id: string; level: string; status: string; start_date: string | null; }

/** Otvorena grupa za nivo, sa najranijim start_date. null ako ne postoji. */
export function pickOpenGroupForNivo<T extends OpenGroupRow>(groups: T[], nivo: string): T | null {
  const open = groups.filter((g) => g.level === nivo && g.status === "otvoren");
  if (!open.length) return null;
  return open.sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""))[0];
}
```

- [ ] **Step 4: Pokreni — mora da prođe**

Run: `npx vitest run src/lib/groups.test.ts -t pickOpenGroupForNivo`
Expected: PASS (2 testa).

- [ ] **Step 5: Auto-upis u `grant-access.ts`**

U `src/lib/grant-access.ts` dodaj import na vrh:

```typescript
import { nivoForSlug } from "@/lib/course-nivo";
import { pickOpenGroupForNivo } from "@/lib/groups";
```

Zatim, u `grantAccessForOrder`, NEPOSREDNO PRE reda `await admin.from("orders").update({ payment_status: "completed", granted: true })...`, dodaj blok:

```typescript
  // Grupni proizvodi: auto-upis u otvorenu grupu (best-effort; ne ruši dodelu pristupa).
  for (const item of items) {
    const nivo = nivoForSlug(item.course_slug);
    if (!nivo) continue;
    try {
      const { data: openGroups } = await admin
        .from("groups").select("id, level, status, start_date")
        .eq("level", nivo).eq("status", "otvoren");
      const group = pickOpenGroupForNivo(openGroups ?? [], nivo);
      if (!group) { console.warn(`[grant] Nema otvorene grupe za nivo ${nivo} (order ${orderId})`); continue; }
      await admin.from("group_enrollments").upsert(
        { group_id: group.id, user_id: order.user_id, status: "active" },
        { onConflict: "group_id,user_id" },
      );
      console.log(`[grant] Auto-upis u grupu ${group.id} (${nivo}) za order ${orderId}`);
    } catch (e) {
      console.error(`[grant] Auto-upis pao za nivo ${nivo} (order ${orderId}):`, e);
    }
  }
```

(Napomena: `nivoForSlug` vraća nivo i za individualne slugove, ali za njih `pickOpenGroupForNivo` nad grupama može naći grupu istog nivoa — to NIJE željeno. Zато filtriraj samo grupne: dodaj uslov `if (!item.course_slug.startsWith("grupni-")) continue;` na početak petlje, pre `nivoForSlug`.)

Ispravljen početak petlje:

```typescript
  for (const item of items) {
    if (!item.course_slug.startsWith("grupni-")) continue;
    const nivo = nivoForSlug(item.course_slug);
    if (!nivo) continue;
```

- [ ] **Step 6: tsc + svi testovi**

Run: `npx tsc --noEmit && npx vitest run src/lib/groups.test.ts`
Expected: bez grešaka; svi groups testovi PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/groups.ts src/lib/groups.test.ts src/lib/grant-access.ts
git commit -m "feat: auto-upis u otvorenu grupu pri potvrdi grupnog ordera"
```

---

## Task 4: Checkout blokira punu grupu

**Files:**
- Modify: `src/app/api/orders/route.ts` (učitaj `category`; za grupni proveri popunjenost → 409)

- [ ] **Step 1: Dodaj `category` u select kursa**

U `src/app/api/orders/route.ts:30-35`, izmeni select:

```typescript
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, slug, title, price, category")
      .eq("slug", courseSlug)
      .eq("is_purchasable", true)
      .single();
```

- [ ] **Step 2: Dodaj proveru popunjenosti posle učitavanja kursa**

U istom fajlu, dodaj importe na vrh:

```typescript
import { nivoForSlug } from "@/lib/course-nivo";
import { computeSeats, pickOpenGroupForNivo } from "@/lib/groups";
```

Zatim, ODMAH POSLE bloka koji proverava `if (courseError || !course)` (posle linije ~43), dodaj:

```typescript
    // Grupni kurs: ne dozvoli kupovinu ako je grupa popunjena.
    if (course.category === "grupni") {
      const nivo = nivoForSlug(course.slug);
      if (nivo) {
        const { data: openGroups } = await supabase
          .from("groups").select("id, level, status, start_date, max_seats, manual_enrolled")
          .eq("level", nivo).eq("status", "otvoren");
        const group = pickOpenGroupForNivo(openGroups ?? [], nivo);
        if (group) {
          const { count } = await supabase
            .from("group_enrollments").select("*", { count: "exact", head: true })
            .eq("group_id", group.id).eq("status", "active");
          const seats = computeSeats({
            maxSeats: group.max_seats, manualEnrolled: group.manual_enrolled ?? null,
            activeEnrollments: count ?? 0,
          });
          if (seats.full) {
            return NextResponse.json(
              { error: "Grupa je trenutno popunjena. Ostavi mejl da te obavestimo za sledeći termin." },
              { status: 409 },
            );
          }
        }
      }
    }
```

- [ ] **Step 3: tsc provera**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 4: Ručna provera logike (bez živog plaćanja)**

Run:
```bash
npx vitest run src/lib/groups.test.ts -t computeSeats
```
Expected: PASS — odluka o popunjenosti je pokrivena `computeSeats` testovima (Task 2). Sama ruta je tanak omotač oko te funkcije.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat: checkout odbija kupovinu popunjene grupe (409)"
```

---

## Task 5: „Obavesti me za sledeći termin" — mejl funkcija + ruta

**Files:**
- Modify: `src/lib/email.ts` (dodaj `sendInteresNotification`)
- Create: `src/app/api/grupe/interes/route.ts`

- [ ] **Step 1: Dodaj `sendInteresNotification` u `email.ts`**

Na kraj `src/lib/email.ts` dodaj (prati postojeći obrazac: `getResend()`, `FROM`):

```typescript
export async function sendInteresNotification(nivo: string, email: string, ime: string) {
  try {
    const resend = getResend();
    if (!resend) return;
    await resend.emails.send({
      from: FROM,
      to: "kurs@hartweger.rs",
      replyTo: email,
      subject: `Interes za sledeći termin — ${nivo}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6">
<h2>Novi interes za grupni termin</h2>
<p><strong>Nivo:</strong> ${nivo}</p>
<p><strong>Ime:</strong> ${ime || "—"}</p>
<p><strong>Mejl:</strong> ${email}</p>
<p>Grupa za ovaj nivo je trenutno popunjena. Kontaktiraj polaznika kad otvoriš novi termin.</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendInteresNotification pao:", e);
  }
}
```

- [ ] **Step 2: Napravi rutu**

Create `src/app/api/grupe/interes/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { sendInteresNotification } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { nivo, email, ime } = await request.json();
    const mail = String(email || "").toLowerCase().trim();
    if (!mail.includes("@") || !nivo) {
      return NextResponse.json({ error: "Nivo i ispravan mejl su obavezni." }, { status: 400 });
    }
    await sendInteresNotification(String(nivo), mail, String(ime || ""));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[grupe/interes] Error:", e);
    return NextResponse.json({ error: "Greška na serveru." }, { status: 500 });
  }
}
```

- [ ] **Step 3: tsc provera**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 4: Commit**

```bash
git add src/lib/email.ts src/app/api/grupe/interes/route.ts
git commit -m "feat: ruta i mejl za 'obavesti me za sledeci termin'"
```

---

## Task 6: Stranica kursa — „Popunjeno" + zamena CTA

**Files:**
- Create: `src/app/kursevi/[slug]/InteresForm.tsx` (client)
- Modify: `src/app/kursevi/[slug]/page.tsx` (info-blok i CTA kad je `grupa.full`)

- [ ] **Step 1: Napravi client komponentu `InteresForm`**

Create `src/app/kursevi/[slug]/InteresForm.tsx`:

```tsx
"use client";
import { useState } from "react";

export default function InteresForm({ nivo }: { nivo: string }) {
  const [open, setOpen] = useState(false);
  const [ime, setIme] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "slanje" | "ok" | "greska">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("slanje");
    try {
      const res = await fetch("/api/grupe/interes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nivo, ime, email }),
      });
      setStatus(res.ok ? "ok" : "greska");
    } catch {
      setStatus("greska");
    }
  }

  if (status === "ok") {
    return <p className="text-green-600 font-semibold">Hvala! Javićemo ti kad otvorimo sledeći termin. 💚</p>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-plava hover:bg-plava-dark text-white font-bold text-lg py-4 px-10 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg"
      >
        Obavesti me za sledeći termin
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 w-full max-w-sm">
      <input
        type="text" placeholder="Ime" value={ime} onChange={(e) => setIme(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-3"
      />
      <input
        type="email" required placeholder="Tvoj mejl" value={email} onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-3"
      />
      <button
        type="submit" disabled={status === "slanje"}
        className="bg-plava hover:bg-plava-dark text-white font-bold py-3 px-6 rounded-lg disabled:opacity-60"
      >
        {status === "slanje" ? "Šaljem…" : "Pošalji"}
      </button>
      {status === "greska" && <p className="text-red-600 text-sm">Greška. Pokušaj ponovo.</p>}
    </form>
  );
}
```

- [ ] **Step 2: Importuj komponentu u `page.tsx`**

U `src/app/kursevi/[slug]/page.tsx` dodaj uz ostale importe:

```typescript
import InteresForm from "./InteresForm";
```

- [ ] **Step 3: „Popunjeno" u info-bloku grupe**

U `src/app/kursevi/[slug]/page.tsx`, u grupnom info-bloku (oko linije 357-360), zameni red sa „Slobodnih mesta":

```tsx
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>👥</span>
                    {grupa.full ? (
                      <span className="text-red-600 font-bold">Popunjeno — nema slobodnih mesta</span>
                    ) : (
                      <span className="text-gray-600"><strong>Slobodnih mesta:</strong> {grupa.slobodnih}</span>
                    )}
                  </div>
```

(Koristi `grupa.slobodnih` — već je tačno izračunat string; ne računaj ponovo `parseInt(maks)-parseInt(upisanih)`.)

- [ ] **Step 4: Zameni glavni CTA kad je grupa puna**

U `src/app/kursevi/[slug]/page.tsx`, u završnoj CTA sekciji (oko linije 458-466), zameni `<Link href={...}>{ctaLabel}...</Link>` uslovnim renderom. Pronađi blok:

```tsx
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={`/kupovina/${course.slug}`}
              className="bg-[#F78687] hover:bg-[#e06060] text-white font-bold text-lg py-4 px-10 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-[#F78687]/20"
            >
              {ctaLabel} — {isVariable ? "od " : ""}{formatPrice(course.price)} din
            </Link>
```

i zameni ga sa:

```tsx
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {category === "grupni" && grupa?.full ? (
              <InteresForm nivo={grupa.nivo} />
            ) : (
              <Link
                href={`/kupovina/${course.slug}`}
                className="bg-[#F78687] hover:bg-[#e06060] text-white font-bold text-lg py-4 px-10 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-[#F78687]/20"
              >
                {ctaLabel} — {isVariable ? "od " : ""}{formatPrice(course.price)} din
              </Link>
            )}
```

(Ostatak sekcije — link „Ili uradi besplatno testiranje" i zatvarajući `</div>` — ostaje nepromenjen.)

- [ ] **Step 5: tsc + build provera**

Run: `npx tsc --noEmit`
Expected: bez grešaka (`grupa` je tipa `GrupaRaspored | null`; `grupa?.full` i `grupa.nivo` su validni).

- [ ] **Step 6: Lokalna vizuelna provera (opciono ali preporučeno)**

Run: `npm run dev`, otvori `http://localhost:3000/kursevi/grupni-kurs-nemackog-jezika-a1-1`.
Expected: pošto A1.1 ima `manual_enrolled=3` (osnova 3/6), prikazuje „Slobodnih mesta: 3" i dugme „Prijavi se". Da proveriš „Popunjeno" stanje lokalno, privremeno postavi `manual_enrolled=6` za A1.1 u bazi pa vrati nazad (ili oslони se na Task 7 smoke posle deploya).

- [ ] **Step 7: Commit**

```bash
git add "src/app/kursevi/[slug]/InteresForm.tsx" "src/app/kursevi/[slug]/page.tsx"
git commit -m "feat: stranica kursa prikazuje Popunjeno + 'obavesti me' formu za pune grupe"
```

---

## Task 7: Deploy + smoke

**Files:** nema izmena koda — puštanje i provera.

- [ ] **Step 1: Pokreni ceo test paket**

Run: `npx vitest run`
Expected: svi testovi PASS.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build prolazi bez grešaka.

- [ ] **Step 3: Deploy na produkciju**

Run: `vercel --prod`
(PostToolUse hook automatski pokreće smoke-deploy na `/lekcija/[id]` — vidi [[feedback_deploy_smoke_test]].)

- [ ] **Step 4: Smoke — popunjena grupa (privremeni test u bazi)**

Privremeno postavi `manual_enrolled = max_seats` za jednu grupu (npr. A2.1) i proveri:
```bash
curl -s "https://kurs.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-a2?cb=$RANDOM" | grep -o "Popunjeno"
```
Expected: vrati „Popunjeno". Zatim proveri da checkout vraća 409:
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST "https://kurs.hartweger.rs/api/orders" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test+full@example.com","country":"RS","courseSlug":"grupni-kurs-nemackog-jezika-a2","paymentMethod":"uplatnica"}'
```
Expected: `409`. Posle provere **vrati `manual_enrolled` na staru vrednost** (A2.1 = 0).

- [ ] **Step 5: Smoke — „obavesti me" mejl**

Na popunjenoj grupi (dok je u test stanju iz Step 4) pošalji interes:
```bash
curl -s -X POST "https://kurs.hartweger.rs/api/grupe/interes" \
  -H "Content-Type: application/json" \
  -d '{"nivo":"A2.1","email":"test@example.com","ime":"Test"}'
```
Expected: `{"ok":true}` i mejl stiže na `kurs@hartweger.rs`.

- [ ] **Step 6: Commit/označi gotovo**

Posao A je pušten. Posao B (Google integracija) ide po zasebnom planu kad se podesi service account.

---

## Self-Review (popunjeno)

**Spec coverage (Posao A deo):**
- Brojanje po plaćanju → Task 3 (auto-upis) + Task 2 (`computeSeats`). ✓
- „Popunjeno" na stranici → Task 6. ✓
- Checkout blokada → Task 4. ✓
- „Obavesti me" → mejl adminu → Tasks 5 + 6. ✓
- manual_enrolled kao osnova + nove uplate → Task 2 (`computeSeats` testovi). ✓
- Važi odmah za sve grupe (bez migracije) → cela A serija. ✓

**Van obima ovog plana (Posao B, zaseban plan):** `term_opened_at` kolona + dugme „Otvori novi termin" + reset; Google Calendar/Meet/Docs/Sheets; mejl polazniku sa Meet/beleškama; mejl/sheet profesoru. Razlog: zavise od Google service account podešavanja i ne blokiraju gašenje preprodaje.

**Placeholder scan:** nema TBD/TODO; sav kod je konkretan.

**Type consistency:** `computeSeats`/`SeatInput`/`SeatResult`, `pickOpenGroupForNivo`/`OpenGroupRow`, `nivoForSlug`/`SLUG_TO_NIVO`, `GrupaRaspored.full`, `mapGroupToRaspored(g, prof, activeEnrollments)` — imena usklađena kroz Task 1-6.
