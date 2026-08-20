import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site-url";
import { fetchRaspored, type GrupaRaspored } from "@/lib/raspored";

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

export type PreviewLesson = {
  lessonTitle: string;
  courseTitle: string;
  courseSlug: string;
};

/**
 * Spisak besplatnih probnih lekcija za Smile - da na pitanje „može li da se vidi
 * kako izgleda kurs" daje link umesto da traži mejl. Grupiše se po kursu jer je
 * javna stranica `/kurs/<slug>` ulaz za sve probne lekcije tog kursa.
 */
export function renderPreviewLessons(rows: PreviewLesson[]): string {
  if (rows.length === 0) return "";
  const groups = new Map<string, { title: string; lessons: string[] }>();
  for (const r of rows) {
    const g = groups.get(r.courseSlug) ?? { title: r.courseTitle, lessons: [] };
    g.lessons.push(r.lessonTitle);
    groups.set(r.courseSlug, g);
  }
  return [...groups.entries()]
    .sort((a, b) => a[1].title.localeCompare(b[1].title, "sr"))
    .map(([slug, g]) => `- ${g.title} (${g.lessons.map((l) => `„${l}"`).join(", ")}) | ${SITE_URL}/kurs/${slug}`)
    .join("\n");
}

export async function getPreviewLessonsText(admin: SupabaseClient): Promise<string> {
  // Samo objavljeni kursevi - `/kurs/<slug>` neobjavljenog kursa vraća 404
  // (npr. „kurs-konverzacije"), pa bi Smile davao mrtav link.
  const { data } = await admin
    .from("lessons")
    .select("title, order_index, courses!inner(title, slug, is_published)")
    .eq("is_free_preview", true)
    .eq("courses.is_published", true)
    .order("order_index");
  const rows = ((data ?? []) as unknown as {
    title: string;
    courses: { title: string; slug: string } | null;
  }[])
    .filter((r) => r.courses)
    .map((r) => ({
      lessonTitle: r.title,
      courseTitle: r.courses!.title,
      courseSlug: r.courses!.slug,
    }));
  return renderPreviewLessons(rows);
}

/**
 * Otvoreni grupni termini za Smile. Do 07.08.2026 katalog je imao samo kurseve i
 * cene, pa Smile nije znao da grupa uopšte postoji - posetiocu koji pita „koliko
 * košta kurs za početnike" tri dana pre starta A1.1 grupe nudio je video kurs.
 * Uzima se isti izvor kao javna /raspored stranica, pa se prikazano i izgovoreno
 * ne razilaze.
 *
 * Ulaze SAMO grupe na koje se sad može upisati: „Otvoren za upis" i sa slobodnim
 * mestom. Popunjena ili tek najavljena grupa nije ponuda - vidi pravilo da se bez
 * otvorenog termina ne prodaje.
 */
export function renderOpenGroups(rows: GrupaRaspored[]): string {
  const open = rows.filter((g) => !g.full && g.status.toLowerCase().startsWith("otvoren"));
  if (open.length === 0) return "";
  return open
    .map((g) => {
      const termin = [g.daniPuni.toLowerCase(), g.sat].filter(Boolean).join(" ");
      const cena =
        g.cena != null
          ? `${g.cena.toLocaleString("sr-RS")} RSD${g.cenaEur != null ? ` / ${g.cenaEur} EUR` : ""}`
          : null;
      // Ime profesora bez titule - rod se ne pripisuje.
      // Grupa koja je već krenula, a i dalje prima polaznike: „početak 05.08." bi
      // zvučao kao promašen rok. Ide sledeći čas i koliko ih je ostalo.
      const kada = g.uToku
        ? [
            g.sledeciCas ? `u toku, sledeći čas ${g.sledeciCas}` : "u toku",
            g.preostaloCasova > 0 && g.ukupnoCasova > 0
              ? `ostalo ${g.preostaloCasova} od ${g.ukupnoCasova} časova`
              : null,
          ].filter(Boolean).join(", ")
        : g.pocetak
          ? `početak ${g.pocetak}`
          : null;
      const parts = [
        g.nivo,
        kada,
        termin || null,
        g.trajanje ? `${g.trajanje} nedelja` : null,
        g.prof || null,
        `${g.slobodnih} od ${g.maks} mesta slobodno`,
        cena,
        g.checkoutSlug ? `${SITE_URL}/kursevi/${g.checkoutSlug}` : null,
      ].filter(Boolean);
      return `- ${parts.join(" | ")}`;
    })
    .join("\n");
}

export async function getOpenGroupsText(): Promise<string> {
  return renderOpenGroups(await fetchRaspored());
}

export async function getCatalogText(admin: SupabaseClient): Promise<string> {
  const { data } = await admin
    .from("courses")
    .select("title, slug, price, paypal_price_eur, category, course_type")
    .eq("is_purchasable", true)
    .order("category", { ascending: true });
  return renderCatalog((data ?? []) as CatalogCourse[]);
}

/**
 * Natašina 1:1 ponuda. Do 20.08.2026 prompt je tvrdio da individualne kurseve vode
 * isključivo profesorke iz tima, pa je Smile lidu koji je dvaput izričito tražio baš
 * Natašu odgovorio da „individualne časove ne drži lično" - a ona ima svoje aktivne
 * 1:1 varijante i svoje polaznike. Njena cena je viša od standardne, pa se ne sme
 * izgovoriti bazna cena kursa: uzima se iz `product_variants`, isti izvor kao checkout.
 *
 * Prazan string = nema aktivnih varijanti; tada bloka nema i Smile o njoj ne tvrdi ništa.
 */
const NATASA_PROFESSOR_EMAIL = "natasa@hartweger.rs";

export type NatasaVariant = {
  courseTitle: string;
  courseSlug: string;
  packageType: string | null;
  price: number | null; // RSD
};

const PACKAGE_LABEL: Record<string, string> = {
  paket4: "4 časa mesečno",
  paket8: "8 časova mesečno",
  paket12: "12 časova mesečno",
};

export function renderNatasaIndividual(rows: NatasaVariant[]): string {
  if (rows.length === 0) return "";
  const order = ["paket4", "paket8", "paket12"];
  return [...rows]
    .sort(
      (a, b) =>
        a.courseTitle.localeCompare(b.courseTitle, "sr") ||
        order.indexOf(a.packageType ?? "") - order.indexOf(b.packageType ?? "")
    )
    .map((r) => {
      const label = r.packageType
        ? `${r.courseTitle} - ${PACKAGE_LABEL[r.packageType] ?? r.packageType}`
        : r.courseTitle;
      const cena = r.price != null ? `${r.price.toLocaleString("sr-RS")} RSD` : "cena varira";
      return `- ${label} | ${cena} | ${SITE_URL}/kursevi/${r.courseSlug}`;
    })
    .join("\n");
}

export async function getNatasaIndividualText(admin: SupabaseClient): Promise<string> {
  const { data: prof } = await admin
    .from("user_profiles")
    .select("id")
    .eq("email", NATASA_PROFESSOR_EMAIL)
    .maybeSingle();
  if (!prof) return "";
  const { data } = await admin
    .from("product_variants")
    .select("package_type, price, courses!inner(title, slug, is_purchasable)")
    .eq("professor_id", (prof as { id: string }).id)
    .eq("is_active", true)
    .eq("courses.is_purchasable", true);
  const rows = ((data ?? []) as unknown as {
    package_type: string | null;
    price: number | null;
    courses: { title: string; slug: string } | null;
  }[])
    .filter((r) => r.courses)
    .map((r) => ({
      courseTitle: r.courses!.title,
      courseSlug: r.courses!.slug,
      packageType: r.package_type,
      price: r.price,
    }));
  return renderNatasaIndividual(rows);
}
