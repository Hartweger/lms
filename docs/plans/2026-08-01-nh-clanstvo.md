# NH Membership (Članstvo) — plan izgradnje

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Cilj:** Mesečno članstvo "NH Membership" na postojećoj platformi: pretplatnički proizvod (2.290 RSD ≈ 19€ founding → kasnije 3.490 RSD ≈ 29€), biblioteka lekcija koja raste, chat zajednica, profil + imenik članica — sve u posebnoj `/clanstvo` sekciji sa NH vizuelnim identitetom (bez navigacije jezičke škole).

**Arhitektura:** Novi pretplatnički proizvod se kači na POSTOJEĆU mašineriju (NestPay recurring + `subscriptions` + dnevni `subscriptions-poll` cron + `grant-access` sa `expires_at = naplata + 1 mesec + 7 dana` → prestanak plaćanja sam gasi pristup). Novo se gradi samo: `/clanstvo` sekcija sa svojim layoutom, `member_profiles` tabela + imenik, chat (`chat_kanali` + `chat_poruke`, Supabase Realtime — prvi put u projektu). Sav pristup (lekcije, chat, imenik) se gejtuje kroz RLS na osnovu aktivnog `course_access` na sadržajni kurs članstva.

**Tech stack:** Next.js 16 App Router (PAŽNJA: `AGENTS.md` — pročitaj `node_modules/next/dist/docs/` pre rada na rutama/layoutima; middleware je `src/proxy.ts` sa `proxy()`), Supabase (RLS + Realtime), Tailwind v4 (CSS-first `@theme` u `globals.css` — `tailwind.config.ts` je zastareo, NE dirati), Vitest (testovi SAMO za čiste funkcije, pored modula, imena na srpskom), NestPay recurring, Resend mejlovi.

**Koncept:** `/Users/natasahartweger/Documents/Claude/NH/membership-koncept.md`
**Postojeće istraživanje:** `docs/ideje/2026-06-18-membership-pretplata-recurring.md`

---

## Ključne odluke (obrazloženje)

1. **Slugovi:** proizvod `nh-clanstvo` (is_purchasable), sadržajni kurs `nh-clanstvo-sadrzaj` (drži lekcije). Nova kategorija `membership` — namerno NIJE `mesecni` jer `kupovina/[slug]/page.tsx` za kategorije `individualni|paket|mesecni` učitava `product_variants` (profesore), što članstvu ne treba.
2. **`totalPayments: 121`** (maksimum banke, greška CORE-2029 iznad) = "do otkazivanja". Founding članice automatski zauvek zadržavaju 19€: banka zaključava iznos serije pri kreiranju (`subscriptions.amount` iz `order.total`), pa kasnija promena cene važi samo za nove pretplate.
3. **Jedan sadržajni kurs, ne drip po ratama:** `unlocks: [{installment: 1, ...}]` — svaka naplata produžava pristup CELOJ biblioteci (`unlockedSlugsAfter` uključuje installment 1 za svako n≥1, pa `grant-access.ts` svaki mesec produži `expires_at`). "Biblioteka raste" = Nataša mesečno dodaje lekcije kroz admin, ne kroz mehanizam otključavanja.
4. **Chat = direktan insert iz browsera + Realtime `postgres_changes`**, bez API rute — RLS je jedina kapija (obrazac iz `067`: poruke nasleđuju vidljivost kanala; logika članstva stoji na JEDNOM mestu, na `chat_kanali`).
5. **Bez fotografija na profilu u v1** (izbegavamo Supabase Storage setup) — inicijali u krugu. Fotografije = backlog.
6. **Lekcije se otvaraju kroz postojeći `/lekcija/[id]`** (školski header se vidi na toj stranici — svesni kompromis v1, backlog: NH omot za lekcije).
7. **NH boje** (iz brend reference): pink `#c94f6d`, pink-light `#f0d8e3`, pink-bg `#fdf5f7`, cream `#faf9f6`, dark `#1a1a1a`.

## Preduslovi — proveriti PRE početka (Nataša)

- [ ] **Banka:** za produkciju recurring-a banka traži da checkout jasno prikaže iznos/frekvenciju/maksimalan broj naplata + uslove otkazivanja u Uslovima korišćenja (nalaz iz `docs/ideje/2026-06-18-…`). Task 3 dodaje taj tekst na checkout; **Nataša treba da potvrdi sa bankom da je tekst prihvatljiv za novi proizvod** i da dopuni `/uslovi` stranicu.
- [ ] **Cena:** 2.290 RSD founding (≈19,5€), kasnije 3.490 RSD (≈29,8€) — potvrditi iznose.

---

### Task 1: Migracija 073 — proizvod, sadržajni kurs, unlock

**Files:**
- Create: `supabase/migrations/073_nh_clanstvo_proizvod.sql`

- [ ] **Step 1: Napiši migraciju**

```sql
-- NH Membership (koncept 1.8.2026, docs/plans/2026-08-01-nh-clanstvo.md).
-- Mesečno članstvo za edukatore: prodajni proizvod + sadržajni kurs + unlock.
-- Kategorija je 'membership' (NE 'mesecni' - ta kategorija na checkoutu
-- učitava product_variants sa profesorima, što članstvu ne treba).
-- Cena 2290 RSD = founding (~19€); pri prelasku na punu cenu menja se
-- courses.price + monthlyRsd u src/lib/subscription-plans.ts - postojeće
-- pretplate zadržavaju stari iznos jer banka zaključava seriju pri kreiranju.

insert into public.courses
  (title, slug, description, course_type, category, price, is_published, is_purchasable)
values
  ('NH Membership',
   'nh-clanstvo',
   'Mesečno članstvo za edukatorke: biblioteka lekcija o brendu, publici i rastu, nova lekcija svakog meseca, zajednica i direktan pristup Nataši.',
   'video', 'membership', 2290, true, true),
  ('NH Membership - biblioteka',
   'nh-clanstvo-sadrzaj',
   'Sadržajni kurs članstva - lekcije se dodaju svakog meseca.',
   'video', 'membership', 0, true, false)
on conflict (slug) do nothing;

insert into public.course_unlocks (purchasable_course_id, content_course_id)
select p.id, c.id
from public.courses p, public.courses c
where p.slug = 'nh-clanstvo' and c.slug = 'nh-clanstvo-sadrzaj'
on conflict (purchasable_course_id, content_course_id) do nothing;
```

- [ ] **Step 2: Primeni migraciju na Supabase** (kako se inače primenjuju u projektu — Supabase MCP `apply_migration` ili dashboard SQL editor; folder migracija se ne primenjuje automatski)

