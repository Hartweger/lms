import { describe, it, expect } from "vitest";
import { CANCEL_REASONS, cancelReasonLabel, parseCancelReason } from "./subscription-cancel-reason";

describe("parseCancelReason", () => {
  it("prihvata ključ iz ponuđene liste", () => {
    expect(parseCancelReason("skupo")).toBe("skupo");
  });

  it("odbija nepoznatu vrednost - u analitiku ne sme da uđe smeće", () => {
    expect(parseCancelReason("bilo-sta")).toBeNull();
    expect(parseCancelReason("")).toBeNull();
    expect(parseCancelReason(undefined)).toBeNull();
    expect(parseCancelReason(42)).toBeNull();
  });
});

describe("cancelReasonLabel", () => {
  it("vraća čitljiv tekst za poznat ključ", () => {
    expect(cancelReasonLabel("vreme")).toBe("Nemam vremena");
  });

  it("preskočeno pitanje nije greška nego podatak", () => {
    expect(cancelReasonLabel(null)).toBe("bez odgovora");
  });

  it("nepoznat ključ iz baze ne ruši prikaz", () => {
    expect(cancelReasonLabel("staro-nesto")).toBe("bez odgovora");
  });
});

describe("CANCEL_REASONS", () => {
  it("nudi četiri razloga koje je Nataša odobrila", () => {
    expect(CANCEL_REASONS.map((r) => r.key)).toEqual(["skupo", "vreme", "tempo", "zavrsio"]);
  });
});
