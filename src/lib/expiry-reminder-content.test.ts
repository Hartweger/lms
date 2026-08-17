import { describe, it, expect } from "vitest";
import { expiryReminderContent } from "./email";

const now = new Date("2026-08-13T11:00:00Z");
const istek = "2026-08-27T16:27:11Z";

/** Stvarni slučaj: paket A1-A2-B1 = 6 nivoa, obnavlja se kroz 3 video kursa. */
const paket6 = [
  { courseTitle: "Nemački A1.1", renewSlug: "video-kurs-a1", renewTitle: "VIDEO kurs A1" },
  { courseTitle: "Nemački A1.2", renewSlug: "video-kurs-a1", renewTitle: "VIDEO kurs A1" },
  { courseTitle: "Nemački A2.1", renewSlug: "video-kurs-a2", renewTitle: "VIDEO kurs A2" },
  { courseTitle: "Nemački A2.2", renewSlug: "video-kurs-a2", renewTitle: "VIDEO kurs A2" },
  { courseTitle: "Nemački B1.1", renewSlug: "video-kurs-b1", renewTitle: "VIDEO kurs B1" },
  { courseTitle: "Nemački B1.2", renewSlug: "video-kurs-b1", renewTitle: "VIDEO kurs B1" },
];

describe("expiryReminderContent", () => {
  it("jedan kurs - kopija ostaje kakva je bila (naziv u rečenici, jedno dugme)", () => {
    const c = expiryReminderContent({
      name: "Ana", expiresAt: istek, now,
      items: [{ courseTitle: "Nemački A1.1", renewSlug: "video-kurs-a1", renewTitle: "VIDEO kurs A1" }],
      couponDaysAfter: 60,
    })!;
    expect(c.subject).toBe("Tvoj pristup kursu ističe 27. avgust 2026. - obnovi sa 50% popusta");
    expect(c.html).toContain("na platformi za <strong>Nemački A1.1</strong> ističe");
    expect(c.html).not.toContain("<ul");
    expect(c.html.match(/kupovina\//g)).toHaveLength(1);
    expect(c.html).toContain(">Obnovi pristup<");
  });

  it("šest kurseva - jedan mejl sa spiskom svih šest", () => {
    const c = expiryReminderContent({ name: "Jovana", expiresAt: istek, now, items: paket6, couponDaysAfter: 60 })!;
    expect(c.subject).toBe("Tvoj pristup kursevima ističe 27. avgust 2026. - obnovi sa 50% popusta");
    expect(c.html.match(/<li>/g)).toHaveLength(6);
    for (const i of paket6) expect(c.html).toContain(`<li>${i.courseTitle}</li>`);
  });

  it("dugme po proizvodu, bez ponavljanja - 6 nivoa daje 3 dugmeta sa nazivom", () => {
    const c = expiryReminderContent({ name: "Jovana", expiresAt: istek, now, items: paket6, couponDaysAfter: 60 })!;
    expect(c.html.match(/kupovina\//g)).toHaveLength(3);
    expect(c.html).toContain("Obnovi: VIDEO kurs A1");
    expect(c.html).toContain("Obnovi: VIDEO kurs A2");
    expect(c.html).toContain("Obnovi: VIDEO kurs B1");
    expect(c.html).not.toContain(">Obnovi pristup<");
  });

  it("kupon i njegov rok se vide u mejlu", () => {
    const c = expiryReminderContent({ name: "Jovana", expiresAt: istek, now, items: paket6, couponDaysAfter: 60 })!;
    expect(c.html).toContain("OBNOVI50");
    expect(c.html).toContain("Važi do <strong>26. oktobar 2026.</strong>");
  });

  it("bez kupona (ind/grupni) - nema koda ni linka na kupovinu", () => {
    const c = expiryReminderContent({ name: "Jovana", expiresAt: istek, now, items: paket6, withCoupon: false })!;
    expect(c.subject).toBe("Tvoj pristup materijalima ističe 27. avgust 2026.");
    expect(c.html).not.toContain("OBNOVI50");
    expect(c.html).not.toContain("kupovina/");
    expect(c.html).toContain("Javi nam se");
    expect(c.html.match(/<li>/g)).toHaveLength(6);
  });

  it("kurs bez proizvoda za obnovu ne daje kupon-verziju", () => {
    const c = expiryReminderContent({
      name: "Ana", expiresAt: istek, now, items: [{ courseTitle: "Kurs konverzacije", renewSlug: null }],
    })!;
    expect(c.html).not.toContain("OBNOVI50");
    expect(c.html).toContain("Javi nam se");
  });

  it("prazan spisak ne pravi mejl", () => {
    expect(expiryReminderContent({ name: "Ana", expiresAt: istek, now, items: [] })).toBeNull();
  });

  it("naziv kursa se escape-uje", () => {
    const c = expiryReminderContent({
      name: "Ana", expiresAt: istek, now,
      items: [{ courseTitle: "A1 <script>", renewSlug: "video-kurs-a1" }, { courseTitle: "A2", renewSlug: "video-kurs-a2" }],
    })!;
    expect(c.html).not.toContain("<script>");
    expect(c.html).toContain("&lt;script&gt;");
  });
});
