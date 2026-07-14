// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { SENTRY_DENY_URLS, SENTRY_IGNORE_ERRORS } from "@/lib/sentry-ignore";

Sentry.init({
  dsn: "https://4888c4f4fdf635c39c792f36efd16896@o4511456054673408.ingest.de.sentry.io/4511456059326544",

  // Benigne Supabase multi-tab lock greške - ne troše kvotu.
  ignoreErrors: SENTRY_IGNORE_ERRORS,

  // Greške čiji stack potiče iz browser ekstenzija - ne troše kvotu.
  denyUrls: SENTRY_DENY_URLS,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  // 0.1 = 10% - namerno nisko da se ne potroši besplatna Sentry kvota (446+ korisnika).
  tracesSampleRate: 0.1,

  // PII se NE šalje (GDPR - EU korisnici). Session Replay isključen (kvota + privatnost).
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
