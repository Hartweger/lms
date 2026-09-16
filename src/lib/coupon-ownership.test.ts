import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeAdmin } from "@/lib/test/fake-admin";
import { emailUsedCoupon, emailOwnsCourse } from "./coupon-ownership";

type Row = Record<string, unknown>;

/** Mini in-memory imitacija supabase query buildera za tabelu orders. */
function fakeAdmin(rows: Row[]): SupabaseClient {
  const builder = (current: Row[]) => ({
    select: () => builder(current),
    eq: (col: string, val: unknown) => builder(current.filter((r) => r[col] === val)),
    ilike: (col: string, val: string) =>
      builder(current.filter((r) => String(r[col]).toLowerCase() === val.toLowerCase())),
    limit: (n: number) => Promise.resolve({ data: current.slice(0, n), error: null }),
  });
  return { from: () => builder(rows) } as unknown as SupabaseClient;
}

const base = { coupon_code: "NAKI10", email: "ana@example.com" };

describe("emailUsedCoupon", () => {
  it("true kad postoji naplaćena porudžbina sa tim kuponom i mejlom", async () => {
    const admin = fakeAdmin([{ ...base, payment_status: "completed" }]);
    expect(await emailUsedCoupon(admin, "NAKI10", "ana@example.com")).toBe(true);
  });

  it("mejl se poredi bez obzira na velika/mala slova", async () => {
    const admin = fakeAdmin([{ ...base, payment_status: "completed" }]);
    expect(await emailUsedCoupon(admin, "NAKI10", "Ana@Example.com")).toBe(true);
  });

  it("false kad je jedini pokušaj propao (odbijena kartica) - polaznik sme ponovo", async () => {
    const admin = fakeAdmin([
      { ...base, payment_status: "pending" },
      { ...base, payment_status: "failed" },
      { ...base, payment_status: "cancelled" },
    ]);
    expect(await emailUsedCoupon(admin, "NAKI10", "ana@example.com")).toBe(false);
  });

  it("false za drugi mejl ili drugi kupon", async () => {
    const admin = fakeAdmin([{ ...base, payment_status: "completed" }]);
    expect(await emailUsedCoupon(admin, "NAKI10", "petar@example.com")).toBe(false);
    expect(await emailUsedCoupon(admin, "OBNOVI50", "ana@example.com")).toBe(false);
  });
});

// OBNOVI50 je renewal_only: važi samo za obnovu kursa koji mejl već ima. Pristup se
// vodi na SADRŽAJNI kurs, a kupuje se PROIZVOD - bez mapiranja preko course_unlocks
// kupon je odbijao baš one kojima je namenjen.
function ownershipAdmin(over: Record<string, Record<string, unknown>[]> = {}) {
  return createFakeAdmin({
    user_profiles: [{ id: "u1", email: "ana@example.com" }],
    course_unlocks: [
      { purchasable_course_id: "v-a1", content_course_id: "a11" },
      { purchasable_course_id: "v-a1", content_course_id: "a12" },
    ],
    course_access: [{ user_id: "u1", course_id: "a11" }],
    individual_enrollments: [],
    ...over,
  }).admin as unknown as SupabaseClient;
}

describe("emailOwnsCourse", () => {
  it("true za proizvod čiji sadržajni kurs polaznik ima (video-kurs-a1 ← nemacki-a1-1)", async () => {
    expect(await emailOwnsCourse(ownershipAdmin(), "ana@example.com", "v-a1")).toBe(true);
  });

  it("true kad je pristup upisan direktno na sam kurs", async () => {
    expect(await emailOwnsCourse(ownershipAdmin(), "ana@example.com", "a11")).toBe(true);
  });

  it("false za proizvod koji nema veze sa onim što polaznik ima", async () => {
    expect(await emailOwnsCourse(ownershipAdmin(), "ana@example.com", "v-b2")).toBe(false);
  });

  it("false kad polaznik nema nijedan sadržajni kurs tog proizvoda", async () => {
    const admin = ownershipAdmin({ course_access: [{ user_id: "u1", course_id: "b11" }] });
    expect(await emailOwnsCourse(admin, "ana@example.com", "v-a1")).toBe(false);
  });

  it("false za nepoznat mejl", async () => {
    expect(await emailOwnsCourse(ownershipAdmin(), "niko@example.com", "v-a1")).toBe(false);
  });
});

