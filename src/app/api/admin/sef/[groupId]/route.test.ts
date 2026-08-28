import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdmin } from "@/lib/test/fake-admin";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof import("@/lib/test/fake-admin").createFakeAdmin>,
  slanjeUspeva: true,
  firmaNaSefu: true as boolean | null,
}));

vi.mock("@/lib/api-auth", () => ({
  requireAdmin: async () => ({ ok: true, admin: h.fake.admin }),
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/sef", async () => {
  const stvarni = await vi.importActual<typeof import("@/lib/sef")>("@/lib/sef");
  return {
    ...stvarni,
    sefPodesen: () => true,
    firmaJeNaSefu: vi.fn(async () => h.firmaNaSefu),
    posaljiUbl: vi.fn(async () =>
      h.slanjeUspeva
        ? { ok: true, data: { salesInvoiceId: 998877 } }
        : { ok: false, greska: "Neispravan UBL: nedostaje CityName", status: 400 },
    ),
    procitajStatus: vi.fn(async () => ({ ok: true, data: { status: "Sent" } })),
  };
});

import { POST } from "./route";
import { posaljiUbl } from "@/lib/sef";

const GRUPA = "g-1";
const params = Promise.resolve({ groupId: GRUPA });

function narudzbina(over: Record<string, unknown> = {}) {
  return {
    id: "o1",
    order_number: "2026-408",
    total: 38500,
    items: [{ title: "Individualni kurs A2.1" }],
    company_id: "c-1",
    company_order_group: GRUPA,
    faktura_broj: "2026-408",
    faktura_sent_at: "2026-08-26T09:00:00Z",
    sef_invoice_id: null,
    sef_request_id: null,
    sef_status: null,
    created_at: "2026-08-26T08:00:00Z",
    ...over,
  };
}

const firma = {
  id: "c-1",
  naziv: "Proba DOO",
  adresa: "Neka 1",
  grad: "Beograd",
  pib: "109925860",
  maticni_broj: "21268372",
  email: "racunovodstvo@firma.rs",
};

const zahtev = () => new Request("https://test.local/api/admin/sef/g-1", { method: "POST" });

beforeEach(() => {
  vi.clearAllMocks();
  h.slanjeUspeva = true;
  h.firmaNaSefu = true;
});

describe("slanje fakture na SEF", () => {
  it("upisuje SEF id i status na sve narudžbine grupe", async () => {
    h.fake = createFakeAdmin({
      orders: [narudzbina(), narudzbina({ id: "o2", order_number: "2026-409" })],
      companies: [firma],
    });

    const body = await (await POST(zahtev(), { params })).json();

    expect(body.sefInvoiceId).toBe("998877");
    expect(body.status).toBe("Sent");
    const redovi = h.fake.tables.get("orders")!;
    expect(redovi.every((o) => o.sef_invoice_id === "998877")).toBe(true);
    expect(redovi.every((o) => o.sef_status === "Sent")).toBe(true);
  });

  it("faktura mora prvo da bude izdata", async () => {
    h.fake = createFakeAdmin({
      orders: [narudzbina({ faktura_broj: null, faktura_sent_at: null })],
      companies: [firma],
    });

    const res = await POST(zahtev(), { params });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Prvo izdaj fakturu");
    expect(posaljiUbl).not.toHaveBeenCalled();
  });

  it("probna narudžbina sa demoa se ne šalje na pravi SEF", async () => {
    // Posle prelaska na produkciju demo broj je obrisan, pa bi se dugme inače
    // vratilo - a klik bi probnu fakturu predao državi kao pravu.
    h.fake = createFakeAdmin({
      orders: [narudzbina({ sef_status: "DEMO", sef_invoice_id: null })],
      companies: [firma],
    });

    const res = await POST(zahtev(), { params });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("probna");
    expect(posaljiUbl).not.toHaveBeenCalled();
  });

  it("drugi klik ne šalje drugu fakturu", async () => {
    h.fake = createFakeAdmin({
      orders: [narudzbina({ sef_invoice_id: "998877", sef_status: "Approved" })],
      companies: [firma],
    });

    const body = await (await POST(zahtev(), { params })).json();

    expect(body.vecPoslato).toBe(true);
    expect(posaljiUbl).not.toHaveBeenCalled();
  });

  it("isti requestId na ponovni pokušaj - retry ne pravi drugu fakturu", async () => {
    h.fake = createFakeAdmin({
      orders: [narudzbina({ sef_request_id: "11111111-1111-1111-1111-111111111111" })],
      companies: [firma],
    });

    await POST(zahtev(), { params });

    expect(posaljiUbl).toHaveBeenCalledWith(
      expect.any(String),
      "11111111-1111-1111-1111-111111111111",
    );
  });

  it("bez matičnog broja ili grada se ne šalje - SEF ih traži", async () => {
    h.fake = createFakeAdmin({
      orders: [narudzbina()],
      companies: [{ ...firma, grad: null }],
    });

    const res = await POST(zahtev(), { params });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("grad");
    expect(posaljiUbl).not.toHaveBeenCalled();
  });

  it("firma koja nije na eFakturi se zaustavlja pre slanja", async () => {
    h.firmaNaSefu = false;
    h.fake = createFakeAdmin({ orders: [narudzbina()], companies: [firma] });

    const res = await POST(zahtev(), { params });
    expect(res.status).toBe(400);
    expect(posaljiUbl).not.toHaveBeenCalled();
  });

  it("kad provera firme ne uspe, slanje se ipak pušta - ne tvrdimo neproverено", async () => {
    h.firmaNaSefu = null;
    h.fake = createFakeAdmin({ orders: [narudzbina()], companies: [firma] });

    expect((await POST(zahtev(), { params })).status).toBe(200);
    expect(posaljiUbl).toHaveBeenCalled();
  });

  it("odbijeno slanje ostavlja trag, ali ne upisuje SEF id", async () => {
    h.slanjeUspeva = false;
    h.fake = createFakeAdmin({ orders: [narudzbina()], companies: [firma] });

    const res = await POST(zahtev(), { params });
    const red = h.fake.row("orders", (o) => o.id === "o1")!;

    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("CityName");
    expect(red.sef_invoice_id).toBe(null);
    expect(red.sef_status).toBe("GRESKA");
  });

  it("XML nosi broj fakture i datum sa PDF-a, ne današnji", async () => {
    h.fake = createFakeAdmin({ orders: [narudzbina()], companies: [firma] });

    await POST(zahtev(), { params });

    const [ubl] = (posaljiUbl as unknown as { mock: { calls: string[][] } }).mock.calls[0];
    expect(ubl).toContain("<cbc:ID>2026-408</cbc:ID>");
    expect(ubl).toContain("<cbc:IssueDate>2026-08-26</cbc:IssueDate>");
    expect(ubl).toContain("<cbc:DueDate>2026-09-02</cbc:DueDate>");
  });
});
