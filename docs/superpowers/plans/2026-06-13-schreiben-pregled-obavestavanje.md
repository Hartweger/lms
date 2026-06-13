# Schreiben pregled + obaveštavanje — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodati obaveštavanje na postojeći Schreiben tok — dnevni rezime profesoru/adminu o esejima koji čekaju pregled, mejl učeniku kad se objavi feedback, i osigurač za eseje koji čekaju 3+ dana.

**Architecture:** AI pregled i UI za pregled već postoje. Dodajemo: (1) čistu pomoćnu logiku grupisanja eseja po profesoru (`src/lib/essay-digest.ts`, jedino što se unit-testira), (2) novi dnevni cron `/api/cron/eseji-pregled` koji šalje rezime, (3) novu API rutu `/api/essays/publish` koja spaja upis statusa i mejl učeniku, (4) sekciju „3+ dana" u postojećem `jutarnji-pregled` cron-u. Email funkcije i cron-ovi se verifikuju preko `?test=`/`?dry=1` parametara i smoke testa (po obrascu projekta), ne unit-testovima.

**Tech Stack:** Next.js App Router, Supabase (service-role admin client + SSR cookie client), Resend (`src/lib/email.ts`), Vercel cron (`vercel.json`), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-13-schreiben-pregled-obavestavanje-design.md`

**Ključne činjenice iz koda (potvrđene):**
- `essay_submissions`: `id, user_id (auth.users), lesson_id, ai_feedback, ai_corrections, ai_score, professor_feedback, professor_score, status ('pending'|'reviewed'|'published'), submitted_at, reviewed_at`.
- `lessons.course_id` je direktan FK na `courses` — esej → lekcija → kurs bez modula.
- `professor_students(professor_id, student_id, course_id)` — „bez profa" = nema reda za (student_id, course_id).
- `user_profiles(id, full_name, email, role)`; role ∈ `student|professor|admin`.
- Email: `FROM = "Hartweger <kurs@hartweger.rs>"`, helperi `getResend()`, `esc()`, `SITE_URL`, `replyTo: "info@hartweger.rs"`. Admin brief ide na `["info@hartweger.rs", "natasa@hartweger.rs"]`.
- Cron auth: `Bearer ${process.env.CRON_SECRET}`. Staff API auth: obrazac `requireStaff()` iz `src/app/api/profesor/individualni-cas/route.ts`.
- `DailyBrief` tip i `sendDailyAdminBrief` su u `src/lib/email.ts`; sekcije se renderuju preko lokalnog `sekcija(naslov, telo, prazno)` helpera.

---

## File Structure

- **Create** `src/lib/essay-digest.ts` — čista logika: grupisanje eseja po profesoru + filter zakasnelih. Jedina jedinica koja se unit-testira.
- **Create** `src/lib/essay-digest.test.ts` — Vitest testovi za gornje.
- **Modify** `src/lib/email.ts` — dve nove funkcije (`sendPendingEssaysDigest`, `sendEssayFeedbackEmail`), proširenje `DailyBrief` tipa i `sendDailyAdminBrief` sekcijom za eseje 3+ dana.
- **Create** `src/app/api/cron/eseji-pregled/route.ts` — dnevni rezime.
- **Create** `src/app/api/essays/publish/route.ts` — objava + mejl učeniku.
- **Modify** `src/app/profesor/eseji/page.tsx` — `publishEssay` zove novu rutu.
- **Modify** `src/app/admin/eseji/page.tsx` — `publishEssay` zove novu rutu.
- **Modify** `src/app/api/cron/jutarnji-pregled/route.ts` — upit za eseje 3+ dana, popuni `brief.eseji3Dana`.
- **Modify** `vercel.json` — registruj `eseji-pregled` cron.

---

## Task 1: Čista logika grupisanja (`essay-digest.ts`)

**Files:**
- Create: `src/lib/essay-digest.ts`
- Test: `src/lib/essay-digest.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/essay-digest.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { groupEssaysForDigest, essaysOverdue, type DigestEssay, type Assignment } from "./essay-digest";

