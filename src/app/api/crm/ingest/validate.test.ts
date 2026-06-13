import { describe, it, expect } from "vitest";
import { parseIngest } from "./validate";

describe("parseIngest", () => {
  it("prihvata validan IG payload", () => {
    const r = parseIngest({ name: "Marko", instagram_handle: "@marko", message: "ćao", channel: "instagram" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.channel).toBe("instagram");
      expect(r.value.instagram).toBe("@marko");
    }
  });
  it("odbija nepoznat kanal", () => {
    const r = parseIngest({ message: "x", channel: "telepatija" });
    expect(r.ok).toBe(false);
  });
  it("odbija ako nema nijednog identifikatora (ni mejl ni IG ni telefon)", () => {
    const r = parseIngest({ message: "x", channel: "instagram" });
    expect(r.ok).toBe(false);
  });
  it("podrazumeva channel whatsapp kad je prosleđen", () => {
    const r = parseIngest({ phone: "+38160", message: "zdravo", channel: "whatsapp" });
    expect(r.ok).toBe(true);
  });
});
