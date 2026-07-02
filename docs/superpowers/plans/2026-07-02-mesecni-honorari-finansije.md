# Mesečni pregled honorara u Finansijama Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sekcija „Po profesorkama" na /admin/finansije dobija kolone Isplaćeno / Saldo perioda / Ukupan saldo danas (+ aktivnosti u zarađeno), postojeći mesečni mejl profesorkama se dopunjava aktivnostima i isplatama, i dodaje se dugme za ručno ponovno slanje obračuna za izabrani mesec.

**Architecture:** Čista računica ide u `buildFinansije` (`src/lib/finansije.ts`, bez I/O — postojeći obrazac). Obračun za mejl se izvlači iz cron rute u novi I/O modul `src/lib/honorar-report.ts` koji dele cron i nova admin ruta. UI izmene su u `FinansijeClient.tsx`.

**Tech Stack:** Next.js App Router (v. AGENTS.md — proveri `node_modules/next/dist/docs/` pri odstupanju od postojećih obrazaca), Supabase (admin klijent), Resend (preko postojećeg `src/lib/email.ts`), vitest.

**Spec:** `docs/superpowers/specs/2026-07-02-mesecni-honorari-finansije-design.md`

**Repo pravila:** trunk-based na `main` (proveri `git branch --show-current` pre commita). Obična crtica u svim tekstovima, nikad em/en-dash. Ti-forma u mejlovima, potpis „Hartweger tim".

---

### Task 1: `finansije.ts` — isplate i aktivnosti u ProfRow

**Files:**
- Modify: `src/lib/finansije.ts`
- Test: `src/lib/finansije.test.ts`

- [ ] **Step 1: Write the failing tests**

Dodaj na kraj `src/lib/finansije.test.ts`:

```ts
describe("buildFinansije - isplate i aktivnosti po profesorki", () => {
  it("isplaceno = zbir isplata u periodu; van perioda ne ulazi", () => {
    const f = fixture({ mesec: 6 });
    f.payments = [
      { professor_id: "p-hristina", payment_date: "2026-06-15", amount: 2000 },
      { professor_id: "p-hristina", payment_date: "2026-06-28", amount: 500 },
      { professor_id: "p-hristina", payment_date: "2026-05-15", amount: 9999 }, // maj - van perioda
      { professor_id: "p-katarina", payment_date: "2026-06-20", amount: 3600 },
    ];
    const d = buildFinansije(f);
    const hristina = d.profesorke.find((p) => p.professor_id === "p-hristina")!;
    const katarina = d.profesorke.find((p) => p.professor_id === "p-katarina")!;
    expect(hristina.isplaceno).toBe(2500);
    expect(katarina.isplaceno).toBe(3600);
  });

  it("aktivnosti u periodu ulaze u zaradjeno i saldo, van perioda ne", () => {
    const f = fixture({ mesec: 6 });
    f.activities = [
      { professor_id: "p-hristina", activity_date: "2026-06-10", amount: 700 },
      { professor_id: "p-hristina", activity_date: "2026-03-10", amount: 9999 }, // mart - van perioda
    ];
    const d = buildFinansije(f);
    const hristina = d.profesorke.find((p) => p.professor_id === "p-hristina")!;
    // jun: 2 ind časa × 1400 = 2800 honorar + 700 aktivnosti
    expect(hristina.aktivnosti).toBe(700);
    expect(hristina.zaradjeno).toBe(2800 + 700);
    expect(hristina.saldoPerioda).toBe(3500); // ništa isplaćeno
  });

  it("saldoPerioda = zaradjeno - isplaceno; neto odbija i aktivnosti", () => {
    const f = fixture({ mesec: 6 });
    f.activities = [{ professor_id: "p-hristina", activity_date: "2026-06-10", amount: 700 }];
    f.payments = [{ professor_id: "p-hristina", payment_date: "2026-06-15", amount: 3000 }];
    const d = buildFinansije(f);
    const hristina = d.profesorke.find((p) => p.professor_id === "p-hristina")!;
    expect(hristina.saldoPerioda).toBe(2800 + 700 - 3000);
    // prihod juna za Hristinu: obnova o4 = 14000; neto = 14000 - 3500
    expect(hristina.neto).toBe(14000 - 3500);
  });

  it("bez payments/activities polja (stari pozivi) sve je 0 i ništa ne puca", () => {
    const d = buildFinansije(fixture({ mesec: 6 }));
    const hristina = d.profesorke.find((p) => p.professor_id === "p-hristina")!;
    expect(hristina.isplaceno).toBe(0);
    expect(hristina.aktivnosti).toBe(0);
    expect(hristina.zaradjeno).toBe(hristina.honorar);
    expect(hristina.saldoPerioda).toBe(hristina.honorar);
  });

  it("cela godina (mesec=null): isplate iz svih meseci godine se sabiraju", () => {
    const f = fixture(); // mesec: null
    f.payments = [
      { professor_id: "p-hristina", payment_date: "2026-05-15", amount: 1000 },
      { professor_id: "p-hristina", payment_date: "2026-06-15", amount: 2000 },
      { professor_id: "p-hristina", payment_date: "2025-12-31", amount: 9999 }, // druga godina
    ];
    const d = buildFinansije(f);
    expect(d.profesorke.find((p) => p.professor_id === "p-hristina")!.isplaceno).toBe(3000);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/finansije.test.ts`