const e = (over: Partial<DigestEssay> = {}): DigestEssay => ({
  id: "e1", userId: "s1", courseId: "c1",
  studentName: "Ana", lessonTitle: "Schreiben Teil 1",
  submittedAt: "2026-06-10T08:00:00Z", ...over,
});

describe("groupEssaysForDigest", () => {
  it("eseje sa dodeljenim profom grupiše po professorId", () => {
    const essays = [e({ id: "e1", userId: "s1", courseId: "c1" }), e({ id: "e2", userId: "s1", courseId: "c1" })];
    const assignments: Assignment[] = [{ professorId: "p1", studentId: "s1", courseId: "c1" }];
    const r = groupEssaysForDigest(essays, assignments);
    expect(r.unassigned).toHaveLength(0);
    expect(r.byProfessor).toHaveLength(1);
    expect(r.byProfessor[0]).toMatchObject({ professorId: "p1" });
    expect(r.byProfessor[0].essays.map((x) => x.id)).toEqual(["e1", "e2"]);
  });

  it("esej bez reda u professor_students ide u unassigned", () => {
    const essays = [e({ id: "e1", userId: "s9", courseId: "c1" })];
    const r = groupEssaysForDigest(essays, []);
    expect(r.byProfessor).toHaveLength(0);
    expect(r.unassigned.map((x) => x.id)).toEqual(["e1"]);
  });

  it("match mora biti i po studentu i po kursu (prof za drugi kurs ne važi)", () => {
    const essays = [e({ id: "e1", userId: "s1", courseId: "cB" })];
    const assignments: Assignment[] = [{ professorId: "p1", studentId: "s1", courseId: "cA" }];
    const r = groupEssaysForDigest(essays, assignments);
    expect(r.unassigned.map((x) => x.id)).toEqual(["e1"]);
    expect(r.byProfessor).toHaveLength(0);
  });
});

