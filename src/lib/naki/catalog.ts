import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site-url";

export type CatalogCourse = {
  title: string;
  slug: string;
  price: number | null;            // RSD
  paypal_price_eur: number | null; // EUR
  category: string | null;
  course_type: string | null;
};

function formatPrice(c: CatalogCourse): string {
  if (c.price == null) return "cena varira";
  const rsd = c.price.toLocaleString("sr-RS");
  return c.paypal_price_eur != null ? `${rsd} RSD / ${c.paypal_price_eur} EUR` : `${rsd} RSD`;
}

export function renderCatalog(courses: CatalogCourse[]): string {
  if (courses.length === 0) return "";
  const groups = new Map<string, CatalogCourse[]>();
  for (const c of courses) {
    const key = c.category && c.category.trim() ? c.category : "Ostalo";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  const blocks: string[] = [];
  for (const [cat, items] of groups) {
    const lines = items.map(
      (c) => `- ${c.title} | ${formatPrice(c)} | ${SITE_URL}/kursevi/${c.slug}`
    );
    blocks.push(`${cat.toUpperCase()}:\n${lines.join("\n")}`);
  }
  return blocks.join("\n\n");
}

export async function getCatalogText(admin: SupabaseClient): Promise<string> {
  const { data } = await admin
    .from("courses")
    .select("title, slug, price, paypal_price_eur, category, course_type")
    .eq("is_purchasable", true)
    .order("category", { ascending: true });
  return renderCatalog((data ?? []) as CatalogCourse[]);
}
