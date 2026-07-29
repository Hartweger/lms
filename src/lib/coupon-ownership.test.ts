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
