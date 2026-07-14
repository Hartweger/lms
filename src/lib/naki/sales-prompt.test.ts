import { describe, it, expect } from "vitest";
import { buildSalesSystemPrompt, SMILE_MODEL } from "./sales-prompt";

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
});
