// src/lib/izvod-xml.ts
// Čitanje dnevnog izvoda Banca Intese (XML koji stiže mejlom sa info@mail.bancaintesa.rs).
//
// Čist modul: bez baze i bez mreže, da može da se testira sam.
//
// Oblik je `pmtnotification` sa listom `stmttrn`. Ključna polja:
//   fitid          jedinstven broj transakcije - po njemu se sprečava dvostruko knjiženje
//   benefit        "credit" = novac ULAZI, "debit" = novac IZLAZI
//   trnamt         iznos (uvek pozitivan; smer nosi `benefit`)
//   purpose        svrha doznake
//   refnumber      poziv na broj ODOBRENJA - ono što je platilac upisao za nas
//   payeerefnumber poziv na broj zaduženja - referenca druge strane
//   payeeinfo/name naziv druge strane
//
// PAŽNJA: poziv na broj ume da nosi rep koji banka dopisuje ("3228067867,27-AUG-26"),
// pa se za uparivanje traži NAŠ broj narudžbine unutar teksta, ne jednakost.

import { XMLParser } from "fast-xml-parser";

export type Smer = "priliv" | "odliv";

export interface IzvodStavka {
  /** Jedinstven broj transakcije kod banke. Ključ protiv dvostrukog knjiženja. */
  fitid: string;
  smer: Smer;
  /** Uvek pozitivan; smer je u `smer`. */
  iznos: number;
  /** Datum knjiženja, YYYY-MM-DD. */
  datum: string | null;
  naziv: string | null;
  racunDruge: string | null;
  svrha: string | null;
  /** Šifra plaćanja (npr. 284). */
  sifra: string | null;
  /** Poziv na broj odobrenja - ono što je platilac upisao za nas. */
  pozivNaBroj: string | null;
  /** Poziv na broj zaduženja - referenca druge strane. */
  pozivDruge: string | null;
}

export interface Izvod {
  racun: string | null;
  broj: number | null;
  /** Datum izvoda, YYYY-MM-DD. */
  datum: string | null;
  stanje: number | null;
  stavke: IzvodStavka[];
}

function tekst(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function broj(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/\s/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** `2026-08-27T00:00:00` → `2026-08-27`. Prazno ostaje prazno. */
export function dan(v: unknown): string | null {
  const s = tekst(v);
  if (!s) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  return m ? m[1] : null;
}

export function procitajIzvod(xml: string): Izvod {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
    // Brojevi računa i pozivi na broj MORAJU ostati tekst: "160-6000..." i vodeće
    // nule bi se inače pokvarili.
    parseTagValue: false,
    trimValues: true,
  });

  const root = parser.parse(xml)?.pmtnotification;
  if (!root) throw new Error("Nije izvod: nema pmtnotification");

  const lista = root.trnlist?.stmttrn;
  const sirove: Record<string, unknown>[] = Array.isArray(lista) ? lista : lista ? [lista] : [];

  const stavke: IzvodStavka[] = sirove.map((t) => {
    const payee = (t.payeeinfo ?? {}) as Record<string, unknown>;
    const racun = (t.payeeaccountinfo ?? {}) as Record<string, unknown>;
    return {
      fitid: tekst(t.fitid) ?? "",
      smer: tekst(t.benefit) === "credit" ? "priliv" : "odliv",
      iznos: Math.abs(broj(t.trnamt) ?? 0),
      datum: dan(t.dtposted),
      naziv: tekst(payee.name),
      racunDruge: tekst(racun.acctid),
      svrha: tekst(t.purpose),
      sifra: tekst(t.purposecode),
      pozivNaBroj: tekst(t.refnumber),
      pozivDruge: tekst(t.payeerefnumber),
    };
  });

  return {
    racun: tekst(root.acctid),
    broj: broj(root.stmtnumber),
    datum: dan(root.ledgerbal?.dtasof) ?? dan(root.availbal?.dtasof),
    stanje: broj(root.availbal?.balamt),
    stavke,
  };
}

/**
 * Traži broj narudžbine (2026-419) u pozivu na broj i u svrsi doznake.
 *
 * Ne poredi se jednakošću: banka dopisuje rep uz poziv na broj, a platilac ume da
 * broj upiše u svrhu umesto u poziv - ili obrnuto. Zato se gleda pojavljivanje.
 */
export function nadjiBrojNarudzbine(s: IzvodStavka, brojevi: readonly string[]): string | null {
  const gde = [s.pozivNaBroj, s.svrha, s.pozivDruge].filter(Boolean).join(" ");
  if (!gde) return null;
  // Duži broj prvi: da "2026-41" ne pokupi uplatu za "2026-419".
  for (const b of [...brojevi].sort((a, c) => c.length - a.length)) {
    if (gde.includes(b)) return b;
  }
  return null;
}
