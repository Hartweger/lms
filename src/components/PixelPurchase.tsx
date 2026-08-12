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
  /** Mejl kupca - samo za Google Enhanced Conversions. Google tag ga heširanog
   *  šalje; u dataLayer ne ulazi u čistom obliku. */
  email?: string;
}

// Google Ads konverzija. Obe vrednosti iz Ads naloga: Tools -> Conversions ->
// akcija -> Tag setup -> "Use Google tag". Ako bilo koja nedostaje, Ads događaj
// se preskače, a Meta i GA4 rade nepromenjeno.
const ADS_ID = process.env.NEXT_PUBLIC_ADS_ID ?? "";
const ADS_PURCHASE_LABEL = process.env.NEXT_PUBLIC_ADS_PURCHASE_LABEL ?? "";

/**
 * Šalje Purchase na stranici potvrde - Meta Pixel + GA4 - sa value, currency i order_id.
 * GA4 dobija i items (prihod po proizvodu u e-commerce izveštajima).
 * Dedup: jedan Purchase po porudžbini po sesiji (refresh stranice ne sme da
 * dupli konverziju).
 */
export default function PixelPurchase({ orderId, value, currency = "RSD", contentId, contentName, items, email }: Props) {
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
    if (ADS_ID && ADS_PURCHASE_LABEL) {
      if (email) window.gtag?.("set", "user_data", { email });
      window.gtag?.("event", "conversion", {
        send_to: `${ADS_ID}/${ADS_PURCHASE_LABEL}`,
        transaction_id: orderId,
        value,
        currency,
      });
    }
  }, [orderId, value, currency, contentId, contentName, items, email]);
  return null;
}
