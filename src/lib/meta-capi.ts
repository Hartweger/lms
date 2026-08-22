// Meta Conversions API (CAPI) - server-side slanje konverzija.
// Radi paralelno sa browser pixel-om; deduplikacija ide preko event_id
// (purchaseEventId(order_number)) - Meta spaja browser + server događaj u jedan.
//
// Best-effort: ako token nije postavljen ili poziv padne, samo logujemo i ne
// rušimo tok plaćanja (isto kao Resend/Fiscomm obrazac).

import crypto from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { META_PIXEL_ID, poklonEventId, purchaseEventId } from "@/lib/fbq";

const GRAPH_VERSION = "v21.0";

interface OrderItemLike {
  course_id?: string;
  course_slug?: string;
  title?: string;
  price?: number;
}

interface OrderLike {
  order_number: string | null;
  total: number; // celi dinari (RSD)
  email: string | null;
  items: unknown; // JSONB niz OrderItemLike
  payment_method?: string;
}

export interface CapiContext {
  /** _fbp cookie (browser pixel ga postavlja) - poboljšava match ako je dostupan. */
  fbp?: string | null;
  /** _fbc cookie (klik atribucija) - poboljšava match ako je dostupan. */
  fbc?: string | null;
  /** IP korisnika (ne banke/admina). Izostaviti ako nije pouzdano korisnikov. */
  clientIp?: string | null;
  /** User-Agent korisnika. Izostaviti ako nije pouzdano korisnikov. */
  userAgent?: string | null;
  /** URL na kom se konverzija desila (stranica „Hvala"). */
  eventSourceUrl?: string | null;
}

/** SHA-256 hex od normalizovane vrednosti (trim + lowercase) - Meta zahteva za PII. */
function hash(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase(), "utf8").digest("hex");
}

/** Korisnički podaci za match - isti za svaki događaj koji šaljemo. */
function korisnickiPodaci(order: OrderLike, ctx: CapiContext): Record<string, unknown> {
  const userData: Record<string, unknown> = {};
  if (order.email) userData.em = [hash(order.email)];
  if (ctx.fbp) userData.fbp = ctx.fbp;
  if (ctx.fbc) userData.fbc = ctx.fbc;
  if (ctx.clientIp) userData.client_ip_address = ctx.clientIp;
  if (ctx.userAgent) userData.client_user_agent = ctx.userAgent;
  return userData;
}

/** Slugovi proizvoda iz porudžbine - Meta ih traži kao content_ids. */
function sadrzaj(order: OrderLike): { contentIds: string[]; contentName?: string } {
  const items = Array.isArray(order.items) ? (order.items as OrderItemLike[]) : [];
  return {
    contentIds: items.map((i) => i.course_slug).filter((s): s is string => Boolean(s)),
    contentName: items[0]?.title || undefined,
  };
}

/**
 * Zajednički POST ka Meti. Best-effort: nikad ne baca, samo vrati false i
 * ostavi trag - pozivaoci su tokovi plaćanja i dodele pristupa.
 */
async function posaljiDogadjaj(
  event: Record<string, unknown>,
  token: string,
  opis: string,
  orderNumber: string | null,
): Promise<boolean> {
  const body: Record<string, unknown> = { data: [event], access_token: token };
  // Opcionalni kod za Test Events tab (postavi META_TEST_EVENT_CODE dok testiraš, pa ukloni).
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[meta-capi] ${opis} odbijen (${res.status}): ${text}`);
      Sentry.captureMessage(`[meta-capi] ${opis} odbijen (${res.status})`, {
        level: "error",
        extra: { opis, order_number: orderNumber, status: res.status, response: text },
      });
      return false;
    }
    console.log(`[meta-capi] ${opis} poslat`);
    return true;
  } catch (err) {
    console.error(`[meta-capi] greška pri slanju ${opis}:`, err);
    Sentry.captureException(err, { extra: { scope: "meta-capi", opis, order_number: orderNumber } });
    return false;
  }
}

/** Token + pixel; bez njih se tiho ne šalje ništa (isto kao ranije). */
function tokenIliOdustani(): string | null {
  const token = process.env.META_CONVERSIONS_API_KEY;
  if (!token || !META_PIXEL_ID) {
    console.warn("[meta-capi] META_CONVERSIONS_API_KEY ili pixel ID nije postavljen - CAPI preskočen");
    return null;
  }
  return token;
}

/**
 * Šalje Purchase na Meta Conversions API. Vraća true ako je Meta primila događaj.
 * Iznos (value) je u celim dinarima, currency je RSD, order_id = order_number.
 */
export async function sendPurchaseEvent(order: OrderLike, ctx: CapiContext = {}): Promise<boolean> {
  const token = tokenIliOdustani();
  if (!token) return false;

  const { contentIds, contentName } = sadrzaj(order);
  const userData = korisnickiPodaci(order, ctx);

  const event = {
    event_name: "Purchase",
    // event_time je sekundama; Date.now() je dozvoljen u serverskom kodu (ne u workflow skriptama).
    event_time: Math.floor(Date.now() / 1000),
    event_id: purchaseEventId(order.order_number),
    action_source: "website",
    ...(ctx.eventSourceUrl ? { event_source_url: ctx.eventSourceUrl } : {}),
    user_data: userData,
    custom_data: {
      currency: "RSD",
      value: order.total,
      order_id: order.order_number,
      ...(contentIds.length ? { content_ids: contentIds, content_type: "product" } : {}),
      ...(contentName ? { content_name: contentName } : {}),
    },
  };

  return posaljiDogadjaj(event, token, `Purchase ${order.order_number} (value=${order.total} RSD)`, order.order_number);
}

/**
 * Poklon (zack!, /poklon) - CompleteRegistration, NE Purchase.
 *
 * Poklon nije prihod: kupovina od 0 RSD bi ušla u isti skup kao prave prodaje,
 * oborila prosečnu vrednost porudžbine i naterala Metu da optimizuje ka ljudima
 * koji uzimaju besplatno. Zato ide zaseban događaj BEZ value i currency - ima
 * šta da se optimizuje i broji, a novac ostaje čist.
 */
export async function sendPoklonEvent(order: OrderLike, ctx: CapiContext = {}): Promise<boolean> {
  const token = tokenIliOdustani();
  if (!token) return false;

  const { contentIds, contentName } = sadrzaj(order);

  const event = {
    event_name: "CompleteRegistration",
    event_time: Math.floor(Date.now() / 1000),
    event_id: poklonEventId(order.order_number),
    action_source: "website",
    ...(ctx.eventSourceUrl ? { event_source_url: ctx.eventSourceUrl } : {}),
    user_data: korisnickiPodaci(order, ctx),
    custom_data: {
      // Namerno bez value i currency - vidi komentar iznad.
      order_id: order.order_number,
      status: "poklon",
      ...(contentIds.length ? { content_ids: contentIds, content_type: "product" } : {}),
      ...(contentName ? { content_name: contentName } : {}),
    },
  };

  return posaljiDogadjaj(event, token, `CompleteRegistration (poklon) ${order.order_number}`, order.order_number);
}
