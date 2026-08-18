import { describe, it, expect } from "vitest";
import { napraviPinOtisak, pinJeIspravan, pinSePoklapa, slabPin } from "./pin";

describe("pinJeIspravan", () => {
  it("prihvata tačno četiri cifre", () => {
    expect(pinJeIspravan("0492")).toBe(true);
  });
  it("odbija sve ostalo", () => {
    for (const p of ["123", "12345", "12a4", "", "  12", "١٢٣٤"]) {
      expect(pinJeIspravan(p)).toBe(false);
    }
  });
});

describe("slabPin", () => {
  it("odbija sve iste cifre", () => {
    for (const p of ["0000", "1111", "9999"]) expect(slabPin(p)).toBe(true);
  });
  it("odbija uzlazni i silazni niz", () => {
    for (const p of ["1234", "2345", "4321", "9876"]) expect(slabPin(p)).toBe(true);
  });
  it("propušta običan PIN", () => {
    for (const p of ["0492", "7314", "8025"]) expect(slabPin(p)).toBe(false);
  });
  it("na neispravan oblik ne tvrdi da je slab", () => {
    expect(slabPin("12")).toBe(false);
  });
});

describe("otisak PIN-a", () => {
  it("isti PIN dva puta daje različit otisak, jer so radi", async () => {
    const a = await napraviPinOtisak("0492");
    const b = await napraviPinOtisak("0492");
    expect(a).not.toBe(b);
  });

  it("nikad ne sadrži sam PIN", async () => {
    const o = await napraviPinOtisak("7314");
    expect(o.includes("7314")).toBe(false);
  });

  it("poklapa se sa svojim PIN-om", async () => {
    const o = await napraviPinOtisak("0492");
    expect(await pinSePoklapa("0492", o)).toBe(true);
  });

  it("ne poklapa se sa tuđim PIN-om", async () => {
    const o = await napraviPinOtisak("0492");
    expect(await pinSePoklapa("0493", o)).toBe(false);
  });

  it("neispravan PIN se ne poklapa ni sa čim", async () => {
    const o = await napraviPinOtisak("0492");
    expect(await pinSePoklapa("492", o)).toBe(false);
  });

  it("pokvaren otisak vraća false, ne baca", async () => {
    for (const o of ["", "nije-otisak", "scrypt$0$8$1$c28=$a2V5", "scrypt$16384$8$1$$", "a$b$c$d$e$f"]) {
      expect(await pinSePoklapa("0492", o)).toBe(false);
    }
  });

  it("odbija pravljenje otiska za neispravan PIN", async () => {
    await expect(napraviPinOtisak("12")).rejects.toThrow();
  });
});
