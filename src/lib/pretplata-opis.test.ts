import { describe, it, expect } from "vitest";
import { pretplataOpis } from "./pretplata-opis";
import { planForSlug } from "./subscription-plans";

describe("pretplataOpis", () => {
  it("za članstvo: mesečna pretplata do otkazivanja, bez ukupnog zbira", () => {
    const o = pretplataOpis(planForSlug("nh-clanstvo")!, 2290);
    expect(o.naslov).toContain("Mesečna pretplata");
    const sve = o.stavke.join(" ");
    expect(sve).toContain("2.290");
    expect(sve).toContain("dok je pretplata aktivna");
    expect(sve).toContain("Moj nalog");
    // bankina obaveza: maksimalan broj naplata mora biti naveden
    expect(sve).toContain("121");
    // ne sme da prikazuje zbir kao obavezu (121 × 2290 = 277.090)
    expect(sve).not.toContain("277");
  });

  it("za paket: zadržava postojeći narativ sa ukupnim iznosom i otključavanjem", () => {
    const o = pretplataOpis(planForSlug("paket-a1-a2-b1")!, 29133);
    const sve = o.stavke.join(" ");
    expect(sve).toContain("38.388"); // 3.199 × 12
    expect(sve).toContain("A1.1");
  });
});
