import { describe, it, expect } from "vitest";
import { buildSalesSystemPrompt, SMILE_MODEL, leadNudgeAddon } from "./sales-prompt";

describe("leadNudgeAddon", () => {
  const u = (content: string) => ({ role: "user" as const, content });
  const a = (content: string) => ({ role: "assistant" as const, content });

  it("ćuti na prvoj poruci - prvo odgovor, pa tek onda mejl", () => {
    expect(leadNudgeAddon([u("Koliko košta kurs?")], true)).toBe("");
  });

  it("traži mejl od druge korisničke poruke nadalje", () => {
    const out = leadNudgeAddon([u("Koliko košta?"), a("Zavisi..."), u("A1 sam")], true);
    expect(out).toContain("ZAVRŠI ovaj odgovor");
    expect(out).toContain("mejl");
  });

  it("ćuti kad je leadCapture isključen", () => {
    const out = leadNudgeAddon([u("Koliko košta?"), a("Zavisi..."), u("A1 sam")], false);
    expect(out).toBe("");
  });

  it("ćuti kad je posetilac već ostavio mejl", () => {
    const out = leadNudgeAddon(
      [u("Koliko košta?"), a("Zavisi..."), u("marija@primer.rs"), a("Hvala!"), u("A još nešto")],
      true
    );
    expect(out).toBe("");
  });

  it("ćuti kad je Smile već pitao za mejl, da ne dosađuje", () => {
    const out = leadNudgeAddon(
      [u("Koliko košta?"), a("Ostavi mi svoj mejl pa ti tim šalje detalje"), u("A1 sam")],
      true
    );
    expect(out).toBe("");
  });
});

describe("buildSalesSystemPrompt", () => {
  it("ubacuje katalog tekst", () => {
    const out = buildSalesSystemPrompt("VIDEO KURSEVI:\n- X | 1 RSD | url", { coupon: false });
    expect(out).toContain("VIDEO KURSEVI:");
    expect(out).toContain("Ti si Smile");
  });

  it("ne pominje kupon kad je coupon=false", () => {
    const out = buildSalesSystemPrompt("katalog", { coupon: false });
    expect(out).not.toContain("NAKI10");
  });

  it("dodaje kupon blok kad je coupon=true", () => {
    const out = buildSalesSystemPrompt("katalog", { coupon: true });
    expect(out).toContain("NAKI10");
  });

  it("default model je sonnet", () => {
    expect(SMILE_MODEL).toBe("claude-sonnet-4-6");
  });

  it("za visoke nivoe (C1) upucuje na mesecne pakete umesto 'nemamo u ponudi'", () => {
    const out = buildSalesSystemPrompt("katalog", { coupon: false });
    expect(out).toContain("IZUZETAK - visoki nivoi");
    expect(out).toContain("C1.2");
  });

  it("individualni termini: 8-21h, kalendar posle uplate, provera termina preko mejla", () => {
    const out = buildSalesSystemPrompt("katalog", { coupon: false });
    expect(out).toContain("od 8 do 21 h");
    expect(out).toContain("nakon uplate");
    expect(out).toContain("PRE kupovine proveri");
  });

  it("ne traži mejl aktivno kad je leadCapture=false", () => {
    const out = buildSalesSystemPrompt("katalog", { coupon: false, leadCapture: false });
    expect(out).not.toContain("HVATANJE MEJLA");
  });

  it("dodaje blok za aktivno traženje mejla kad je leadCapture=true", () => {
    const out = buildSalesSystemPrompt("katalog", { coupon: false, leadCapture: true });
    expect(out).toContain("HVATANJE MEJLA");
    expect(out).toContain("ostavi mejl");
  });

  it("blok za mejl zabranjuje ponavljanje i pritisak", () => {
    const out = buildSalesSystemPrompt("katalog", { coupon: false, leadCapture: true });
    expect(out).toContain("Ne traži mejl više od jednom");
    expect(out).toContain("nastavi normalno");
  });

  it("leadCapture izostavljen se ponaša kao false (kompatibilnost)", () => {
    const out = buildSalesSystemPrompt("katalog", { coupon: false });
    expect(out).not.toContain("HVATANJE MEJLA");
  });
});
