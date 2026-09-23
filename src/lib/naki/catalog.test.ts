import { describe, it, expect } from "vitest";
import {
  renderCatalog,
  renderPreviewLessons,
  renderOpenGroups,
  daniInstrumental,
  getCatalogText,
  getNatasaIndividualText,
  getFullyFreeCourses,
  getFreeCoursesText,
  type CatalogCourse,
  type PreviewLesson,
} from "./catalog";
import { renderBesplatno } from "@/lib/besplatno";
import type { GrupaRaspored } from "@/lib/raspored";
import type { SupabaseClient } from "@supabase/supabase-js";

const SAMPLE: CatalogCourse[] = [
  { title: "Video kurs A1", slug: "video-kurs-a1", price: 11600, paypal_price_eur: 99, category: "Video kursevi", course_type: "video" },
  { title: "Grupni A1.1", slug: "grupni-kurs-nemackog-jezika-a1-1", price: 19600, paypal_price_eur: 168, category: "Grupni kursevi", course_type: "group" },
  { title: "Individualni B1.1", slug: "individualni-kurs-nemackog-jezika-b11", price: null, paypal_price_eur: null, category: "Individualni kursevi", course_type: "individual" },
];

describe("renderCatalog", () => {
  it("grupiše po kategoriji sa velikim slovima u naslovu", () => {
    const out = renderCatalog(SAMPLE);
    expect(out).toContain("VIDEO KURSEVI:");
    expect(out).toContain("GRUPNI KURSEVI:");
    expect(out).toContain("INDIVIDUALNI KURSEVI:");
  });

  it("formatira cenu u RSD i EUR i daje detalj link", () => {
    const out = renderCatalog(SAMPLE);
    expect(out).toContain("11.600 RSD / 99 EUR");
    expect(out).toContain("https://www.hartweger.rs/kursevi/video-kurs-a1");
  });

  it("kad nema cene piše 'cena varira'", () => {
    const out = renderCatalog(SAMPLE);
    expect(out).toContain("cena varira");
  });

  it("prazna lista vraća prazan string", () => {
    expect(renderCatalog([])).toBe("");
  });
});

const PREVIEWS: PreviewLesson[] = [
  { lessonTitle: "Pozdravi", courseTitle: "Nemački A1.1", courseSlug: "nemacki-a1-1" },
  { lessonTitle: "Die ersten Fragen", courseTitle: "Nemački A1.1", courseSlug: "nemacki-a1-1" },
  { lessonTitle: "Persönliche Angaben", courseTitle: "Nemački A2.1", courseSlug: "nemacki-a2-1" },
];

describe("renderPreviewLessons", () => {
  it("grupiše lekcije istog kursa u jedan red sa linkom na /kurs/<slug>", () => {
    const out = renderPreviewLessons(PREVIEWS);
    expect(out.split("\n")).toHaveLength(2);
    expect(out).toContain(`Nemački A1.1 („Pozdravi", „Die ersten Fragen") | https://www.hartweger.rs/kurs/nemacki-a1-1`);
    expect(out).toContain("https://www.hartweger.rs/kurs/nemacki-a2-1");
  });

  it("prazna lista vraća prazan string - bez spiska nema ni bloka u promptu", () => {
    expect(renderPreviewLessons([])).toBe("");
  });
});

const grupa = (o: Partial<GrupaRaspored> = {}): GrupaRaspored => ({
  nivo: "A1.1",
  prof: "Milica Vučić",
  status: "Otvoren za upis",
  pocetak: "11.08.2026",
  trajanje: "7",
  dani: "uto, čet",
  daniPuni: "Utorak, Četvrtak",
  sat: "20:00-21:00",
  maks: "6",
  upisanih: "1",
  slobodnih: "5",
  full: false,
  checkoutSlug: "grupni-kurs-nemackog-jezika-a1-1",
  cena: 19600,
  cenaEur: 168,
  uToku: false,
  sledeciCas: "",
  ukupnoCasova: 14,
  preostaloCasova: 14,
  ...o,
});

describe("daniInstrumental", () => {
  it("daje instrumental, pa Smile dane ubacuje u rečenicu bez prevođenja", () => {
    expect(daniInstrumental("Sreda, Subota")).toBe("sredom i subotom");
    expect(daniInstrumental("Utorak, Četvrtak")).toBe("utorkom i četvrtkom");
    expect(daniInstrumental("Ponedeljak, Sreda")).toBe("ponedeljkom i sredom");
  });

  it("jedan dan ide bez veznika, tri sa zarezima", () => {
    expect(daniInstrumental("Subota")).toBe("subotom");
    expect(daniInstrumental("Ponedeljak, Sreda, Petak")).toBe("ponedeljkom, sredom i petkom");
  });

  it("prazno ostaje prazno - termin se tada izostavlja iz reda", () => {
    expect(daniInstrumental("")).toBe("");
  });
});