Expected: FAIL — TypeScript/asercije jer `payments`, `isplaceno`, `zaradjeno`, `saldoPerioda`, `aktivnosti` ne postoje.

- [ ] **Step 3: Implement in `src/lib/finansije.ts`**

(a) Posle `export interface RoyaltyRow ...` (linija ~102) dodaj:

```ts
export interface FinPaymentRow { professor_id: string; payment_date: string; amount: number }
export interface FinActivityRow { professor_id: string; activity_date: string; amount: number }
```

(b) U `FinansijeInput`, posle `royalties: RoyaltyRow[];` dodaj:

```ts
  payments?: FinPaymentRow[];   // professor_payments - isplate profesorkama (cela istorija, filtrira se po periodu)
  activities?: FinActivityRow[]; // professor_activities SAMO status='odobreno' (filtrira pozivalac)
```

(c) `ProfRow` interfejs zameni sa:

```ts
export interface ProfRow {
  professor_id: string; ime: string; prihod: number; honorar: number;
  aktivnosti: number; zaradjeno: number; isplaceno: number; saldoPerioda: number;
  neto: number; aktivniPolaznici: number; retencijaMeseci: number | null;
}
```

(d) U `buildFinansije`, u mapiranju `profesorke` (blok koji počinje `const profesorke: ProfRow[] = input.professors.map((p) => {`), posle linije `const honorar = honorarCasovi + (royaltyHonorarByProf.get(p.id) ?? 0);` dodaj:

```ts
    const aktivnosti = (input.activities ?? [])
      .filter((a) => a.professor_id === p.id && inSel(a.activity_date))
      .reduce((s, a) => s + (a.amount || 0), 0);
    const isplaceno = (input.payments ?? [])
      .filter((x) => x.professor_id === p.id && inSel(x.payment_date))
      .reduce((s, x) => s + (x.amount || 0), 0);
    const zaradjeno = honorar + aktivnosti;
```

(e) `return` red profesorke zameni sa (neto sada odbija i aktivnosti):

```ts
    return {
      professor_id: p.id, ime: p.full_name ?? "-", prihod, honorar,
      aktivnosti, zaradjeno, isplaceno, saldoPerioda: zaradjeno - isplaceno,
      neto: prihod - zaradjeno, aktivniPolaznici: aktivni, retencijaMeseci: retencija,
    };
```

(f) Filter praznih redova ispod mape dopuni da profesorka sa isplatom/aktivnošću ne ispadne:

```ts
  }).filter((p) => p.prihod !== 0 || p.zaradjeno !== 0 || p.isplaceno !== 0 || p.aktivniPolaznici > 0)
    .sort((a, b) => b.neto - a.neto);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/finansije.test.ts`
Expected: PASS (svi, uključujući stare — fixture ne zadaje nova polja pa su opciona).

- [ ] **Step 5: Commit**

```bash
git add src/lib/finansije.ts src/lib/finansije.test.ts
git commit -m "feat(finansije): isplate i aktivnosti po profesorki u ProfRow"
```

---

