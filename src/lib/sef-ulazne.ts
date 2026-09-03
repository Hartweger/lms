// src/lib/sef-ulazne.ts
// Pretvaranje SEF-ovog pregleda ulaznih faktura u naše redove, i predlog kategorije.
//
// Čist modul: bez baze i bez mreže, da može da se testira sam.

import { poljeIz, type UlaznaFakturaSef } from "@/lib/sef";

export interface UlaznaFakturaRed {
  sef_invoice_id: string;
  cir_invoice_id: string | null;
  broj_dokumenta: string | null;
  dobavljac_naziv: string | null;
  dobavljac_pib: string | null;
  iznos: number | null;
  iznos_bez_pdv: number | null;
  pdv: number | null;
  valuta: string;
  datum: string | null;
  rok_placanja: string | null;
  status: string | null;
}

/** SEF vraća datume u raznim oblicima; nama treba YYYY-MM-DD ili ništa. */
export function danOnly(v: unknown): string | null {
  if (v == null) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v).trim());
  return m ? m[1] : null;
}

/**
 * Jedan red iz SEF-a → jedan naš red. Vraća `null` ako fakturi fali identifikator,
 * jer bez njega ne možemo da je razlikujemo od druge i sledeći prolaz bi je duplirao.
 */
function tekst(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function broj(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function uRed(f: UlaznaFakturaSef): UlaznaFakturaRed | null {
  // Polja se čitaju kroz `poljeIz`, ne po tačnom imenu: SEF ih piše VELIKIM
  // početnim slovom (`InvoiceId`, `SupplierName`), iako specifikacija navodi mala.
  // Ista greška je već dvaput promašila - kod broja fakture i kod statusa.
  const id = broj(poljeIz(f, "invoiceId"));
  if (id == null) return null;
  return {
    sef_invoice_id: String(id),
    cir_invoice_id: tekst(poljeIz(f, "cirInvoiceId")),
    broj_dokumenta: tekst(poljeIz(f, "documentNumber")),
    dobavljac_naziv: tekst(poljeIz(f, "supplierName")),
    dobavljac_pib: tekst(poljeIz(f, "supplierVatRegistrationNumber")),
    iznos: broj(poljeIz(f, "amount")),
    iznos_bez_pdv: broj(poljeIz(f, "sumWithoutVat")),
    pdv: broj(poljeIz(f, "vatAmount")),
    valuta: tekst(poljeIz(f, "currency")) ?? "RSD",
    // `sentDate` je kad je faktura stigla; ako ga nema, uzima se datum prometa.
    datum: danOnly(poljeIz(f, "sentDate")) ?? danOnly(poljeIz(f, "deliveryDate")),
    rok_placanja: danOnly(poljeIz(f, "dueDate")),
    status: tekst(poljeIz(f, "status")),
  };
}

/** Statusi ulazne fakture koji znače da to nije trošak koji treba knjižiti. */
const NIJE_TROSAK = ["Deleted", "Cancelled", "Storno", "Rejected"];

export function jeZaKnjizenje(status: string | null): boolean {
  return !status || !NIJE_TROSAK.includes(status);
}

/**
 * Predlog kategorije po nazivu dobavljača - samo predlog, Nataša bira.
 * Namerno kratko: pogađanje koje često promaši gore je od praznog polja.
 */
const PREPOZNATI: { deo: RegExp; kategorija: string }[] = [
  { deo: /vercel|supabase|resend|google|anthropic|openai|github|zoom|canva/i, kategorija: "alati-hosting" },
  { deo: /meta platforms|facebook|instagram|google ads/i, kategorija: "oglasi" },
  { deo: /banka|intesa|unicredit|raiffeisen/i, kategorija: "provizije" },
];

export function predlozenaKategorija(dobavljac: string | null): string | null {
  if (!dobavljac) return null;
  return PREPOZNATI.find((p) => p.deo.test(dobavljac))?.kategorija ?? null;
}
