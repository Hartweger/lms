import { describe, it, expect } from "vitest";
import { groupExpiryRows } from "./expiry-grouping";

const r = (user_id: string, course_id: string, expires_at: string) => ({ user_id, course_id, expires_at });

describe("groupExpiryRows", () => {
  it("paket od 6 nivoa sa istim istekom daje JEDNU grupu (jedan mejl, ne šest)", () => {
    const istek = "2026-08-27T16:27:11+00:00";
    const rows = ["a1-1", "a1-2", "a2-1", "a2-2", "b1-1", "b1-2"].map((c) => r("u1", c, istek));
    const groups = groupExpiryRows(rows);
    expect(groups).toHaveLength(1);
    expect(groups[0].rows).toHaveLength(6);
    expect(groups[0].userId).toBe("u1");
  });

  it("različiti polaznici ostaju razdvojeni", () => {
    const istek = "2026-08-27T16:27:11+00:00";
    const groups = groupExpiryRows([r("u1", "a1-1", istek), r("u2", "a1-1", istek)]);
    expect(groups).toHaveLength(2);
  });

  it("isti polaznik sa istekom u različite dane dobija odvojene grupe", () => {
    const groups = groupExpiryRows([
      r("u1", "a1-1", "2026-08-27T16:27:11+00:00"),
      r("u1", "b1-1", "2026-09-10T10:00:00+00:00"),
    ]);
    expect(groups).toHaveLength(2);
  });

  it("isti dan a različit sat = jedna grupa, datum je najraniji istek", () => {
    const groups = groupExpiryRows([
      r("u1", "a1-1", "2026-08-27T16:27:11+00:00"),
      r("u1", "a1-2", "2026-08-27T08:00:00+00:00"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].expiresAt).toBe("2026-08-27T08:00:00+00:00");
    expect(groups[0].rows).toHaveLength(2);
  });

  it("prazan ulaz daje praznu listu", () => {
    expect(groupExpiryRows([])).toEqual([]);
  });
});
