// Meta (Facebook) Pixel — tanak klijentski helper.
// fbq stub se definiše u <MetaPixel/> (base kod iz Meta-e). Ovde su samo
// tipovi i bezbedni omotači koji ne pucaju ako pixel nije učitan
// (npr. blokiran adblockom ili dok korisnik nije dao saglasnost).

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

/**
 * Deterministički event_id za Purchase — isti na browseru (pixel) i serveru (CAPI),
 * pa Meta deduplikuje dva izvora u jedan događaj. Bazira se na broju porudžbine
 * (jedan Purchase po porudžbini). Mora biti identičan na obe strane.
 */
export function purchaseEventId(orderNumber: string): string {
  return `purchase_${orderNumber}`;
}

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Bezbedan poziv fbq-a — tiho ne radi ništa ako pixel nije prisutan. */
function fbq(...args: unknown[]): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

export interface ContentParams {
  contentId?: string;
  contentName?: string;
  value?: number;
  currency?: string;
}

function contentParams({ contentId, contentName, value, currency }: ContentParams) {
  return {
    ...(contentId ? { content_ids: [contentId], content_type: "product" } : {}),
    ...(contentName ? { content_name: contentName } : {}),
    ...(typeof value === "number" ? { value } : {}),
    ...(currency ? { currency } : {}),
  };
}

export function trackPageView(): void {
  fbq("track", "PageView");
}

export function trackViewContent(p: ContentParams): void {
  fbq("track", "ViewContent", contentParams(p));
}

export function trackAddToCart(p: ContentParams): void {
  fbq("track", "AddToCart", contentParams(p));
}

export function trackInitiateCheckout(p: ContentParams): void {
  fbq("track", "InitiateCheckout", contentParams(p));
}

export function trackPurchase(p: ContentParams & { orderId: string; eventId?: string }): void {
  fbq(
    "track",
    "Purchase",
    {
      ...contentParams(p),
      ...(p.orderId ? { order_id: p.orderId } : {}),
    },
    // eventID za deduplikaciju sa server-side CAPI događajem (isti string na obe strane)
    ...(p.eventId ? [{ eventID: p.eventId }] : []),
  );
}

/**
 * Saglasnost za pixel (Meta consent API). Poziva se iz CookieBanner-a kad
 * korisnik prihvati/odbije — paralelno sa gtag consent update-om.
 * Dok je 'revoke', pixel ne šalje nijedan događaj.
 */
export function setPixelConsent(granted: boolean): void {
  fbq("consent", granted ? "grant" : "revoke");
}
