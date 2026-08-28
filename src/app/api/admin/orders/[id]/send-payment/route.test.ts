import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdmin } from "@/lib/test/fake-admin";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof import("@/lib/test/fake-admin").createFakeAdmin>,
}));

vi.mock("@/lib/api-auth", () => ({
  requireAdmin: async () => ({ ok: true, admin: h.fake.admin }),
}));
vi.mock("@/lib/email", () => ({ sendPaymentInstructionsEmail: vi.fn(async () => null) }));
vi.mock("@/lib/ips-qr", () => ({ generateIpsQrUrl: vi.fn(async () => null) }));

import { POST } from "./route";
import { sendPaymentInstructionsEmail } from "@/lib/email";

function narudzbina(over: Record<string, unknown> = {}) {
  return {
    id: "o1",
    order_number: "2026-419",
    email: "polaznik@example.com",
    full_name: "Polaznik",
    total: 40250,
    items: [{ title: "Individualni kurs B1.1" }],
    payment_method: "uplatnica",
    company_order_group: null,
    ...over,
  };
}

const zahtev = () => new Request("https://test.local/x", { method: "POST" });
const params = Promise.resolve({ id: "o1" });

beforeEach(() => vi.clearAllMocks());

describe("slanje podataka za uplatu", () => {
  it("fizičkom licu se šalje kao i do sad", async () => {
    h.fake = createFakeAdmin({ orders: [narudzbina()] });
    expect((await POST(zahtev(), { params })).status).toBe(200);
    expect(sendPaymentInstructionsEmail).toHaveBeenCalled();
  });

  it("firmi se NE šalje - to bi otišlo polazniku, sa računom za fizička lica", async () => {
    // 28.08.2026: uplatnica je otišla polazniku umesto računovodstvu firme, jer je
    // staro dugme stajalo i na firmskoj narudžbini.
    h.fake = createFakeAdmin({ orders: [narudzbina({ company_order_group: "g-1" })] });

    const res = await POST(zahtev(), { params });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("predračun");
    expect(sendPaymentInstructionsEmail).not.toHaveBeenCalled();
  });
});
