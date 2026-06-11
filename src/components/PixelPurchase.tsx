"use client";

import { useEffect } from "react";
import { trackPurchase, purchaseEventId } from "@/lib/fbq";

interface Props {
  orderId: string;
  value: number;
  currency?: string;
  contentId?: string;
  contentName?: string;
}

/**
 * Šalje Meta Pixel Purchase na stranici potvrde — sa value, currency i order_id.
 * Dedup: jedan Purchase po porudžbini po sesiji (refresh stranice ne sme da
 * dupli konverziju).
 */
export default function PixelPurchase({ orderId, value, currency = "RSD", contentId, contentName }: Props) {
  useEffect(() => {
    const key = `fb_purchase_${orderId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage nedostupan — svejedno pošalji */
    }
    trackPurchase({ orderId, value, currency, contentId, contentName, eventId: purchaseEventId(orderId) });
  }, [orderId, value, currency, contentId, contentName]);
  return null;
}
