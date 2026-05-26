"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="sr">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "80px 20px" }}>
        <h1 style={{ fontSize: "24px", color: "#1a1a2e" }}>Došlo je do greške</h1>
        <p style={{ color: "#666", marginBottom: "24px" }}>Izvinjavamo se. Pokušajte ponovo.</p>
        <button
          onClick={reset}
          style={{
            background: "#4fb1d3",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Pokušaj ponovo
        </button>
      </body>
    </html>
  );
}