### Task 2: `page.tsx` — upiti za isplate/aktivnosti + ukupan saldo

**Files:**
- Modify: `src/app/admin/finansije/page.tsx`

- [ ] **Step 1: Dodaj upite**

U `Promise.all` niz (posle `course_royalties` upita) dodaj dva upita, i destrukturiraj ih kao `paymentsRes, activitiesRes`:

```ts
      admin.from("professor_payments").select("professor_id, payment_date, amount").limit(10000),
      admin.from("professor_activities").select("professor_id, activity_date, amount, status").eq("status", "odobreno").limit(10000),
```

U petlju za proveru grešaka dodaj `[paymentsRes, "professor_payments"], [activitiesRes, "professor_activities"],`.

- [ ] **Step 2: Prosledi u buildFinansije**

U poziv `buildFinansije({...})` posle `royalties: ...` dodaj:

```ts
    payments: (paymentsRes.data ?? []).map((r) => ({ professor_id: r.professor_id, payment_date: r.payment_date, amount: Number(r.amount) || 0 })),
    activities: (activitiesRes.data ?? []).map((r) => ({ professor_id: r.professor_id, activity_date: r.activity_date, amount: Number(r.amount) || 0 })),
```

- [ ] **Step 3: Ukupan saldo danas (kao Obaveze)**

Import na vrhu: `import { loadPayables } from "@/lib/professor-payable";`

Posle poziva `buildFinansije` dodaj:

```ts
  // "Ukupan saldo danas" - ista računica kao /admin/obaveze (bez autorskog procenta)
  const payables = await loadPayables();
  const ukupanSaldo: Record<string, number> = Object.fromEntries(payables.map((p) => [p.professorId, p.balance]));
```

i prosledi klijentu novi prop: `<FinansijeClient ... ukupanSaldo={ukupanSaldo} />`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` (pući će samo na `FinansijeClient` propu — to rešava Task 3; ako ima drugih grešaka, popravi ih sada). Zato commit tek posle Taska 3.

---

### Task 3: `FinansijeClient.tsx` — nove kolone + info napomena

**Files:**
- Modify: `src/app/admin/finansije/FinansijeClient.tsx`

- [ ] **Step 1: Prop**

U `interface Props` dodaj `ukupanSaldo: Record<string, number>;` i destrukturiraj ga u potpisu komponente.

- [ ] **Step 2: Tabela**

U sekciji `{/* Po profesorkama */}`:

(a) `min-w-[700px]` → `min-w-[1000px]`.

(b) Postojeću napomenu (`<p className="text-xs...`) dopuni rečenicom:

```
Zarađeno = časovi + autorski procenat + odobrene aktivnosti. Ukupan saldo danas je ista brojka kao na Obavezama (bez autorskog procenta) i ne zavisi od izabranog perioda.
```

(c) Header red zameni sa:

```tsx
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-3 font-medium">Profesorka</th>
              <th className="py-1 px-2 text-right font-medium">Prihod koji donosi</th>
              <th className="py-1 px-2 text-right font-medium">Zarađeno</th>
              <th className="py-1 px-2 text-right font-medium">Isplaćeno</th>
              <th className="py-1 px-2 text-right font-medium">Saldo perioda</th>
              <th className="py-1 px-2 text-right font-medium">Ukupan saldo danas</th>
              <th className="py-1 px-2 text-right font-medium">Neto doprinos</th>
              <th className="py-1 px-2 text-center font-medium">Aktivni polaznici</th>
              <th className="py-1 pl-2 text-right font-medium">Retencija (mes.)</th>
            </tr>
```

(d) Body red zameni sa:

```tsx
            {data.profesorke.map((p) => (
              <tr key={p.professor_id} className="border-t border-gray-50">
                <td className="py-2 pr-3">{p.ime}</td>
                <td className="py-2 px-2 text-right">{din(p.prihod)}</td>
                <td className="py-2 px-2 text-right">−{din(p.zaradjeno)}</td>
                <td className="py-2 px-2 text-right">{din(p.isplaceno)}</td>
                <td className={`py-2 px-2 text-right ${p.saldoPerioda > 0 ? "text-red-600 font-semibold" : ""}`}>{din(p.saldoPerioda)}</td>
                <td className={`py-2 px-2 text-right ${(ukupanSaldo[p.professor_id] ?? 0) > 0 ? "text-red-600 font-semibold" : ""}`}>{din(ukupanSaldo[p.professor_id] ?? 0)}</td>
                <td className={`py-2 px-2 text-right font-semibold ${p.neto < 0 ? "text-red-600" : ""}`}>{din(p.neto)}</td>
                <td className="py-2 px-2 text-center">{p.aktivniPolaznici}</td>
                <td className="py-2 pl-2 text-right">{p.retencijaMeseci ?? "-"}</td>
              </tr>
            ))}
```

