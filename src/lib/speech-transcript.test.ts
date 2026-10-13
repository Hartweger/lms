import { describe, it, expect } from "vitest";
import { mergeTranscript, expandSpokenSymbols } from "./speech-transcript";

describe("mergeTranscript", () => {
  it("nadovezuje zasebne segmente (desktop Chrome)", () => {
    expect(mergeTranscript("hallo wie geht es", "mir geht es gut"))
      .toBe("hallo wie geht es mir geht es gut");
  });

  it("zamenjuje kumulativni finalni rezultat (Chrome na Androidu)", () => {
    expect(mergeTranscript("im Wohnzimmer", "im Wohnzimmer steht"))
      .toBe("im Wohnzimmer steht");
  });

  it("ponovljen identičan rezultat ne duplira tekst", () => {
    expect(mergeTranscript("im Wohnzimmer", "im Wohnzimmer"))
      .toBe("im Wohnzimmer");
  });

  it("prazan prethodni tekst vraća novi", () => {
    expect(mergeTranscript("", "im Wohnzimmer")).toBe("im Wohnzimmer");
  });

  it("prazan novi tekst vraća prethodni", () => {
    expect(mergeTranscript("im Wohnzimmer", "")).toBe("im Wohnzimmer");
    expect(mergeTranscript("im Wohnzimmer", "   ")).toBe("im Wohnzimmer");
  });

  it("poređenje ignoriše velika slova i interpunkciju", () => {
    expect(mergeTranscript("Im Wohnzimmer,", "im wohnzimmer steht ein"))
      .toBe("im wohnzimmer steht ein");
  });

  it("zamenjuje i kad je engine revidirao poneku raniju reč", () => {
    expect(mergeTranscript("im Wohnzimmer sind", "im Wohnzimmer steht ein Sofa"))
      .toBe("im Wohnzimmer steht ein Sofa");
  });

  it("regresija: niz kumulativnih finala sa Androida daje jednu rečenicu", () => {
    // Tačan obrazac iz prijave polaznika (07.2026): svaki parcijalni rezultat
    // stigao kao finalan i kumulativan, pa je nadovezivanje pravilo
    // "im im Wohnzimmer im Wohnzimmer ... im Wohnzimmer steht ein Sofa".
    const events = [
      "im",
      "im Wohnzimmer",
      "im Wohnzimmer",
      "im Wohnzimmer steht",
      "im Wohnzimmer steht",
      "im Wohnzimmer steht ein",
      "im Wohnzimmer steht ein Sofa",
    ];
    const merged = events.reduce((acc, t) => mergeTranscript(acc, t), "");
    expect(merged).toBe("im Wohnzimmer steht ein Sofa");
  });

  it("kumulativni interim posle istog finala se ne duplira", () => {
    expect(mergeTranscript("im Wohnzimmer steht ein Sofa", "im Wohnzimmer steht ein Sofa"))
      .toBe("im Wohnzimmer steht ein Sofa");
  });

  it("nova rečenica posle pauze se nadovezuje, ne zamenjuje", () => {
    expect(mergeTranscript("ich wohne in Berlin", "meine Wohnung ist klein"))
      .toBe("ich wohne in Berlin meine Wohnung ist klein");
  });
});

describe("expandSpokenSymbols", () => {
  it("€ postaje euro", () => {
    expect(expandSpokenSymbols("das kostet 3 €").replace(/\s+/g, " ").trim())
      .toBe("das kostet 3 euro");
    expect(expandSpokenSymbols("3€").replace(/\s+/g, " ").trim()).toBe("3 euro");
  });

  it("vreme sa dvotačkom postaje uhr", () => {
    expect(expandSpokenSymbols("um 9:00").replace(/\s+/g, " ").trim()).toBe("um 9 uhr");
    expect(expandSpokenSymbols("um 9:00 uhr").replace(/\s+/g, " ").trim()).toBe("um 9 uhr");
    expect(expandSpokenSymbols("um 7:30").replace(/\s+/g, " ").trim()).toBe("um 7 uhr 30");
  });

  it("% postaje prozent", () => {
    expect(expandSpokenSymbols("10 %").replace(/\s+/g, " ").trim()).toBe("10 prozent");
  });
});