// Paket (A1+A2) otključava sadržaj VIŠE video kurseva. Kupon za obnovu važi samo za ono
// što je polaznik već imao, pa vlasnik samog A1 ne sme da uzme ceo paket upola cene
// (odluka Nataše 16.09.2026, povod Katarina J.: A1 do 06.10, u novembru kupuje A1+A2).
function paketAdmin(courseAccess: Record<string, unknown>[]) {
  return createFakeAdmin({
    user_profiles: [{ id: "u1", email: "ana@example.com" }],
    courses: [
      { id: "v-a1", course_type: "video" },
      { id: "v-a2", course_type: "video" },
      { id: "pk-a1-a2", course_type: "video" },
      { id: "pk-a1-a2-b1", course_type: "video" },
      { id: "g-a11", course_type: "grupni" },
    ],
    course_unlocks: [
      { purchasable_course_id: "v-a1", content_course_id: "a11" },
      { purchasable_course_id: "v-a1", content_course_id: "a12" },
      { purchasable_course_id: "v-a2", content_course_id: "a21" },
      { purchasable_course_id: "v-a2", content_course_id: "a22" },
      { purchasable_course_id: "pk-a1-a2", content_course_id: "a11" },
      { purchasable_course_id: "pk-a1-a2", content_course_id: "a12" },
      { purchasable_course_id: "pk-a1-a2", content_course_id: "a21" },
      { purchasable_course_id: "pk-a1-a2", content_course_id: "a22" },
      { purchasable_course_id: "pk-a1-a2-b1", content_course_id: "a11" },
      { purchasable_course_id: "pk-a1-a2-b1", content_course_id: "a12" },
      { purchasable_course_id: "pk-a1-a2-b1", content_course_id: "a21" },
      { purchasable_course_id: "pk-a1-a2-b1", content_course_id: "a22" },
      { purchasable_course_id: "pk-a1-a2-b1", content_course_id: "b11" },
      { purchasable_course_id: "pk-a1-a2-b1", content_course_id: "b12" },
      // grupni A1.1 daje samo a11 - NIJE video komponenta, ne sme da pooštri video-kurs-a1
      { purchasable_course_id: "g-a11", content_course_id: "a11" },
    ],
    course_access: courseAccess,
    individual_enrollments: [],
  }).admin as unknown as SupabaseClient;
}

describe("emailOwnsCourse - paketi", () => {
  it("vlasnik samo A1 NE može paket A1+A2 (dobio bi A2 upola cene)", async () => {
    const admin = paketAdmin([{ user_id: "u1", course_id: "a11" }, { user_id: "u1", course_id: "a12" }]);
    expect(await emailOwnsCourse(admin, "ana@example.com", "pk-a1-a2")).toBe(false);
  });

  it("vlasnik A1 i A2 može paket A1+A2", async () => {
    const admin = paketAdmin([{ user_id: "u1", course_id: "a11" }, { user_id: "u1", course_id: "a21" }]);
    expect(await emailOwnsCourse(admin, "ana@example.com", "pk-a1-a2")).toBe(true);
  });

  it("vlasnik A1 i A2 NE može paket A1+A2+B1 (nema B1)", async () => {
    const admin = paketAdmin([{ user_id: "u1", course_id: "a11" }, { user_id: "u1", course_id: "a21" }]);
    expect(await emailOwnsCourse(admin, "ana@example.com", "pk-a1-a2-b1")).toBe(false);
  });

  it("migrirani polaznik sa samo A1.1 i dalje može da obnovi video-kurs-a1", async () => {
    const admin = paketAdmin([{ user_id: "u1", course_id: "a11" }]);
    expect(await emailOwnsCourse(admin, "ana@example.com", "v-a1")).toBe(true);
  });

  it("vlasnik A1 ne može video-kurs-a2", async () => {
    const admin = paketAdmin([{ user_id: "u1", course_id: "a11" }, { user_id: "u1", course_id: "a12" }]);
    expect(await emailOwnsCourse(admin, "ana@example.com", "v-a2")).toBe(false);
  });
});
