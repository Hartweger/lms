import { describe, it, expect } from "vitest";
import {
  jeZakljucano,
  POKUSAJA_PRE_ZAKLJUCAVANJA,
  preostaloMinuta,
  stanjePosleGreske,
} from "./zakljucavanje";

const SADA = new Date("2026-08-18T12:00:00Z");
const zaMinuta = (n: number) => new Date(SADA.getTime() + n * 60000).toISOString();

describe("stanjePosleGreske", () => {
  it("prva greška samo broji", () => {
    expect(stanjePosleGreske(0, SADA)).toEqual({ pokusaji: 1, zakljucanoDo: null });
  });

  it("peta greška zaključava na 15 minuta i resetuje brojač", () => {
    const s = stanjePosleGreske(POKUSAJA_PRE_ZAKLJUCAVANJA - 1, SADA);
    expect(s.pokusaji).toBe(0);
    expect(s.zakljucanoDo?.toISOString()).toBe(zaMinuta(15));
  });

  it("pokvaren brojač se ponaša kao nula, ne zaključava iz prve", () => {
    for (const p of [-3, NaN, 2.5]) {
      expect(stanjePosleGreske(p, SADA).zakljucanoDo).toBeNull();
    }
  });
});

describe("jeZakljucano", () => {
  it("zaključano dok rok ne istekne", () => {
    expect(jeZakljucano(zaMinuta(5), SADA)).toBe(true);
  });

  it("otključano kad rok istekne", () => {
    expect(jeZakljucano(zaMinuta(-1), SADA)).toBe(false);
  });

  it("prazan rok znači otključano", () => {
    expect(jeZakljucano(null, SADA)).toBe(false);
    expect(jeZakljucano("", SADA)).toBe(false);
  });

  it("pokvaren datum ne sme da zaključa dete", () => {
    expect(jeZakljucano("ovo-nije-datum", SADA)).toBe(false);
  });
});

describe("preostaloMinuta", () => {
  it("zaokružuje naviše, nikad ne kaže nula dok je zaključano", () => {
    expect(preostaloMinuta(zaMinuta(5), SADA)).toBe(5);
    const trideset_sekundi = new Date(SADA.getTime() + 30000).toISOString();
    expect(preostaloMinuta(trideset_sekundi, SADA)).toBe(1);
  });

  it("nula kad nije zaključano", () => {
    expect(preostaloMinuta(null, SADA)).toBe(0);
    expect(preostaloMinuta(zaMinuta(-10), SADA)).toBe(0);
  });
});
