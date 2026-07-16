import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdmin } from "@/lib/test/fake-admin";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof import("@/lib/test/fake-admin").createFakeAdmin>,
  allowed: true,
  adminEmail: vi.fn(),
  instructionsEmail: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.admin }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => ({ allowed: h.allowed, remaining: 1 }) }));
vi.mock("@/lib/email", () => ({
  sendNewOrderAdminEmail: h.adminEmail,
  sendPaymentInstructionsEmail: h.instructionsEmail,
}));
vi.mock("@/lib/order-utils", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  generateOrderNumber: async () => "2026-9999",
}));
vi.mock("@/lib/ips-qr", () => ({ generateIpsQrUrl: async () => null }));

import { POST } from "./route";

function orderRequest(over: Record<string, unknown> = {}): Request {
  return new Request("https://test.local/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify({
      fullName: "Ana Anić",
      email: "ana@example.com",
      country: "Srbija",
      courseSlug: "nemacki-a1",
      paymentMethod: "kartica",
      ...over,
    }),
  });
}

function seedCourse() {
  return {
    id: "c1", slug: "nemacki-a1", title: "Nemački A1", price: 19600,
    category: "video", course_type: "video", included_lessons: null, is_purchasable: true,
  };
}

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

function seedPendingOrder(over: Record<string, unknown> = {}) {
  return {
    id: "o-pending",
    order_number: "2026-1000",
    email: "ana@example.com",
    payment_status: "pending",
    payment_method: "kartica",
    created_at: minutesAgo(10),
    items: [{ course_id: "c1", course_slug: "nemacki-a1", title: "Nemački A1", price: 19600 }],
    subtotal: 19600,
    discount: 0,
    total: 19600,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.allowed = true;
});

describe("POST /api/orders", () => {
  it("normalna porudžbina → 200 sa brojem porudžbine", async () => {
    h.fake = createFakeAdmin({ courses: [seedCourse()] });

    const res = await POST(orderRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orderNumber).toBe("2026-9999");
    expect(h.fake.tables.get("orders")!.length).toBe(1);
  });

  it("IP rate limit → 429, ništa se ne kreira i ne šalje", async () => {
    h.fake = createFakeAdmin({ courses: [seedCourse()] });
    h.allowed = false;

    const res = await POST(orderRequest());

    expect(res.status).toBe(429);
    expect(h.fake.tables.get("orders") ?? []).toHaveLength(0);
    expect(h.adminEmail).not.toHaveBeenCalled();
    expect(h.instructionsEmail).not.toHaveBeenCalled();
  });

  it("3+ porudžbine za isti mejl u poslednjih sat → 429 (email-bomb zaštita)", async () => {
    const spam = { email: "Zrtva@example.com" };
    h.fake = createFakeAdmin({
      courses: [seedCourse()],
      orders: [
        { ...spam, created_at: minutesAgo(5) },
        { ...spam, created_at: minutesAgo(15) },
        { ...spam, created_at: minutesAgo(45) },
      ],
    });

    const res = await POST(orderRequest({ email: "zrtva@example.com" }));

    expect(res.status).toBe(429);
    expect(h.fake.tables.get("orders")!.length).toBe(3);
    expect(h.adminEmail).not.toHaveBeenCalled();
    expect(h.instructionsEmail).not.toHaveBeenCalled();
  });

  it("povratak sa NestPay: pending za isti mejl+kurs (<24h) se ažurira umesto nove, bez admin mejla", async () => {
    h.fake = createFakeAdmin({ courses: [seedCourse()], orders: [seedPendingOrder()] });

    const res = await POST(orderRequest({ paymentMethod: "uplatnica" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orderNumber).toBe("2026-1000"); // isti order_number, ne novi
    expect(h.fake.tables.get("orders")!.length).toBe(1);
    const row = h.fake.row("orders", (r) => r.id === "o-pending")!;
    expect(row.payment_method).toBe("uplatnica");
    expect(row.total).toBe(19600);
    expect(h.adminEmail).not.toHaveBeenCalled();
    expect(h.instructionsEmail).toHaveBeenCalled(); // kupac ipak dobija instrukcije za uplatnicu
  });

  it("reuse zaobilazi email kočnicu: 3 pending pokušaja u satu ne daju 429 za isti kurs", async () => {
    h.fake = createFakeAdmin({
      courses: [seedCourse()],
      orders: [
        seedPendingOrder({ id: "o1", order_number: "2026-1001", created_at: minutesAgo(50) }),
        seedPendingOrder({ id: "o2", order_number: "2026-1002", created_at: minutesAgo(30) }),
        seedPendingOrder({ id: "o3", order_number: "2026-1003", created_at: minutesAgo(10) }),
      ],
    });

    const res = await POST(orderRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orderNumber).toBe("2026-1003"); // ažurira se najskorija pending
    expect(h.fake.tables.get("orders")!.length).toBe(3);
    expect(h.adminEmail).not.toHaveBeenCalled();
  });

  it("pending za DRUGI kurs se ne ažurira → nova porudžbina + admin mejl", async () => {
    h.fake = createFakeAdmin({
      courses: [seedCourse()],
      orders: [seedPendingOrder({ items: [{ course_id: "c2", course_slug: "nemacki-a2", title: "Nemački A2", price: 19600 }] })],
    });

    const res = await POST(orderRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orderNumber).toBe("2026-9999");
    expect(h.fake.tables.get("orders")!.length).toBe(2);
    expect(h.adminEmail).toHaveBeenCalledOnce();
  });

  it("pending starija od 24h se ne ažurira → nova porudžbina", async () => {
    h.fake = createFakeAdmin({
      courses: [seedCourse()],
      orders: [seedPendingOrder({ created_at: minutesAgo(25 * 60) })],
    });

    const res = await POST(orderRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orderNumber).toBe("2026-9999");
    expect(h.fake.tables.get("orders")!.length).toBe(2);
  });

  it("naplaćena (completed) porudžbina se ne dira → nova porudžbina", async () => {
    h.fake = createFakeAdmin({
      courses: [seedCourse()],
      orders: [seedPendingOrder({ payment_status: "completed" })],
    });

    const res = await POST(orderRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orderNumber).toBe("2026-9999");
    expect(h.fake.tables.get("orders")!.length).toBe(2);
    const completed = h.fake.row("orders", (r) => r.id === "o-pending")!;
    expect(completed.total).toBe(19600); // iznos naplaćene se ne menja
    expect(h.adminEmail).toHaveBeenCalledOnce();
  });

  it("stare porudžbine (>1h) ne blokiraju novu", async () => {
    const old = { email: "ana@example.com" };
    h.fake = createFakeAdmin({
      courses: [seedCourse()],
      orders: [
        { ...old, created_at: minutesAgo(90) },
        { ...old, created_at: minutesAgo(120) },
        { ...old, created_at: minutesAgo(180) },
      ],
    });

    const res = await POST(orderRequest());

    expect(res.status).toBe(200);
    expect(h.fake.tables.get("orders")!.length).toBe(4);
  });
});
