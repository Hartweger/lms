import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Jednokratne migracione i pomoćne skripte (WP migracija, uvoz kvizova,
  // slanje podsetnika...). Ne idu u build, pokreću se ručno preko tsx, i rade
  // sa neuređenim spoljnim podacima gde je `any` realno stanje stvari, a ne
  // propust. Tipiziranje njih ne donosi ništa, a šum krije greške u src/.
  // Ako neka skripta preraste u nešto što se stalno koristi - izbaci je odavde.
  {
    files: ["scripts/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