describe("renderOpenGroups", () => {
  it("daje nivo, datum početka, dane i sat, mesta, cenu i link u jednom redu", () => {
    const out = renderOpenGroups([grupa()]);
    expect(out).toContain("A1.1");
    expect(out).toContain("početak 11.08.2026");
    expect(out).toContain("utorkom i četvrtkom 20:00-21:00");
    expect(out).toContain("7 nedelja");
    expect(out).toContain("5 od 6 mesta slobodno");
    expect(out).toContain("19.600 RSD / 168 EUR");
    expect(out).toContain("https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-a1-1");
  });

  it("grupa u toku: ne pominje prošli početak, nego sledeći čas i preostalo", () => {
    const out = renderOpenGroups([
      grupa({ uToku: true, sledeciCas: "10.08.2026", preostaloCasova: 13 }),
    ]);
    expect(out).toContain("u toku, sledeći čas 10.08.2026");
    expect(out).toContain("ostalo 13 od 14 časova");
    expect(out).not.toContain("početak");
  });

  it("izostavlja popunjene grupe - na njih se ne može upisati", () => {
    const out = renderOpenGroups([grupa({ full: true, slobodnih: "0" })]);
    expect(out).toBe("");
  });

  it("izostavlja grupe koje nisu otvorene za upis (npr. 'Uskoro')", () => {
    const out = renderOpenGroups([grupa({ status: "Uskoro" })]);
    expect(out).toBe("");
  });

  it("prazna lista vraća prazan string", () => {
    expect(renderOpenGroups([])).toBe("");
  });

  it("preživljava grupu bez cene i bez checkout slug-a - termin je i dalje vest", () => {
    const out = renderOpenGroups([grupa({ cena: null, cenaEur: null, checkoutSlug: null })]);
    expect(out).toContain("A1.1");
    expect(out).toContain("početak 11.08.2026");
    expect(out).not.toContain("/kursevi/");
  });

  it("ne pripisuje profesoru rod - samo ime", () => {
    const out = renderOpenGroups([grupa()]);
    expect(out).toContain("Milica Vučić");
    expect(out).not.toMatch(/profesorka Milica/);
  });
});

/**
 * Beleži upite: koja tabela, koji select i koji `.eq` filteri. Svaki upit se
 * razrešava praznom listom (thenable), a `maybeSingle` vraća Natašin profil.
 */
function recordingAdmin() {
  const calls: { table: string; select: string; eq: [string, unknown][] }[] = [];
  const admin = {
    from(table: string) {
      const call = { table, select: "", eq: [] as [string, unknown][] };
      calls.push(call);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b: any = {
        select(sel: string) { call.select = sel; return b; },
        eq(col: string, val: unknown) { call.eq.push([col, val]); return b; },
        in() { return b; },
        order() { return b; },
        maybeSingle: async () => ({ data: { id: "prof-1" }, error: null }),
        then(res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) {
          return Promise.resolve({ data: [], error: null }).then(res, rej);
        },
      };
      return b;
    },
  };
  return { admin: admin as unknown as SupabaseClient, calls };
}

describe("getCatalogText - samo objavljeni kursevi", () => {
  // 15.09.2026: Smile je nudio „VIDEO kurs B2" (is_published=false, nacrt) sa linkom
  // koji anon posetiocu vraća 404 - admin klijent zaobilazi RLS, pa filter mora u upit.
  it("filtrira is_published=true uz is_purchasable=true", async () => {
    const { admin, calls } = recordingAdmin();
    await getCatalogText(admin);
    expect(calls[0].table).toBe("courses");
    expect(calls[0].eq).toContainEqual(["is_purchasable", true]);
    expect(calls[0].eq).toContainEqual(["is_published", true]);
  });
});

describe("getNatasaIndividualText - samo objavljeni kursevi", () => {
  it("join na courses traži i is_published=true", async () => {
    const { admin, calls } = recordingAdmin();
    await getNatasaIndividualText(admin);
    const variants = calls.find((c) => c.table === "product_variants");
    expect(variants).toBeDefined();
    expect(variants!.select).toContain("is_published");
    expect(variants!.eq).toContainEqual(["courses.is_purchasable", true]);
    expect(variants!.eq).toContainEqual(["courses.is_published", true]);
  });
});

/**
 * 23.09.2026: Goethe masterclassi (is_purchasable=false + SVE lekcije besplatne) su
 * upadali u spisak probnih lekcija, pa ih je Smile nudio kao „pogledaj pre kupovine".
 */
