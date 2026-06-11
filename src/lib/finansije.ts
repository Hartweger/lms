// src/lib/finansije.ts — čiste funkcije za admin Finansije (P&L, marže, grupe, profesorke). Bez I/O.

export type Kategorija = "video" | "grupni" | "individualni" | "paket" | "ostalo";

export const KATEGORIJA_LABELS: Record<Kategorija, string> = {
  video: "Video kursevi",
  grupni: "Grupni kursevi",
  individualni: "Individualni kursevi",
  paket: "Paketi",
  ostalo: "Ostalo",
};

export const EXPENSE_CATEGORIES = ["marketing", "alati-hosting", "provizije", "materijali", "ostalo"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  marketing: "Marketing",
  "alati-hosting": "Alati i hosting",
  provizije: "Provizije",
  materijali: "Materijali",
  ostalo: "Ostalo",
};

export interface FinOrderItem { course_id: string; course_slug: string; title: string; price: number }
export interface FinOrder { id: string; user_id: string | null; created_at: string; total: number; items: FinOrderItem[] }
export interface Allocation { course_id: string; course_slug: string; amount: number }
export interface ExpenseRow {
  id: string; name: string; category: string; amount: number;
  course_id: string | null; expense_date: string; recurring: boolean;
  ended_at: string | null; note: string | null;
}

/** "2026-06-11..." → "2026-06" */
export function monthKey(dateStr: string): string {
  return String(dateStr).slice(0, 7);
}

/** Kategorija stavke: prefiks slug-a, pa courses.course_type kao fallback. */
export function kategorijaForItem(slug: string, courseType: string | null | undefined): Kategorija {
  const s = String(slug ?? "");
  if (s.startsWith("paket")) return "paket";
  if (s.startsWith("grupni-") || courseType === "group") return "grupni";
  if (courseType === "individual") return "individualni";
  if (s.startsWith("video-") || courseType === "video") return "video";
  return "ostalo";
}

/**
 * Raspodela order.total na stavke proporcionalno cenama (popust se "razmaže").
 * Zbir iznosa je uvek tačno order.total (ostatak zaokruživanja ide na poslednju stavku).
 */
export function allocateOrderTotal(order: FinOrder): Allocation[] {
  const items = order.items ?? [];
  if (items.length === 0) return [];
  const sum = items.reduce((s, i) => s + (Number(i.price) || 0), 0);
  if (sum <= 0) {
    return items.map((it, i) => ({ course_id: it.course_id, course_slug: it.course_slug, amount: i === 0 ? order.total : 0 }));
  }
  const out: Allocation[] = [];
  let used = 0;
  for (let i = 0; i < items.length; i++) {
    const last = i === items.length - 1;
    const amount = last ? order.total - used : Math.round(((Number(items[i].price) || 0) / sum) * order.total);
    used += amount;
    out.push({ course_id: items[i].course_id, course_slug: items[i].course_slug, amount });
  }
  return out;
}

export interface CourseInfo { id: string; title: string; slug: string; course_type: string | null }
export interface ProfInfo { id: string; full_name: string | null; honorar_ind: number | null; honorar_grp: number | null }
export interface LessonRow { lesson_date: string; professor_id: string; course_id: string | null }
export interface SessionRow { session_date: string; professor_id: string | null; group_id: string; course_id: string | null }
export interface GroupInfo {
  id: string; level: string; status: string; max_seats: number;
  professor_id: string | null; purchasable_course_id: string | null; session_time: string | null;
}
export interface GroupMember { group_id: string; user_id: string; status: string }

export interface FinansijeInput {
  year: number;
  mesec: number | null;       // null = cela godina (filter za sekcije, P&L je uvek cela godina)
  nowKey: string;             // tekući "yyyy-mm", za mesečne troškove bez kraja
  orders: FinOrder[];         // SVE completed porudžbine (cela istorija — retencija)
  courses: CourseInfo[];
  professors: ProfInfo[];
  lessons: LessonRow[];       // course_id = individual_enrollments.course_id (spojeno na strani servera)
  sessions: SessionRow[];     // course_id = groups.purchasable_course_id (spojeno na strani servera)
  expenses: ExpenseRow[];
  indProfByOrderId: Record<string, string>;  // order_id → professor_id (iz individual_enrollments)
  indEnrollments: { professor_id: string | null; user_id: string; status: string }[];
  groups: GroupInfo[];
  groupMembers: GroupMember[]; // SVI (i cancelled — atribucija prihoda istorijskih članova)
}