describe("essaysOverdue", () => {
  const now = new Date("2026-06-13T05:00:00Z").getTime();
  it("vraća eseje starije od N dana", () => {
    const essays = [
      e({ id: "old", submittedAt: "2026-06-09T05:00:00Z" }), // 4 dana
      e({ id: "new", submittedAt: "2026-06-12T05:00:00Z" }), // 1 dan
    ];
    const r = essaysOverdue(essays, now, 3);
    expect(r.map((x) => x.id)).toEqual(["old"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/essay-digest.test.ts`
Expected: FAIL — `Cannot find module './essay-digest'`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/essay-digest.ts`:

```ts
// Čista logika za dnevni rezime Schreiben-a. Bez I/O — sve zavisnosti se prosleđuju.

export type DigestEssay = {
  id: string;
  userId: string;       // učenik (auth.users.id)
  courseId: string;     // izveden iz lesson.course_id
  studentName: string;
  lessonTitle: string;
  submittedAt: string;  // ISO
};

export type Assignment = {
  professorId: string;
  studentId: string;
  courseId: string;
};

export type ProfessorGroup = { professorId: string; essays: DigestEssay[] };

export type DigestGrouping = {
  byProfessor: ProfessorGroup[];
  unassigned: DigestEssay[];
};

// Grupiše pending eseje: oni čiji (student, kurs) ima reda u professor_students idu pod tog profa,
// ostali (npr. samostalni video kursevi bez profa) idu u `unassigned` → adminu.
export function groupEssaysForDigest(essays: DigestEssay[], assignments: Assignment[]): DigestGrouping {
  const profByKey = new Map<string, string>(); // `${studentId}|${courseId}` → professorId
  for (const a of assignments) {
    profByKey.set(`${a.studentId}|${a.courseId}`, a.professorId);
  }

  const groups = new Map<string, DigestEssay[]>();
  const unassigned: DigestEssay[] = [];

  for (const essay of essays) {
    const professorId = profByKey.get(`${essay.userId}|${essay.courseId}`);
    if (!professorId) {
      unassigned.push(essay);
      continue;
    }
    const list = groups.get(professorId) ?? [];
    list.push(essay);
    groups.set(professorId, list);
  }

  return {
    byProfessor: [...groups.entries()].map(([professorId, list]) => ({ professorId, essays: list })),
    unassigned,
  };
}

// Eseji koji čekaju ≥ `days` dana (za osigurač u jutarnjem pregledu).
export function essaysOverdue<T extends { submittedAt: string }>(essays: T[], nowMs: number, days: number): T[] {
  const cutoff = nowMs - days * 86400000;
  return essays.filter((e) => new Date(e.submittedAt).getTime() <= cutoff);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/essay-digest.test.ts`
Expected: PASS (4 testa).

- [ ] **Step 5: Commit**

```bash
git add src/lib/essay-digest.ts src/lib/essay-digest.test.ts
git commit -m "feat(eseji): čista logika grupisanja eseja za dnevni rezime"
```

---

## Task 2: Email funkcije (`sendPendingEssaysDigest`, `sendEssayFeedbackEmail`)

**Files:**
- Modify: `src/lib/email.ts` (dodati dve funkcije; obrazac kao `sendReviewRequest` na vrhu fajla)

Napomena: email funkcije se NE unit-testiraju (kao ni ostale u `email.ts`) — verifikuju se preko cron `?test=` (Task 3) i ručnog poziva (Task 4). Prate isti `try/getResend()/return` obrazac da pad jednog mejla ne ruši pozivaoca.

- [ ] **Step 1: Dodati `sendPendingEssaysDigest` u `src/lib/email.ts`**

Dodati pre kraja fajla (uz ostale `export async function send...`). Koristi postojeće `FROM`, `esc`, `SITE_URL`, `getResend`:

```ts
// Dnevni rezime: koliko Schreiben-a čeka pregled. Šalje se profesoru (njegovi učenici)
// ili adminu (eseji bez dodeljenog profa). `link` vodi na odgovarajuću stranicu za pregled.
export async function sendPendingEssaysDigest(o: {
  to: string;
  recipientName: string;
  essays: { studentName: string; lessonTitle: string; submittedAt: string }[];
  forAdmin: boolean;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    if (o.essays.length === 0) return;

    const link = o.forAdmin ? `${SITE_URL}/admin/eseji` : `${SITE_URL}/profesor/eseji`;
    const n = o.essays.length;
    const naslov = o.forAdmin
      ? `${n} Schreiben-a bez profesora čeka pregled`
      : `Imaš ${n} ${n === 1 ? "Schreiben" : "Schreiben-a"} za pregled`;
    const fmtDan = (v: string) =>
      new Date(v).toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" });

    const redovi = o.essays
      .map(
        (e) =>
          `<tr><td style="padding:6px 8px">${esc(e.studentName)}</td><td style="padding:6px 8px">${esc(
            e.lessonTitle
          )}</td><td style="padding:6px 8px;text-align:right;color:#888">${esc(fmtDan(e.submittedAt))}</td></tr>`
      )
      .join("");

    await resend.emails.send({
      from: FROM,
      to: o.to,
      replyTo: "info@hartweger.rs",
      subject: `📝 ${naslov}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="font-size:19px;margin:0 0 12px;">Zdravo, ${esc(o.recipientName || "")}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">${esc(naslov)}. Pregled počinje od AI provere koja je već urađena — ti samo dodaš svoj komentar i ocenu i objaviš.</p>
      <table style="border-collapse:collapse;font-size:14px;width:100%;margin:0 0 8px;">
        <thead><tr style="background:#f5f5f5"><th style="padding:6px 8px;text-align:left">Učenik</th><th style="padding:6px 8px;text-align:left">Lekcija</th><th style="padding:6px 8px;text-align:right">Poslato</th></tr></thead>
        <tbody>${redovi}</tbody>
      </table>
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${link}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Otvori pregled</a>
      </div>
      <p style="font-size:13px;color:#888;margin:12px 0 0;">Hartweger tim</p>
    </div>
  </div>
</body></html>`,
    });
    console.log(`[email] Rezime eseja (${o.essays.length}) → ${o.to}`);
  } catch (e) {
    console.error(`[email] sendPendingEssaysDigest pao za ${o.to}:`, e);
  }
}
```

- [ ] **Step 2: Dodati `sendEssayFeedbackEmail` u `src/lib/email.ts`**

Odmah ispod prethodne:

```ts
// Učeniku kad profesor/admin objavi pregled njegovog Schreiben-a.
export async function sendEssayFeedbackEmail(o: {
  to: string;
  studentName: string;
  lessonTitle: string;
  lessonId: string;
  score: number | null;
  feedback: string | null;
}) {
  try {
    const resend = getResend();
    if (!resend) return;

    const labels: Record<number, string> = {
      1: "Treba još vežbe",
      2: "Solidno, ali ima prostora",
      3: "Dobro",
      4: "Vrlo dobro",
      5: "Odlično!",
    };
    const ocenaHtml =
      o.score != null
        ? `<p style="font-size:15px;margin:0 0 12px;color:#1a1a2e;"><strong>Ocena:</strong> ${"★".repeat(o.score)}${"☆".repeat(5 - o.score)} — ${esc(labels[o.score] ?? "")}</p>`
        : "";
    const komentarHtml = o.feedback
      ? `<div style="background:#f8fcfd;border-radius:8px;padding:14px 16px;margin:0 0 16px;font-size:15px;line-height:1.6;color:#333;">${esc(o.feedback)}</div>`
      : "";

    await resend.emails.send({
      from: FROM,
      to: o.to,
      replyTo: "info@hartweger.rs",
      subject: "📝 Tvoj Schreiben je pregledan",
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:20px;"><img src="https://hartweger.rs/logo.jpg" alt="Hartweger" style="width:120px;height:auto;"/></div>
      <h1 style="font-size:20px;margin:0 0 12px;">Zdravo, ${esc(o.studentName || "")}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">Tvoj profesor je pregledao Schreiben iz lekcije <strong>${esc(o.lessonTitle)}</strong>.</p>
      ${ocenaHtml}
      ${komentarHtml}
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${SITE_URL}/lekcija/${esc(o.lessonId)}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Pogledaj feedback</a>
      </div>
      <p style="font-size:14px;color:#444;margin:12px 0 0;">Samo nastavi ovako! — Hartweger tim</p>
    </div>
  </div>
</body></html>`,
    });
    console.log(`[email] Feedback eseja → ${o.to}`);
  } catch (e) {
    console.error(`[email] sendEssayFeedbackEmail pao za ${o.to}:`, e);
  }
}
```

- [ ] **Step 3: Provera tipova/builda**

Run: `npx tsc --noEmit`
Expected: bez novih grešaka u `src/lib/email.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat(eseji): email funkcije za dnevni rezime i feedback učeniku"
```

---

## Task 3: Dnevni cron `/api/cron/eseji-pregled`

**Files:**
- Create: `src/app/api/cron/eseji-pregled/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Kreirati rutu**

Create `src/app/api/cron/eseji-pregled/route.ts`:

```ts
// Dnevni cron: rezime Schreiben-a koji čekaju pregled.
// - eseji čiji (učenik, kurs) ima profesora → mejl tom profesoru
// - eseji bez profesora (samostalni video kursevi) → mejl adminu (Nataši)
// Zaštita: Bearer CRON_SECRET. Test: ?test=mejl (pošalje admin-rezime na taj mejl), ?dry=1 (samo brojevi).
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { groupEssaysForDigest, type DigestEssay, type Assignment } from "@/lib/essay-digest";
import { sendPendingEssaysDigest } from "@/lib/email";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = "info@hartweger.rs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dry") === "1";
  const testEmail = searchParams.get("test");

  const authHeader = request.headers.get("authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!isCron && !testEmail && !dryRun) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Pending eseji + učenik + lekcija (radi course_id i naslova).
  const { data: rows } = await admin
    .from("essay_submissions")
    .select("id, user_id, submitted_at, user_profiles(full_name, email), lessons(title, course_id)")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  const one = <T,>(x: T | T[] | null | undefined): T | null =>
    Array.isArray(x) ? (x[0] ?? null) : (x ?? null);

  const essays: DigestEssay[] = (rows ?? []).map((r) => {
    const up = one(r.user_profiles as { full_name: string | null; email: string | null } | null);
    const ls = one(r.lessons as { title: string | null; course_id: string } | null);
    return {
      id: r.id as string,
      userId: r.user_id as string,
      courseId: (ls?.course_id as string) ?? "",
      studentName: up?.full_name ?? "Učenik",
      lessonTitle: ls?.title ?? "Schreiben",
      submittedAt: r.submitted_at as string,
    };
  });

  // Sve dodele prof↔učenik↔kurs.
  const { data: assignRows } = await admin
    .from("professor_students")
    .select("professor_id, student_id, course_id");
  const assignments: Assignment[] = (assignRows ?? []).map((a) => ({
    professorId: a.professor_id as string,
    studentId: a.student_id as string,
    courseId: a.course_id as string,
  }));

  const { byProfessor, unassigned } = groupEssaysForDigest(essays, assignments);

  if (dryRun) {
    return NextResponse.json({
      dry: true,
      profesori: byProfessor.map((g) => ({ professorId: g.professorId, broj: g.essays.length })),
      bezProfa: unassigned.length,
    });
  }

  // Test: pošalji samo admin-rezime (bez profa) na test mejl.
  if (testEmail) {
    await sendPendingEssaysDigest({
      to: testEmail,
      recipientName: "Test",
      essays: unassigned.map((e) => ({ studentName: e.studentName, lessonTitle: e.lessonTitle, submittedAt: e.submittedAt })),
      forAdmin: true,
    });
    return NextResponse.json({ test: testEmail, bezProfa: unassigned.length });
  }

  // Profesorima — svakom svoji.
  let poslato = 0;
  for (const grupa of byProfessor) {
    const { data: prof } = await admin
      .from("user_profiles")
      .select("full_name, email")
      .eq("id", grupa.professorId)
      .single();
    if (!prof?.email) continue;
    await sendPendingEssaysDigest({
      to: prof.email,
      recipientName: prof.full_name ?? "",
      essays: grupa.essays.map((e) => ({ studentName: e.studentName, lessonTitle: e.lessonTitle, submittedAt: e.submittedAt })),
      forAdmin: false,
    });
    poslato++;
  }

  // Adminu — eseji bez profa.
  if (unassigned.length > 0) {
    await sendPendingEssaysDigest({
      to: ADMIN_EMAILS,
      recipientName: "Nataša",
      essays: unassigned.map((e) => ({ studentName: e.studentName, lessonTitle: e.lessonTitle, submittedAt: e.submittedAt })),
      forAdmin: true,
    });
    poslato++;
  }

  console.log("[cron/eseji-pregled] poslato rezimea:", poslato, "| profa:", byProfessor.length, "| bez profa:", unassigned.length);
  return NextResponse.json({ ok: true, poslato, profesori: byProfessor.length, bezProfa: unassigned.length });
}
```

- [ ] **Step 2: Provera tipova**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Registrovati cron u `vercel.json`**

U `vercel.json`, u niz `"crons"`, dodati novi unos (npr. posle `review-request`):

```json
    {
      "path": "/api/cron/eseji-pregled",
      "schedule": "0 7 * * *"
    },
```

(7:00 UTC; odvojeno od `jutarnji-pregled` u 5:00 i `review-request` u 12:00.)

- [ ] **Step 4: Lokalna dry provera (ako je dev baza dostupna)**

Run: `curl -s "http://localhost:3000/api/cron/eseji-pregled?dry=1"`
Expected: JSON `{ "dry": true, "profesori": [...], "bezProfa": N }` bez slanja mejlova.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cron/eseji-pregled/route.ts vercel.json
git commit -m "feat(eseji): dnevni cron rezime za pregled (prof svoje, admin bez profa)"
```

---

## Task 4: Publish ruta + povezivanje UI (`/api/essays/publish`)

**Files:**
- Create: `src/app/api/essays/publish/route.ts`
- Modify: `src/app/profesor/eseji/page.tsx` (`publishEssay`)
- Modify: `src/app/admin/eseji/page.tsx` (`publishEssay`)

- [ ] **Step 1: Kreirati rutu**

Create `src/app/api/essays/publish/route.ts`:

```ts
// Objava pregledanog Schreiben-a + mejl učeniku, u jednom koraku (Resend ključ je samo na serveru).
// Profesor sme samo svoje učenike; admin sve.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEssayFeedbackEmail } from "@/lib/email";

async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "professor" && profile?.role !== "admin") return null;
  return { admin, userId: user.id, isAdmin: profile.role === "admin" };
}