describe("getFullyFreeCourses - samo kursevi kojima je svaka lekcija besplatna", () => {
  function adminWith(
    courses: { id: string; title: string; slug: string }[],
    lessons: { course_id: string; is_free_preview: boolean }[]
  ) {
    const admin = {
      from(table: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b: any = {
          select() { return b; },
          eq() { return b; },
          in() { return b; },
          order() { return b; },
          then(res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) {
            const data = table === "courses" ? courses : lessons;
            return Promise.resolve({ data, error: null }).then(res, rej);
          },
        };
        return b;
      },
    };
    return admin as unknown as SupabaseClient;
  }

  it("uzima kurs kome su sve lekcije is_free_preview", async () => {
    const out = await getFullyFreeCourses(
      adminWith(
        [{ id: "c1", title: "VIDEO + B1 ispit - kompletna priprema", slug: "polozi-goethe-b1" }],
        [
          { course_id: "c1", is_free_preview: true },
          { course_id: "c1", is_free_preview: true },
        ]
      )
    );
    expect(out).toEqual([{ title: "VIDEO + B1 ispit - kompletna priprema", slug: "polozi-goethe-b1" }]);
  });

  it("ne uzima sadržajni kurs sa par probnih lekcija (nemacki-a1-1)", async () => {
    const out = await getFullyFreeCourses(
      adminWith(
        [{ id: "c2", title: "Nemački A1.1", slug: "nemacki-a1-1" }],
        [
          { course_id: "c2", is_free_preview: true },
          { course_id: "c2", is_free_preview: false },
        ]
      )
    );
    expect(out).toEqual([]);
  });

  it("ne uzima kurs bez ijedne lekcije (paket)", async () => {
    const out = await getFullyFreeCourses(
      adminWith([{ id: "c3", title: "Video paket A1 + A2", slug: "paket-a1-i-a2" }], [])
    );
    expect(out).toEqual([]);
  });

  it("traži is_published=true i is_purchasable=false", async () => {
    const { admin, calls } = recordingAdmin();
    await getFullyFreeCourses(admin);
    expect(calls[0].table).toBe("courses");
    expect(calls[0].eq).toContainEqual(["is_published", true]);
    expect(calls[0].eq).toContainEqual(["is_purchasable", false]);
  });
});

describe("renderBesplatno", () => {
  it("kaže da je potpuno besplatno, daje link i NE pominje cenu", () => {
    const out = renderBesplatno([
      { naslov: "Položi Goethe B1 - kompletna priprema", href: "/kurs/polozi-goethe-b1", slug: "polozi-goethe-b1", opis: "video priprema" },
    ]);
    expect(out).toContain("https://www.hartweger.rs/kurs/polozi-goethe-b1");
    expect(out).toContain("potpuno besplatno");
    expect(out).not.toMatch(/RSD|EUR/);
  });

  it("prenosi napomenu (nepotpun B2, mejl za masterclass reči)", () => {
    const out = renderBesplatno([
      { naslov: "Položi Goethe B2 - Leseverstehen", href: "/kurs/polozi-goethe-b2", opis: "tri modelltesta", napomena: "nepotpun je" },
    ]);
    expect(out).toContain("NAPOMENA: nepotpun je");
  });

  it("prazna lista vraća prazan string (bloka tada nema)", () => {
    expect(renderBesplatno([])).toBe("");
  });
});

describe("getFreeCoursesText - kurs koji se opet prodaje ispada iz besplatnog", () => {
  function adminWithFreeSlugs(slugs: string[]) {
    const courses = slugs.map((s, i) => ({ id: `c${i}`, title: s, slug: s }));
    const lessons = courses.map((c) => ({ course_id: c.id, is_free_preview: true }));
    const admin = {
      from(table: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b: any = {
          select() { return b; },
          eq() { return b; },
          in() { return b; },
          order() { return b; },
          then(res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) {
            return Promise.resolve({ data: table === "courses" ? courses : lessons, error: null }).then(res, rej);
          },
        };
        return b;
      },
    };
    return admin as unknown as SupabaseClient;
  }

  it("stavke bez slug-a (test nivoa, masterclass reči, NaKI) uvek ostaju", async () => {
    const out = await getFreeCoursesText(adminWithFreeSlugs([]));
    expect(out).toContain("/besplatno-testiranje");
    expect(out).toContain("/masterclass-reci");
    expect(out).toContain("/naki");
    expect(out).not.toContain("polozi-goethe-b1");
  });

  it("Goethe masterclass ostaje dok je u bazi besplatan", async () => {
    const out = await getFreeCoursesText(adminWithFreeSlugs(["polozi-goethe-b1", "polozi-goethe-b2", "polozi-goethe-c1"]));
    expect(out).toContain("/kurs/polozi-goethe-b1");
    expect(out).toContain("NAPOMENA: nepotpun je");
  });
});
