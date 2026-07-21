import { describe, it, expect } from "vitest";
import {
  planForSlug,
  accessUntilForCharge,
  chargeAmountFor,
  unlockedSlugsAfter,
  SUBSCRIPTION_PLANS,
} from "./subscription-plans";

describe("planForSlug", () => {
  it("vraća plan za video paket A1-B1", () => {
    const p = planForSlug("paket-a1-a2-b1");
    expect(p?.monthlyRsd).toBe(3199);
    expect(p?.totalPayments).toBe(12);
  });

  it("vraća null za kurs bez pretplate", () => {
    expect(planForSlug("individualni-mesecni-paketi")).toBeNull();
    expect(planForSlug("nepostojeci")).toBeNull();
  });

  it("svi planovi su u granicama koje banka dozvoljava (max 121 naplata)", () => {
    for (const p of SUBSCRIPTION_PLANS) {
      expect(p.totalPayments).toBeGreaterThan(1);
      expect(p.totalPayments).toBeLessThanOrEqual(121);
    }
  });

  it("raspored otključavanja ne traži ratu koje nema u planu", () => {
    for (const p of SUBSCRIPTION_PLANS) {
      for (const u of p.unlocks) {
        expect(u.installment).toBeGreaterThanOrEqual(1);
        expect(u.installment).toBeLessThanOrEqual(p.totalPayments);
      }
    }
  });
});

describe("accessUntilForCharge", () => {
  it("daje mesec dana od naplate plus 7 dana zaliha", () => {
    const iz = accessUntilForCharge(new Date("2026-08-21T10:00:00Z"));
    expect(iz.toISOString().slice(0, 10)).toBe("2026-09-28");
  });

  it("ne puca na kraju meseca (31.01 → 28.02 + 7)", () => {
    const iz = accessUntilForCharge(new Date("2026-01-31T10:00:00Z"));
    expect(iz.getTime()).toBeGreaterThan(new Date("2026-02-28T10:00:00Z").getTime());
  });
});

describe("chargeAmountFor", () => {
  it("za pretplatu naplaćuje IZNOS RATE, ne punu cenu", () => {
    expect(chargeAmountFor("kartica_pretplata", "paket-a1-a2-b1", 29133)).toBe(3199);
  });

  it("za obične metode naplaćuje punu cenu", () => {
    expect(chargeAmountFor("kartica", "paket-a1-a2-b1", 29133)).toBe(29133);
    expect(chargeAmountFor("uplatnica", "paket-a1-a2-b1", 29133)).toBe(29133);
  });

  it("pretplata na kursu koji je nema pada nazad na punu cenu", () => {
    expect(chargeAmountFor("kartica_pretplata", "paket-a1-a2", 20475)).toBe(20475);
  });
});

describe("unlockedSlugsAfter", () => {
  const plan = planForSlug("paket-a1-a2-b1")!;

  it("prva rata otvara samo prvi nivo", () => {
    expect(unlockedSlugsAfter(plan, 1)).toEqual(["nemacki-a1-1"]);
  });

  it("druga rata otvara i A1.2", () => {
    expect(unlockedSlugsAfter(plan, 2)).toEqual(["nemacki-a1-1", "nemacki-a1-2"]);
  });

  it("mesec obnavljanja ne donosi nov nivo", () => {
    // 3. rata je mesec za obnavljanje i završni ispit A1 - isti sadržaj kao posle 2.
    expect(unlockedSlugsAfter(plan, 3)).toEqual(unlockedSlugsAfter(plan, 2));
    expect(unlockedSlugsAfter(plan, 6)).toEqual(unlockedSlugsAfter(plan, 5));
  });

  it("od osme rate je otključano svih šest kurseva", () => {
    expect(unlockedSlugsAfter(plan, 8)).toHaveLength(6);
    expect(unlockedSlugsAfter(plan, 12)).toHaveLength(6);
  });

  it("nula plaćenih rata ne otvara ništa", () => {
    expect(unlockedSlugsAfter(plan, 0)).toEqual([]);
  });

  it("raspored prati dogovor: parovi 1-2, 4-5, 7-8", () => {
    expect(unlockedSlugsAfter(plan, 4)).toContain("nemacki-a2-1");
    expect(unlockedSlugsAfter(plan, 5)).toContain("nemacki-a2-2");
    expect(unlockedSlugsAfter(plan, 7)).toContain("nemacki-b1-1");
    expect(unlockedSlugsAfter(plan, 7)).not.toContain("nemacki-b1-2");
  });
});
