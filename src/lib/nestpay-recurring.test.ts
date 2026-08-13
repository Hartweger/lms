import { describe, it, expect } from "vitest";
import {
  buildRecurringStatusXml,
  buildRecurringCancelXml,
  buildChargeRetryXml,
  parseRecurringStatus,
  isRecurringOpApproved,
  isSeriesCancelled,
} from "./nestpay-recurring";

// Uzorak po priručniku: naplata 1 uspela, naplata 2 na čekanju.
const ODGOVOR = `<?xml version="1.0" encoding="ISO-8859-9"?><CC5Response>
<ErrMsg>Record(s) found for 26201OnlA13974</ErrMsg>
<Extra>
<RECURRINGCOUNT>2</RECURRINGCOUNT>
<RECURRINGID>26201OnlA13974</RECURRINGID>
<ORD_ID_1>RECTEST-1784551062868</ORD_ID_1>
<TRANS_STAT_1>S</TRANS_STAT_1>
<CAPTURE_AMT_1>319900</CAPTURE_AMT_1>
<AUTH_CODE_1>798667</AUTH_CODE_1>
<TRANS_ID_1>26201OnlB13975</TRANS_ID_1>
<AUTH_DTTM_1>2026-07-20 14:39:36.887</AUTH_DTTM_1>
<PLANNED_START_DTTM_1>2026-07-21 14:39:00.0</PLANNED_START_DTTM_1>
<ORD_ID_2>RECTEST-1784551062868-2</ORD_ID_2>
<TRANS_STAT_2>PN</TRANS_STAT_2>
<PLANNED_START_DTTM_2>2026-08-21 14:39:00.0</PLANNED_START_DTTM_2>
</Extra></CC5Response>`;

describe("buildRecurringStatusXml", () => {
  it("traži status po RECURRINGID", () => {
    const xml = buildRecurringStatusXml("26201OnlA13974");
    expect(xml).toContain("<RECURRINGID>26201OnlA13974</RECURRINGID>");
    expect(xml).toContain("<ORDERSTATUS>QUERY</ORDERSTATUS>");
  });
});

describe("buildRecurringCancelXml", () => {
  it("otkazuje CELU seriju (RECORDTYPE=Recurring)", () => {
    const xml = buildRecurringCancelXml("26201OnlA13974");
    expect(xml).toContain("<RECURRINGOPERATION>Cancel</RECURRINGOPERATION>");
    expect(xml).toContain("<RECORDTYPE>Recurring</RECORDTYPE>");
    expect(xml).toContain("<RECORDID>26201OnlA13974</RECORDID>");
  });
});

describe("buildChargeRetryXml", () => {
  it("ponovo inicira JEDNU naplatu pomeranjem planiranog datuma (pogl. 7)", () => {
    const xml = buildChargeRetryXml("2026-300-2", "2026-07-23");
    expect(xml).toContain("<RECURRINGOPERATION>Update</RECURRINGOPERATION>");
    expect(xml).toContain("<RECORDTYPE>Order</RECORDTYPE>");
    expect(xml).toContain("<RECORDID>2026-300-2</RECORDID>");
    expect(xml).toContain("<STARTDATE>2026-07-23</STARTDATE>");
  });
});

