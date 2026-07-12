import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { emailUsedCoupon } from "./coupon-ownership";

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
