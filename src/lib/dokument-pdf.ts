// src/lib/dokument-pdf.ts
// Crtanje predračuna i fakture za kupca pravno lice. Izgled prati postojeću
// Natašinu Google tabelu: zaglavlje, blok kupca, tabela stavki bez PDV-a, zbir,
// napomena, rok plaćanja, podnožje. Dodato u odnosu na tabelu: logo i IPS QR.
//
// Font MORA biti Roboto iz src/fonts - podrazumevani jsPDF font nema naša slova
// (č, ć, š, ž, đ) i tiho ih izbaci. Isti postupak kao u sertifikatu.
import "server-only";
import { jsPDF } from "jspdf";
import * as fs from "fs";
import * as path from "path";
import { MERCHANT } from "@/lib/payment-confirmation";
import { BANK_FIRME } from "@/lib/order-utils";
import type { DokumentPodaci } from "@/lib/dokument-podaci";

const M = 18;   // margina
const W = 210;  // A4 širina u mm
const H = 297;  // A4 visina u mm

const LOGO_W = 34;
const LOGO_H = LOGO_W / 3.806; // 472x124 - odnos se ne sme pomeriti

function rsd(n: number): string {
  // sr-RS daje tačku kao separator hiljada, isto kao u tabeli (16.333 RSD).
  return `${n.toLocaleString("sr-RS")} RSD`;
}

function fajl(ime: string): Buffer {
  return fs.readFileSync(path.join(process.cwd(), "src/fonts", ime));
}

export function napraviDokumentPdf(d: DokumentPodaci, qr: Buffer | null): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.addFileToVFS("Roboto-VF.ttf", fajl("Roboto-VF.ttf").toString("base64"));
  doc.addFont("Roboto-VF.ttf", "Roboto", "normal");
  doc.setFont("Roboto");

  // === Zaglavlje ===
  doc.addImage(
    `data:image/png;base64,${fajl("logo.png").toString("base64")}`,
    "PNG", M, M, LOGO_W, LOGO_H,
  );

  doc.setFontSize(20);
  doc.text(d.tip === "faktura" ? "FAKTURA" : "PREDRAČUN", W - M, M + 7, { align: "right" });

  let y = M + LOGO_H + 7;

  doc.setFontSize(8.5);
  doc.setTextColor(70);
  doc.text(MERCHANT.adresa, M, y);
  doc.text(`PIB: ${MERCHANT.pib}  ·  ${BANK_FIRME.naziv}: ${BANK_FIRME.racun}`, M, y + 4);
  doc.text("www.hartweger.rs  ·  info@hartweger.rs", M, y + 8);

  doc.setTextColor(0);
  doc.setFontSize(9.5);
  doc.text(`Broj: ${d.broj}`, W - M, y, { align: "right" });
  doc.text(`Datum: ${d.datum}`, W - M, y + 5, { align: "right" });

  y += 22;

  // === Kupac ===
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("KUPAC / PRIMALAC", M, y);
  doc.setTextColor(0);
  y += 6;

  doc.setFontSize(10);
  doc.text(d.kupac.naziv, M, y);
  y += 5;

  doc.setFontSize(9);
  for (const red of [
    d.kupac.adresa,
    `PIB: ${d.kupac.pib}`,
    d.kupac.maticniBroj ? `Matični broj: ${d.kupac.maticniBroj}` : null,
    d.kupac.email,
  ]) {
    if (!red) continue;
    doc.text(red, M, y);
    y += 4.5;
  }

  y += 8;

  // === Tabela stavki ===
  const xKol = 128, xCena = 162, xIznos = W - M;

  doc.setFillColor(242, 242, 242);
  doc.rect(M, y - 4.5, W - 2 * M, 7, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(60);
  doc.text("OPIS USLUGE", M + 2, y);
  doc.text("KOL.", xKol, y, { align: "right" });
  doc.text("CENA BEZ PDV", xCena, y, { align: "right" });
  doc.text("IZNOS BEZ PDV", xIznos - 2, y, { align: "right" });
  doc.setTextColor(0);
  y += 9;

  doc.setFontSize(9);
  for (const s of d.stavke) {
    // Dugačak naziv kursa se prelama, da ne uđe u kolonu sa količinom.
    const redovi = doc.splitTextToSize(s.opis, xKol - M - 8) as string[];
    doc.text(redovi, M + 2, y);
    doc.text(String(s.kolicina), xKol, y, { align: "right" });
    doc.text(rsd(s.cenaBezPdv), xCena, y, { align: "right" });
    doc.text(rsd(s.iznosBezPdv), xIznos - 2, y, { align: "right" });
    y += 5 * redovi.length + 1.5;
  }

  y += 2;
  doc.setDrawColor(210);
  doc.line(M, y, W - M, y);
  y += 6;

  // === Zbir ===
  doc.setFontSize(9);
  doc.text("Ukupno bez PDV:", xCena, y, { align: "right" });
  doc.text(rsd(d.ukupnoBezPdv), xIznos - 2, y, { align: "right" });
  y += 5;
  doc.text("PDV (20%):", xCena, y, { align: "right" });
  doc.text(rsd(d.pdv), xIznos - 2, y, { align: "right" });
  y += 7;

  doc.setFontSize(11);
  doc.text("UKUPNO SA PDV:", xCena, y, { align: "right" });
  doc.text(rsd(d.ukupnoSaPdv), xIznos - 2, y, { align: "right" });
  y += 14;

  // === Napomena i rok ===
  doc.setFontSize(9);
  if (d.napomena) {
    for (const red of doc.splitTextToSize(d.napomena, W - 2 * M) as string[]) {
      doc.text(red, M, y);
      y += 4.5;
    }
    y += 4;
  }

  doc.text("Plaćanje: Molimo vas da iznos uplatite u roku od 7 dana.", M, y);
  y += 9;

  // === IPS QR ===
  if (qr) {
    doc.addImage(`data:image/png;base64,${qr.toString("base64")}`, "PNG", M, y, 30, 30);
    doc.setFontSize(9);
    doc.text(`Poziv na broj: ${d.broj}`, M + 35, y + 10);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("IPS QR — plaćanje skeniranjem u mobilnoj banci", M + 35, y + 15);
    doc.setTextColor(0);
  }

  // === Podnožje ===
  doc.setFontSize(7.5);
  doc.setTextColor(140);
  doc.text(
    `HARTWEGER  ·  www.hartweger.rs  ·  info@hartweger.rs  ·  PIB: ${MERCHANT.pib}`,
    W / 2, H - 12, { align: "center" },
  );

  return Buffer.from(doc.output("arraybuffer"));
}