- [ ] **Step 3: Proveri**

SQL: `select slug, category, price, is_purchasable from courses where slug like 'nh-clanstvo%';` → 2 reda; `select count(*) from course_unlocks cu join courses p on p.id=cu.purchasable_course_id where p.slug='nh-clanstvo';` → 1.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/073_nh_clanstvo_proizvod.sql
git commit -m "NH Članstvo: proizvod, sadržajni kurs i unlock (migracija 073)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Pretplatnički plan + polje `tip`

**Files:**
- Modify: `src/lib/subscription-plans.ts`
- Test: `src/lib/subscription-plans.test.ts`

- [ ] **Step 1: Dodaj testove koji padaju** (na kraj postojećeg fajla; postojeća 2 invariant testa nad `SUBSCRIPTION_PLANS` automatski pokrivaju novi plan)

```ts
describe("nh-clanstvo plan", () => {
  it("nh-clanstvo postoji, tip je clanstvo, 121 naplata (maksimum banke)", () => {
    const plan = planForSlug("nh-clanstvo");
    expect(plan).not.toBeNull();
    expect(plan!.tip).toBe("clanstvo");
    expect(plan!.totalPayments).toBe(121);
    expect(plan!.monthlyRsd).toBe(2290);
  });

  it("svaka rata članstva otključava celu biblioteku (installment 1)", () => {
    const plan = planForSlug("nh-clanstvo")!;
    expect(unlockedSlugsAfter(plan, 1)).toEqual(["nh-clanstvo-sadrzaj"]);
    expect(unlockedSlugsAfter(plan, 57)).toEqual(["nh-clanstvo-sadrzaj"]);
  });

  it("postojeći paket nema tip, podrazumeva se paket", () => {
    expect(planForSlug("paket-a1-a2-b1")!.tip).toBeUndefined();
  });
});
```

- [ ] **Step 2: Pokreni** — `npx vitest run src/lib/subscription-plans.test.ts` → FAIL (`tip` ne postoji, plan ne postoji)

- [ ] **Step 3: Implementiraj** — u `SubscriptionPlan` interfejs dodaj:

```ts
  /**
   * "paket" (podrazumevano) = fiksan broj rata, postepeno otključavanje nivoa.
   * "clanstvo" = traje do otkazivanja; totalPayments je bankin maksimum (121),
   * ne obećanje broja naplata - checkout tekst se razlikuje (pretplata-opis.ts).
   */
  tip?: "paket" | "clanstvo";
```

i u `SUBSCRIPTION_PLANS` niz dodaj:

```ts
  // NH Membership (odluka 1.8.2026): članstvo do otkazivanja. 121 = bankin
  // maksimum naplata u seriji, svaka rata produžava pristup celoj biblioteci.
  {
    slug: "nh-clanstvo",
    monthlyRsd: 2290,
    totalPayments: 121,
    tip: "clanstvo",
    unlocks: [{ installment: 1, slug: "nh-clanstvo-sadrzaj" }],
  },
```

- [ ] **Step 4: Pokreni** — `npx vitest run src/lib/subscription-plans.test.ts` → PASS (uključujući postojeće invariant testove)

- [ ] **Step 5: Commit**

```bash
git add src/lib/subscription-plans.ts src/lib/subscription-plans.test.ts
git commit -m "NH Članstvo: pretplatnički plan nh-clanstvo sa tipom clanstvo

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Checkout — opis pretplate po tipu plana

Postojeći žuti okvir u `CheckoutForm.tsx` (~linije 473–520) ima tvrdo kodiran narativ za `paket-a1-a2-b1` ("A1.1 odmah, A1.2 uz 2. naplatu…") i računicu ukupnog iznosa — za članstvo je to pogrešno (121 × 2.290 kao "ukupno" je apsurd). Izdvajamo tekst u čistu funkciju.

**Files:**
- Create: `src/lib/pretplata-opis.ts`
- Test: `src/lib/pretplata-opis.test.ts`
- Modify: `src/app/kupovina/[slug]/CheckoutForm.tsx` (metoda ~432–470, žuti okvir ~473–520, `method` state linija 94)

- [ ] **Step 1: Test koji pada**

```ts
import { describe, it, expect } from "vitest";
import { pretplataOpis } from "./pretplata-opis";
import { planForSlug } from "./subscription-plans";

describe("pretplataOpis", () => {
  it("za članstvo: mesečna pretplata do otkazivanja, bez ukupnog zbira", () => {
    const o = pretplataOpis(planForSlug("nh-clanstvo")!, 2290);
    expect(o.naslov).toContain("Mesečna pretplata");
    const sve = o.stavke.join(" ");
    expect(sve).toContain("2.290");
    expect(sve).toContain("dok je pretplata aktivna");
    expect(sve).toContain("Moj nalog");
    // bankina obaveza: maksimalan broj naplata mora biti naveden
    expect(sve).toContain("121");
    // ne sme da prikazuje zbir kao obavezu
    expect(sve).not.toContain("277");
  });

  it("za paket: zadržava postojeći narativ sa ukupnim iznosom i otključavanjem", () => {
    const o = pretplataOpis(planForSlug("paket-a1-a2-b1")!, 29133);
    const sve = o.stavke.join(" ");
    expect(sve).toContain("38.388"); // 3.199 × 12
    expect(sve).toContain("A1.1");
  });
});
```

- [ ] **Step 2: Pokreni** — `npx vitest run src/lib/pretplata-opis.test.ts` → FAIL

- [ ] **Step 3: Implementiraj `src/lib/pretplata-opis.ts`**

```ts
// Tekst žutog okvira na checkoutu za mesečno plaćanje (EPM/banka: iznos,
// učestalost, maksimalan broj naplata i uslovi otkazivanja moraju biti
// prikazani PRE plaćanja). Čista funkcija radi testiranja - CheckoutForm
// samo renderuje rezultat.
import type { SubscriptionPlan } from "./subscription-plans";

export interface PretplataOpis {
  naslov: string;
  stavke: string[];
}

const rsd = (n: number) => n.toLocaleString("sr-RS");

