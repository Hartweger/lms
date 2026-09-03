import { describe, it, expect } from "vitest";
import { nadjiSumnje, upozorenje } from "./duplikat-troska";
import type { ExpenseRow } from "@/lib/finansije";

function trosak(p: Partial<ExpenseRow>): ExpenseRow {
  return {
    id: p.id ?? "x", name: p.name ?? "Trošak", category: p.category ?? "usluge",
    amount: p.amount ?? 100, course_id: null, expense_date: p.expense_date ?? "2026-08-01",
    recurring: p.recurring ?? false, ended_at: p.ended_at ?? null, note: null,
  };
}

describe("nadjiSumnje - mesečna ponavljanja", () => {
  // Pravi slučaj iz avgusta 2026: knjigovođa je bio i ponavljanje pod imenom
  // "Knjigovođa", i faktura sa SEF-a od "Knjiški moljac 2012". Imena se ne
  // poklapaju, iznos se poklapa do dinara.
  const knjigovodja = trosak({ name: "Knjigovođa", amount: 31152, recurring: true, expense_date: "2026-06-01" });

  it("prepoznaje isti iznos pod drugim imenom", () => {
    const s = nadjiSumnje({ naziv: "Knjiški moljac 2012", iznos: 31152, datum: "2026-08-31" }, [knjigovodja]);
    expect(s).toEqual([{ naziv: "Knjigovođa", iznos: 31152, kako: "mesečno ponavljanje" }]);
  });

  it("ćuti kad je ponavljanje već ugašeno pre tog meseca", () => {
    const ugaseno = { ...knjigovodja, ended_at: "2026-08-31" };
    expect(nadjiSumnje({ naziv: "Knjiški moljac", iznos: 31152, datum: "2026-09-30" }, [ugaseno])).toEqual([]);
    expect(nadjiSumnje({ naziv: "Knjiški moljac", iznos: 31152, datum: "2026-08-31" }, [ugaseno])).toHaveLength(1);
  });

  it("ćuti pre nego što je ponavljanje počelo", () => {
    expect(nadjiSumnje({ naziv: "Knjiški moljac", iznos: 31152, datum: "2026-05-31" }, [knjigovodja])).toEqual([]);
  });

  it("prepoznaje isto ime i kad je iznos drugi - kartica ne naplati u dinar", () => {
    const manychat = trosak({ name: "ManyChat", amount: 7605, recurring: true, expense_date: "2026-05-01" });
    const s = nadjiSumnje({ naziv: "MANYCHAT.COM", iznos: 6717, datum: "2026-08-31" }, [manychat]);
    expect(s).toHaveLength(1);
  });
});

describe("nadjiSumnje - jednokratni", () => {
  const provizija = trosak({ name: "Provizija za plaćanje karticama", amount: 19746, expense_date: "2026-07-15" });

  it("javlja isti iznos u prozoru od 35 dana", () => {
    // Faktura sa SEF-a od 07.08. za istu julsku proviziju.
    const s = nadjiSumnje({ naziv: "BANCA INTESA", iznos: 19746.49, datum: "2026-08-07" }, [provizija]);
    expect(s).toEqual([{ naziv: "Provizija za plaćanje karticama", iznos: 19746, kako: "2026-07-15" }]);
  });

  it("ćuti kad je isti iznos daleko u prošlosti", () => {
    expect(nadjiSumnje({ naziv: "BANCA INTESA", iznos: 19746, datum: "2026-11-07" }, [provizija])).toEqual([]);
  });

  it("isto ime bez istog iznosa nije dovoljno za jednokratni", () => {
    // Dva različita računa istog dobavljača u istom mesecu su normalna stvar.
    expect(nadjiSumnje({ naziv: "Banca Intesa", iznos: 810, datum: "2026-07-20" }, [provizija])).toEqual([]);
  });
});

describe("nadjiSumnje - granice", () => {
  it("bez iznosa ili datuma ne pogađa", () => {
    const t = [trosak({ amount: 100 })];
    expect(nadjiSumnje({ naziv: "X", iznos: null, datum: "2026-08-01" }, t)).toEqual([]);
    expect(nadjiSumnje({ naziv: "X", iznos: 100, datum: null }, t)).toEqual([]);
  });

  it("pravni oblici i grad ne prave lažno poklapanje", () => {
    const a = trosak({ name: "Alfa DOO Beograd", amount: 500, recurring: true, expense_date: "2026-01-01" });
    expect(nadjiSumnje({ naziv: "Beta DOO Beograd", iznos: 900, datum: "2026-08-01" }, [a])).toEqual([]);
  });
});

describe("upozorenje", () => {
  it("bez sumnje vraća null", () => {
    expect(upozorenje({ naziv: "X", iznos: 1, datum: "2026-08-01" }, [])).toBe(null);
  });

  it("piše ime, iznos i odakle dolazi", () => {
    const t = [trosak({ name: "Knjigovođa", amount: 31152, recurring: true, expense_date: "2026-06-01" })];
    expect(upozorenje({ naziv: "Knjiški moljac", iznos: 31152, datum: "2026-08-31" }, t)).toBe(
      "Možda je već knjiženo: Knjigovođa (31.152 RSD, mesečno ponavljanje).",
    );
  });
});
