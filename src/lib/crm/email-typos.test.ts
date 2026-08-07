import { describe, it, expect } from "vitest";
import { suggestEmailFix } from "./email-typos";

describe("suggestEmailFix", () => {
  it("hvata slučaj koji nas je i naterao na proveru (gmai.com)", () => {
    const s = suggestEmailFix("danijelavuklis88@gmai.com");
    expect(s?.suggestion).toBe("danijelavuklis88@gmail.com");
    expect(s?.domain).toBe("gmai.com");
  });

  it("hvata zamenu mesta susednih slova (gmial.com)", () => {
    expect(suggestEmailFix("ana@gmial.com")?.suggestion).toBe("ana@gmial.com".replace("gmial", "gmail"));
  });

  it("hvata pogrešan TLD", () => {
    expect(suggestEmailFix("ana@gmail.con")?.suggestion).toBe("ana@gmail.com");
    expect(suggestEmailFix("ana@yahoo.co")?.suggestion).toBe("ana@yahoo.com");
  });

  it("hvata i domaće provajdere", () => {
    expect(suggestEmailFix("ana@mts.rd")?.suggestion).toBe("ana@mts.rs");
  });

  it("ćuti za ispravne domene", () => {
    expect(suggestEmailFix("ana@gmail.com")).toBeNull();
    expect(suggestEmailFix("ana@hartweger.rs")).toBeNull();
    expect(suggestEmailFix("ana@mts.rs")).toBeNull();
  });

  it("ne prijavljuje prave provajdere koji liče na veće (mail.com, ymail.com)", () => {
    expect(suggestEmailFix("ana@mail.com")).toBeNull();
    expect(suggestEmailFix("ana@ymail.com")).toBeNull();
    expect(suggestEmailFix("ana@hotmail.co.uk")).toBeNull();
  });

  it("ćuti za nepoznate domene koji ne liče ni na jedan poznati", () => {
    expect(suggestEmailFix("ana@firma-xyz.co.rs")).toBeNull();
    expect(suggestEmailFix("ana@univerzitet.ac.rs")).toBeNull();
  });

  it("ćuti za prazno i nevalidno", () => {
    expect(suggestEmailFix("")).toBeNull();
    expect(suggestEmailFix(null)).toBeNull();
    expect(suggestEmailFix(undefined)).toBeNull();
    expect(suggestEmailFix("nije-mejl")).toBeNull();
    expect(suggestEmailFix("@gmai.com")).toBeNull();
    expect(suggestEmailFix("ana@")).toBeNull();
  });

  it("normalizuje ulaz (trim + mala slova)", () => {
    expect(suggestEmailFix("  Ana@GMAI.com ")?.suggestion).toBe("ana@gmail.com");
  });

  // Domeni zatečeni u crm_contacts 07.08.2026 - provera na stvarnim podacima.
  describe("stvarni domeni iz baze", () => {
    it("hvata punycode homograf (xn--gmal-nza.com = gmaıl.com)", () => {
      const s = suggestEmailFix("ana@xn--gmal-nza.com");
      expect(s?.reason).toBe("punycode");
      expect(s?.suggestion).toBeNull();
    });

    it("hvata dvostruku tačku (gmail..com)", () => {
      expect(suggestEmailFix("ana@gmail..com")?.suggestion).toBe("ana@gmail.com");
    });

    it("hvata poznat domen zalepljen uz višak (hotmail.commail.com)", () => {
      const s = suggestEmailFix("ana@hotmail.commail.com");
      expect(s?.reason).toBe("sadrzi-poznat-domen");
      expect(s?.suggestion).toBe("ana@hotmail.com");
    });

    it("hvata gamil.com", () => {
      expect(suggestEmailFix("ana@gamil.com")?.suggestion).toBe("ana@gmail.com");
    });

    it("hvata cifre odlutale u domen (84gmil.com)", () => {
      expect(suggestEmailFix("milenaacim@84gmil.com")?.suggestion).toBe("milenaacim@gmail.com");
    });

    it("ćuti za sve ispravne domene zatečene u bazi", () => {
      const cisti = [
        "gmail.com", "yahoo.com", "hotmail.com", "icloud.com", "outlook.com",
        "live.com", "hartweger.rs", "bluewin.ch", "balcanica.ba", "beherbie.com",
        "limessoft.com", "jednakost.gov.rs", "web.de", "ymail.com", "duck.com",
        "energogroup.com", "filum.kg.ac.rs", "optop.ch", "fivuma.com",
        "outlook.de", "proton.me", "yahoo.co.uk", "gmx.net", "nikisgrupa.hr",
        "googlemail.com",
      ];
      const lazni = cisti.filter((d) => suggestEmailFix(`ana@${d}`) !== null);
      expect(lazni).toEqual([]);
    });
  });
});