export function pretplataOpis(plan: SubscriptionPlan, fullPrice: number): PretplataOpis {
  if (plan.tip === "clanstvo") {
    return {
      naslov: `Mesečna pretplata - ${rsd(plan.monthlyRsd)} RSD mesečno`,
      stavke: [
        `Danas plaćaš ${rsd(plan.monthlyRsd)} RSD, a zatim se isti iznos automatski naplaćuje jednom mesečno sa iste kartice.`,
        `Pristup sadržaju i zajednici važi dok je pretplata aktivna.`,
        `Pretplatu otkazuješ kad god želiš na stranici Moj nalog - bez otkaznog roka. Posle otkazivanja pristup traje do isteka plaćenog meseca.`,
        `Tehnički maksimum banke je 121 mesečna naplata u seriji; pretplata prestaje ranije čim je otkažeš.`,
        `Za svaku naplatu dobijaš potvrdu na mejl.`,
      ],
    };
  }
  // paket (postojeći narativ za paket-a1-a2-b1, prenet iz CheckoutForm)
  const ukupno = plan.monthlyRsd * plan.totalPayments;
  return {
    naslov: `Mesečno plaćanje - ${rsd(plan.monthlyRsd)} RSD mesečno`,
    stavke: [
      `Danas plaćaš ${rsd(plan.monthlyRsd)} RSD, a zatim se isti iznos automatski naplaćuje jednom mesečno, ukupno ${plan.totalPayments} puta (ukupno ${rsd(ukupno)} RSD; jednokratna kupovina: ${rsd(fullPrice)} RSD).`,
      `Nivoi se otključavaju postepeno: A1.1 odmah, A1.2 uz 2. naplatu, A2.1 uz 4., A2.2 uz 5., B1.1 uz 7. i B1.2 uz 8. naplatu.`,
      `Pristup važi dok pretplata teče; prestankom plaćanja pristup ističe.`,
      `Ovo NIJE isto što i plaćanje na rate karticom Banca Intesa - ne biraj "na rate" na stranici banke.`,
      `Pretplatu otkazuješ kad god želiš na stranici Moj nalog.`,
    ],
  };
}
```

NAPOMENA: pre pisanja uporedi tekst sa stvarnim postojećim tekstom u `CheckoutForm.tsx` (~473–520) i prenesi ga VERBATIM u granu za paket — ništa ne sme da se izgubi (bankina formulacija). Ako se stvarni tekst razlikuje od gornjeg, važi stvarni tekst, a test za paket prilagodi.

- [ ] **Step 4: Pokreni** — `npx vitest run src/lib/pretplata-opis.test.ts` → PASS

- [ ] **Step 5: Prepravi `CheckoutForm.tsx`**

1. Import: `import { pretplataOpis } from "@/lib/pretplata-opis";`
2. Žuti okvir: umesto tvrdo kodiranog teksta renderuj `pretplataOpis(pretplataPlan, discountedRsd ?? course.price)` — naslov + `<ul>` sa `stavke.map(...)`. Vizuelni stil okvira ostaje isti.
3. **Članstvo = samo pretplata:** kad je `pretplataPlan?.tip === "clanstvo"`, lista metoda plaćanja prikazuje SAMO `kartica_pretplata` (bez kartica/uplatnica/paypal), a inicijalni `method` state postavi na `"kartica_pretplata"`:

```ts
const jeClanstvo = pretplataPlan?.tip === "clanstvo";
const [method, setMethod] = useState<Method>(jeClanstvo ? "kartica_pretplata" : "kartica");
```

(anchor: linija 94 `method` state; lista metoda ~432–470 — postojeće opcije umotaj u `!jeClanstvo && ...`)

- [ ] **Step 6: Proveri build** — `npm run build` → bez grešaka. Ručno: `npm run dev`, otvori `/kupovina/nh-clanstvo` → vidi se samo mesečna opcija sa novim tekstom; otvori `/kupovina/paket-a1-a2-b1` → sve metode + stari tekst netaknut.

- [ ] **Step 7: Commit**

```bash
git add src/lib/pretplata-opis.ts src/lib/pretplata-opis.test.ts "src/app/kupovina/[slug]/CheckoutForm.tsx"
git commit -m "NH Članstvo: checkout opis pretplate po tipu plana, članstvo samo mesečno

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: `/api/orders` — zaštite za članstvo

Postojeća zaštita od duple kupovine (linije 262–282) gleda `course_access` na PROIZVODU — za članstvo se pristup upisuje na sadržajni kurs, pa ta zaštita nikad ne okida. Dodajemo: (a) članstvo se može platiti samo pretplatom, (b) blokada ako već postoji aktivna pretplata.

**Files:**
- Modify: `src/app/api/orders/route.ts` (posle postojeće provere na liniji ~253: `kartica_pretplata && !planForSlug → 400`)

- [ ] **Step 1: Dodaj provere** (odmah posle postojećeg guarda na ~253, pre provere postojećeg pristupa; `planForSlug` je već importovan)

```ts
    // Članstvo (tip "clanstvo") se plaća isključivo pretplatom - jednokratna
    // kupovina bi dala mesec dana pristupa po ceni rate, bez obnavljanja.
    const plan = planForSlug(course.slug);
    if (plan?.tip === "clanstvo" && paymentMethod !== "kartica_pretplata") {
      return NextResponse.json(
        { error: "Ovaj proizvod se plaća mesečnom pretplatom." },
        { status: 400 }
      );
    }

    // Dupla pretplata: za članstvo course_access pokazuje na sadržajni kurs,
    // pa postojeća provera pristupa na proizvodu ne hvata ovaj slučaj.
    if (paymentMethod === "kartica_pretplata" && plan) {
      const { data: postojeciUser } = await admin
        .from("user_profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();
      if (postojeciUser) {
        const { data: aktivna } = await admin
          .from("subscriptions")
          .select("id")
          .eq("user_id", postojeciUser.id)
          .eq("course_id", course.id)
          .eq("status", "active")
          .maybeSingle();
        if (aktivna) {
          return NextResponse.json(
            { error: "Već imaš aktivnu mesečnu pretplatu na ovaj proizvod. Proveri stranicu Moj nalog." },
            { status: 400 }
          );
        }
      }
    }
```

NAPOMENA: uskladi način dohvatanja korisnika po mejlu sa onim kako to već radi postojeća provera na 262–282 (isti klijent, isto normalizovanje mejla) — kopiraj njihov obrazac.

- [ ] **Step 2: Proveri** — `npm run build`; ručno: pokušaj checkout `nh-clanstvo` sa metodom `uplatnica` kroz API (ili privremeno u UI) → 400.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "NH Članstvo: samo pretplata kao metod + blokada duple aktivne pretplate

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: `/clanstvo` sekcija — proxy, sakrivanje školske navigacije, NH layout

