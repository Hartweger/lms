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
