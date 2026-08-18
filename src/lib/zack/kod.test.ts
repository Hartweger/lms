import { describe, it, expect } from "vitest";
import { AZBUKA, kodJeIspravan, napraviKod, normalizujKod } from "./kod";

describe("azbuka koda", () => {
  it("ne sadrži znakove koji se mešaju pri prepisivanju", () => {
    for (const z of ["0", "O", "1", "I", "L"]) {
      expect(AZBUKA.includes(z)).toBe(false);
    }
  });
});

describe("napraviKod", () => {
  it("ima prefiks i tačno četiri znaka", () => {
    const k = napraviKod(() => 0);
    expect(k).toMatch(/^ZK-.{4}$/);
  });

  it("koristi samo znakove iz azbuke", () => {
    let seme = 0;
    const k = napraviKod(() => ((seme = (seme + 0.137) % 1), seme));
    expect([...k.slice(3)].every((z) => AZBUKA.includes(z))).toBe(true);
  });

  it("rng na gornjoj granici ne izlazi iz azbuke", () => {
    expect(kodJeIspravan(napraviKod(() => 0.999999))).toBe(true);
    expect(kodJeIspravan(napraviKod(() => 1))).toBe(true);
  });
});

describe("normalizujKod", () => {
  it("isti kod prepoznaje u svakom zapisu", () => {
    const ocekivano = "ZK-4F7Q";
    for (const zapis of ["ZK-4F7Q", "zk-4f7q", "zk4f7q", "ZK 4F7Q", " Zk-4F 7q "]) {
      expect(normalizujKod(zapis)).toBe(ocekivano);
    }
  });

  it("prazan unos daje samo prefiks", () => {
    expect(normalizujKod("")).toBe("ZK-");
  });
});

describe("kodJeIspravan", () => {
  it("prihvata ispravan kod u svakom zapisu", () => {
    expect(kodJeIspravan("ZK-4F7Q")).toBe(true);
    expect(kodJeIspravan("zk4f7q")).toBe(true);
  });

  it("odbija pogrešnu dužinu", () => {
    expect(kodJeIspravan("ZK-4F7")).toBe(false);
    expect(kodJeIspravan("ZK-4F7QQ")).toBe(false);
    expect(kodJeIspravan("")).toBe(false);
  });

  it("odbija znakove koji se mešaju", () => {
    expect(kodJeIspravan("ZK-4F70")).toBe(false);
    expect(kodJeIspravan("ZK-4F7O")).toBe(false);
    expect(kodJeIspravan("ZK-4F7I")).toBe(false);
  });
});