**Files:**
- Modify: `src/proxy.ts` (protectedRoutes linija ~?, matcher 78–86)
- Modify: `src/app/layout.tsx` (linije 111–112, PromoBar + Navigacija)
- Modify: `src/components/PromoBar.tsx` (SKRIVENA_NA, linije 24–36)
- Create: `src/components/SakrijNa.tsx`
- Create: `src/components/clanstvo/ClanstvoNav.tsx`
- Create: `src/app/clanstvo/layout.tsx`
- Create: `src/lib/clanstvo.ts`
- Modify: `src/app/globals.css` (`@theme` blok, linije 3–18)

- [ ] **Step 1: NH boje u `globals.css`** — u `@theme` dodaj:

```css
  /* NH Membership brend (clanstvo sekcija) */
  --color-nh-pink: #c94f6d;
  --color-nh-pink-light: #f0d8e3;
  --color-nh-pink-bg: #fdf5f7;
  --color-nh-cream: #faf9f6;
  --color-nh-dark: #1a1a1a;
```

- [ ] **Step 2: `src/proxy.ts`** — dodaj `"/clanstvo"` u `protectedRoutes` I u `config.matcher` (`"/clanstvo"`, `"/clanstvo/:path*"`). KRITIČNO: komentar na linijama 73–77 objašnjava da ruta koja nije u matcheru tiho desinhronizuje sesije (samo proxy sme da upiše osvežene auth kolačiće).

- [ ] **Step 3: `src/components/SakrijNa.tsx`** — klijentski omotač koji sakriva školski hrom na članskim rutama (isti obrazac kao PromoBar granica sa `+ "/"`):

```tsx
"use client";
// Sakriva decu (školski header) na zadatim prefiksima ruta. Server-rendered
// deca prolaze kroz klijentsku komponentu netaknuta - ovo ne pretvara
// Navigaciju u klijentsku komponentu.
import { usePathname } from "next/navigation";

export default function SakrijNa({
  prefiksi,
  children,
}: {
  prefiksi: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const sakrij = prefiksi.some(
    (p) => pathname === p || pathname?.startsWith(p + "/")
  );
  if (sakrij) return null;
  return <>{children}</>;
}
```

- [ ] **Step 4: `src/app/layout.tsx`** — umotaj `<Navigacija/>` (linija ~112): `<SakrijNa prefiksi={["/clanstvo"]}><Navigacija/></SakrijNa>`. U `PromoBar.tsx` dodaj `"/clanstvo"` u `SKRIVENA_NA`.

- [ ] **Step 5: `src/lib/clanstvo.ts`** — jedno mesto za konstante i proveru članstva:

```ts
// NH Membership - konstante i provera aktivnog članstva.
// Pristup = aktivan course_access na sadržajni kurs (RLS isto pravilo koristi
// u migracijama 074/075) ili admin. Provera ide kroz cookie-vezani klijent
// (vlastiti red se vidi kroz postojeću "Users can view own access" polisu).
import type { SupabaseClient } from "@supabase/supabase-js";

export const CLANSTVO_PRODUCT_SLUG = "nh-clanstvo";
export const CLANSTVO_CONTENT_SLUG = "nh-clanstvo-sadrzaj";

export async function jeAktivnaClanica(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profil } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (profil?.role === "admin") return true;

  const { data: kurs } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", CLANSTVO_CONTENT_SLUG)
    .single();
  if (!kurs) return false;

  const { data: pristup } = await supabase
    .from("course_access")
    .select("expires_at")
    .eq("user_id", userId)
    .eq("course_id", kurs.id)
    .maybeSingle();
  if (!pristup) return false;
  return pristup.expires_at === null || new Date(pristup.expires_at) > new Date();
}
```

- [ ] **Step 6: `src/app/clanstvo/layout.tsx`** — kopija obrasca iz `src/app/profesor/layout.tsx` (force-dynamic, auth, redirect), sa NH izgledom:

```tsx
// NH Membership sekcija - poseban vizuelni identitet, bez školske navigacije
// (root layout sakriva Navigaciju kroz SakrijNa). Obrazac: profesor/layout.tsx.
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { jeAktivnaClanica, CLANSTVO_PRODUCT_SLUG } from "@/lib/clanstvo";
import ClanstvoNav from "@/components/clanstvo/ClanstvoNav";

export const dynamic = "force-dynamic";

export default async function ClanstvoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prijava?next=/clanstvo");

  const clanica = await jeAktivnaClanica(supabase, user.id);
  if (!clanica) redirect(`/kupovina/${CLANSTVO_PRODUCT_SLUG}`);

  return (
    <div className="min-h-screen bg-nh-cream">
      <Suspense>
        <ClanstvoNav />
      </Suspense>
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
```

NAPOMENA: proveri da li `/prijava` podržava `?next=` povratak (login-link `isSafeNext` postoji); ako prijava ne prosleđuje `next`, koristi običan `redirect("/prijava")` — posle prijave članica ide na `/dashboard` pa ručno na `/clanstvo` (v1 kompromis, zabeleži u backlog).

- [ ] **Step 7: `src/components/clanstvo/ClanstvoNav.tsx`** — klijentska navigacija:

```tsx
"use client";
// Navigacija NH Membership sekcije. Aktivan link = pun pink; NH paleta iz
// globals.css @theme (nh-pink, nh-cream, nh-dark).
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKOVI = [
  { href: "/clanstvo", label: "Početna" },
  { href: "/clanstvo/biblioteka", label: "Biblioteka" },
  { href: "/clanstvo/zajednica", label: "Zajednica" },
  { href: "/clanstvo/clanice", label: "Članice" },
  { href: "/clanstvo/profil", label: "Moj profil" },
];

export default function ClanstvoNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-nh-pink-light bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/clanstvo" className="font-heading text-lg font-bold text-nh-dark">
          NH <span className="text-nh-pink">Membership</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {LINKOVI.map((l) => {
            const aktivan =
              pathname === l.href ||
              (l.href !== "/clanstvo" && pathname?.startsWith(l.href + "/"));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
                  aktivan
                    ? "bg-nh-pink text-white"
                    : "text-nh-dark hover:bg-nh-pink-bg"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/nalog"
            className="ml-2 whitespace-nowrap rounded-full border border-nh-pink-light px-3 py-1.5 text-sm text-nh-dark hover:bg-nh-pink-bg"
          >
            Moj nalog
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 8: Proveri** — `npm run build`; `npm run dev`: kao ne-članica otvori `/clanstvo` → redirect na `/kupovina/nh-clanstvo`; kao admin → vidi se NH nav bez školskog headera; `/dashboard` i dalje ima školski header.

- [ ] **Step 9: Commit**

```bash
git add src/proxy.ts src/app/layout.tsx src/components/PromoBar.tsx src/components/SakrijNa.tsx src/components/clanstvo/ClanstvoNav.tsx src/app/clanstvo/layout.tsx src/lib/clanstvo.ts src/app/globals.css
git commit -m "NH Članstvo: /clanstvo sekcija sa NH identitetom, proxy rute, sakrivanje školskog headera

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Početna i Biblioteka