describe("parseRecurringStatus", () => {
  it("čita sve naplate serije", () => {
    const r = parseRecurringStatus(ODGOVOR);
    expect(r.count).toBe(2);
    expect(r.charges).toHaveLength(2);
  });

  it("prvu naplatu prepoznaje kao uspelu, sa iznosom u dinarima", () => {
    const c = parseRecurringStatus(ODGOVOR).charges[0];
    expect(c.installmentNo).toBe(1);
    expect(c.oid).toBe("RECTEST-1784551062868");
    expect(c.succeeded).toBe(true);
    expect(c.amountRsd).toBe(3199);
  });

  it("čita podatke o transakciji za mejl kupcu (EPM 2.7, zahtev banke 24.07.2026)", () => {
    const c = parseRecurringStatus(ODGOVOR).charges[0];
    expect(c.authCode).toBe("798667");
    expect(c.transId).toBe("26201OnlB13975");
    expect(c.authDttm).toBe("2026-07-20 14:39:36.887");
    // Naplata na čekanju još nema transakciju.
    const pn = parseRecurringStatus(ODGOVOR).charges[1];
    expect(pn.authCode).toBeNull();
    expect(pn.transId).toBeNull();
  });

  it("podatke o transakciji čita i iz zbirnog ORDERSTATUS_n polja", () => {
    const odgovor = `<CC5Response><Extra><RECURRINGCOUNT>1</RECURRINGCOUNT>
<ORD_ID_1>2026-300-2</ORD_ID_1><TRANS_STAT_1>C</TRANS_STAT_1>
<ORDERSTATUS_1>ORD_ID:2026-300-2\tCHARGE_TYPE_CD:S\tCAPTURE_AMT:319900\tTRANS_STAT:C\tAUTH_DTTM:2026-08-21 14:39:01.12\tAUTH_CODE:P53293\tTRANS_ID:15210MfAA180146</ORDERSTATUS_1>
<CAPTURE_AMT_1>319900</CAPTURE_AMT_1></Extra></CC5Response>`;
    const c = parseRecurringStatus(odgovor).charges[0];
    expect(c.authCode).toBe("P53293");
    expect(c.transId).toBe("15210MfAA180146");
    expect(c.authDttm).toBe("2026-08-21 14:39:01.12");
  });

  it("naplatu na čekanju (PN) NE prepoznaje kao uspelu", () => {
    const c = parseRecurringStatus(ODGOVOR).charges[1];
    expect(c.installmentNo).toBe(2);
    expect(c.oid).toBe("RECTEST-1784551062868-2");
    expect(c.succeeded).toBe(false);
    expect(c.amountRsd).toBeNull();
  });

  it("uspelu ponovljenu naplatu prepoznaje i kad je TRANS_STAT `C`", () => {
    // Test serija 21.07.2026: uspela naplata u recurring seriji nosi `C` (Completed),
    // a ne `S` kao jednokratna prodaja. Zato se uspeh ceni po „nije PN + ima iznos".
    const odgovor = `<CC5Response><Extra><RECURRINGCOUNT>1</RECURRINGCOUNT>
<ORD_ID_1>RECTEST-1784551062868-2</ORD_ID_1><TRANS_STAT_1>C</TRANS_STAT_1>
<CAPTURE_AMT_1>10000</CAPTURE_AMT_1></Extra></CC5Response>`;
    const c = parseRecurringStatus(odgovor).charges[0];
    expect(c.transStat).toBe("C");
    expect(c.succeeded).toBe(true);
    expect(c.amountRsd).toBe(100);
  });

  it("naplata koja tek predstoji nema iznos ni kad joj je poznat termin", () => {
    // Kod naplata na čekanju banka šalje PLANNED_START_DTTM, ali ne i CAPTURE_AMT.
    const odgovor = `<CC5Response><Extra><RECURRINGCOUNT>1</RECURRINGCOUNT>
<ORD_ID_1>RECTEST-1784551062868-3</ORD_ID_1><TRANS_STAT_1>PN</TRANS_STAT_1>
<PLANNED_START_DTTM_1>2026-07-22 14:39:36.887</PLANNED_START_DTTM_1></Extra></CC5Response>`;
    const c = parseRecurringStatus(odgovor).charges[0];
    expect(c.succeeded).toBe(false);
    expect(c.plannedAt).toBe("2026-07-22 14:39:36.887");
  });

  it("povraćaj NE broji kao uspelu naplatu (CHARGE_TYPE_CD=C)", () => {
    // Priručnik, tabela statusa: TRANS_STAT `C`/`S` uz CHARGE_TYPE_CD `C` znači
    // „Credited - payment refunded". Bez ove provere bi vraćen novac produžio pristup.
    const odgovor = `<CC5Response><Extra><RECURRINGCOUNT>1</RECURRINGCOUNT>
<ORD_ID_1>2026-300-2</ORD_ID_1><TRANS_STAT_1>C</TRANS_STAT_1>
<CHARGE_TYPE_CD_1>C</CHARGE_TYPE_CD_1><CAPTURE_AMT_1>319900</CAPTURE_AMT_1></Extra></CC5Response>`;
    const c = parseRecurringStatus(odgovor).charges[0];
    expect(c.succeeded).toBe(false);
    expect(c.refund).toBe(true);
  });

  it("odbijenu, pokvarenu i otkazanu naplatu prepoznaje kao palu", () => {
    // D = Declined, ERR = Errorred Recurring Order, CNCL = Cancelled Recurring Order.
    for (const stat of ["D", "ERR", "CNCL"]) {
      const odgovor = `<CC5Response><Extra><RECURRINGCOUNT>1</RECURRINGCOUNT>
<ORD_ID_1>2026-300-2</ORD_ID_1><TRANS_STAT_1>${stat}</TRANS_STAT_1>
<CHARGE_TYPE_CD_1>S</CHARGE_TYPE_CD_1></Extra></CC5Response>`;
      const c = parseRecurringStatus(odgovor).charges[0];
      expect(c.succeeded, stat).toBe(false);
      expect(c.failed, stat).toBe(true);
    }
  });

  it("ponovo se iniciraju samo odbijena (D) i greška (ERR), ne i otkazana/poništena", () => {
    // Banka 22.07.2026: pala naplata sme ponovo da se inicira (Update + STARTDATE).
    // CNCL i V su NAMERNO prekinute (otkazivanje, void) - njih ne oživljavamo.
    for (const [stat, ocekivano] of [["D", true], ["ERR", true], ["CNCL", false], ["V", false], ["PN", false]] as const) {
      const odgovor = `<CC5Response><Extra><RECURRINGCOUNT>1</RECURRINGCOUNT>
<ORD_ID_1>2026-300-2</ORD_ID_1><TRANS_STAT_1>${stat}</TRANS_STAT_1></Extra></CC5Response>`;
      expect(parseRecurringStatus(odgovor).charges[0].retryable, stat).toBe(ocekivano);
    }
  });

  it("naplatu koja se još obrađuje (NW) ne proglašava ni uspelom ni palom", () => {
    // NW = First Commit: prolazno stanje, sledeći prolaz crona daje konačan status.
    const odgovor = `<CC5Response><Extra><RECURRINGCOUNT>1</RECURRINGCOUNT>
<ORD_ID_1>2026-300-2</ORD_ID_1><TRANS_STAT_1>NW</TRANS_STAT_1></Extra></CC5Response>`;
    const c = parseRecurringStatus(odgovor).charges[0];
    expect(c.succeeded).toBe(false);
    expect(c.failed).toBe(false);
  });

  it("tip transakcije čita i iz zbirnog ORDERSTATUS_n polja", () => {
    // Banka isti podatak šalje i kao zasebnu oznaku i unutar ORDERSTATUS_n niza;
    // ako zasebne nema, ne smemo da ostanemo bez tipa i propustimo povraćaj.
    const odgovor = `<CC5Response><Extra><RECURRINGCOUNT>1</RECURRINGCOUNT>
<ORD_ID_1>2026-300-2</ORD_ID_1><TRANS_STAT_1>S</TRANS_STAT_1>
<ORDERSTATUS_1>ORD_ID:2026-300-2\tCHARGE_TYPE_CD:C\tCAPTURE_AMT:319900\tTRANS_STAT:S</ORDERSTATUS_1>
<CAPTURE_AMT_1>319900</CAPTURE_AMT_1></Extra></CC5Response>`;
    const c = parseRecurringStatus(odgovor).charges[0];
    expect(c.refund).toBe(true);
    expect(c.succeeded).toBe(false);
  });

  it("prazan odgovor daje nula naplata umesto pucanja", () => {
    expect(parseRecurringStatus("<CC5Response></CC5Response>").charges).toEqual([]);
  });
});

