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
  it("ignoriše neispunjene ManyChat tokene ({{phone}}, {{email}})", () => {
    const r = parseIngest({
      instagram_handle: "marko", message: "ćao", channel: "instagram",
      email: "{{email}}", phone: "{{phone}}",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.email).toBeNull();
      expect(r.value.phone).toBeNull();
      expect(r.value.instagram).toBe("marko");
    }
  });
  it("odbija kad su svi identifikatori neispunjeni tokeni", () => {
    const r = parseIngest({ email: "{{email}}", phone: "{{phone}}", instagram_handle: "{{ig_username}}", channel: "instagram" });
    expect(r.ok).toBe(false);
  });
  it("prihvata mejl kanal sa email + subject", () => {
    const r = parseIngest({ channel: "mejl", email: "ana@x.rs", name: "Ana", subject: "Pitanje o B1", message: "Koliko traje?" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.channel).toBe("mejl");
      expect(r.value.subject).toBe("Pitanje o B1");
    }
  });
  it("odbija mejl kanal bez email-a", () => {
    const r = parseIngest({ channel: "mejl", name: "Ana", message: "x" });
    expect(r.ok).toBe(false);
  });
});
