import { describe, it, expect } from "vitest";
import { isDeliverableEmail } from "./email-valid";

describe("isDeliverableEmail", () => {
  it("prihvata uobičajene adrese", () => {
    expect(isDeliverableEmail("aleksandra.naunovic@gmail.com")).toBe(true);
    expect(isDeliverableEmail("ime+tag@sub.domen.rs")).toBe(true);
    expect(isDeliverableEmail("Ime.Prezime@Example.COM")).toBe(true);
  });

  it("odbija TLD sa ciframa (Sentry 40ddd5d2: gmail.com5)", () => {
    expect(isDeliverableEmail("aleksandra.naunovic@gmail.com5")).toBe(false);
    expect(isDeliverableEmail("neko@domen.c0m")).toBe(false);
  });

  it("odbija očigledno neispravne oblike", () => {
    expect(isDeliverableEmail("")).toBe(false);
    expect(isDeliverableEmail("bez-eta.com")).toBe(false);
    expect(isDeliverableEmail("dva@@domen.com")).toBe(false);
    expect(isDeliverableEmail("razmak u@domen.com")).toBe(false);
    expect(isDeliverableEmail("neko@domen")).toBe(false);
    expect(isDeliverableEmail("neko@domen.c")).toBe(false);
    expect(isDeliverableEmail("neko@domen.com ")).toBe(false);
  });
});
