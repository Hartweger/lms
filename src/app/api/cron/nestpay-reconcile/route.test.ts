import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdmin } from "@/lib/test/fake-admin";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof import("@/lib/test/fake-admin").createFakeAdmin>,
  fiscalResult: { ok: true } as { ok: boolean; error?: string },
  query: null as { procReturnCode: string } | null,
  sentry: { captureException: vi.fn() },
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.admin }));
vi.mock("@sentry/nextjs", () => h.sentry);
vi.mock("@/lib/nestpay", () => ({ queryTransaction: vi.fn(async () => h.query) }));
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
import { sendCardRetryEmail, sendOrderCancelledEmail } from "@/lib/email";

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

function pendingCard(over: Record<string, unknown> = {}) {
  return {
    id: "op1", order_number: "2026-311", email: "kupac@example.com", full_name: "Kupac",
    payment_method: "kartica", payment_status: "pending", total: 3600,
    created_at: hoursAgo(2), recovery_stage: 0, recovery_email_sent_at: null,
    fiscal_referent_number: "F-1", granted: false,
    items: [{ course_id: "c1", course_slug: "polozi-goethe-b1", title: "VIDEO + B1 ispit", price: 3600 }],
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-cron";
  h.fiscalResult = { ok: true };
  h.query = null;
});

// Porudžbina 2026-311 (16.08.2026): kupac je platio, potvrda banke se izgubila u pretraživaču,
// a mejl „kupovina nije prošla" ide već sat vremena posle narudžbine. Dok banka izričito ne
// kaže da naplate NEMA, ne smemo kupcu da tvrdimo da nije platio - ni mejlom ni otkazivanjem.
describe("nestpay-reconcile: bez tvrdnji o naplati dok banka ne potvrdi", () => {
  it("upit banci pao (unknown) → nema mejla „kupovina nije prošla", async () => {
    h.fake = createFakeAdmin({ orders: [pendingCard()] });
    h.query = null;

    const res = await GET(cronRequest());
    const body = await res.json();

    expect(sendCardRetryEmail).not.toHaveBeenCalled();
    expect(body.mejl1).toBe(0);
    expect(body.neodgovoreno).toBe(1);
    expect(h.fake.row("orders", (r) => r.id === "op1")?.recovery_stage).toBe(0);
  });

  it("banka potvrdi da naplate nema → mejl ide kao i do sada", async () => {
    h.fake = createFakeAdmin({ orders: [pendingCard()] });
    h.query = { procReturnCode: "99" };

    const res = await GET(cronRequest());
    const body = await res.json();

    expect(sendCardRetryEmail).toHaveBeenCalled();
    expect(body.mejl1).toBe(1);
    expect(h.fake.row("orders", (r) => r.id === "op1")?.recovery_stage).toBe(1);
  });

  it("upit banci pao → stara porudžbina se NE otkazuje", async () => {
    h.fake = createFakeAdmin({ orders: [pendingCard({ created_at: hoursAgo(24 * 9), recovery_stage: 2 })] });
    h.query = null;

    const res = await GET(cronRequest());
    const body = await res.json();

    expect(sendOrderCancelledEmail).not.toHaveBeenCalled();
    expect(body.cancel).toBe(0);
    expect(h.fake.row("orders", (r) => r.id === "op1")?.payment_status).toBe("pending");
  });
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
