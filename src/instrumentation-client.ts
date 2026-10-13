// Sentry u browseru se NE inicijalizuje ovde odmah - SDK je najveći JS paket
// na sajtu i usporavao je prvi prikaz na mobilnom. Učitava se tek kad se
// stranica učita (vidi src/lib/sentry-klijent.ts, tamo je i Sentry.init).
//
// Do tada se greške skupljaju ovde i predaju SDK-u čim stigne, pa ni greške
// iz prvih sekundi ne propadaju. Posle init-a Sentry ima svoje globalne
// hvatače, pa se naši skidaju.

import { sentryAkoJeUcitan, ucitajSentry } from "@/lib/sentry-klijent";

const naCekanju: unknown[] = [];
const naGresku = (e: ErrorEvent) => naCekanju.push(e.error ?? e.message);
const naOdbijanje = (e: PromiseRejectionEvent) => naCekanju.push(e.reason);
window.addEventListener("error", naGresku);
window.addEventListener("unhandledrejection", naOdbijanje);

function pokreni() {
  void ucitajSentry().then((Sentry) => {
    window.removeEventListener("error", naGresku);
    window.removeEventListener("unhandledrejection", naOdbijanje);
    for (const greska of naCekanju.splice(0)) Sentry.captureException(greska);
  });
}

if (document.readyState === "complete") {
  pokreni();
} else {
  window.addEventListener("load", pokreni, { once: true });
}

export function onRouterTransitionStart(href: string, navigationType: string) {
  sentryAkoJeUcitan()?.captureRouterTransitionStart(href, navigationType);
}
