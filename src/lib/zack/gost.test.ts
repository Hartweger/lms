import { describe, expect, it } from "vitest";
import { proveriGostUnos, smePostavljanjePina, GOST_IME_NAJVISE } from "./gost";

const UDZBENIK = "3f9a1c2e-1111-4222-8333-444455556666";

const unos = (delovi: Partial<Parameters<typeof proveriGostUnos>[0]> = {}) => ({
  ime: "Petra",
  udzbenikId: UDZBENIK,
  email: "roditelj@example.com",
  pristanak: true,
  ...delovi,
});

describe("proveriGostUnos", () => {
  it("ispravan unos prolazi, sa normalizovanim vrednostima", () => {
    const r = proveriGostUnos(unos({ ime: "  Petra ", email: "Roditelj@Example.COM " }));
    expect(r).toEqual({ ok: true, ime: "Petra", udzbenikId: UDZBENIK, email: "roditelj@example.com" });
  });

  it("prazno ime (i samo razmaci) se odbija", () => {
    expect(proveriGostUnos(unos({ ime: "   " }))).toEqual({ ok: false, poruka: "Upiši ime deteta." });
    expect(proveriGostUnos(unos({ ime: undefined }))).toMatchObject({ ok: false });
  });

  it("predugačko ime se odbija, tačno na granici prolazi", () => {
    expect(proveriGostUnos(unos({ ime: "a".repeat(GOST_IME_NAJVISE + 1) }))).toMatchObject({ ok: false });
    expect(proveriGostUnos(unos({ ime: "a".repeat(GOST_IME_NAJVISE) }))).toMatchObject({ ok: true });
  });

  it("udžbenik mora biti UUID", () => {
    expect(proveriGostUnos(unos({ udzbenikId: "" }))).toMatchObject({ ok: false, poruka: "Izaberi razred i udžbenik." });
    expect(proveriGostUnos(unos({ udzbenikId: "nije-uuid" }))).toMatchObject({ ok: false });
    expect(proveriGostUnos(unos({ udzbenikId: 7 }))).toMatchObject({ ok: false });
  });

  it("neispravan mejl se odbija", () => {
    for (const email of ["", "bez-monkija", "a@b", "a@b.c", "a@gmail.com5", undefined]) {
      expect(proveriGostUnos(unos({ email }))).toMatchObject({ ok: false });
    }
  });

  it("tipfeler domena dobija predlog ispravke", () => {
    const r = proveriGostUnos(unos({ email: "mama@gmial.com" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.poruka).toContain("mama@gmail.com");
  });

  it("bez štikliranog pristanka nema porudžbine - i server to proverava", () => {
    expect(proveriGostUnos(unos({ pristanak: false }))).toMatchObject({ ok: false });
    expect(proveriGostUnos(unos({ pristanak: "true" }))).toMatchObject({ ok: false });
    expect(proveriGostUnos(unos({ pristanak: undefined }))).toMatchObject({ ok: false });
  });

  it("nijedna poruka ne otkriva da li mejl već postoji u sistemu", () => {
    // Grananje po postojećem nalogu ide tek posle uplate (grant-access);
    // provera oblika za ZAUZET i SLOBODAN mejl mora dati identičan ishod.
    const zauzet = proveriGostUnos(unos({ email: "postojeci.polaznik@example.com" }));
    const slobodan = proveriGostUnos(unos({ email: "sasvim.novi@example.com" }));
    expect(zauzet).toEqual({ ok: true, ime: "Petra", udzbenikId: UDZBENIK, email: "postojeci.polaznik@example.com" });
    expect(slobodan).toEqual({ ok: true, ime: "Petra", udzbenikId: UDZBENIK, email: "sasvim.novi@example.com" });
    for (const p of [
      proveriGostUnos(unos({ ime: "" })),
      proveriGostUnos(unos({ udzbenikId: "x" })),
      proveriGostUnos(unos({ email: "los" })),
      proveriGostUnos(unos({ pristanak: false })),
    ]) {
      if (!p.ok) expect(p.poruka.toLowerCase()).not.toMatch(/nalog|postoji|registrovan/);
    }
  });
});

describe("smePostavljanjePina", () => {
  const osnova = { paymentStatus: "completed", deteId: "d-1", pinHash: null };

  it("nudi PIN samo za naplaćenu zack porudžbinu sa detetom bez PIN-a", () => {
    expect(smePostavljanjePina(osnova)).toBe(true);
  });

  it("jednom postavljen PIN se više ne nudi (idempotentno)", () => {
    expect(smePostavljanjePina({ ...osnova, pinHash: "scrypt$..." })).toBe(false);
  });

  it("bez naplate nema PIN-a", () => {
    expect(smePostavljanjePina({ ...osnova, paymentStatus: "pending" })).toBe(false);
    expect(smePostavljanjePina({ ...osnova, paymentStatus: "failed" })).toBe(false);
  });

  it("porudžbina bez deteta (nije zack, ili grant još nije prošao) ne nudi PIN", () => {
    expect(smePostavljanjePina({ ...osnova, deteId: null })).toBe(false);
    expect(smePostavljanjePina({ ...osnova, deteId: undefined })).toBe(false);
  });

  it("dete bez reda (pinHash undefined) se ne tretira kao „bez PIN-a“", () => {
    expect(smePostavljanjePina({ ...osnova, pinHash: undefined })).toBe(false);
  });
});
