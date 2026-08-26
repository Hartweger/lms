// src/lib/sef-ubl.ts
// Pretvaranje naše fakture u UBL 2.1 XML koji SEF prima.
// Čist modul: bez baze, bez mreže, bez datuma iz sistema - sve ulazi kao parametar,
// da može da se testira sam.
//
// Profil je srpski CIUS: urn:cen.eu:en16931:2017#compliant#urn:mfin.gov.rs:srbdt:2021
//
// ZAOKRUŽIVANJE - zašto ovde ne važe cifre sa PDF-a:
// Naše cene su celi dinari SA PDV-om (38.500). PDF prikazuje cele dinare i bez PDV-a
// (32.083), jer je tako u Natašinoj tabeli. UBL to ne prihvata: EN 16931 traži da
// PDV bude tačno 20% osnovice, zaokruženo na dve decimale. 64.167 x 20% = 12.833,40,
// a mi bismo poslali 12.833 - provera puca i faktura se odbija.
//
// Zato XML računa svoje iznose na dve decimale, iz bruto cene:
//   cena bez PDV = round2(cena sa PDV / 1.2)
//   iznos linije = round2(cena bez PDV x količina)   <- tačno, po konstrukciji
// Zbir tih linija se za par para razlikuje od stvarno naplaćenog iznosa. Ta razlika
// ide u PayableRoundingAmount (BT-114) - polje koje EN 16931 ima baš za ovo - pa
// PayableAmount ostaje TAČNO ono što firma plaća.

export const SEF_CUSTOMIZATION_ID =
  "urn:cen.eu:en16931:2017#compliant#urn:mfin.gov.rs:srbdt:2021";

/** Opšta stopa PDV-a. Sve što prodajemo firmama je oporezivo po njoj. */
export const PDV_PROCENAT = 20;

/** UN/ECE šifra jedinice mere: H87 = komad. Kurs se fakturiše kao komad. */
const JEDINICA = "H87";

export interface UblStranka {
  naziv: string;
  /** PIB, samo cifre - "RS" prefiks se dodaje gde UBL traži. */
  pib: string;
  maticniBroj: string;
  ulica: string | null;
  grad: string;
  email?: string | null;
}

export interface UblStavka {
  opis: string;
  kolicina: number;
  /** Cena JEDNE jedinice, sa uračunatim PDV-om - kao na sajtu. */
  jedinicnaSaPdv: number;
}

