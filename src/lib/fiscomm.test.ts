import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFakeAdmin } from "@/lib/test/fake-admin";

const h = vi.hoisted(() => {
  process.env.FISCOMM_API_KEY = "test-key"; // FISCOMM konstanta se čita pri importu modula
  return {
    fake: null as unknown as ReturnType<typeof import("@/lib/test/fake-admin").createFakeAdmin>,
    sentry: { captureException: vi.fn() },
  };
});

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.admin }));
vi.mock("@sentry/nextjs", () => h.sentry);
vi.mock("@/lib/site-url", () => ({ SITE_URL: "https://test.local" }));

import { fiscalizeOrder } from "./fiscomm";

const realFetch = global.fetch;

function order(over: Record<string, unknown> = {}) {
  return {
    id: "o1", order_number: 1001, payment_status: "completed", total: 4800,
    payment_method: "kartica", country: "RS", fiscal_referent_number: null,
    items: [{ title: "Kurs X" }], ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.fake = createFakeAdmin({ orders: [order()] });
});
afterEach(() => { global.fetch = realFetch; });

describe("fiscalizeOrder - vidljivost pada", () => {
  it("API greška (500) → ok:false + Sentry + fiscal_response sačuvan", async () => {
    global.fetch = vi.fn(async () => new Response("oops", { status: 500 })) as typeof fetch;

    const res = await fiscalizeOrder("o1");

    expect(res.ok).toBe(false);
    expect(h.sentry.captureException).toHaveBeenCalled();
    expect(h.fake.row("orders", (r) => r.id === "o1")!.fiscal_response).toBeTruthy();
  });

  it("mrežni izuzetak → ok:false + Sentry", async () => {
    global.fetch = vi.fn(async () => { throw new Error("ECONNRESET"); }) as typeof fetch;

    const res = await fiscalizeOrder("o1");

    expect(res.ok).toBe(false);
    expect(h.sentry.captureException).toHaveBeenCalled();
  });

  it("uspeh → upisuje fiskalna polja, bez Sentry", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({
      referentDocumentNumber: "ABC-123", verificationUrl: "https://suf.purs.gov.rs/v/x",
    }), { status: 200 })) as typeof fetch;

    const res = await fiscalizeOrder("o1");

    expect(res.ok).toBe(true);
    expect(h.fake.row("orders", (r) => r.id === "o1")!.fiscal_referent_number).toBe("ABC-123");
    expect(h.sentry.captureException).not.toHaveBeenCalled();
  });
});
