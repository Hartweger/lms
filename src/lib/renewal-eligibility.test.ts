import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeAdmin } from "@/lib/test/fake-admin";
import { enrollmentDerivedCourseIds, emailCanRenewWithCoupon } from "./renewal-eligibility";

type Row = Record<string, unknown>;

// v-a1 (video, CEO nivo) otključava a11 i a12; grupni proizvod je POLUNIVO (grp-a11 → a11).
function admin(over: Record<string, Row[]> = {}) {
  return createFakeAdmin({
    user_profiles: [{ id: "u1", email: "ana@example.com" }],
    course_unlocks: [
      { purchasable_course_id: "v-a1", content_course_id: "a11" },
      { purchasable_course_id: "v-a1", content_course_id: "a12" },
      { purchasable_course_id: "grp-a11", content_course_id: "a11" },
      { purchasable_course_id: "ind-a11", content_course_id: "a11" },
    ],
    courses: [
      { slug: "grp-a11", category: "grupni" },
      { slug: "ind-a11", category: "individualni" },
      { slug: "ind-mesecni", category: "mesecni" },
      { slug: "v-a1", category: "video" },
    ],
    orders: [],
    course_access: [],
    ...over,
  }).admin as unknown as SupabaseClient;
}

const order = (num: string, slug: string) => ({
  id: `id-${num}`, order_number: num, items: [{ course_slug: slug }],
});

describe("enrollmentDerivedCourseIds", () => {
  it("ručni upis u grupu - izvor počinje sa grupa-", async () => {
    const a = admin({ course_access: [{ user_id: "u1", course_id: "a11", source: "grupa-rucni-unos" }] });
    expect([...(await enrollmentDerivedCourseIds(a, "u1"))]).toEqual(["a11"]);
  });

  it("pristup iz porudžbine grupnog kursa", async () => {
    const a = admin({
      orders: [order("2026-064", "grp-a11")],
      course_access: [{ user_id: "u1", course_id: "a11", source: "order:2026-064" }],
    });
    expect((await enrollmentDerivedCourseIds(a, "u1")).has("a11")).toBe(true);
  });

  it("pristup iz porudžbine individualnog i mesečnog paketa", async () => {
    const a = admin({
      orders: [order("2026-068", "ind-a11"), order("2026-073", "ind-mesecni")],
      course_access: [
        { user_id: "u1", course_id: "a11", source: "order:2026-068" },
        { user_id: "u1", course_id: "a12", source: "order:2026-073" },
      ],
    });
    const set = await enrollmentDerivedCourseIds(a, "u1");
    expect(set.has("a11")).toBe(true);
    expect(set.has("a12")).toBe(true);
  });

  it("porudžbina video kursa NIJE upis - obnova ostaje", async () => {
    const a = admin({
      orders: [order("2026-071", "v-a1")],
      course_access: [{ user_id: "u1", course_id: "a11", source: "order:2026-071" }],
    });
    expect((await enrollmentDerivedCourseIds(a, "u1")).size).toBe(0);
  });

  it("stari WP pristup i prazan izvor se tumače u korist polaznika", async () => {
    const a = admin({
      course_access: [
        { user_id: "u1", course_id: "a11", source: "wp-migration-2026-06" },
        { user_id: "u1", course_id: "a12", source: null },
      ],
    });
    expect((await enrollmentDerivedCourseIds(a, "u1")).size).toBe(0);
  });

  it("izvor može da nosi id porudžbine umesto broja", async () => {
    const uuid = "1f116bd1-be13-4a92-bddf-63d309d60f8f";
    const a = admin({
      orders: [{ id: uuid, order_number: null, items: [{ course_slug: "grp-a11" }] }],
      course_access: [{ user_id: "u1", course_id: "a11", source: `order:${uuid}` }],
    });
    expect((await enrollmentDerivedCourseIds(a, "u1")).has("a11")).toBe(true);
  });

  it("tuđi pristup se ne računa", async () => {
    const a = admin({ course_access: [{ user_id: "u2", course_id: "a11", source: "grupa-rucni-unos" }] });
    expect((await enrollmentDerivedCourseIds(a, "u1")).size).toBe(0);
  });
});

describe("emailCanRenewWithCoupon", () => {
  it("false kad pristup dolazi SAMO iz grupnog upisa (polunivo → ceo nivo za pola cene)", async () => {
    const a = admin({
      orders: [order("2026-064", "grp-a11")],
      course_access: [{ user_id: "u1", course_id: "a11", source: "order:2026-064" }],
    });
    expect(await emailCanRenewWithCoupon(a, "ana@example.com", "v-a1")).toBe(false);
  });

  it("true kad pored grupe ima i stariji plaćen video pristup drugom polunivou", async () => {
    const a = admin({
      orders: [order("2026-064", "grp-a11")],
      course_access: [
        { user_id: "u1", course_id: "a11", source: "order:2026-064" },
        { user_id: "u1", course_id: "a12", source: "wp-migration-2026-06" },
      ],
    });
    expect(await emailCanRenewWithCoupon(a, "ana@example.com", "v-a1")).toBe(true);
  });

  it("true za običnog video kupca", async () => {
    const a = admin({ course_access: [{ user_id: "u1", course_id: "a11", source: "wp-migration-2026-06" }] });
    expect(await emailCanRenewWithCoupon(a, "ana@example.com", "v-a1")).toBe(true);
  });

  it("true kad je pristup upisan direktno na sam proizvod (kurs sam sebi proizvod)", async () => {
    const a = admin({ course_access: [{ user_id: "u1", course_id: "fsp", source: "order:2026-118" }] });
    expect(await emailCanRenewWithCoupon(a, "ana@example.com", "fsp")).toBe(true);
  });

  it("false kad polaznik nema nikakav pristup", async () => {
    expect(await emailCanRenewWithCoupon(admin(), "ana@example.com", "v-a1")).toBe(false);
  });

  it("false za nepoznat mejl", async () => {
    expect(await emailCanRenewWithCoupon(admin(), "niko@example.com", "v-a1")).toBe(false);
  });
});
