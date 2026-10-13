// Omotač oko web-push: jedna tačka kroz koju ide svako slanje, sa tumačenjem
// odgovora push servisa. 404/410 znači da pretplata više ne postoji (obrisan
// browser, deinstalirana PWA) - pozivalac tada briše red iz push_pretplate.
import webpush from "web-push";
import * as Sentry from "@sentry/nextjs";

export interface PushPretplata {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushTelo {
  naslov: string;
  telo: string;
  url: string;
}

export type IshodSlanja = "ok" | "mrtva" | "greska";

let podesen = false;

/** Lenjo podešavanje: bez ključeva push tiho miruje, kao što email.ts radi bez RESEND_API_KEY. */
function podesi(): boolean {
  if (podesen) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    console.warn("[push] VAPID ključevi nisu postavljeni - push isključen");
    return false;
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:info@hartweger.rs", pub, priv);
  podesen = true;
  return true;
}

export async function posaljiPush(p: PushPretplata, telo: PushTelo): Promise<IshodSlanja> {
  if (!podesi()) return "greska";
  try {
    await webpush.sendNotification(
      { endpoint: p.endpoint, keys: { p256dh: p.p256dh, auth: p.auth } },
      JSON.stringify(telo)
    );
    return "ok";
  } catch (e) {
    const kod = (e as { statusCode?: number }).statusCode;
    if (kod === 404 || kod === 410) return "mrtva";
    console.error(`[push] slanje palo (${kod ?? "bez koda"}):`, e);
    Sentry.captureException(e);
    return "greska";
  }
}
