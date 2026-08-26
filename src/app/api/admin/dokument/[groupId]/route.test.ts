import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdmin } from "@/lib/test/fake-admin";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof import("@/lib/test/fake-admin").createFakeAdmin>,
  mejlProlazi: true,
}));

vi.mock("@/lib/api-auth", () => ({
  requireAdmin: async () => ({ ok: true, admin: h.fake.admin }),
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/ips-qr", () => ({
  ipsQrBuffer: vi.fn(async () => null),
  dokumentIpsQrUrl: vi.fn(async () => "https://storage.test/qr.png"),
}));
vi.mock("@/lib/dokument-pdf", () => ({
  napraviDokumentPdf: vi.fn(() => Buffer.from("pdf")),
}));
vi.mock("@/lib/email", () => ({
  sendDokumentEmail: vi.fn(async () => (h.mejlProlazi ? { id: "mejl-1" } : null)),
}));

import { POST } from "./route";
import { sendDokumentEmail } from "@/lib/email";

const GRUPA = "g-1";

function narudzbina(over: Record<string, unknown> = {}) {
  return {
    id: "o1",
    order_number: "2026-408",
    total: 38500,
    items: [{ title: "Individualni kurs A2.1" }],
    billing_email: "racunovodstvo@firma.rs",
    company_id: "c-1",
    company_order_group: GRUPA,
    payment_status: "pending",
    predracun_broj: null,
    predracun_sent_at: null,
    faktura_broj: null,
    faktura_sent_at: null,
    created_at: "2026-08-26T10:00:00Z",
    ...over,
  };
}

const firma = {
  id: "c-1",
  naziv: "Proba DOO",
  adresa: "Neka 1, Beograd",
  pib: "123456789",
  maticni_broj: "87654321",
  email: "office@firma.rs",
};

function zahtev(tip: "predracun" | "faktura") {
  return new Request("https://test.local/api/admin/dokument/g-1", {
    method: "POST",
    body: JSON.stringify({ tip }),
  });
}

const params = Promise.resolve({ groupId: GRUPA });

beforeEach(() => {
  vi.clearAllMocks();
  h.mejlProlazi = true;
});

describe("izdavanje dokumenta firmi", () => {
  it("predračun nosi broj prve narudžbine i upiše se na sve u grupi", async () => {
    h.fake = createFakeAdmin({
      orders: [narudzbina(), narudzbina({ id: "o2", order_number: "2026-409" })],
      companies: [firma],
    });

    const res = await POST(zahtev("predracun"), { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.broj).toBe("2026-408");
    expect(sendDokumentEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "racunovodstvo@firma.rs",
        dokument: expect.objectContaining({ tip: "predracun", broj: "2026-408" }),
        // Predračun se prosleđuje onome ko plaća, pa QR mora da se VIDI u mejlu.
        ipsQrUrl: "https://storage.test/qr.png",
      }),
    );

    const upisano = h.fake.tables.get("orders")!;
    expect(upisano.every((o) => o.predracun_broj === "2026-408")).toBe(true);
    expect(upisano.every((o) => o.faktura_broj === null)).toBe(true);
  });

  it("obe narudžbine ulaze u isti dokument kao dve stavke", async () => {
    h.fake = createFakeAdmin({
      orders: [
        narudzbina(),
        narudzbina({ id: "o2", order_number: "2026-409", items: [{ title: "Grupni kurs A2.1" }], total: 19600 }),
      ],
      companies: [firma],
    });

    const body = await (await POST(zahtev("predracun"), { params })).json();
    expect(body.stavki).toBe(2);
  });

  it("drugi klik ne izda drugi dokument", async () => {
    h.fake = createFakeAdmin({
      orders: [narudzbina({ predracun_broj: "2026-408" })],
      companies: [firma],
    });

    const body = await (await POST(zahtev("predracun"), { params })).json();

    expect(body.vecIzdat).toBe(true);
    expect(body.broj).toBe("2026-408");
    expect(sendDokumentEmail).not.toHaveBeenCalled();
  });

  it("faktura za neplaćenu narudžbinu se odbija", async () => {
    h.fake = createFakeAdmin({ orders: [narudzbina()], companies: [firma] });

    const res = await POST(zahtev("faktura"), { params });

    expect(res.status).toBe(400);
    expect(sendDokumentEmail).not.toHaveBeenCalled();
  });

  it("faktura ne prolazi ni ako je samo jedna u grupi neplaćena", async () => {
    h.fake = createFakeAdmin({
      orders: [
        narudzbina({ payment_status: "completed" }),
        narudzbina({ id: "o2", order_number: "2026-409" }),
      ],
      companies: [firma],
    });

    expect((await POST(zahtev("faktura"), { params })).status).toBe(400);
  });

  it("plaćena faktura nosi isti broj kao predračun", async () => {
    h.fake = createFakeAdmin({
      orders: [narudzbina({ payment_status: "completed", predracun_broj: "2026-408" })],
      companies: [firma],
    });

    const body = await (await POST(zahtev("faktura"), { params })).json();

    expect(body.broj).toBe("2026-408");
    expect(h.fake.row("orders", (o) => o.id === "o1")!.faktura_broj).toBe("2026-408");
  });

  it("faktura ne nosi podatke za uplatu - do nje se stiže posle uplate", async () => {
    h.fake = createFakeAdmin({
      orders: [narudzbina({ payment_status: "completed" })],
      companies: [firma],
    });

    await POST(zahtev("faktura"), { params });

    expect(sendDokumentEmail).toHaveBeenCalledWith(
      expect.objectContaining({ ipsQrUrl: null }),
    );
  });

  it("kad mejl padne, broj se ne upisuje - da sledeći klik pokuša ponovo", async () => {
    h.fake = createFakeAdmin({ orders: [narudzbina()], companies: [firma] });
    h.mejlProlazi = false;

    const res = await POST(zahtev("predracun"), { params });

    expect(res.status).toBe(502);
    expect(h.fake.row("orders", (o) => o.id === "o1")!.predracun_broj).toBe(null);
  });

  it("bez mejla računovodstva pada sa jasnom porukom, ne šalje ništa", async () => {
    h.fake = createFakeAdmin({
      orders: [narudzbina({ billing_email: null })],
      companies: [{ ...firma, email: null }],
    });

    const res = await POST(zahtev("predracun"), { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("mejla");
    expect(sendDokumentEmail).not.toHaveBeenCalled();
  });
});
