// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://4888c4f4fdf635c39c792f36efd16896@o4511456054673408.ingest.de.sentry.io/4511456059326544",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  // 0.1 = 10% — namerno nisko da se ne potroši besplatna Sentry kvota (446+ korisnika).
  tracesSampleRate: 0.1,

  // PII se NE šalje (GDPR — EU korisnici).
  sendDefaultPii: false,
});