const one = <T,>(x: T | T[] | null | undefined): T | null =>
  Array.isArray(x) ? (x[0] ?? null) : (x ?? null);

export async function POST(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { essayId, professorFeedback, professorScore } = await request.json();
  if (!essayId) return NextResponse.json({ error: "essayId je obavezan" }, { status: 400 });
  if (typeof professorScore !== "number" || professorScore < 1 || professorScore > 5) {
    return NextResponse.json({ error: "professorScore mora biti 1-5" }, { status: 400 });
  }

  const { admin, userId, isAdmin } = staff;

  // Učitaj esej + učenika + lekciju.
  const { data: essay } = await admin
    .from("essay_submissions")
    .select("id, user_id, lesson_id, user_profiles(full_name, email), lessons(title, course_id)")
    .eq("id", essayId)
    .single();
  if (!essay) return NextResponse.json({ error: "Esej nije pronađen" }, { status: 404 });

  const student = one(essay.user_profiles as { full_name: string | null; email: string | null } | null);
  const lesson = one(essay.lessons as { title: string | null; course_id: string } | null);

  // Profesor sme samo ako mu je taj (učenik, kurs) dodeljen.
  if (!isAdmin) {
    const { data: link } = await admin
      .from("professor_students")
      .select("id")
      .eq("professor_id", userId)
      .eq("student_id", essay.user_id as string)
      .eq("course_id", (lesson?.course_id as string) ?? "")
      .maybeSingle();
    if (!link) return NextResponse.json({ error: "Nije tvoj učenik" }, { status: 403 });
  }

  // Upis (prioritet — ovo mora da prođe).
  const { error: updErr } = await admin
    .from("essay_submissions")
    .update({
      professor_feedback: professorFeedback ?? null,
      professor_score: professorScore,
      status: "published",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", essayId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Mejl učeniku (best-effort — pad mejla ne ruši objavu).
  if (student?.email) {
    await sendEssayFeedbackEmail({
      to: student.email,
      studentName: student.full_name ?? "",
      lessonTitle: lesson?.title ?? "Schreiben",
      lessonId: essay.lesson_id as string,
      score: professorScore,
      feedback: professorFeedback ?? null,
    });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Povezati `profesor/eseji` na rutu**

U `src/app/profesor/eseji/page.tsx`, zameniti telo `publishEssay` (trenutno radi `supabase.from("essay_submissions").update(...)`) ovim:

```ts
  const publishEssay = async (essayId: string) => {
    setSaving(true);
    const res = await fetch("/api/essays/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ essayId, professorFeedback: profFeedback, professorScore: profScore }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert("Greška pri objavi: " + (j.error ?? res.status));
      setSaving(false);
      return;
    }

    setEssays(essays.map(e =>
      e.id === essayId
        ? { ...e, professor_feedback: profFeedback, professor_score: profScore, status: "published" as const, reviewed_at: new Date().toISOString() }
        : e
    ));
    setEditingId(null);
    setSaving(false);
  };
```

- [ ] **Step 3: Povezati `admin/eseji` na rutu**

U `src/app/admin/eseji/page.tsx`, identično zameniti telo `publishEssay` (isti `fetch` na `/api/essays/publish`, ista obrada greške i lokalni `setEssays(...)` kao u Step 2).

- [ ] **Step 4: Provera tipova**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/essays/publish/route.ts src/app/profesor/eseji/page.tsx src/app/admin/eseji/page.tsx
git commit -m "feat(eseji): objava preko API rute + mejl učeniku (prof/admin)"
```

---

## Task 5: Osigurač — eseji 3+ dana u jutarnjem pregledu

**Files:**
- Modify: `src/lib/email.ts` (`DailyBrief` tip + sekcija u `sendDailyAdminBrief`)
- Modify: `src/app/api/cron/jutarnji-pregled/route.ts`

- [ ] **Step 1: Proširiti `DailyBrief` tip u `src/lib/email.ts`**

U `export type DailyBrief = { ... }` dodati novo polje (posle `bounces`):

```ts
  eseji3Dana?: { ime: string; profesor: string; lekcija: string; danaStaro: number }[];
```

- [ ] **Step 2: Renderovati sekciju u `sendDailyAdminBrief`**

U `sendDailyAdminBrief`, pored postojećih `*Html` konstanti, dodati:

```ts
    const eseji3Html = (d.eseji3Dana?.length ?? 0)
      ? `<table style="border-collapse:collapse;font-size:13px;width:100%">
<thead><tr style="background:#f5f5f5"><th style="padding:4px 8px;text-align:left">Učenik</th><th style="padding:4px 8px;text-align:left">Profesor</th><th style="padding:4px 8px;text-align:left">Lekcija</th><th style="padding:4px 8px;text-align:right">dana</th></tr></thead>
<tbody>${d.eseji3Dana!.map((r) => `<tr><td style="padding:4px 8px">${esc(r.ime)}</td><td style="padding:4px 8px">${esc(r.profesor)}</td><td style="padding:4px 8px">${esc(r.lekcija)}</td><td style="padding:4px 8px;text-align:right">${r.danaStaro}</td></tr>`).join("")}</tbody></table>`
      : "";
```

I u HTML telu, posle `grupeKraj` sekcije (pre `bounces`), dodati:

```ts
${sekcija(`📝 Schreiben-i koji čekaju 3+ dana (${d.eseji3Dana?.length ?? 0})`, eseji3Html, "Nema zaostalih eseja.")}
```

- [ ] **Step 3: Popuniti `eseji3Dana` u `jutarnji-pregled` cron-u**

U `src/app/api/cron/jutarnji-pregled/route.ts`, pre kreiranja `const brief: DailyBrief = {...}`, dodati upit i mapiranje (koristi postojeći `admin`, `one`, `now`):

```ts
  // Schreiben-i koji čekaju pregled 3+ dana (osigurač).
  const tri = new Date(now.getTime() - 3 * 86400000).toISOString();
  const { data: esejiRows } = await admin
    .from("essay_submissions")
    .select("submitted_at, user_id, user_profiles(full_name), lessons(title, course_id)")
    .eq("status", "pending")
    .lte("submitted_at", tri)
    .order("submitted_at", { ascending: true });

  const { data: profStud } = await admin
    .from("professor_students")
    .select("student_id, course_id, user_profiles!professor_students_professor_id_fkey(full_name)");
  const profByKey = new Map<string, string>();
  for (const a of profStud ?? []) {
    const p = one((a as { user_profiles: { full_name: string | null } | { full_name: string | null }[] }).user_profiles);
    profByKey.set(`${a.student_id}|${a.course_id}`, p?.full_name ?? "");
  }

  const eseji3Dana = (esejiRows ?? []).map((r) => {
    const up = one(r.user_profiles as { full_name: string | null } | null);
    const ls = one(r.lessons as { title: string | null; course_id: string } | null);
    const prof = profByKey.get(`${r.user_id}|${ls?.course_id ?? ""}`);
    const danaStaro = Math.floor((now.getTime() - new Date(r.submitted_at as string).getTime()) / 86400000);
    return {
      ime: up?.full_name ?? "Učenik",
      profesor: prof || "— bez profa",
      lekcija: ls?.title ?? "Schreiben",
      danaStaro,
    };
  });
```

Zatim u objektu `brief` dodati polje:

```ts
    eseji3Dana,
```

Napomena: ako naziv FK constraint-a `professor_students_professor_id_fkey` ne odgovara, zameniti embeded join eksplicitnim drugim upitom: učitati `professor_id`-jeve pa `user_profiles` po njima. (Proveriti naziv: `grep -n "professor_id" supabase/migrations/014_professor_students.sql`.)

- [ ] **Step 4: Provera tipova**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 5: Lokalna provera (ako je dostupno)**

Run: `curl -s -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/jutarnji-pregled"`
Expected: 200; u logu se vidi da je pregled poslat; sekcija eseja se pojavi u mejlu kad ima zaostalih.

- [ ] **Step 6: Commit**

```bash
git add src/lib/email.ts src/app/api/cron/jutarnji-pregled/route.ts
git commit -m "feat(eseji): osigurač — eseji 3+ dana u jutarnjem pregledu"
```

---

## Task 6: Finalna verifikacija (build, testovi, deploy, smoke)

**Files:** nijedan (verifikacija)

- [ ] **Step 1: Svi testovi**

Run: `npm run test`
Expected: PASS (uključujući nove `essay-digest` testove).

- [ ] **Step 2: Tipovi + lint build**

Run: `npx tsc --noEmit && npm run build`
Expected: build prolazi bez grešaka.

- [ ] **Step 3: Deploy na produkciju**

Run: `vercel --prod` (po pravilu projekta — produkcija ide ručno iz lokala).
Posle deploya PostToolUse hook automatski pokreće smoke-deploy (gađa `/lekcija/[id]`).

- [ ] **Step 4: Dry provera crona na produkciji**

Run: `curl -s "https://www.hartweger.rs/api/cron/eseji-pregled?dry=1"`
Expected: JSON sa brojevima (`profesori`, `bezProfa`), bez slanja mejlova.

- [ ] **Step 5: Test mejla rezimea**

Run: `curl -s "https://www.hartweger.rs/api/cron/eseji-pregled?test=info@hartweger.rs"`
Expected: stigne probni admin-rezime na info@; vizuelno proveriti izgled.

- [ ] **Step 6: Ručni test objave (UI)**

Prijaviti se kao profesor (ili admin), otvoriti `/profesor/eseji` (`/admin/eseji`), pregledati jedan pending esej i kliknuti „Objavi studentu". Proveriti: status pređe u „Objavljeno" i učenik dobije mejl „Tvoj Schreiben je pregledan".

---

## Self-Review (popunjeno)

- **Spec coverage:** Deo 1 (dnevni rezime) → Task 1+2+3. Deo 2 (mejl učeniku) → Task 2+4. Deo 3 (osigurač 3+ dana) → Task 5. „Bez profa → adminu" → Task 1 (`unassigned`) + Task 3. Sve pokriveno.
- **Placeholder scan:** Nema TBD/„handle errors" bez koda; svaki korak ima konkretan kod/komandu. Jedini uslovni korak (naziv FK u Task 5 Step 3) ima eksplicitan fallback.
- **Type consistency:** `DigestEssay`/`Assignment`/`DigestGrouping` isti u libu, testu i cron-u. `sendPendingEssaysDigest`/`sendEssayFeedbackEmail` potpisi isti na deklaraciji i pozivima. `DailyBrief.eseji3Dana` polje isto u tipu, renderu i cron-u.
