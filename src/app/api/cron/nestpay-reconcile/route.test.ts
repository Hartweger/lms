import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdmin } from "@/lib/test/fake-admin";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof import("@/lib/test/fake-admin").createFakeAdmin>,
  fiscalResult: { ok: true } as { ok: boolean; error?: string },
  sentry: { captureException: vi.fn() },
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.admin }));
vi.mock("@sentry/nextjs", () => h.sentry);
vi.mock("@/lib/nestpay", () => ({ queryTransaction: vi.fn(async () => null) }));
vi.mock("@/lib/grant-access", () => ({ grantAccessForOrder: vi.fn(async () => ({ ok: true })) }));
vi.mock("@/lib/fiscomm", () => ({ fiscalizeOrder: vi.fn(async () => h.fiscalResult) }));
vi.mock("@/lib/ips-qr", () => ({ generateIpsQrUrl: vi.fn(async () => null) }));
vi.mock("@/lib/email", () => ({
  sendCardRetryEmail: vi.fn(async () => {}),
  sendCardReminder2Email: vi.fn(async () => {}),
  sendOrderCancelledEmail: vi.fn(async () => {}),
  sendUplataReminderEmail: vi.fn(async () => {}),
}));

import { GET } from "./route";
import { fiscalizeOrder } from "@/lib/fiscomm";

const hoursAgo = (hrs: number) => new Date(Date.now() - hrs * 3600000).toISOString();

function cronRequest() {
  return new Request("https://test.local/api/cron/nestpay-reconcile", {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
}

function fiscalGap(over: Record<string, unknown> = {}) {
  return {
    id: "of1", order_number: "2026-500", payment_status: "completed", granted: true,
    payment_method: "kartica", total: 4800, created_at: hoursAgo(2),
    fiscal_referent_number: null, email: "kupac@example.com", items: [],
    recovery_stage: 3, ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-cron";
  h.fiscalResult = { ok: true };
});

describe("nestpay-reconcile: fiskalizacija retry", () => {
  it("completed bez fiskalnog broja → fiscalizeOrder retry", async () => {
    h.fake = createFakeAdmin({ orders: [fiscalGap()] });

    const res = await GET(cronRequest());
    const body = await res.json();

    expect(fiscalizeOrder).toHaveBeenCalledWith("of1");
    expect(body.fiscalRetried).toBe(1);
  });

  it("retry pao → Sentry alarm + fiscalFailed u odgovoru", async () => {
    h.fake = createFakeAdmin({ orders: [fiscalGap()] });
    h.fiscalResult = { ok: false, error: "http_500" };

    const res = await GET(cronRequest());
    const body = await res.json();

    expect(h.sentry.captureException).toHaveBeenCalled();
    expect(body.fiscalFailed).toBe(1);
  });

  it("istorijska porudžbina (10 dana) se NE fiskalizuje naknadno", async () => {
    h.fake = createFakeAdmin({ orders: [fiscalGap({ created_at: hoursAgo(240) })] });

    await GET(cronRequest());

    expect(fiscalizeOrder).not.toHaveBeenCalled();
  });

  it("bez CRON_SECRET → 401", async () => {
    h.fake = createFakeAdmin({ orders: [] });
    const res = await GET(new Request("https://test.local/api/cron/nestpay-reconcile"));
    expect(res.status).toBe(401);
  });
});
