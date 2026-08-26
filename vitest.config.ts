import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts", "scripts/**/*.test.ts"] },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // `server-only` nije instaliran paket - Next ga rešava sam pri build-u.
      // Bez ovog aliasa svaki test koji dotakne serverski modul puca.
      "server-only": resolve(__dirname, "./src/lib/test/server-only-stub.ts"),
    },
  },
});
