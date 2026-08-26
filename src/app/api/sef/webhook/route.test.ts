import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdmin } from "@/lib/test/fake-admin";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof import("@/lib/test/fake-admin").createFakeAdmin>,
  sefStatus: "Rejected" as string,
  sefOdgovara: true,
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.admin }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/sef", () => ({
  sefPodesen: () => true,
  procitajStatus: vi.fn(async () =>
    h.sefOdgovara
      ? { ok: true, data: { status: h.sefStatus } }
      : { ok: false, greska: "SEF nedostupan", status: 0 },
  ),
}));

import { POST } from "./route";
import { procitajStatus } from "@/lib/sef";

function zahtev(telo: unknown) {
  return new Request("https://test.local/api/sef/webhook", {
    method: "POST",
    body: typeof telo === "string" ? telo : JSON.stringify(telo),
  });
}

function narudzbina(over: Record<string, unknown> = {}) {
  return {
    id: "o1",
    company_order_group: "g-1",
    sef_invoice_id: "998877",
    sef_status: "Sent",
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.sefStatus = "Rejected";
  h.sefOdgovara = true;
});

describe("SEF webhook", () => {
  it("status se čita od SEF-a, ne iz tela zahteva", async () => {
    h.fake = createFakeAdmin({ orders: [narudzbina()] });

    // Telo LAŽE da je prihvaćena; SEF kaže da je odbijena.
    await POST(zahtev({ salesInvoiceId: 998877, newInvoiceStatus: "Approved" }));

    expect(procitajStatus).toHaveBeenCalledWith("998877");
    expect(h.fake.row("orders", (o) => o.id === "o1")!.sef_status).toBe("Rejected");
  });

  it("upisuje status na sve narudžbine grupe", async () => {
    h.sefStatus = "Approved";
    h.fake = createFakeAdmin({
      orders: [narudzbina(), narudzbina({ id: "o2" })],
    });

    await POST(zahtev({ salesInvoiceId: 998877 }));

    expect(h.fake.tables.get("orders")!.every((o) => o.sef_status === "Approved")).toBe(true);
  });

  it("faktura koja nije naša se preskače bez greške", async () => {
    h.fake = createFakeAdmin({ orders: [narudzbina({ sef_invoice_id: "111" })] });

    const res = await POST(zahtev({ salesInvoiceId: 998877 }));

    expect(res.status).toBe(200);
    expect(procitajStatus).not.toHaveBeenCalled();
    expect(h.fake.row("orders", (o) => o.id === "o1")!.sef_status).toBe("Sent");
  });

  it("kad SEF ne odgovara, status se ne dira - cron će pokupiti", async () => {
    h.sefOdgovara = false;
    h.fake = createFakeAdmin({ orders: [narudzbina()] });

    const body = await (await POST(zahtev({ salesInvoiceId: 998877 }))).json();

    expect(body.odlozeno).toBe(true);
    expect(h.fake.row("orders", (o) => o.id === "o1")!.sef_status).toBe("Sent");
  });

  it("neispravno telo ne obara rutu - inače bi SEF pokušavao u krug", async () => {
    h.fake = createFakeAdmin({ orders: [narudzbina()] });

    const res = await POST(zahtev("ovo nije json"));

    expect(res.status).toBe(200);
  });

  it("telo bez identifikatora se preskače", async () => {
    h.fake = createFakeAdmin({ orders: [narudzbina()] });

    const res = await POST(zahtev({ nesto: "drugo" }));

    expect(res.status).toBe(200);
    expect(procitajStatus).not.toHaveBeenCalled();
  });
});