- [ ] **Step 3: Verify + ručna provera**

Run: `npx tsc --noEmit` → bez grešaka. Run: `npx vitest run` → PASS.
Pokreni `npm run dev`, otvori `/admin/finansije?godina=2026&mesec=6` i uporedi „Ukupan saldo danas" sa `/admin/obaveze` — brojke moraju da se poklope.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/finansije/page.tsx src/app/admin/finansije/FinansijeClient.tsx
git commit -m "feat(finansije): kolone Isplaćeno/Saldo perioda/Ukupan saldo u Po profesorkama"
```

---

### Task 4: `honorar-report.ts` — zajednički obračun za mejl

**Files:**
- Create: `src/lib/honorar-report.ts`

- [ ] **Step 1: Napiši modul**

I/O modul po uzoru na `professor-payable.ts` — bez unit testova (čista računica ispod je pokrivena u `honorar.ts`/`finansije.ts` testovima):

```ts
// src/lib/honorar-report.ts
// I/O: mesečni obračun honorara po profesorki za mejl (cron + ručno slanje iz Finansija).
import { createAdminClient } from "@/lib/supabase/admin";
import { computeHonorar, monthDateRange, MESECI, DEFAULT_HONORAR_IND, DEFAULT_HONORAR_GRP } from "@/lib/honorar";
import { loadPayables } from "@/lib/professor-payable";

export interface MonthlyHonorarReport {
  professorId: string;
  name: string;
  email: string | null;
  ind: number; grp: number;
  rateInd: number; rateGrp: number;
  indTotal: number; grpTotal: number;
  aktivnosti: { description: string; amount: number }[];
  aktivnostiTotal: number;
  isplate: { date: string; amount: number }[];
  isplaceno: number;
  total: number;          // časovi + aktivnosti (bruto zarađeno u mesecu)
  balance: number | null; // trenutni ukupan saldo (kao Obaveze)
}

export interface MonthlyHonorarReports {
  label: string; // npr. "jun 2026."
  reports: MonthlyHonorarReport[];
}

