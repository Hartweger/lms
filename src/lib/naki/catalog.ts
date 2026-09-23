import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site-url";
import { fetchRaspored, type GrupaRaspored } from "@/lib/raspored";
import { BESPLATNO_PONUDA, renderBesplatno } from "@/lib/besplatno";

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
  //
  // Potpuno besplatni kursevi (Goethe masterclassi) se IZBACUJU: kod njih su sve
  // lekcije `is_free_preview`, pa su do 23.09.2026 upadali u ovaj spisak i Smile ih
  // je predstavljao kao „pogledaj besplatno pre kupovine" - a ne prodaju se uopšte.
  // Oni idu u svoj odeljak (vidi `getFreeCoursesText`).
  const [res, freeCourses] = await Promise.all([
    admin
      .from("lessons")
      .select("title, order_index, courses!inner(title, slug, is_published)")
      .eq("is_free_preview", true)
      .eq("courses.is_published", true)
      .order("order_index"),
    getFullyFreeCourses(admin),
  ]);
  const freeSlugs = new Set(freeCourses.map((c) => c.slug));
  const rows = (((res as { data: unknown }).data ?? []) as unknown as {
    title: string;
    courses: { title: string; slug: string } | null;
  }[])
    .filter((r) => r.courses && !freeSlugs.has(r.courses.slug))
    .map((r) => ({
      lessonTitle: r.title,
      courseTitle: r.courses!.title,
      courseSlug: r.courses!.slug,
    }));
  return renderPreviewLessons(rows);
}

export type FreeCourse = { title: string; slug: string };

/**
 * Potpuno besplatni kursevi - cela stranica je otvorena svima, kurs se NE prodaje.
 * Danas su to tri Goethe masterclassa (`is_purchasable=false` + sve lekcije
 * `is_free_preview=true`, odluka od 19.08.2026).
 *
 * Kriterijum je namerno „sve lekcije besplatne", ne samo `is_purchasable=false`:
 * sadržajni kursevi grupnih polaznika (`nemacki-a1-1`...) takođe nisu kupovni, ali
 * imaju po jednu-dve probne lekcije i ostatak zaključan - oni ostaju u spisku
 * probnih lekcija.
 */
export async function getFullyFreeCourses(admin: SupabaseClient): Promise<FreeCourse[]> {
  const { data: courseRows } = await admin
    .from("courses")
    .select("id, title, slug")
    .eq("is_published", true)
    .eq("is_purchasable", false);
  const courses = (courseRows ?? []) as { id: string; title: string; slug: string }[];
  if (courses.length === 0) return [];

  const { data: lessonRows } = await admin
    .from("lessons")
    .select("course_id, is_free_preview")
    .in("course_id", courses.map((c) => c.id));
  const stat = new Map<string, { total: number; free: number }>();
  for (const l of (lessonRows ?? []) as { course_id: string; is_free_preview: boolean | null }[]) {
    const s = stat.get(l.course_id) ?? { total: 0, free: 0 };
    s.total += 1;
    if (l.is_free_preview) s.free += 1;
    stat.set(l.course_id, s);
  }
  return courses
    .filter((c) => {
      const s = stat.get(c.id);
      return !!s && s.total > 0 && s.free === s.total;
    })
    .map((c) => ({ title: c.title, slug: c.slug }));
}


/**
 * Sve iz sekcije „Besplatno" na sajtu. Stavke koje su kurs u bazi ostaju u
 * spisku samo dok su tamo stvarno besplatne (nekupovne, sve lekcije otvorene):
 * ako se neki masterclass vrati u prodaju, sam ispada odavde i vraća se u
 * katalog, pa Smile ne nastavi da ga deli besplatno.
 */
export async function getFreeCoursesText(admin: SupabaseClient): Promise<string> {
  const freeSlugs = new Set((await getFullyFreeCourses(admin)).map((c) => c.slug));
  return renderBesplatno(BESPLATNO_PONUDA.filter((r) => !r.slug || freeSlugs.has(r.slug)));
}

/**
 * Dani se Smile-u daju gotovi za rečenicu („sredom i subotom"), a ne kao lista iz
 * baze („sreda, subota"). Razlog: 22.08.2026 je posetiocu koji je pitao za B2.1
 * (sre+sub) rekao „utorkom i subotom" - sve ostalo iz reda je prepisao tačno
 * (datum, cena, mesta, link), a dane je povukao iz obrasca uto+čet, tada 5 od 7
 * otvorenih grupa. Greška je nastala u prevođenju nominativa u instrumental, pa
 * se prevod ukida: oblik se prepisuje takav kakav jeste.
 *
 * Bez verzala, iako bi odskakao od ostatka reda: prva verzija (15.09.2026) davala
 * je „SREDOM i SUBOTOM" i Smile je verzal prepisivao u odgovor posetiocu - dani
 * tačni, ali usred rečenice izgleda kao vika.
 */
const DAN_INSTRUMENTAL: Record<string, string> = {
  Ponedeljak: "ponedeljkom",
  Utorak: "utorkom",
  Sreda: "sredom",
  Četvrtak: "četvrtkom",
  Petak: "petkom",
  Subota: "subotom",
  Nedelja: "nedeljom",
};

export function daniInstrumental(daniPuni: string): string {
  const dani = daniPuni
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => DAN_INSTRUMENTAL[d] ?? d.toLowerCase());
  if (dani.length === 0) return "";
  if (dani.length === 1) return dani[0];
  return `${dani.slice(0, -1).join(", ")} i ${dani[dani.length - 1]}`;
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
      const termin = [daniInstrumental(g.daniPuni), g.sat].filter(Boolean).join(" ");
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

/**
 * Samo objavljeni kursevi. Admin klijent zaobilazi RLS, a javna `/kursevi/<slug>`
 * čita anon klijentom kome RLS krije neobjavljen red - pa je Smile do 15.09.2026
 * nudio „VIDEO kurs B2" (nacrt, is_published=false) sa linkom koji vraća 404.
 */
export async function getCatalogText(admin: SupabaseClient): Promise<string> {
  const { data } = await admin
    .from("courses")
    .select("title, slug, price, paypal_price_eur, category, course_type")
    .eq("is_purchasable", true)
    .eq("is_published", true)
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
    .select("package_type, price, courses!inner(title, slug, is_purchasable, is_published)")
    .eq("professor_id", (prof as { id: string }).id)
    .eq("is_active", true)
    .eq("courses.is_purchasable", true)
    .eq("courses.is_published", true);
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
