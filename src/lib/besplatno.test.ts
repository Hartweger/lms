import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { BESPLATNO_PONUDA } from "./besplatno";

/**
 * Prikazano i izgovoreno moraju biti isto: ako se u tab Besplatno doda ili iz
 * njega izbaci kartica, a spisak za Smile ostane stari, ovaj test pada. Bez
 * njega se razilaženje ne vidi - Smile tiho priča o staroj ponudi.
 */
describe("sekcija Besplatno na sajtu i spisak za Smile", () => {
  function hrefoviIzTabaBesplatno(): string[] {
    const src = readFileSync(join(process.cwd(), "src/components/KurseviKatalog.tsx"), "utf8");
    const start = src.indexOf('id: "besplatno"');
    expect(start).toBeGreaterThan(-1);
    const cards = src.slice(src.indexOf("cards: [", start), src.indexOf("\n  },", start));
    return [...cards.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);
  }

  it("svaka kartica iz taba ima svoju stavku u spisku", () => {
    const spisak = new Set(BESPLATNO_PONUDA.map((r) => r.href));
    for (const href of hrefoviIzTabaBesplatno()) {
      // NaKI kartica vodi na stari WP link koji je 308 na /naki
      const normalizovan = href.replace("https://www.hartweger.rs/naki-ai-asistent-nemacki/", "/naki");
      expect(spisak.has(normalizovan), `kartica ${href} nije u BESPLATNO_PONUDA`).toBe(true);
    }
  });

  it("u spisku nema stavke koje nema u tabu", () => {
    const naSajtu = new Set(
      hrefoviIzTabaBesplatno().map((h) => h.replace("https://www.hartweger.rs/naki-ai-asistent-nemacki/", "/naki"))
    );
    for (const r of BESPLATNO_PONUDA) {
      expect(naSajtu.has(r.href), `${r.href} je u spisku, a nije kartica u tabu`).toBe(true);
    }
  });
});
