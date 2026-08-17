import { describe, it, expect } from "vitest";
import { isDeliverableEmail, domainTypoHint } from "./email-valid";

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

  // Adrese ispod su STVARNO upisane u bazu i odbile se - spisak nije izmišljen.
  it("odbija tipfelere velikih provajdera", () => {
    for (const e of [
      "sasemaks2@gmail.con", "bebili973@gmail.comcom", "hajnisupra5@gmail.comh",
      "cvetkovic.milos42@gmail.cokm", "neko@gmail.coma", "neko@gmail.comz",
      "ivana18stojiljkovic@hotmail.commail.com", "neko@hotmail.con", "neko@yahoo.con",
      "miljkovicivana66@gamil.com", "neko@gmai.com", "milenaacim@84gmil.com", "neko@gmail..com",
    ]) expect(isDeliverableEmail(e), e).toBe(false);
  });

  it("NE odbija prave domene koji liče na tipfeler", () => {
    // ymail i rocketmail su Yahoo-ovi, hotmail.it italijanski - u bazi ih ima 25.
    for (const e of [
      "neko@ymail.com", "neko@rocketmail.com", "neko@hotmail.it",
      "neko@yahoo.com.sg", "neko@email.com", "neko@gmail.com", "neko@icloud.com",
    ]) expect(isDeliverableEmail(e), e).toBe(true);
  });

  it("predlaže ispravku, da poruka o grešci može da kaže šta nije u redu", () => {
    expect(domainTypoHint("sasemaks2@gmail.con")).toBe("gmail.com");
    expect(domainTypoHint("neko@gmail.comcom")).toBe("gmail.com");
    expect(domainTypoHint("neko@hotmail.commail.com")).toBe("hotmail.com");
    expect(domainTypoHint("neko@gamil.com")).toBe("gmail.com");
    expect(domainTypoHint("neko@yahoo.con")).toBe("yahoo.com");
    expect(domainTypoHint("neko@gmail..com")).toBe("gmail.com");
    expect(domainTypoHint("neko@gmail.com")).toBeNull();
    expect(domainTypoHint("neko@ymail.com")).toBeNull();
  });
});