export interface UblFaktura {
  /** Broj fakture, isti kao na PDF-u (npr. 2026-408). */
  broj: string;
  /** YYYY-MM-DD. */
  datumIzdavanja: string;
  /** Datum prometa - YYYY-MM-DD. */
  datumPrometa: string;
  /** Rok plaćanja - YYYY-MM-DD. */
  datumValute: string;
  prodavac: UblStranka;
  kupac: UblStranka;
  /** Tekući račun na koji se plaća. */
  racun: string;
  pozivNaBroj: string;
  stavke: UblStavka[];
  /** Iznos koji firma stvarno plaća, u celim dinarima. Na njega se zaokružuje. */
  ukupnoSaPdv: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function iznos(n: number): string {
  return n.toFixed(2);
}

/** XML escape. Nazivi kurseva i firmi umeju da nose & i navodnike. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function strankaXml(tag: string, s: UblStranka, jeKupac: boolean): string {
  return `   <cac:${tag}>
      <cac:Party>
         <cbc:EndpointID schemeID="9948">${esc(s.pib)}</cbc:EndpointID>
         <cac:PartyName>
            <cbc:Name>${esc(s.naziv)}</cbc:Name>
         </cac:PartyName>
         <cac:PostalAddress>
${s.ulica ? `            <cbc:StreetName>${esc(s.ulica)}</cbc:StreetName>\n` : ""}            <cbc:CityName>${esc(s.grad)}</cbc:CityName>
            <cac:Country>
               <cbc:IdentificationCode>RS</cbc:IdentificationCode>
            </cac:Country>
         </cac:PostalAddress>
         <cac:PartyTaxScheme>
            <cbc:CompanyID>RS${esc(s.pib)}</cbc:CompanyID>
            <cac:TaxScheme>
               <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
         </cac:PartyTaxScheme>
         <cac:PartyLegalEntity>
            <cbc:RegistrationName>${esc(s.naziv)}</cbc:RegistrationName>
            <cbc:CompanyID>${esc(s.maticniBroj)}</cbc:CompanyID>
         </cac:PartyLegalEntity>
${s.email ? `         <cac:Contact>\n            <cbc:ElectronicMail>${esc(s.email)}</cbc:ElectronicMail>\n         </cac:Contact>\n` : ""}      </cac:Party>
   </cac:${tag}>`.replace(/\n\n/g, "\n") + (jeKupac ? "" : "");
}

interface Obracun {
  linije: { neto: number; cenaBezPdv: number }[];
  ukupnoNeto: number;
  pdv: number;
  ukupnoBruto: number;
  zaokruzenje: number;
}

/** Iznosi za XML - na dve decimale, izvedeni iz bruto cena. Vidi objašnjenje gore. */
export function obracunajUbl(f: UblFaktura): Obracun {
  const linije = f.stavke.map((s) => {
    const cenaBezPdv = round2(s.jedinicnaSaPdv / (1 + PDV_PROCENAT / 100));
    return { cenaBezPdv, neto: round2(cenaBezPdv * s.kolicina) };
  });
  const ukupnoNeto = round2(linije.reduce((a, l) => a + l.neto, 0));
  const pdv = round2((ukupnoNeto * PDV_PROCENAT) / 100);
  const ukupnoBruto = round2(ukupnoNeto + pdv);
  return {
    linije,
    ukupnoNeto,
    pdv,
    ukupnoBruto,
    // Razlika prema stvarno naplaćenom iznosu. Ide u PayableRoundingAmount.
    zaokruzenje: round2(f.ukupnoSaPdv - ukupnoBruto),
  };
}

export function napraviUbl(f: UblFaktura): string {
  if (f.stavke.length === 0) throw new Error("Faktura bez stavki");

  const o = obracunajUbl(f);

  const linijeXml = f.stavke
    .map(
      (s, i) => `   <cac:InvoiceLine>
      <cbc:ID>${i + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${JEDINICA}">${s.kolicina}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="RSD">${iznos(o.linije[i].neto)}</cbc:LineExtensionAmount>
      <cac:Item>
         <cbc:Name>${esc(s.opis)}</cbc:Name>
         <cac:SellersItemIdentification>
            <cbc:ID>${i + 1}</cbc:ID>
         </cac:SellersItemIdentification>
         <cac:ClassifiedTaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>${PDV_PROCENAT}</cbc:Percent>
            <cac:TaxScheme>
               <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
         </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
         <cbc:PriceAmount currencyID="RSD">${iznos(o.linije[i].cenaBezPdv)}</cbc:PriceAmount>
      </cac:Price>
   </cac:InvoiceLine>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:cec="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:sbt="http://mfin.gov.rs/srbdt/srbdtext">
   <cbc:CustomizationID>${SEF_CUSTOMIZATION_ID}</cbc:CustomizationID>
   <cbc:ID>${esc(f.broj)}</cbc:ID>
   <cbc:IssueDate>${f.datumIzdavanja}</cbc:IssueDate>
   <cbc:DueDate>${f.datumValute}</cbc:DueDate>
   <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
   <cbc:DocumentCurrencyCode>RSD</cbc:DocumentCurrencyCode>
   <cac:InvoicePeriod>
      <cbc:DescriptionCode>35</cbc:DescriptionCode>
   </cac:InvoicePeriod>
   <cac:Delivery>
      <cbc:ActualDeliveryDate>${f.datumPrometa}</cbc:ActualDeliveryDate>
   </cac:Delivery>
   <cac:PaymentMeans>
      <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
      <cbc:PaymentID>${esc(f.pozivNaBroj)}</cbc:PaymentID>
      <cac:PayeeFinancialAccount>
         <cbc:ID>${esc(f.racun)}</cbc:ID>
      </cac:PayeeFinancialAccount>
   </cac:PaymentMeans>
${strankaXml("AccountingSupplierParty", f.prodavac, false)}
${strankaXml("AccountingCustomerParty", f.kupac, true)}
   <cac:TaxTotal>
      <cbc:TaxAmount currencyID="RSD">${iznos(o.pdv)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
         <cbc:TaxableAmount currencyID="RSD">${iznos(o.ukupnoNeto)}</cbc:TaxableAmount>
         <cbc:TaxAmount currencyID="RSD">${iznos(o.pdv)}</cbc:TaxAmount>
         <cac:TaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>${PDV_PROCENAT}</cbc:Percent>
            <cac:TaxScheme>
               <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
         </cac:TaxCategory>
      </cac:TaxSubtotal>
   </cac:TaxTotal>
   <cac:LegalMonetaryTotal>
      <cbc:LineExtensionAmount currencyID="RSD">${iznos(o.ukupnoNeto)}</cbc:LineExtensionAmount>
      <cbc:TaxExclusiveAmount currencyID="RSD">${iznos(o.ukupnoNeto)}</cbc:TaxExclusiveAmount>
      <cbc:TaxInclusiveAmount currencyID="RSD">${iznos(o.ukupnoBruto)}</cbc:TaxInclusiveAmount>
      <cbc:AllowanceTotalAmount currencyID="RSD">0.00</cbc:AllowanceTotalAmount>
      <cbc:PrepaidAmount currencyID="RSD">0.00</cbc:PrepaidAmount>
      <cbc:PayableRoundingAmount currencyID="RSD">${iznos(o.zaokruzenje)}</cbc:PayableRoundingAmount>
      <cbc:PayableAmount currencyID="RSD">${iznos(f.ukupnoSaPdv)}</cbc:PayableAmount>
   </cac:LegalMonetaryTotal>
${linijeXml}
</Invoice>`;
}
