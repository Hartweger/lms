"use client";

import { useEffect } from "react";
import { trackPurchase, purchaseEventId } from "@/lib/fbq";

export interface PurchaseItem {
  id: string;
  name: string;
  price: number;
}

interface Props {
  orderId: string;
  value: number;
  currency?: string;
  contentId?: string;
  contentName?: string;
  items?: PurchaseItem[];
}

/**
 * Šalje Purchase na stranici potvrde - Meta Pixel + GA4 - sa value, currency i order_id.
 * GA4 dobija i items (prihod po proizvodu u e-commerce izveštajima).
 * Dedup: jedan Purchase po porudžbini po sesiji (refresh stranice ne sme da
 * dupli konverziju).
 */
export default function PixelPurchase({ orderId, value, currency = "RSD", contentId, contentName, items }: Props) {
  useEffect(() => {
    const key = `fb_purchase_${orderId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage nedostupan - svejedno pošalji */
    }
    trackPurchase({ orderId, value, currency, contentId, contentName, eventId: purchaseEventId(orderId) });
    window.gtag?.("event", "purchase", {
      transaction_id: orderId,
      value,
      currency,
      items: (items ?? []).map((it) => ({
        item_id: it.id,
        item_name: it.name,
        price: it.price,
        quantity: 1,
      })),
    });
  }, [orderId, value, currency, contentId, contentName, items]);
  return null;
}