**Files:**
- Create: `src/app/clanstvo/page.tsx`
- Create: `src/app/clanstvo/biblioteka/page.tsx`

- [ ] **Step 1: `src/app/clanstvo/page.tsx`** (server; layout je već proverio članstvo; RLS propušta lekcije jer članica ima `course_access`)

```tsx
// Početna članstva: pozdrav + najnovije lekcije + prečica u zajednicu.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CLANSTVO_CONTENT_SLUG } from "@/lib/clanstvo";

export const dynamic = "force-dynamic";

export default async function ClanstvoPocetna() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profil } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: kurs } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", CLANSTVO_CONTENT_SLUG)
    .single();

  const { data: lekcije } = await supabase
    .from("lessons")
    .select("id, title, created_at")
    .eq("course_id", kurs!.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const ime = (profil?.full_name ?? "").split(" ")[0] || "članice";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-nh-dark">
          Dobro došla, {ime} 💗
        </h1>
        <p className="mt-1 text-nh-dark/70">
          Tvoje članstvo je aktivno. Nove lekcije stižu svakog meseca.
        </p>
      </div>

      <section>
        <h2 className="font-heading text-xl font-bold text-nh-dark">Najnovije lekcije</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(lekcije ?? []).map((l) => (
            <Link
              key={l.id}
              href={`/lekcija/${l.id}`}
              className="rounded-xl border border-nh-pink-light bg-white p-4 hover:shadow-md"
            >
              <p className="font-semibold text-nh-dark">{l.title}</p>
            </Link>
          ))}
          {(lekcije ?? []).length === 0 && (
            <p className="text-nh-dark/60">Prve lekcije stižu uskoro.</p>
          )}
        </div>
        <Link href="/clanstvo/biblioteka" className="mt-3 inline-block text-sm font-semibold text-nh-pink">
          Cela biblioteka →
        </Link>
      </section>

      <section className="rounded-xl bg-nh-pink-bg p-6">
        <h2 className="font-heading text-xl font-bold text-nh-dark">Zajednica</h2>
        <p className="mt-1 text-nh-dark/70">
          Postavi pitanje ili podeli uspeh - Nataša odgovara svakog dana.
        </p>
        <Link
          href="/clanstvo/zajednica"
          className="mt-3 inline-block rounded-full bg-nh-pink px-5 py-2 font-semibold text-white"
        >
          Otvori chat
        </Link>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: `src/app/clanstvo/biblioteka/page.tsx`** — lista svih lekcija grupisana po modulima. Grupisanje po `module_name` koloni (GENERATED kolona iz migracije 060; fallback "Ostalo" kad je null), sortirano po `order_index`:

```tsx
// Biblioteka članstva: sve lekcije sadržajnog kursa grupisane po modulima
// (lessons.module_name - generisana kolona iz badge bloka, migracija 060).
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CLANSTVO_CONTENT_SLUG } from "@/lib/clanstvo";

export const dynamic = "force-dynamic";

