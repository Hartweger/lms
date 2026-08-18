import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdmin } from "@/lib/test/fake-admin";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof import("@/lib/test/fake-admin").createFakeAdmin>,
  query: null as { procReturnCode: string } | null,
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.admin }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/nestpay", () => ({ queryTransaction: vi.fn(async () => h.query) }));
vi.mock("@/lib/grant-access", () => ({ grantAccessForOrder: vi.fn(async () => ({ ok: true })) }));

import { GET } from "./route";
import { grantAccessForOrder } from "@/lib/grant-access";

const hoursAgo = (hrs: number) => new Date(Date.now() - hrs * 3600000).toISOString();

function cronRequest() {
  return new Request("https://test.local/api/cron/nestpay-poll", {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
}

function pendingCard(over: Record<string, unknown> = {}) {
  return {
    id: "o1", order_number: "2026-311", payment_method: "kartica",
    payment_status: "pending", total: 3600, created_at: hoursAgo(2), ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-cron";
  h.query = null;
});

describe("nestpay-poll", () => {
  it("izgubljen callback: banka kaže naplaćeno → pristup odmah", async () => {
    h.fake = createFakeAdmin({ orders: [pendingCard()] });
    h.query = { procReturnCode: "00" };

    const res = await GET(cronRequest());
    const body = await res.json();

    expect(grantAccessForOrder).toHaveBeenCalledWith("o1");
    expect(body.reconciled).toBe(1);
  });

  it("porudžbina starija od 24h se prepušta punom prolazu", async () => {
    h.fake = createFakeAdmin({ orders: [pendingCard({ created_at: hoursAgo(48) })] });
    h.query = { procReturnCode: "00" };

    const res = await GET(cronRequest());
    const body = await res.json();

    expect(grantAccessForOrder).not.toHaveBeenCalled();
    expect(body.checked).toBe(0);
  });

  it("bez CRON_SECRET → 401", async () => {
    h.fake = createFakeAdmin({ orders: [] });
    const res = await GET(new Request("https://test.local/api/cron/nestpay-poll"));
    expect(res.status).toBe(401);
  });
});
