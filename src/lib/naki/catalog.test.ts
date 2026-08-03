import { describe, it, expect } from "vitest";
import { renderCatalog, renderPreviewLessons, type CatalogCourse, type PreviewLesson } from "./catalog";

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
