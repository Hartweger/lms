import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeAdmin } from "@/lib/test/fake-admin";

const h = vi.hoisted(() => ({
  query: null as unknown as { procReturnCode: string } | null,
  throws: false,
  sentry: { captureException: vi.fn() },
}));

vi.mock("@sentry/nextjs", () => h.sentry);
vi.mock("@/lib/nestpay", () => ({
  queryTransaction: vi.fn(async () => {
    if (h.throws) throw new Error("ECONNRESET");
    return h.query;
  }),
}));
vi.mock("@/lib/grant-access", () => ({ grantAccessForOrder: vi.fn(async () => ({ ok: true })) }));

import { reconcilePendingCards } from "./reconcile-cards";
import { grantAccessForOrder } from "@/lib/grant-access";
import { queryTransaction } from "@/lib/nestpay";

const NOW = Date.parse("2026-08-16T22:00:00Z");
const minutesAgo = (m: number) => new Date(NOW - m * 60000).toISOString();

function pendingOrder(over: Record<string, unknown> = {}) {
  return {
    id: "o1", order_number: "2026-311", total: 3600,
    payment_method: "kartica", payment_status: "pending",
    created_at: minutesAgo(120), nestpay_status: null, ...over,
  };
}

function run(seed: Record<string, unknown>[], opts: { maxAgeMs?: number } = {}) {
  const fake = createFakeAdmin({ orders: seed });
  return {
    fake,
    result: reconcilePendingCards(fake.admin as unknown as SupabaseClient, { nowMs: NOW, ...opts }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.query = null;
  h.throws = false;
});

describe("reconcilePendingCards", () => {
  it("banka potvrdi naplatu → pristup + nestpay_status=charged", async () => {
    h.query = { procReturnCode: "00" };
    const { fake, result } = run([pendingOrder()]);

    const { reconciled, answers } = await result;

    expect(grantAccessForOrder).toHaveBeenCalledWith("o1");
    expect(fake.row("orders", (r) => r.id === "o1")?.nestpay_status).toBe("charged");
    expect(answers.get("o1")).toBe("charged");
    expect(reconciled).toBe(1);
  });

  it("banka kaže da naplate nema → bez pristupa, odgovor not-charged", async () => {
    h.query = { procReturnCode: "99" };
    const { result } = run([pendingOrder()]);

    const { reconciled, answers } = await result;

    expect(grantAccessForOrder).not.toHaveBeenCalled();
    expect(answers.get("o1")).toBe("not-charged");
    expect(reconciled).toBe(0);
  });

  it("upit banci padne (null) → odgovor unknown, bez pristupa", async () => {
    h.query = null;
    const { result } = run([pendingOrder()]);

    const { answers } = await result;

    expect(answers.get("o1")).toBe("unknown");
    expect(grantAccessForOrder).not.toHaveBeenCalled();
  });

  it("upit banci pukne izuzetkom → unknown + Sentry, ostale porudžbine se i dalje obrade", async () => {
    h.throws = true;
    const { result } = run([pendingOrder(), pendingOrder({ id: "o2", order_number: "2026-312" })]);

    const { answers } = await result;

    expect(answers.get("o1")).toBe("unknown");
    expect(answers.get("o2")).toBe("unknown");
    expect(h.sentry.captureException).toHaveBeenCalled();
  });

  it("porudžbina mlađa od 15 min se ne pita (kupac je možda još na strani banke)", async () => {
    h.query = { procReturnCode: "00" };
    const { result } = run([pendingOrder({ created_at: minutesAgo(5) })]);

    const { checked, answers } = await result;

    expect(queryTransaction).not.toHaveBeenCalled();
    expect(checked).toBe(0);
    expect(answers.size).toBe(0);
  });

  it("maxAgeMs: brzi prolaz gleda samo sveže porudžbine", async () => {
    h.query = { procReturnCode: "00" };
    const { result } = run(
      [pendingOrder({ id: "stara", created_at: minutesAgo(60 * 48) }), pendingOrder()],
      { maxAgeMs: 24 * 3600_000 }
    );

    const { answers } = await result;

    expect(answers.has("stara")).toBe(false);
    expect(answers.get("o1")).toBe("charged");
  });

  it("uplatnica se ne dira", async () => {
    h.query = { procReturnCode: "00" };
    const { result } = run([pendingOrder({ payment_method: "uplatnica" })]);

    const { checked } = await result;

    expect(checked).toBe(0);
    expect(grantAccessForOrder).not.toHaveBeenCalled();
  });
});
