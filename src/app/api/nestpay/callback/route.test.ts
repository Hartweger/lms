import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdmin } from "@/lib/test/fake-admin";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof import("@/lib/test/fake-admin").createFakeAdmin>,
  verifyOk: true,
  grantResult: { ok: true } as { ok: boolean; error?: string },
  sentry: { captureException: vi.fn() },
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.admin }));
vi.mock("@sentry/nextjs", () => h.sentry);
vi.mock("@/lib/nestpay", () => ({
  verifyCallbackHash: vi.fn(() => h.verifyOk),
  NESTPAY: { storeKey: "test-key" },
}));
vi.mock("@/lib/grant-access", () => ({ grantAccessForOrder: vi.fn(async () => h.grantResult) }));
vi.mock("@/lib/fiscomm", () => ({ fiscalizeOrder: vi.fn(async () => ({ ok: true })) }));
vi.mock("@/lib/site-url", () => ({ SITE_URL: "https://test.local" }));

import { POST } from "./route";
import { grantAccessForOrder } from "@/lib/grant-access";
import { fiscalizeOrder } from "@/lib/fiscomm";

function callbackRequest(params: Record<string, string>): Request {
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  return new Request("https://test.local/api/nestpay/callback", { method: "POST", body: form });
}

function seedOrder(over: Record<string, unknown> = {}) {
  return {
    id: "o1", order_number: "1001", payment_status: "pending",
    email: "kupac@example.com", ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.verifyOk = true;
  h.grantResult = { ok: true };
});

describe("POST /api/nestpay/callback", () => {
  it("loš potpis → redirect na /kupovina/greska, bez granta", async () => {
    h.fake = createFakeAdmin({ orders: [seedOrder()] });
    h.verifyOk = false;

    const res = await POST(callbackRequest({ oid: "1001", ProcReturnCode: "00" }));

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://test.local/kupovina/greska");
    expect(grantAccessForOrder).not.toHaveBeenCalled();
  });

  it("odbijena kartica → nestpay_status failed, redirect status=fail, bez granta", async () => {
    h.fake = createFakeAdmin({ orders: [seedOrder()] });

    const res = await POST(callbackRequest({ oid: "1001", ProcReturnCode: "99" }));

    expect(res.headers.get("location")).toBe("https://test.local/kupovina/hvala/o1?status=fail");
    expect(h.fake.row("orders", (r) => r.id === "o1")!.nestpay_status).toBe("failed");
    expect(grantAccessForOrder).not.toHaveBeenCalled();
  });

  it("uspešna naplata → charged, grant + fiskalizacija, redirect na hvala", async () => {
    h.fake = createFakeAdmin({ orders: [seedOrder()] });

    const res = await POST(callbackRequest({ oid: "1001", ProcReturnCode: "00", TransId: "T123" }));

    const order = h.fake.row("orders", (r) => r.id === "o1")!;
    expect(order.nestpay_status).toBe("charged");
    expect(order.nestpay_trans_id).toBe("T123");
    expect(grantAccessForOrder).toHaveBeenCalledWith("o1");
    expect(fiscalizeOrder).toHaveBeenCalledWith("o1");
    // fake generateLink vraća grešku → fallback bez auto-logina
    expect(res.headers.get("location")).toBe("https://test.local/kupovina/hvala/o1?status=ok");
  });

  it("već completed → idempotentan redirect, bez ponovnog granta", async () => {
    h.fake = createFakeAdmin({ orders: [seedOrder({ payment_status: "completed" })] });

    const res = await POST(callbackRequest({ oid: "1001", ProcReturnCode: "00" }));

    expect(res.headers.get("location")).toBe("https://test.local/kupovina/hvala/o1");
    expect(grantAccessForOrder).not.toHaveBeenCalled();
  });

  it("plaćeno a grant pao → Sentry alarm, kupac ipak ide na hvala", async () => {
    h.fake = createFakeAdmin({ orders: [seedOrder()] });
    h.grantResult = { ok: false, error: "insert pao" };

    const res = await POST(callbackRequest({ oid: "1001", ProcReturnCode: "00" }));

    expect(h.sentry.captureException).toHaveBeenCalled(); // „platio-a-nema-pristup" mora da se VIDI
    expect(res.headers.get("location")).toBe("https://test.local/kupovina/hvala/o1?status=ok");
  });
});
