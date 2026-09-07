import { describe, it, expect } from "vitest";
import { cenaZaDan } from "./route";

describe("NH Academy — cena po fazi kampanje", () => {
  it("rani upis važi do 31.8. uključivo", () => {
    expect(cenaZaDan("2026-08-08").rsd).toBe(57300);
    expect(cenaZaDan("2026-08-31").rsd).toBe(57300);
  });

  it("puna cena kreće 1.9., bez međukoraka", () => {
    expect(cenaZaDan("2026-09-01").rsd).toBe(80700);
    expect(cenaZaDan("2026-09-20").rsd).toBe(80700);
    expect(cenaZaDan("2026-09-29").rsd).toBe(80700);
  });

  it("posle kraja kampanje ostaje puna cena, ne pada nazad", () => {
    expect(cenaZaDan("2027-01-15").rsd).toBe(80700);
  });
});