describe("isRecurringOpApproved", () => {
  it("prihvata Approved", () => {
    expect(isRecurringOpApproved("<CC5Response><Response>Approved</Response></CC5Response>")).toBe(true);
  });
  it("prihvata ProcReturnCode 00", () => {
    expect(isRecurringOpApproved("<CC5Response><ProcReturnCode>00</ProcReturnCode></CC5Response>")).toBe(true);
  });
  it("odbija grešku", () => {
    expect(isRecurringOpApproved("<CC5Response><Response>Error</Response><ErrMsg>CORE-5103</ErrMsg></CC5Response>")).toBe(false);
  });
});

describe("isSeriesCancelled", () => {
  // 13.08.2026: banka je seriju 26206OfSB24222 stvarno otkazala, ali njen odgovor
  // na Cancel nismo prepoznali kao odobren - kupac je dobio grešku, a baza ostala
  // „active". Zato posle neprepoznatog odgovora pitamo kako serija STVARNO stoji.
  const naplate = (spisak: Array<[string, number | null]>) =>
    parseRecurringStatus(
      `<CC5Response><Extra><RECURRINGCOUNT>${spisak.length}</RECURRINGCOUNT>` +
        spisak
          .map(
            ([stat, iznos], i) =>
              `<ORD_ID_${i + 1}>2026-232-${i + 1}</ORD_ID_${i + 1}><TRANS_STAT_${i + 1}>${stat}</TRANS_STAT_${i + 1}>` +
              (iznos === null ? "" : `<CAPTURE_AMT_${i + 1}>${iznos}</CAPTURE_AMT_${i + 1}>`),
          )
          .join("") +
        `</Extra></CC5Response>`,
    ).charges;

  it("potvrđuje otkazivanje kad su sve nenaplaćene rate CNCL", () => {
    expect(isSeriesCancelled(naplate([["S", 319900], ["CNCL", null], ["CNCL", null]]))).toBe(true);
  });

  it("ne potvrđuje dok ijedna rata čeka naplatu (PN)", () => {
    expect(isSeriesCancelled(naplate([["S", 319900], ["PN", null], ["PN", null]]))).toBe(false);
  });

  it("palu ratu (D) ne broji kao otkazivanje - nju ponovni pokušaj još može da oživi", () => {
    expect(isSeriesCancelled(naplate([["S", 319900], ["D", null], ["CNCL", null]]))).toBe(false);
  });

  it("prazan odgovor banke ne sme da prođe kao potvrda", () => {
    // Bez ovoga bi svaki neuspeo upit tiho značio „otkazano" i naplate bi tekle dalje.
    expect(isSeriesCancelled([])).toBe(false);
  });
});
