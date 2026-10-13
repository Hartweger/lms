// Sentry SDK u browseru je ~140 KB (najveći JS paket na sajtu) i na sporom
// telefonu se izvršava ~350 ms - a to je baš vreme kad se crta prva slika
// (PageSpeed mobilni, 12.10.2026: LCP 6,2 s, render delay 2,1 s).
// Zato se SDK ne uvozi statički nigde u klijentskom kodu, nego se učitava
// tek posle `load` događaja (vidi instrumentation-client.ts), a klijentske
// komponente greške prijavljuju preko prijaviGresku().
//
// Greške koje se dese pre nego što se SDK učita ne propadaju: hvata ih
// instrumentation-client.ts i predaje ovde kad SDK stigne.

import { SENTRY_DENY_URLS, SENTRY_IGNORE_ERRORS } from "@/lib/sentry-ignore";

type SentryModul = typeof import("@sentry/nextjs");

let ucitavanje: Promise<SentryModul> | null = null;
let ucitan: SentryModul | null = null;

export function ucitajSentry(): Promise<SentryModul> {
  ucitavanje ??= import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: "https://4888c4f4fdf635c39c792f36efd16896@o4511456054673408.ingest.de.sentry.io/4511456059326544",

      // Samo produkcija - dev greške ne idu u Sentry (vidi sentry.server.config.ts).
      enabled: process.env.NODE_ENV === "production",

      // Benigne Supabase multi-tab lock greške - ne troše kvotu.
      ignoreErrors: SENTRY_IGNORE_ERRORS,

      // Greške čiji stack potiče iz browser ekstenzija - ne troše kvotu.
      denyUrls: SENTRY_DENY_URLS,

      // 0.1 = 10% - namerno nisko da se ne potroši besplatna Sentry kvota (446+ korisnika).
      tracesSampleRate: 0.1,

      // PII se NE šalje (GDPR - EU korisnici). Session Replay isključen (kvota + privatnost).
      sendDefaultPii: false,
    });
    ucitan = Sentry;
    return Sentry;
  });
  return ucitavanje;
}

/** Već učitan SDK ili null - za pozive koji ne smeju da okidaju učitavanje. */
export function sentryAkoJeUcitan(): SentryModul | null {
  return ucitan;
}

/** Zamena za Sentry.captureException u klijentskim komponentama. */
export function prijaviGresku(greska: unknown): void {
  void ucitajSentry().then((Sentry) => Sentry.captureException(greska));
}
