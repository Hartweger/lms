import { describe, it, expect } from "vitest";
import { htmlToText } from "./html-to-text";

describe("htmlToText", () => {
  it("skida tagove i čuva tekst", () => {
    const t = htmlToText("<p>Zdravo <strong>Ana</strong></p>");
    expect(t).toBe("Zdravo Ana");
  });

  it("link pretvara u 'tekst (url)'", () => {
    const t = htmlToText('<a href="https://hartweger.rs/prijava">Prijavi se</a>');
    expect(t).toBe("Prijavi se (https://hartweger.rs/prijava)");
  });

  it("izbacuje head/style i pravi prelome za blokove i <br>", () => {
    const html = `<head><style>.x{color:red}</style></head><body><h1>Naslov</h1><p>Red 1<br>Red 2</p></body>`;
    const t = htmlToText(html);
    expect(t).toContain("Naslov");
    expect(t).toContain("Red 1\nRed 2");
    expect(t).not.toContain("color:red");
  });

  it("dekodira entitete i sažima prazne redove", () => {
    const t = htmlToText("<p>A &amp; B</p>\n\n\n<p>C</p>");
    expect(t).toBe("A & B\n\nC");
  });
});