/** Obračun za SVE profesorke sa honorar konfiguracijom, za dati mesec. */
export async function buildMonthlyHonorarReports(year: number, month: number): Promise<MonthlyHonorarReports> {
  const admin = createAdminClient();
  const label = `${MESECI[month - 1]} ${year}.`;
  const { from, toExclusive } = monthDateRange(year, month);

  const { data: profs } = await admin
    .from("user_profiles")
    .select("id, full_name, email, honorar_ind, honorar_grp")
    .not("honorar_ind", "is", null);

  const payables = await loadPayables();
  const balanceById = new Map(payables.map((p) => [p.professorId, p.balance]));

  const reports: MonthlyHonorarReport[] = [];
  for (const p of profs ?? []) {
    const [indRes, grpRes, actsRes, paysRes] = await Promise.all([
      admin.from("individual_lessons").select("*", { count: "exact", head: true })
        .eq("professor_id", p.id).gte("lesson_date", from).lt("lesson_date", toExclusive),
      admin.from("group_sessions").select("*", { count: "exact", head: true })
        .eq("professor_id", p.id).eq("cancelled", false).gte("session_date", from).lt("session_date", toExclusive),
      admin.from("professor_activities").select("description, amount")
        .eq("professor_id", p.id).eq("status", "odobreno")
        .gte("activity_date", from).lt("activity_date", toExclusive),
      admin.from("professor_payments").select("payment_date, amount")
        .eq("professor_id", p.id).gte("payment_date", from).lt("payment_date", toExclusive)
        .order("payment_date"),
    ]);
    const ind = indRes.count ?? 0, grp = grpRes.count ?? 0;
    const rateInd = p.honorar_ind ?? DEFAULT_HONORAR_IND;
    const rateGrp = p.honorar_grp ?? DEFAULT_HONORAR_GRP;
    const h = computeHonorar(ind, grp, rateInd, rateGrp);
    const aktivnosti = (actsRes.data ?? []).map((a) => ({ description: a.description ?? "", amount: a.amount || 0 }));
    const aktivnostiTotal = aktivnosti.reduce((s, a) => s + a.amount, 0);
    const isplate = (paysRes.data ?? []).map((x) => ({ date: x.payment_date, amount: x.amount || 0 }));
    const isplaceno = isplate.reduce((s, x) => s + x.amount, 0);
    reports.push({
      professorId: p.id, name: p.full_name || p.email || "-", email: p.email,
      ind, grp, rateInd, rateGrp, indTotal: h.indTotal, grpTotal: h.grpTotal,
      aktivnosti, aktivnostiTotal, isplate, isplaceno,
      total: h.total + aktivnostiTotal,
      balance: balanceById.get(p.id) ?? null,
    });
  }
  return { label, reports };
}
```

(Kolone `professor_activities` su potvrđene u `src/app/api/profesor/aktivnost/route.ts`: `description`, `amount`, `activity_date`, `status`.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` → bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/lib/honorar-report.ts
git commit -m "feat(honorari): zajednički mesečni obračun za mejl (honorar-report)"
```

---

### Task 5: `email.ts` — aktivnosti i isplate u mejlu

**Files:**
- Modify: `src/lib/email.ts` (funkcija `sendHonorarProfEmail`, ~linija 696)

- [ ] **Step 1: Proširi potpis i HTML**

Zameni celu funkciju `sendHonorarProfEmail` sa:

```ts
export async function sendHonorarProfEmail(
  profEmail: string,
  profIme: string,
  opts: {
    label: string; ind: number; grp: number; rateInd: number; rateGrp: number;
    indTotal: number; grpTotal: number; total: number; balance?: number;
    aktivnosti?: { description: string; amount: number }[];
    isplate?: { date: string; amount: number }[];
  },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = profIme ? profIme.split(" ")[0] : "";
    const fmt = (n: number) => n.toLocaleString("de-DE");
    const aktRows = (opts.aktivnosti ?? [])
      .map((a) => `<li>${esc(a.description || "Dodatna aktivnost")}: <strong>${fmt(a.amount)} din</strong></li>`)
      .join("");
    const isplate = opts.isplate ?? [];
    const isplaceno = isplate.reduce((s, x) => s + x.amount, 0);
    const isplateBlock = isplate.length > 0
      ? `<p>Isplaćeno ti je u ovom mesecu <strong>${fmt(isplaceno)} din</strong> (${isplate.map((x) => `${fmt(x.amount)} din ${esc(x.date)}`).join(", ")}).</p>`
      : "";
    await resend.emails.send({
      from: FROM,
      to: profEmail,
      replyTo: "info@hartweger.rs",
      subject: `Honorar za ${opts.label}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Tvoj obračun za <strong>${esc(opts.label)}</strong>:</p>
<ul>
<li>Individualni časovi: ${opts.ind} × ${fmt(opts.rateInd)} din = <strong>${fmt(opts.indTotal)} din</strong></li>
<li>Grupne sesije: ${opts.grp} × ${fmt(opts.rateGrp)} din = <strong>${fmt(opts.grpTotal)} din</strong></li>
${aktRows}
</ul>
<p style="font-size:18px"><strong>Ukupno: ${fmt(opts.total)} din</strong></p>
${isplateBlock}
${typeof opts.balance === "number" ? `<p style="font-size:13px;color:#666">Trenutni saldo (zarađeno - isplaćeno): <strong>${fmt(opts.balance)} din</strong>.</p>` : ""}
<p style="font-size:13px;color:#666">Ako nešto ne štima, javi nam na info@hartweger.rs.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendHonorarProfEmail pao:", e);
  }
}
```

(Nova polja su opciona — postojeći cron poziv i dalje kompajlira.)

- [ ] **Step 2: Verify + Commit**

Run: `npx tsc --noEmit` → bez grešaka.

```bash
git add src/lib/email.ts
git commit -m "feat(email): aktivnosti i mesečne isplate u honorar mejlu"
```

---

### Task 6: Cron ruta prelazi na zajednički obračun

**Files:**
- Modify: `src/app/api/cron/honorari/route.ts`

- [ ] **Step 1: Refaktoriši rutu**

Zameni ceo fajl sa:

```ts
import { NextRequest, NextResponse } from "next/server";
import { previousMonth } from "@/lib/honorar";
import { sendHonorarProfEmail, sendHonorarSummaryEmail } from "@/lib/email";
import { buildMonthlyHonorarReports } from "@/lib/honorar-report";

// Mesečni cron (1. u mesecu): obračun honorara za PRETHODNI mesec + mejlovi.
// Override meseca: ?month=YYYY-MM (za backfill/test). Zaštita: Bearer CRON_SECRET.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monthParam = request.nextUrl.searchParams.get("month");
  let year: number, month: number;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y; month = m;
  } else {
    ({ year, month } = previousMonth(new Date()));
  }

  const { label, reports } = await buildMonthlyHonorarReports(year, month);
  const summary: { name: string; ind: number; grp: number; total: number }[] = [];
  let grandTotal = 0;
  let mailed = 0;

  for (const r of reports) {
    if (r.ind + r.grp + r.aktivnosti.length === 0) continue; // ništa održano - ne šalje se (kao do sada)
    summary.push({ name: r.name, ind: r.ind, grp: r.grp, total: r.total });
    grandTotal += r.total;
    if (r.email) {
      await sendHonorarProfEmail(r.email, r.name, {
        label, ind: r.ind, grp: r.grp, rateInd: r.rateInd, rateGrp: r.rateGrp,
        indTotal: r.indTotal, grpTotal: r.grpTotal, total: r.total,
        aktivnosti: r.aktivnosti, isplate: r.isplate,
        balance: r.balance ?? undefined,
      });
      mailed++;
    }
  }

  if (summary.length > 0) {
    summary.sort((a, b) => b.total - a.total);
    await sendHonorarSummaryEmail(label, summary, grandTotal);
  }

  return NextResponse.json({ label, professori: summary.length, mailed, grandTotal });
}
```

Ponašanje je isto kao pre + aktivnosti/isplate u mejlu. Napomena: uslov za slanje sada uključuje i profesorku koja u mesecu ima SAMO aktivnosti (ranije bi bila preskočena) — to je ispravka, ne regresija.

- [ ] **Step 2: Verify + Commit**

Run: `npx tsc --noEmit && npx vitest run` → PASS.

```bash
git add src/app/api/cron/honorari/route.ts
git commit -m "refactor(cron): honorari koristi zajednički honorar-report obračun"
```

---

### Task 7: Admin ruta za ručno slanje

**Files:**
- Create: `src/app/api/admin/finansije/posalji-obracun/route.ts`

- [ ] **Step 1: Napiši rutu**

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendHonorarProfEmail } from "@/lib/email";
import { buildMonthlyHonorarReports } from "@/lib/honorar-report";
import honorariHistory from "@/lib/honorari-history.json";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? admin : null;
}

// Ručno (ponovno) slanje mesečnog obračuna profesorkama, iz Finansija.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const godina = Number(body.godina);
  const mesec = Number(body.mesec);
  if (!Number.isInteger(godina) || !Number.isInteger(mesec) || mesec < 1 || mesec > 12) {
    return NextResponse.json({ error: "Godina i mesec su obavezni." }, { status: 400 });
  }
  // Istorijski override meseci (Isplata sheet): nema pojedinačnih časova u bazi - obračun bi bio pogrešan.
  const histRows = (honorariHistory as Record<string, { month: number }[]>)[String(godina)] ?? [];
  if (histRows.some((r) => r.month === mesec)) {
    return NextResponse.json({ error: "Za ovaj mesec obračun je istorijski (migriran) - mejl bi bio pogrešan." }, { status: 400 });
  }

  const { label, reports } = await buildMonthlyHonorarReports(godina, mesec);
  let poslato = 0, preskoceno = 0;
  for (const r of reports) {
    const imaStavke = r.ind + r.grp + r.aktivnosti.length + r.isplate.length > 0;
    if (!imaStavke || !r.email) { preskoceno++; continue; }
    await sendHonorarProfEmail(r.email, r.name, {
      label, ind: r.ind, grp: r.grp, rateInd: r.rateInd, rateGrp: r.rateGrp,
      indTotal: r.indTotal, grpTotal: r.grpTotal, total: r.total,
      aktivnosti: r.aktivnosti, isplate: r.isplate,
      balance: r.balance ?? undefined,
    });
    poslato++;
  }
  return NextResponse.json({ poslato, preskoceno, label });
}
```

- [ ] **Step 2: Verify + Commit**

Run: `npx tsc --noEmit` → bez grešaka.

```bash
git add src/app/api/admin/finansije/posalji-obracun/route.ts
git commit -m "feat(finansije): admin ruta za ručno slanje mesečnog obračuna"
```

---

### Task 8: Dugme u FinansijeClient

**Files:**
- Modify: `src/app/admin/finansije/FinansijeClient.tsx`

- [ ] **Step 1: State + handler**

Kod ostalih `useState` poziva dodaj:

```ts
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");
```

Ispod `deleteExpense` dodaj:

```ts
  async function posaljiObracun() {
    if (!mesec) return;
    if (!confirm(`Poslati obračun za ${periodLabel} svim profesorkama sa stavkama u tom mesecu?`)) return;
    setSending(true); setSendMsg("");
    try {
      const res = await fetch("/api/admin/finansije/posalji-obracun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ godina: year, mesec }),
      });
      const d = await res.json().catch(() => ({}));
      setSendMsg(res.ok
        ? `Poslato: ${(d as { poslato?: number }).poslato ?? 0}, preskočeno: ${(d as { preskoceno?: number }).preskoceno ?? 0}.`
        : (d as { error?: string }).error ?? "Greška pri slanju.");
    } catch {
      setSendMsg("Greška na mreži - pokušaj ponovo.");
    } finally {
      setSending(false);
    }
  }