export default async function Biblioteka() {
  const supabase = await createClient();
  const { data: kurs } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", CLANSTVO_CONTENT_SLUG)
    .single();

  const { data: lekcije } = await supabase
    .from("lessons")
    .select("id, title, order_index, module_name")
    .eq("course_id", kurs!.id)
    .order("order_index", { ascending: true });

  const grupe = new Map<string, { id: string; title: string }[]>();
  for (const l of lekcije ?? []) {
    const modul = l.module_name || "Lekcije";
    if (!grupe.has(modul)) grupe.set(modul, []);
    grupe.get(modul)!.push(l);
  }

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl font-bold text-nh-dark">Biblioteka</h1>
      {[...grupe.entries()].map(([modul, ls]) => (
        <section key={modul}>
          <h2 className="font-heading text-lg font-bold text-nh-pink">{modul}</h2>
          <ul className="mt-2 divide-y divide-nh-pink-light rounded-xl border border-nh-pink-light bg-white">
            {ls.map((l) => (
              <li key={l.id}>
                <Link href={`/lekcija/${l.id}`} className="block px-4 py-3 hover:bg-nh-pink-bg">
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {grupe.size === 0 && <p className="text-nh-dark/60">Prve lekcije stižu uskoro.</p>}
    </div>
  );
}
```

- [ ] **Step 3: Proveri** — `npm run dev`: kao admin dodaj probnu lekciju u `nh-clanstvo-sadrzaj` kroz admin panel, proveri da se vidi na `/clanstvo` i `/clanstvo/biblioteka` i da se otvara kroz `/lekcija/[id]`.

- [ ] **Step 4: Commit**

```bash
git add src/app/clanstvo/page.tsx src/app/clanstvo/biblioteka/page.tsx
git commit -m "NH Članstvo: početna i biblioteka

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Migracija 074 — profili članica

**Files:**
- Create: `supabase/migrations/074_member_profiles.sql`

- [ ] **Step 1: Napiši migraciju** (obrazac RLS: 033 za vlastiti red + EXISTS provera članstva; svesno razlikovanje od postojeće `clanice` tabele koja služi prijave sa drugog sajta i nema RLS polise)

```sql
-- Profili članica NH Membership - predstavljanje + imenik vidljiv SAMO
-- aktivnim članicama (i adminu). Vezano za auth.users, za razliku od
-- postojeće "clanice" tabele (prijave sa natasahartweger.rs, service-role only).
-- Aktivna članica = važeći course_access na nh-clanstvo-sadrzaj - isti uslov
-- koji RLS na lessons već koristi (026), pa se pristup gasi sam sa pretplatom.

create table public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ime text not null default '',
  delatnost text not null default '',   -- npr. "Profesorka nemačkog"
  bio text not null default '',
  instagram text not null default '',   -- korisničko ime bez @
  web text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.member_profiles enable row level security;

-- Jedan uslov članstva, korišćen u svim polisama ispod.
-- (Namerno funkcija: da se logika ne kopira u 075_chat polise.)
create or replace function public.je_aktivna_clanica(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_access ca
    join public.courses c on c.id = ca.course_id
    where ca.user_id = uid
      and c.slug = 'nh-clanstvo-sadrzaj'
      and (ca.expires_at is null or ca.expires_at > now())
  )
  or exists (
    select 1 from public.user_profiles up
    where up.id = uid and up.role = 'admin'
  );
$$;

create policy member_profiles_select_clanice
  on public.member_profiles for select
  using (public.je_aktivna_clanica(auth.uid()));

create policy member_profiles_insert_own
  on public.member_profiles for insert
  with check (auth.uid() = user_id and public.je_aktivna_clanica(auth.uid()));

create policy member_profiles_update_own
  on public.member_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Primeni migraciju** (isti kanal kao Task 1)

- [ ] **Step 3: Proveri** — kao članica (ili test nalog sa ručno ubačenim `course_access`): select nad `member_profiles` radi; kao običan student bez članstva: select vraća 0 redova, insert odbijen.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/074_member_profiles.sql
git commit -m "NH Članstvo: member_profiles + je_aktivna_clanica RLS funkcija (074)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Moj profil (forma)

**Files:**
- Create: `src/app/clanstvo/profil/page.tsx`

- [ ] **Step 1: Napiši stranicu** (klijentska, obrazac iz `src/app/profil/page.tsx` — direktan Supabase pristup iz browsera, RLS štiti):

```tsx
"use client";
// Profil članice: predstavljanje za imenik. Čuva se direktno kroz browser
// klijent - RLS (074) dozvoljava upsert samo vlastitog reda i samo članicama.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ClanstvoProfil() {
  const supabase = createClient();
  const [form, setForm] = useState({ ime: "", delatnost: "", bio: "", instagram: "", web: "" });
  const [poruka, setPoruka] = useState("");
  const [ucitava, setUcitava] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("member_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) setForm({ ime: data.ime, delatnost: data.delatnost, bio: data.bio, instagram: data.instagram, web: data.web });
      else {
        const { data: up } = await supabase
          .from("user_profiles").select("full_name").eq("id", user.id).single();
        if (up) setForm((f) => ({ ...f, ime: up.full_name }));
      }
      setUcitava(false);
    })();
  }, [supabase]);

  async function sacuvaj(e: React.FormEvent) {
    e.preventDefault();
    setPoruka("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("member_profiles").upsert({
      user_id: user.id, ...form, instagram: form.instagram.replace(/^@/, ""), updated_at: new Date().toISOString(),
    });
    setPoruka(error ? "Greška pri čuvanju. Pokušaj ponovo." : "Sačuvano ✓");
  }

  if (ucitava) return <p className="text-nh-dark/60">Učitavanje…</p>;

  const polje = "mt-1 w-full rounded-lg border border-nh-pink-light bg-white px-3 py-2";
  return (
    <div className="max-w-xl">
      <h1 className="font-heading text-3xl font-bold text-nh-dark">Moj profil</h1>
      <p className="mt-1 text-nh-dark/70">Ovako te vide ostale članice u imeniku.</p>
      <form onSubmit={sacuvaj} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-nh-dark">Ime i prezime
          <input className={polje} value={form.ime} onChange={(e) => setForm({ ...form, ime: e.target.value })} required />
        </label>
        <label className="block text-sm font-semibold text-nh-dark">Čime se baviš
          <input className={polje} value={form.delatnost} placeholder="npr. Profesorka nemačkog jezika" onChange={(e) => setForm({ ...form, delatnost: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold text-nh-dark">O meni
          <textarea className={polje} rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold text-nh-dark">Instagram (bez @)
          <input className={polje} value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold text-nh-dark">Sajt
          <input className={polje} value={form.web} placeholder="https://…" onChange={(e) => setForm({ ...form, web: e.target.value })} />
        </label>
        <button className="rounded-full bg-nh-pink px-6 py-2 font-semibold text-white">Sačuvaj</button>
        {poruka && <p className="text-sm text-nh-dark/70">{poruka}</p>}
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Proveri** — sačuvaj profil kao članica, osveži, podaci ostaju.

- [ ] **Step 3: Commit**

```bash
git add src/app/clanstvo/profil/page.tsx
git commit -m "NH Članstvo: forma Moj profil

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Imenik članica

**Files:**
- Create: `src/app/clanstvo/clanice/page.tsx`

- [ ] **Step 1: Napiši stranicu** (server; RLS već filtrira — vide samo članice):

```tsx
// Imenik članica - vidljiv samo aktivnim članicama (RLS 074). Inicijali
// umesto fotografija (v1 - bez Storage-a).
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function inicijali(ime: string): string {
  return ime.split(/\s+/).filter(Boolean).slice(0, 2).map((d) => d[0]?.toUpperCase()).join("");
}

export default async function Clanice() {
  const supabase = await createClient();
  const { data: clanice } = await supabase
    .from("member_profiles")
    .select("user_id, ime, delatnost, bio, instagram, web")
    .neq("ime", "")
    .order("ime", { ascending: true });

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-nh-dark">Članice</h1>
      <p className="mt-1 text-nh-dark/70">
        Upoznaj se i poveži - dopuni svoj profil da bi te ostale pronašle.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(clanice ?? []).map((c) => (
          <div key={c.user_id} className="rounded-xl border border-nh-pink-light bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-nh-pink-light font-heading font-bold text-nh-pink">
                {inicijali(c.ime)}
              </div>
              <div>
                <p className="font-semibold text-nh-dark">{c.ime}</p>
                {c.delatnost && <p className="text-sm text-nh-dark/60">{c.delatnost}</p>}
              </div>
            </div>
            {c.bio && <p className="mt-3 text-sm text-nh-dark/80">{c.bio}</p>}
            <div className="mt-3 flex gap-3 text-sm font-semibold text-nh-pink">
              {c.instagram && (
                <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              )}
              {c.web && (
                <a href={c.web.startsWith("http") ? c.web : `https://${c.web}`} target="_blank" rel="noopener noreferrer">
                  Sajt
                </a>
              )}
            </div>
          </div>
        ))}
        {(clanice ?? []).length === 0 && (
          <p className="text-nh-dark/60">Još nema popunjenih profila - budi prva!</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Proveri** — profil iz Taska 8 se vidi u imeniku; nalog bez članstva ne može do stranice (layout redirect) niti kroz API (RLS).

- [ ] **Step 3: Commit**

```bash
git add src/app/clanstvo/clanice/page.tsx
git commit -m "NH Članstvo: imenik članica

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Migracija 075 — chat + Realtime

**Files:**
- Create: `supabase/migrations/075_chat.sql`

- [ ] **Step 1: Napiši migraciju** (obrazac 067: poruke nasleđuju vidljivost kanala; `je_aktivna_clanica` iz 074; Realtime se prvi put uvodi u projekat)

```sql
-- Chat zajednice NH Membership. Vidljivost: samo aktivne članice (funkcija
-- je_aktivna_clanica iz 074) - pristup se gasi sam kad pretplata istekne.
-- Poruke NASLEĐUJU vidljivost kanala (obrazac 067): subquery na chat_kanali
-- radi pod RLS-om upitivača, pa logika članstva stoji na jednom mestu.
-- Realtime: prvi put u projektu - tabela poruka ide u supabase_realtime
-- publikaciju; postgres_changes poštuje RLS po pretplatniku.

create table public.chat_kanali (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  naziv text not null,
  opis text not null default '',
  samo_admin_pise boolean not null default false,
  sort int not null default 0
);

create table public.chat_poruke (
  id uuid primary key default gen_random_uuid(),
  kanal_id uuid not null references public.chat_kanali(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ime text not null,                 -- denormalizovano: bez join-a pri prikazu
  tekst text not null check (char_length(tekst) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index chat_poruke_kanal_idx on public.chat_poruke (kanal_id, created_at desc);

alter table public.chat_kanali enable row level security;
alter table public.chat_poruke enable row level security;

create policy chat_kanali_select_clanice
  on public.chat_kanali for select
  using (public.je_aktivna_clanica(auth.uid()));

-- Poruke: vidljivost nasleđena od kanala (067 obrazac).
create policy chat_poruke_select_kanal
  on public.chat_poruke for select
  using (exists (select 1 from public.chat_kanali k where k.id = chat_poruke.kanal_id));

-- Pisanje: svoj red + vidljiv kanal + poštuj samo_admin_pise (Novosti).
create policy chat_poruke_insert_own
  on public.chat_poruke for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chat_kanali k
      where k.id = chat_poruke.kanal_id
        and (
          not k.samo_admin_pise
          or (select role from public.user_profiles where id = auth.uid()) = 'admin'
        )
    )
  );

-- Admin briše neprimerene poruke (kroz service-role ili direktno).
create policy chat_poruke_delete_admin
  on public.chat_poruke for delete
  using ((select role from public.user_profiles where id = auth.uid()) = 'admin');

insert into public.chat_kanali (slug, naziv, opis, samo_admin_pise, sort) values
  ('novosti',  'Novosti',          'Nove lekcije, AI promptovi i najave - objavljuje Nataša.', true,  0),
  ('pitanja',  'Pitanja',          'Pitaj bilo šta - Nataša odgovara svakog dana.',            false, 1),
  ('ai-alati', 'AI alati',         'Alati, promptovi i trikovi koje koristiš.',                false, 2),
  ('pohvale',  'Pohvale i uspesi', 'Podeli šta si postigla - slavimo zajedno.',                false, 3);

alter publication supabase_realtime add table public.chat_poruke;
```

- [ ] **Step 2: Primeni migraciju**; proveri u Supabase dashboardu (Database → Replication) da je `chat_poruke` u `supabase_realtime` publikaciji.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/075_chat.sql
git commit -m "NH Članstvo: chat kanali i poruke sa RLS + Realtime publikacija (075)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Chat UI (Zajednica)

**Files:**
- Create: `src/app/clanstvo/zajednica/page.tsx`
- Create: `src/components/clanstvo/ChatKlijent.tsx`

- [ ] **Step 1: `src/app/clanstvo/zajednica/page.tsx`** (server — učitava kanale, ime i admin ID-jeve za stilizovanje Natašinih poruka):

```tsx
// Zajednica: server deo učitava kanale + ime članice + admin id-jeve
// (Natašine poruke se ističu), klijent radi poruke i Realtime.
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ChatKlijent from "@/components/clanstvo/ChatKlijent";

export const dynamic = "force-dynamic";

export default async function Zajednica() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: kanali } = await supabase
    .from("chat_kanali")
    .select("id, slug, naziv, opis, samo_admin_pise")
    .order("sort", { ascending: true });

  const { data: profil } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("id", user!.id)
    .single();

  // Admin id-jevi za isticanje poruka (mali broj redova; service-role jer
  // user_profiles RLS ne dozvoljava čitanje tuđih profila).
  const admin = createAdminClient();
  const { data: admini } = await admin
    .from("user_profiles")
    .select("id")
    .eq("role", "admin");

  return (
    <ChatKlijent
      kanali={kanali ?? []}
      mojId={user!.id}
      mojeIme={profil?.full_name ?? ""}
      jaAdmin={profil?.role === "admin"}
      adminIds={(admini ?? []).map((a) => a.id)}
    />
  );
}
```

- [ ] **Step 2: `src/components/clanstvo/ChatKlijent.tsx`**

```tsx
"use client";
// Chat zajednice. Poruke idu direktnim insertom iz browsera (RLS 075 je
// kapija), novi dolasci stižu kroz Realtime postgres_changes filtriran po
// kanalu. Klijent je modul-singleton (lib/supabase/client) pa se kanal
// OBAVEZNO uklanja u cleanup-u (removeChannel) da se pretplate ne gomilaju.
// Auto-scroll obrazac: naki/NakiChat.tsx.
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Kanal {
  id: string;
  slug: string;
  naziv: string;
  opis: string;
  samo_admin_pise: boolean;
}
interface Poruka {
  id: string;
  kanal_id: string;
  user_id: string;
  ime: string;
  tekst: string;
  created_at: string;
}

export default function ChatKlijent({
  kanali,
  mojId,
  mojeIme,
  jaAdmin,
  adminIds,
}: {
  kanali: Kanal[];
  mojId: string;
  mojeIme: string;
  jaAdmin: boolean;
  adminIds: string[];
}) {
  const supabase = createClient();
  const [aktivni, setAktivni] = useState<Kanal | null>(kanali[0] ?? null);
  const [poruke, setPoruke] = useState<Poruka[]>([]);
  const [tekst, setTekst] = useState("");
  const [salje, setSalje] = useState(false);
  const kraj = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aktivni) return;
    let aktivan = true;

    (async () => {
      const { data } = await supabase
        .from("chat_poruke")
        .select("*")
        .eq("kanal_id", aktivni.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (aktivan) setPoruke((data ?? []).reverse());
    })();

    const kanal = supabase
      .channel(`chat-${aktivni.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_poruke", filter: `kanal_id=eq.${aktivni.id}` },
        (payload) => setPoruke((p) => [...p, payload.new as Poruka])
      )
      .subscribe();

    return () => {
      aktivan = false;
      supabase.removeChannel(kanal);
    };
  }, [supabase, aktivni]);

  useEffect(() => {
    kraj.current?.scrollIntoView({ behavior: "smooth" });
  }, [poruke]);

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    const t = tekst.trim();
    if (!t || !aktivni || salje) return;
    setSalje(true);
    const { error } = await supabase.from("chat_poruke").insert({
      kanal_id: aktivni.id,
      user_id: mojId,
      ime: mojeIme,
      tekst: t,
    });
    if (!error) setTekst("");
    setSalje(false);
  }

  const pise = aktivni && (!aktivni.samo_admin_pise || jaAdmin);

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="flex gap-2 overflow-x-auto pb-3">
        {kanali.map((k) => (
          <button
            key={k.id}
            onClick={() => setAktivni(k)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
              aktivni?.id === k.id ? "bg-nh-pink text-white" : "bg-white text-nh-dark border border-nh-pink-light"
            }`}
          >
            {k.naziv}
          </button>
        ))}
      </div>
      {aktivni?.opis && <p className="pb-2 text-sm text-nh-dark/60">{aktivni.opis}</p>}

      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-nh-pink-light bg-white p-4">
        {poruke.map((p) => {
          const natasa = adminIds.includes(p.user_id);
          const moja = p.user_id === mojId;
          return (
            <div key={p.id} className={moja ? "text-right" : ""}>
              <p className="text-xs text-nh-dark/50">
                {natasa ? "💗 Nataša" : p.ime} ·{" "}
                {new Date(p.created_at).toLocaleString("sr-RS", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
              <p
                className={`mt-0.5 inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-left ${
                  natasa ? "bg-nh-pink text-white" : moja ? "bg-nh-pink-bg text-nh-dark" : "bg-nh-cream text-nh-dark"
                }`}
              >
                {p.tekst}
              </p>
            </div>
          );
        })}
        {poruke.length === 0 && <p className="text-nh-dark/50">Još nema poruka - napiši prvu!</p>}
        <div ref={kraj} />
      </div>

      {pise ? (
        <form onSubmit={posalji} className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-full border border-nh-pink-light bg-white px-4 py-2"
            placeholder={`Poruka u ${aktivni?.naziv}…`}
            value={tekst}
            maxLength={2000}
            onChange={(e) => setTekst(e.target.value)}
          />
          <button disabled={salje} className="rounded-full bg-nh-pink px-6 py-2 font-semibold text-white disabled:opacity-50">
            Pošalji
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-nh-dark/50">U ovom kanalu objavljuje samo Nataša.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Proveri** — dva browsera (admin + test članica): poruka iz jednog stigne u drugi bez osvežavanja; test članica NE može da piše u "Novosti"; nalog bez članstva ne vidi ništa (RLS). Promena kanala ne dovodi do duplih poruka (cleanup radi).

- [ ] **Step 4: Commit**

```bash
git add src/app/clanstvo/zajednica/page.tsx src/components/clanstvo/ChatKlijent.tsx
git commit -m "NH Članstvo: chat zajednica sa Realtime porukama

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: Završna provera i uputstvo za rad

**Files:**
- Create: `docs/nh-clanstvo-uputstvo.md`

- [ ] **Step 1: End-to-end smoke test** (NestPay TEST okruženje već postoji: `admin/nestpay-recurring-test`, `066`):
  1. Test kupovina `nh-clanstvo` pretplatom → callback → `subscriptions` red kreiran, `course_access` na `nh-clanstvo-sadrzaj` sa `expires_at` ≈ +1 mesec +7 dana, welcome mejl sa pretplatnim blokom
  2. `/clanstvo` dostupno; lekcija se otvara; profil se čuva; imenik prikazuje; chat radi
  3. Otkazivanje kroz `/nalog` → status `cancelled`; pristup i dalje važi do `expires_at`
  4. Ručno pomeri `expires_at` u prošlost → `/clanstvo` redirektuje na kupovinu, lekcije zaključane, chat/imenik prazni (RLS)
  5. `npm test` — svi testovi zeleni; `npm run build` — čist

- [ ] **Step 2: Napiši `docs/nh-clanstvo-uputstvo.md`** — kratko uputstvo za Natašu:
  - Kako dodati mesečnu lekciju (admin → kursevi → NH Membership - biblioteka → nova lekcija; badge blok određuje modul u biblioteci)
  - Kako objaviti Novosti (chat kanal Novosti — samo admin piše)
  - Kako preći sa founding na punu cenu (SQL `update courses set price = 3490 where slug = 'nh-clanstvo';` + `monthlyRsd: 3490` u `subscription-plans.ts` + deploy; postojeće pretplate ostaju na starom iznosu automatski)
  - Kako pratiti broj članica (`select count(*) from subscriptions s join courses c on c.id = s.course_id where c.slug = 'nh-clanstvo' and s.status = 'active';`)
  - Backlog: fotografije na profilu (Storage), NH omot za `/lekcija`, `?next=` povratak posle prijave, notifikacija mejlom za nove poruke

- [ ] **Step 3: Commit**

```bash
git add docs/nh-clanstvo-uputstvo.md
git commit -m "NH Članstvo: uputstvo za vođenje članstva

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Van obima ovog plana

1. **Prodajna stranica na natasahartweger.rs** (`/membership`) — drugi repo (Next.js sajt); poseban mali plan: prodajna stranica + CTA dugme na `hartweger.rs/kupovina/nh-clanstvo` + founding brojač (ručno ažuriran ili API poziv).
2. **Godišnja opcija (190€ ≈ 22.800 RSD)** — svesno odloženo za fazu 2. NestPay recurring serija je mesečna; godišnja opcija se rešava kao POSEBAN jednokratni proizvod (`nh-clanstvo-godisnje`, `price 22800`, unlock na isti sadržajni kurs — `grant-access` jednokratnoj kupovini ionako daje pristup +1 godina). Zahteva izuzetak od Task 4 pravila "članstvo samo pretplatom". Za founding lansiranje mesečna opcija je dovoljna.
3. **Founding kampanja** (IG + newsletter) — sadržajni posao, posle izgradnje.
4. **Snimanje lekcija** — sadržaj, po koncept fajlu.
