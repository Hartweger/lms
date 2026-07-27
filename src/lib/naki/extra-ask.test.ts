import { describe, it, expect } from "vitest";
import { pickExtraAsk } from "./extra-ask";

describe("pickExtraAsk", () => {
  const sve = {
    support: "S",
    gender: "R",
    examiner: "I",
    upsell: "K",
    blogLink: "B",
  };

  it("propušta samo jedan nalog po odgovoru", () => {
    expect(pickExtraAsk(sve).text).toBe("S");
  });

  it("podrška ima prednost nad svime - korisnik je zaglavljen", () => {
    expect(pickExtraAsk({ ...sve, support: "S" }).which).toBe("support");
  });

  it("rod ide pre kredencijala i ponude - od njega zavisi svaka sledeća rečenica", () => {
    expect(pickExtraAsk({ ...sve, support: "" }).which).toBe("gender");
  });

  it("kredencijal ide pre ponude kursa", () => {
    expect(pickExtraAsk({ ...sve, support: "", gender: "" }).which).toBe("examiner");
  });

  it("ponuda kursa ide pre blog linka", () => {
    expect(pickExtraAsk({ ...sve, support: "", gender: "", examiner: "" }).which).toBe("upsell");
  });

  it("blog je poslednji - lep je, ali najmanje vredi", () => {
    const out = pickExtraAsk({ support: "", gender: "", examiner: "", upsell: "", blogLink: "B" });
    expect(out.which).toBe("blogLink");
    expect(out.text).toBe("B");
  });

  it("kad nema nijednog naloga, ne dodaje ništa", () => {
    const out = pickExtraAsk({ support: "", gender: "", examiner: "", upsell: "", blogLink: "" });
    expect(out.which).toBeNull();
    expect(out.text).toBe("");
  });

  // Dopisivanje ponude u kodu sme SAMO ako je ponuda i dobila slot - inače bi
  // korisnik u istom odgovoru dobio i pitanje o rodu i ponudu kursa.
  it("kaže da li je ponuda kursa dobila slot", () => {
    expect(pickExtraAsk({ ...sve, support: "", gender: "", examiner: "" }).upsellWon).toBe(true);
    expect(pickExtraAsk(sve).upsellWon).toBe(false);
  });
});
