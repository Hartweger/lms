import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendGa4Purchase } from "./ga4-mp";

// Pretplata: items[].price u orders.items nosi PUNU cenu paketa (29.133), a naplaćena je
// rata (order.total = 3.199). GA4 "prihod od artikla" se računa iz items - bez korekcije
// svaka pretplata izgleda kao prodat ceo paket (nađeno 05.08.2026: +207k RSD u item reports).

function fetchBodyOf(fetchMock: ReturnType<typeof vi.fn>) {
  const [, init] = fetchMock.mock.calls[0];
  return JSON.parse((init as RequestInit).body as string);
}

const baseOrder = {
  id: "o-1",
  order_number: "2026-999",
  total: 3199,
  currency: "RSD",
  items: [
    { course_id: "c-1", course_slug: "paket-a1-a2-b1", title: "Video paket A1 + A2 + B1", price: 29133 },
  ],
};

describe("sendGa4Purchase - cena stavke kod pretplate", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.GA4_API_SECRET = "test-secret";
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GA4_API_SECRET;
  });

  it("pretplata: items[].price = rata (order.total), ne puna cena paketa", async () => {
    await sendGa4Purchase({ ...baseOrder, payment_method: "kartica_pretplata" });
    const body = fetchBodyOf(fetchMock);
    expect(body.events[0].params.value).toBe(3199);
    expect(body.events[0].params.items[0].price).toBe(3199);
  });

  it("jednokratna kupovina: items[].price ostaje puna cena", async () => {
    await sendGa4Purchase({ ...baseOrder, total: 29133, payment_method: "kartica" });
    const body = fetchBodyOf(fetchMock);
    expect(body.events[0].params.value).toBe(29133);
    expect(body.events[0].params.items[0].price).toBe(29133);
  });
});
