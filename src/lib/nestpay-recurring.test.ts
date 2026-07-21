import { describe, it, expect } from "vitest";
import {
  buildRecurringStatusXml,
  buildRecurringCancelXml,
  parseRecurringStatus,
  isCancelApproved,
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

  it("naplatu na čekanju (PN) NE prepoznaje kao uspelu", () => {
    const c = parseRecurringStatus(ODGOVOR).charges[1];
    expect(c.installmentNo).toBe(2);
    expect(c.oid).toBe("RECTEST-1784551062868-2");
    expect(c.succeeded).toBe(false);
    expect(c.amountRsd).toBeNull();
  });

  it("prazan odgovor daje nula naplata umesto pucanja", () => {
    expect(parseRecurringStatus("<CC5Response></CC5Response>").charges).toEqual([]);
  });
});

describe("isCancelApproved", () => {
  it("prihvata Approved", () => {
    expect(isCancelApproved("<CC5Response><Response>Approved</Response></CC5Response>")).toBe(true);
  });
  it("prihvata ProcReturnCode 00", () => {
    expect(isCancelApproved("<CC5Response><ProcReturnCode>00</ProcReturnCode></CC5Response>")).toBe(true);
  });
  it("odbija grešku", () => {
    expect(isCancelApproved("<CC5Response><Response>Error</Response><ErrMsg>CORE-5103</ErrMsg></CC5Response>")).toBe(false);
  });
});
