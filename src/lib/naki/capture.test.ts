import { describe, it, expect } from "vitest";
import { buildWelcomeHtml } from "./capture";

const PLAN = "Hallo, Marija!\n\n1. Test\nprimer";

describe("buildWelcomeHtml", () => {
  it("kad ima levelCourse i kupon: dugme vodi na kurs nivoa + prikaz NAKI10 cene", () => {
    const html = buildWelcomeHtml("Marija", "B1", PLAN, true, {
      slug: "video-kurs-b1", title: "VIDEO kurs B1", price: 11600,
    });
    expect(html).toContain("/kursevi/video-kurs-b1");
    expect(html).toContain("Pogledaj VIDEO kurs B1");
    expect(html).toContain("NAKI10");
    expect(html).toContain("10.440");
  });
  it("kad ima levelCourse bez kupona: cena bez popusta, bez NAKI10 u CTA delu", () => {
    const html = buildWelcomeHtml("Marija", "B1", PLAN, false, {
      slug: "video-kurs-b1", title: "VIDEO kurs B1", price: 11600,
    });
    expect(html).toContain("/kursevi/video-kurs-b1");
    expect(html).toContain("11.600");
  });
  it("bez levelCourse: generično dugme /kursevi", () => {
    const html = buildWelcomeHtml("Marija", "C1", PLAN, true, null);
    expect(html).toContain("/kursevi?utm_source=naki");
    expect(html).toContain("Pogledaj kurseve");
  });
});
