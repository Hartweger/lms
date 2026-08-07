import { describe, it, expect } from "vitest";
import { renderCatalog, renderPreviewLessons, renderOpenGroups, type CatalogCourse, type PreviewLesson } from "./catalog";
import type { GrupaRaspored } from "@/lib/raspored";

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
  ...o,
});

describe("renderOpenGroups", () => {
  it("daje nivo, datum početka, dane i sat, mesta, cenu i link u jednom redu", () => {
    const out = renderOpenGroups([grupa()]);
    expect(out).toContain("A1.1");
    expect(out).toContain("početak 11.08.2026");
    expect(out).toContain("utorak, četvrtak 20:00-21:00");
    expect(out).toContain("7 nedelja");
    expect(out).toContain("5 od 6 mesta slobodno");
    expect(out).toContain("19.600 RSD / 168 EUR");
    expect(out).toContain("https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-a1-1");
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