export interface MonthRow {
  month: number;
  prihod: Record<Kategorija, number>; prihodUkupno: number;
  honorari: Record<string, number>; honorariUkupno: number;   // ključ = professor_id
  troskovi: Record<string, number>; troskoviUkupno: number;   // ključ = kategorija troška
  neto: number;
}
export interface CourseRow {
  course_id: string; title: string; kategorija: Kategorija;
  prihod: number; honorar: number; direktniTroskovi: number; marza: number; marzaPct: number | null;
}
export interface GroupRow {
  group_id: string; naziv: string; profesorka: string; status: string;
  clanovi: number; maxSeats: number; prihod: number; honorar: number;
  zarada: number; zaradaPoClanu: number;
}
export interface ProfRow {
  professor_id: string; ime: string; prihod: number; honorar: number; neto: number;
  aktivniPolaznici: number; retencijaMeseci: number | null;
}
export interface FinansijeData {
  months: MonthRow[];
  totals: { prihod: number; pending?: number; honorari: number; troskovi: number; rashodi: number; neto: number; marzaPct: number | null };
  kursevi: CourseRow[];
  opstiTroskovi: number;
  grupe: GroupRow[];
  profesorke: ProfRow[];
}

/** Meseci (1-12) date godine u kojima trošak važi. nowKey ("yyyy-mm") seče mesečne bez kraja. */
export function expenseMonthsInYear(e: ExpenseRow, year: number, nowKey: string): number[] {
  const startKey = monthKey(e.expense_date);
  if (!e.recurring) {
    return startKey.startsWith(`${year}-`) ? [Number(startKey.slice(5))] : [];
  }
  const endKey = e.ended_at ? monthKey(e.ended_at) : nowKey;
  const months: number[] = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}`;
    if (key >= startKey && key <= endKey) months.push(m); // string poređenje radi za yyyy-mm
  }
  return months;
}

function emptyKategorije(): Record<Kategorija, number> {
  return { video: 0, grupni: 0, individualni: 0, paket: 0, ostalo: 0 };
}

/** Da li datum upada u izabrani period (godina + opcioni mesec). */
function inPeriod(dateStr: string, year: number, mesec: number | null): boolean {
  const key = monthKey(dateStr);
  if (!key.startsWith(`${year}-`)) return false;
  return mesec === null || Number(key.slice(5)) === mesec;
}

export function buildFinansije(input: FinansijeInput): FinansijeData {
  const courseById = new Map(input.courses.map((c) => [c.id, c]));
  const profById = new Map(input.professors.map((p) => [p.id, p]));
  // Napomena: promena stope u user_profiles retroaktivno preračunava istoriju (svesna odluka iz spec-a).
  const rateInd = (pid: string) => profById.get(pid)?.honorar_ind ?? 0;
  const rateGrp = (pid: string | null) => (pid ? profById.get(pid)?.honorar_grp ?? 0 : 0);

  // ---------- P&L po mesecima (uvek cela godina) ----------
  const months: MonthRow[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1, prihod: emptyKategorije(), prihodUkupno: 0,
    honorari: {}, honorariUkupno: 0, troskovi: {}, troskoviUkupno: 0, neto: 0,
  }));
  const monthOf = (dateStr: string): MonthRow | null => {
    const key = monthKey(dateStr);
    return key.startsWith(`${input.year}-`) ? months[Number(key.slice(5)) - 1] : null;
  };

  for (const o of input.orders) {
    const mo = monthOf(o.created_at);
    if (!mo) continue;
    for (const a of allocateOrderTotal(o)) {
      const cat = kategorijaForItem(a.course_slug, courseById.get(a.course_id)?.course_type);
      mo.prihod[cat] += a.amount;
      mo.prihodUkupno += a.amount;
    }
  }
  for (const l of input.lessons) {
    const mo = monthOf(l.lesson_date);
    if (!mo) continue;
    const h = rateInd(l.professor_id);
    mo.honorari[l.professor_id] = (mo.honorari[l.professor_id] ?? 0) + h;
    mo.honorariUkupno += h;
  }
  for (const s of input.sessions) {
    const mo = monthOf(s.session_date);
    if (!mo || !s.professor_id) continue;
    const h = rateGrp(s.professor_id);
    mo.honorari[s.professor_id] = (mo.honorari[s.professor_id] ?? 0) + h;
    mo.honorariUkupno += h;
  }
  for (const e of input.expenses) {
    for (const m of expenseMonthsInYear(e, input.year, input.nowKey)) {
      const mo = months[m - 1];
      mo.troskovi[e.category] = (mo.troskovi[e.category] ?? 0) + e.amount;
      mo.troskoviUkupno += e.amount;
    }
  }
  for (const mo of months) mo.neto = mo.prihodUkupno - mo.honorariUkupno - mo.troskoviUkupno;

  const totals = months.reduce(
    (t, mo) => ({ ...t, prihod: t.prihod + mo.prihodUkupno, honorari: t.honorari + mo.honorariUkupno, troskovi: t.troskovi + mo.troskoviUkupno }),
    { prihod: 0, honorari: 0, troskovi: 0, rashodi: 0, neto: 0, marzaPct: null as number | null }
  );
  totals.rashodi = totals.honorari + totals.troskovi;
  totals.neto = totals.prihod - totals.rashodi;
  totals.marzaPct = totals.prihod > 0 ? Math.round((totals.neto / totals.prihod) * 100) : null;

  // ---------- Sekcije (poštuju mesec filter) ----------
  const inSel = (d: string) => inPeriod(d, input.year, input.mesec);

  const courseAgg = new Map<string, { prihod: number; honorar: number; trosak: number }>();
  const bump = (id: string, field: "prihod" | "honorar" | "trosak", amt: number) => {
    const row = courseAgg.get(id) ?? { prihod: 0, honorar: 0, trosak: 0 };
    row[field] += amt;
    courseAgg.set(id, row);
  };
  for (const o of input.orders) {
    if (!inSel(o.created_at)) continue;
    for (const a of allocateOrderTotal(o)) bump(a.course_id, "prihod", a.amount);
  }
  for (const l of input.lessons) {
    if (!inSel(l.lesson_date) || !l.course_id) continue;
    bump(l.course_id, "honorar", rateInd(l.professor_id));
  }
  for (const s of input.sessions) {
    if (!inSel(s.session_date) || !s.course_id) continue;
    bump(s.course_id, "honorar", rateGrp(s.professor_id));
  }
  let opstiTroskovi = 0;
  for (const e of input.expenses) {
    const meseci = expenseMonthsInYear(e, input.year, input.nowKey)
      .filter((m) => input.mesec === null || m === input.mesec);
    const iznos = meseci.length * e.amount;
    if (iznos === 0) continue;
    if (e.course_id) bump(e.course_id, "trosak", iznos);
    else opstiTroskovi += iznos;
  }

  const kursevi: CourseRow[] = [...courseAgg.entries()].map(([id, agg]) => {
    const c = courseById.get(id);
    const marza = agg.prihod - agg.honorar - agg.trosak;
    return {
      course_id: id,
      title: c?.title ?? id,
      kategorija: kategorijaForItem(c?.slug ?? "", c?.course_type),
      prihod: agg.prihod, honorar: agg.honorar, direktniTroskovi: agg.trosak,
      marza, marzaPct: agg.prihod > 0 ? Math.round((marza / agg.prihod) * 100) : null,
    };
  }).sort((a, b) => b.marza - a.marza);

  // ---------- Atribucija uplata profesorkama (i grupama) ----------
  // Individualne: order_id → professor_id (individual_enrollments).
  // Grupne: stavka grupnog kursa → grupa u kojoj je kupac član → profesorka grupe.
  const memberGroups = new Map<string, { group_id: string; active: boolean }[]>(); // user_id → [{group_id, active}]
  for (const gm of input.groupMembers) {
    memberGroups.set(gm.user_id, [...(memberGroups.get(gm.user_id) ?? []), { group_id: gm.group_id, active: gm.status === "active" }]);
  }
  const groupById = new Map(input.groups.map((g) => [g.id, g]));

  interface ProfPayment { professor_id: string; user_id: string; amount: number; month: string; group_id: string | null }
  const allPayments: ProfPayment[] = []; // cela istorija — za retenciju
  for (const o of input.orders) {
    // Porudžbine uvek imaju user_id (checkout/admin kreiraju korisnika); guard je defanzivan — bez user_id nema atribucije, P&L je svejedno broji.
    if (!o.user_id) continue;
    const indProf = input.indProfByOrderId[o.id];
    for (const a of allocateOrderTotal(o)) {
      const cat = kategorijaForItem(a.course_slug, courseById.get(a.course_id)?.course_type);
      if (cat === "individualni" && indProf) {
        allPayments.push({ professor_id: indProf, user_id: o.user_id, amount: a.amount, month: monthKey(o.created_at), group_id: null });
      } else if (cat === "grupni") {
        // Polaznik može proći kroz više generacija iste grupe (isti purchasable_course_id) —
        // preferiramo aktivno članstvo; ako nema aktivnog, uzimamo prvo istorijsko.
        // Ovo je svesna aproksimacija za slučaj višestrukih generacija.
        const candidates = (memberGroups.get(o.user_id) ?? []).filter((m) => groupById.get(m.group_id)?.purchasable_course_id === a.course_id);
        const best = candidates.find((m) => m.active) ?? candidates[0];
        const gid = best?.group_id;
        const prof = gid ? groupById.get(gid)?.professor_id : null;
        if (gid && prof) {
          allPayments.push({ professor_id: prof, user_id: o.user_id, amount: a.amount, month: monthKey(o.created_at), group_id: gid });
        }
      }
    }
  }
  const selPayments = allPayments.filter((p) => {
    if (!p.month.startsWith(`${input.year}-`)) return false;
    return input.mesec === null || Number(p.month.slice(5)) === input.mesec;
  });

  // ---------- Grupe ----------
  const grupe: GroupRow[] = input.groups.map((g) => {
    const clanovi = input.groupMembers.filter((m) => m.group_id === g.id && m.status === "active").length;
    const prihod = selPayments.filter((p) => p.group_id === g.id).reduce((s, p) => s + p.amount, 0);
    const honorar = input.sessions
      .filter((s) => s.group_id === g.id && inSel(s.session_date))
      .reduce((s2, s) => s2 + rateGrp(s.professor_id), 0);
    const zarada = prihod - honorar;
    return {
      group_id: g.id,
      naziv: g.session_time ? `${g.level} · ${g.session_time}` : g.level,
      profesorka: (g.professor_id && profById.get(g.professor_id)?.full_name) || "—",
      status: g.status, clanovi, maxSeats: g.max_seats, prihod, honorar,
      zarada, zaradaPoClanu: clanovi > 0 ? Math.round(zarada / clanovi) : zarada,
    };
  }).filter((g) => g.prihod !== 0 || g.honorar !== 0 || g.status === "u_toku" || g.status === "otvoren")
    .sort((a, b) => a.zarada - b.zarada); // najgore prve — to admin treba da vidi

  // ---------- Profesorke ----------
  const profesorke: ProfRow[] = input.professors.map((p) => {
    const prihod = selPayments.filter((x) => x.professor_id === p.id).reduce((s, x) => s + x.amount, 0);
    const honorar =
      input.lessons.filter((l) => l.professor_id === p.id && inSel(l.lesson_date)).length * (p.honorar_ind ?? 0) +
      input.sessions.filter((s) => s.professor_id === p.id && inSel(s.session_date)).length * (p.honorar_grp ?? 0);
    const aktivniInd = new Set(input.indEnrollments.filter((e) => e.professor_id === p.id && e.status === "active").map((e) => e.user_id));
    const njeneGrupe = new Set(input.groups.filter((g) => g.professor_id === p.id).map((g) => g.id));
    const aktivniGrp = new Set(input.groupMembers.filter((m) => njeneGrupe.has(m.group_id) && m.status === "active").map((m) => m.user_id));
    const aktivni = new Set([...aktivniInd, ...aktivniGrp]).size;

    // Retencija: po polazniku broj RAZLIČITIH meseci sa uplatom (cela istorija), pa prosek.
    const mesecePoPolazniku = new Map<string, Set<string>>();
    for (const pay of allPayments) {
      if (pay.professor_id !== p.id) continue;
      mesecePoPolazniku.set(pay.user_id, (mesecePoPolazniku.get(pay.user_id) ?? new Set()).add(pay.month));
    }
    const brojevi = [...mesecePoPolazniku.values()].map((s) => s.size);
    const retencija = brojevi.length > 0
      ? Math.round((brojevi.reduce((a, b) => a + b, 0) / brojevi.length) * 10) / 10
      : null;

    return { professor_id: p.id, ime: p.full_name ?? "—", prihod, honorar, neto: prihod - honorar, aktivniPolaznici: aktivni, retencijaMeseci: retencija };
  }).filter((p) => p.prihod !== 0 || p.honorar !== 0 || p.aktivniPolaznici > 0)
    .sort((a, b) => b.neto - a.neto);

  return { months, totals, kursevi, opstiTroskovi, grupe, profesorke };
}