```

- [ ] **Step 2: Dugme u sekciji**

Naslov sekcije „Po profesorkama" zameni sa flex redom (obrazac kao kod Troškova):

```tsx
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h2 className="font-semibold">Po profesorkama - {periodLabel}</h2>
          <div className="flex items-center gap-2">
            {sendMsg && <span className="text-xs text-gray-500">{sendMsg}</span>}
            <button onClick={posaljiObracun} disabled={!mesec || sending}
              title={!mesec ? "Izaberi konkretan mesec da bi poslala obračun." : undefined}
              className="bg-plava text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
              {sending ? "Šaljem..." : "Pošalji obračun profesorkama"}
            </button>
          </div>
        </div>
```

- [ ] **Step 3: Verify + Commit**

Run: `npx tsc --noEmit && npx vitest run && npm run build` → sve PASS.

```bash
git add src/app/admin/finansije/FinansijeClient.tsx
git commit -m "feat(finansije): dugme za ručno slanje mesečnog obračuna profesorkama"
```

---

### Task 9: Deploy + verifikacija

- [ ] **Step 1: Deploy**

Run: `vercel --prod` iz korena repo-a (produkcija ide ručno iz lokala, ne preko git-a). PostToolUse hook automatski pokreće smoke test — proveri da je prošao.

- [ ] **Step 2: Ručna verifikacija na produkciji**

1. `/admin/finansije?godina=2026&mesec=6` — nove kolone vidljive, „Ukupan saldo danas" se poklapa sa `/admin/obaveze` (otvori obe strane po profesorki).
2. Dugme je sivo na „Cela godina", aktivno na konkretnom mesecu.
3. NE klikati „Pošalji obračun" nasumično na produkciji — mejlovi idu pravim profesorkama. Za probu: pozvati cron rutu sa `?month=2026-06` na PREVIEW deploymentu, ili sačekati Natašinu odluku da pošalje.
4. CDN keš: proveri sa cache-busterom ako se izmene ne vide.

- [ ] **Step 3: Javi Nataši**

Ukratko: šta je novo na Finansijama, da mejl 1. u mesecu sada uključuje aktivnosti i isplate, i kako se koristi dugme.
