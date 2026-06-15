import { describe, it, expect } from "vitest";
import { couponPrice, LEVEL_VIDEO_COURSE, stickyLevel, courseUpsellAddon, getLevelCourse } from "./courses";
import type { SupabaseClient } from "@supabase/supabase-js";

function fakeAdmin(result: { data: unknown; error: unknown }): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => result }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("couponPrice", () => {
  it("oduzme 10% i zaokruži", () => {
    expect(couponPrice(11600)).toBe(10440);
    expect(couponPrice(9999)).toBe(8999);
  });
});

describe("LEVEL_VIDEO_COURSE", () => {
  it("ima A1/A2/B1, nema B2/C1", () => {
    expect(Object.keys(LEVEL_VIDEO_COURSE).sort()).toEqual(["A1", "A2", "B1"]);
    expect(LEVEL_VIDEO_COURSE.B1.slug).toBe("video-kurs-b1");
  });
});

describe("stickyLevel", () => {
  it("vrati poslednji pomenuti nivo, neosetljivo na veličinu slova", () => {
    expect(stickyLevel(["učim b1", "daj mi vežbu"])).toBe("B1");
    expect(stickyLevel(["A2 sam", "a sad B1 vežbam"])).toBe("B1");
  });
  it("vrati null kad nema nivoa", () => {
    expect(stickyLevel(["zdravo", "daj vežbu"])).toBeNull();
  });
});

describe("courseUpsellAddon", () => {
  it("ubaci slug, cenu i /kursevi, bez kupona", () => {
    const out = courseUpsellAddon({ slug: "video-kurs-b1", title: "VIDEO kurs B1", price: 11600 });
    expect(out).toContain("video-kurs-b1");
    expect(out).toContain("11600");
    expect(out).toContain("/kursevi/");
    expect(out).not.toContain("NAKI10");
  });
  it("vrati prazan string za null", () => {
    expect(courseUpsellAddon(null)).toBe("");
  });
});

describe("getLevelCourse", () => {
  it("vrati kurs sa živom cenom za mapiran nivo", async () => {
    const c = await getLevelCourse(fakeAdmin({ data: { price: 11600 }, error: null }), "B1");
    expect(c).toEqual({ slug: "video-kurs-b1", title: "VIDEO kurs B1", price: 11600 });
  });
  it("null za nemapiran nivo (B2)", async () => {
    expect(await getLevelCourse(fakeAdmin({ data: { price: 1 }, error: null }), "B2")).toBeNull();
  });
  it("null kada cena nedostaje", async () => {
    expect(await getLevelCourse(fakeAdmin({ data: { price: null }, error: null }), "A1")).toBeNull();
  });
  it("null kada upit padne", async () => {
    expect(await getLevelCourse(fakeAdmin({ data: null, error: { msg: "x" } }), "A1")).toBeNull();
  });
  it("null za null nivo", async () => {
    expect(await getLevelCourse(fakeAdmin({ data: { price: 1 }, error: null }), null)).toBeNull();
  });
});
