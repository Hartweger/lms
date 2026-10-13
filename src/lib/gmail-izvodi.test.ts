import { describe, it, expect } from "vitest";
import { upit, jeXmlPrilog, xmlPrilozi } from "./gmail-izvodi";

describe("upit", () => {
  it("traži samo banku i gleda i u Smeće", () => {
    const q = upit(30);
    expect(q).toContain("from:info@mail.bancaintesa.rs");
    expect(q).toContain("newer_than:30d");
    // Izvodi se brišu posle čitanja; bez ovoga ih pretraga ne vidi.
    expect(q).toContain("in:anywhere");
  });
});

describe("jeXmlPrilog", () => {
  it("prepoznaje izvod", () => {
    expect(jeXmlPrilog({ filename: "[160-6000001689258-40][197].xml", mimeType: "text/xml" })).toBe(true);
  });

  it("preskače potpis koji ide uz svaki mejl banke", () => {
    expect(jeXmlPrilog({ filename: "smime.p7s", mimeType: "application/pkcs7-signature" })).toBe(false);
  });

  it("preskače PDF verziju istog izvoda", () => {
    expect(jeXmlPrilog({ filename: "[160-6000001689258-40][197].Pdf", mimeType: "application/pdf" })).toBe(false);
  });
});

describe("xmlPrilozi", () => {
  it("nalazi prilog i u ugnežđenim delovima", () => {
    const payload = {
      parts: [
        { mimeType: "text/html", body: {} },
        {
          parts: [
            { filename: "izvod.xml", mimeType: "text/xml", body: { attachmentId: "A1" } },
            { filename: "smime.p7s", mimeType: "application/pkcs7-signature", body: { attachmentId: "A2" } },
          ],
        },
      ],
    };
    expect(xmlPrilozi("M1", payload)).toEqual([
      { messageId: "M1", attachmentId: "A1", filename: "izvod.xml" },
    ]);
  });

  it("bez priloga vraća prazno, ne baca", () => {
    expect(xmlPrilozi("M1", undefined)).toEqual([]);
    expect(xmlPrilozi("M1", { mimeType: "text/plain" })).toEqual([]);
  });
});
