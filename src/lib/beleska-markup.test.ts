import { describe, it, expect } from "vitest";
import { parseBlocks, tokenizeInline } from "./beleska-markup";

describe("tokenizeInline", () => {
  it("čist tekst je jedan token", () => {
    expect(tokenizeInline("zdravo")).toEqual([{ kind: "text", text: "zdravo" }]);
  });

  it("prepoznaje bold, kurziv i marker", () => {
    expect(tokenizeInline("a **b** c *d* e ==f==")).toEqual([
      { kind: "text", text: "a " },
      { kind: "bold", text: "b" },
      { kind: "text", text: " c " },
      { kind: "italic", text: "d" },
      { kind: "text", text: " e " },
      { kind: "mark", text: "f" },
    ]);
  });

  it("prepoznaje link u markdown obliku", () => {
    expect(tokenizeInline("vidi [ovde](https://hartweger.rs)")).toEqual([
      { kind: "text", text: "vidi " },
      { kind: "link", text: "ovde", href: "https://hartweger.rs" },
    ]);
  });

  it("odbacuje javascript: link (ostaje samo tekst)", () => {
    expect(tokenizeInline("[klik](javascript:alert)")).toEqual([
      { kind: "text", text: "klik" },
    ]);
  });

  it("nezatvorena oznaka ostaje običan tekst", () => {
    expect(tokenizeInline("**bez kraja")).toEqual([{ kind: "text", text: "**bez kraja" }]);
  });

  it("ugnježdeni *kurziv* unutar **bold** ostaje ceo u jednom bold tokenu, bez osirotelih zvezdica", () => {
    expect(tokenizeInline("**bold sa *kurziv* unutra**")).toEqual([
      { kind: "bold", text: "bold sa *kurziv* unutra" },
    ]);
  });

  it("link čiji URL sadrži balansiran par zagrada (Wikipedia stil) se ne seče", () => {
    expect(
      tokenizeInline("[tekst](https://sr.wikipedia.org/wiki/Dativ_(padež))")
    ).toEqual([
      {
        kind: "link",
        text: "tekst",
        href: "https://sr.wikipedia.org/wiki/Dativ_(padež)",
      },
    ]);
  });
});

describe("parseBlocks", () => {
  it("prazan tekst daje nula blokova", () => {
    expect(parseBlocks("")).toEqual([]);
    expect(parseBlocks("   \n  ")).toEqual([]);
  });

  it("dva pasusa razdvojena praznim redom", () => {
    const b = parseBlocks("prvi\n\ndrugi");
    expect(b).toHaveLength(2);
    expect(b[0].kind).toBe("p");
    expect(b[1].kind).toBe("p");
  });

  it("uzastopne crtice su jedna lista", () => {
    const b = parseBlocks("- jedan\n- dva\n- tri");
    expect(b).toHaveLength(1);
    expect(b[0].kind).toBe("ul");
    if (b[0].kind === "ul") expect(b[0].items).toHaveLength(3);
  });

  it("lista pa pasus su dva bloka", () => {
    const b = parseBlocks("- jedan\nobičan red");
    expect(b.map((x) => x.kind)).toEqual(["ul", "p"]);
  });

  it("novi red unutar pasusa se čuva", () => {
    const b = parseBlocks("prvi red\ndrugi red");
    expect(b).toHaveLength(1);
    if (b[0].kind === "p") expect(b[0].lines).toHaveLength(2);
  });

  it("crtica bez razmaka iza (-jedan) nije lista, ostaje pasus", () => {
    const b = parseBlocks("-jedan");
    expect(b).toHaveLength(1);
    expect(b[0].kind).toBe("p");
  });

  it("zvezdica na početku reda (moguć kurziv) nije bullet marker", () => {
    const b = parseBlocks("* naglašeno nešto*");
    expect(b).toHaveLength(1);
    expect(b[0].kind).toBe("p");
  });
});
