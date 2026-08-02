import { describe, it, expect } from "vitest";
import {
  dodajPoruku,
  ukloniPoruku,
  uvecajNeprocitano,
  ocistiNeprocitano,
  type ChatPoruka,
} from "./chat-poruke";

function poruka(id: string, kanal = "k1"): ChatPoruka {
  return { id, kanal_id: kanal, user_id: "u1", ime: "Ana", tekst: "zdravo", created_at: "2026-08-02T10:00:00Z" };
}

describe("dodajPoruku", () => {
  it("dodaje novu poruku na kraj", () => {
    const out = dodajPoruku([poruka("a")], poruka("b"));
    expect(out.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("ne duplira poruku sa istim id (sopstveni insert + realtime event)", () => {
    const spisak = [poruka("a")];
    expect(dodajPoruku(spisak, poruka("a"))).toBe(spisak);
  });
});

describe("ukloniPoruku", () => {
  it("uklanja poruku po id", () => {
    const out = ukloniPoruku([poruka("a"), poruka("b")], "a");
    expect(out.map((p) => p.id)).toEqual(["b"]);
  });

  it("id kog nema u spisku ne menja ništa (DELETE iz drugog kanala)", () => {
    const spisak = [poruka("a")];
    expect(ukloniPoruku(spisak, "x")).toEqual(spisak);
  });
});

describe("nepročitano mapa", () => {
  it("uvećava brojač po kanalu, od nule za nepoznat kanal", () => {
    let mapa = uvecajNeprocitano({}, "k1");
    mapa = uvecajNeprocitano(mapa, "k1");
    mapa = uvecajNeprocitano(mapa, "k2");
    expect(mapa).toEqual({ k1: 2, k2: 1 });
  });

  it("čisti brojač aktivnog kanala, ostale ne dira", () => {
    const mapa = ocistiNeprocitano({ k1: 3, k2: 1 }, "k1");
    expect(mapa).toEqual({ k1: 0, k2: 1 });
  });

  it("čišćenje već praznog kanala vraća istu referencu (bez re-rendera)", () => {
    const mapa = { k2: 1 };
    expect(ocistiNeprocitano(mapa, "k1")).toBe(mapa);
  });
});
