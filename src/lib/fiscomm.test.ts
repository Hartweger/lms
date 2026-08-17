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

import { fiscalizeOrder, refundOrder } from "./fiscomm";

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

/** Narudžbina koja JESTE fiskalizovana - jedina vrsta koja sme u storno. */
function fiskalizovana(over: Record<string, unknown> = {}) {
  return order({
    order_number: "2026-312",
    total: 3500,
    items: [{ title: "VIDEO: Položi Goethe C1" }],
    fiscal_referent_number: "QQ9JGBJ7-9JGW75O0-348",
    fiscal_referent_dt: "2026-08-16T13:48:22.0284009+02:00",
    refund_referent_number: null,
    ...over,
  });
}

describe("refundOrder - storno", () => {
  it("šalje refund sa referencom na original i pamti PFR broj SAMOG STORNA", async () => {
    h.fake = createFakeAdmin({ orders: [fiskalizovana()] });
    // Odgovor storna nosi DVA broja: svoj (invoiceNumber) i original (referentDocumentNumber).
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      invoiceNumber: "QQ9JGBJ7-9JGW75O0-401",
      referentDocumentNumber: "QQ9JGBJ7-9JGW75O0-348",
      sdcDateTime: "2026-08-17T10:00:00+02:00",
      journal: "...РЕФУНДАЦИЈА...",
      verificationUrl: "https://suf.purs.gov.rs/v/?vl=storno",
      invoicePdfUrl: "https://storage.fiscomm.rs/storno.pdf",
    }), { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await refundOrder("o1");

    expect(res.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { body: string }];
    expect(url).toContain("/invoices/normal/refund");
    const poslato = JSON.parse(init.body);
    expect(poslato.referentDocumentNumber).toBe("QQ9JGBJ7-9JGW75O0-348");
    expect(poslato.referentDocumentDT).toBe("2026-08-16T13:48:22.0284009+02:00");
    expect(poslato.payment).toEqual([{ amount: 3500, paymentType: "Card" }]);

    const red = h.fake.row("orders", (r) => r.id === "o1")!;
    // Ključno: upisan je broj storna, ne originala koji poništavamo.
    expect(red.refund_referent_number).toBe("QQ9JGBJ7-9JGW75O0-401");
    expect(red.refund_pdf_url).toBe("https://storage.fiscomm.rs/storno.pdf");
    expect(red.refunded_at).toBeTruthy();
    // Original ostaje netaknut - PURS drži oba dokumenta.
    expect(red.fiscal_referent_number).toBe("QQ9JGBJ7-9JGW75O0-348");
  });

  it("ne stornira dvaput - drugi poziv ne dira Fiscomm", async () => {
    h.fake = createFakeAdmin({
      orders: [fiskalizovana({ refund_referent_number: "QQ9JGBJ7-9JGW75O0-401" })],
    });
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await refundOrder("o1");

    expect(res.ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("odbija narudžbinu koja nikad nije fiskalizovana", async () => {
    h.fake = createFakeAdmin({
      orders: [fiskalizovana({ fiscal_referent_number: null, fiscal_referent_dt: null })],
    });
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await refundOrder("o1");

    expect(res.ok).toBe(false);
    expect(res.error).toBe("nema_originalnog_racuna");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("greška Fiscomma se čuva u refund_response i NE markira storno", async () => {
    h.fake = createFakeAdmin({ orders: [fiskalizovana()] });
    global.fetch = vi.fn(async () => new Response(
      JSON.stringify({ message: "buyerId is required for refund" }), { status: 400 }
    )) as typeof fetch;

    const res = await refundOrder("o1");

    expect(res.ok).toBe(false);
    expect(res.error).toBe("http_400");
    const red = h.fake.row("orders", (r) => r.id === "o1")!;
    expect(red.refund_referent_number).toBeNull();
    expect(red.refunded_at).toBeUndefined();
    expect(red.refund_response).toEqual({ message: "buyerId is required for refund" });
    expect(h.sentry.captureException).toHaveBeenCalled();
  });

  it("bez API ključa ne šalje ništa", async () => {
    // Ključ se čita pri učitavanju modula, pa se modul mora učitati iznova bez njega.
    vi.resetModules();
    process.env.FISCOMM_API_KEY = "";
    h.fake = createFakeAdmin({ orders: [fiskalizovana()] });
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    try {
      const { refundOrder: bezKljuca } = await import("./fiscomm");

      const res = await bezKljuca("o1");

      expect(res.ok).toBe(false);
      expect(res.error).toBe("no_api_key");
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      process.env.FISCOMM_API_KEY = "test-key";
      vi.resetModules();
    }
  });
});
