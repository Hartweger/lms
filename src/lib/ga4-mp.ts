// src/lib/ga4-mp.ts
// Server-side GA4 purchase preko Measurement Protocol-a.
// Klijentski purchase (PixelPurchase) se pali SAMO za karticu (status=ok); uplatnica i
// PayPal se nikad ne broje, pa GA4 ne vidi prihod. Ovo šalje purchase za SVE načine
// plaćanja iz jedne tačke — grantAccessForOrder (kad porudžbina postane plaćena).

interface OrderItemLike {
  course_id: string;
  course_slug?: string;
  title: string;
  price: number;
}

interface OrderLike {
  id: string;
  order_number?: string | null;
  total: number;
  currency?: string | null;
  coupon_code?: string | null;
  items?: OrderItemLike[] | null;
}

/**
 * Šalje GA4 `purchase` event server-side. No-op ako env nije postavljen (bezbedno).
 * Nikad ne baca grešku — ne sme da obori dodelu pristupa.
 */
export async function sendGa4Purchase(order: OrderLike): Promise<void> {
  const apiSecret = process.env.GA4_API_SECRET;
  const measurementId = process.env.GA4_MEASUREMENT_ID || "G-MB9DRXVVF6";
  if (!apiSecret) return; // tiho preskoči dok secret nije postavljen

  try {
    const items = (order.items ?? []).map((it) => ({
      item_id: it.course_id,
      item_name: it.title,
      price: it.price,
      quantity: 1,
    }));

    // client_id: nemamo _ga iz browsera ovde, pa koristimo id porudžbine kao stabilan
    // identifikator (prihod se broji; kanal atribucije = "(direct)"). Dedup na GA strani
    // ide po transaction_id, a grantAccessForOrder je i sam idempotentan.
    const body = {
      client_id: order.id,
      events: [
        {
          name: "purchase",
          params: {
            transaction_id: order.order_number || order.id,
            value: Number(order.total) || 0,
            currency: order.currency || "RSD",
            ...(order.coupon_code ? { coupon: order.coupon_code } : {}),
            items,
          },
        },
      ],
    };

    const url =
      "https://www.google-analytics.com/mp/collect?measurement_id=" +
      encodeURIComponent(measurementId) +
      "&api_secret=" +
      encodeURIComponent(apiSecret);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`[ga4-mp] purchase HTTP ${res.status} za order ${order.id}`);
    }
  } catch (e) {
    console.error(`[ga4-mp] purchase send pao za order ${order.id}:`, e);
  }
}
