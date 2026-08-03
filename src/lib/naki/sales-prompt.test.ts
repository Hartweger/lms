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

  it("uz probne lekcije daje pravilo 'ne traži mejl' i spisak linkova", () => {
    const out = buildSalesSystemPrompt("katalog", {
      coupon: false,
      previews: `- Nemački A2.1 („Persönliche Angaben") | https://www.hartweger.rs/kurs/nemacki-a2-1`,
    });
    expect(out).toContain("PROBNE LEKCIJE - UVEK DAJ LINK, NIKAD NE TRAŽI MEJL ZA OVO");
    expect(out).toContain("https://www.hartweger.rs/kurs/nemacki-a2-1");
    expect(out).toContain("bez naloga i bez prijave");
  });

  it("bez probnih lekcija nema ni bloka - da Smile ne obeća link koji ne postoji", () => {
    const out = buildSalesSystemPrompt("katalog", { coupon: false });
    expect(out).not.toContain("SPISAK PROBNIH LEKCIJA");
  });

  it("besplatnu vežbu i dalje šalje na NaKI, ali pregled kursa razdvaja od njega", () => {
    const out = buildSalesSystemPrompt("katalog", { coupon: false });
    expect(out).toContain("/naki");
    expect(out).toContain("NaKI nije odgovor");
  });

  it("zna šta je uključeno u video kurs i razdvaja PDF od interaktivnih vežbi", () => {
    const out = buildSalesSystemPrompt("katalog", { coupon: false });
    expect(out).toContain("ŠTA JE UKLJUČENO U VIDEO KURS");
    expect(out).toContain("Ana u Nemačkoj");
    expect(out).toContain("PDF VEŽBE");
    expect(out).toContain("NE obećavaj PDF radnu svesku");
  });

  it("default model je sonnet", () => {
    expect(SMILE_MODEL).toBe("claude-sonnet-4-6");
  });

  it("video kursevi samo celi nivoi - ne nudi izmišljeni 'video kurs A1.2'", () => {
    const out = buildSalesSystemPrompt("katalog", { coupon: false });
    expect(out).toContain("SAMO za cele nivoe");
    expect(out).toContain("video kurs A1.2");
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

  it("prati varijantu posetioca i ne pogađa mu rod", () => {
    const out = buildSalesSystemPrompt("katalog", { coupon: false });
    expect(out).toMatch(/ijekav/i);
    expect(out).toMatch(/ne poga[đd]aj|rod uop[šs]te ne treba/i);
  });

  describe("mesečno plaćanje (pretplata)", () => {
    const out = () => buildSalesSystemPrompt("katalog", { coupon: true });

    it("zna tačnu ratu, broj naplata i ukupan iznos", () => {
      expect(out()).toContain("3.199");
      expect(out()).toContain("12");
      expect(out()).toContain("38.388");
    });

    it("kaže da je ukupno skuplje od jednokratne cene", () => {
      expect(out()).toContain("29.133");
      expect(out()).toMatch(/skuplje/i);
    });

    it("vezuje pretplatu SAMO za Video paket A1+A2+B1", () => {
      expect(out()).toContain("paket-a1-a2-b1");
      expect(out()).toMatch(/samo za Video paket/i);
    });

    it("objašnjava postepeno otvaranje nivoa", () => {
      expect(out()).toMatch(/postepeno|otvara/i);
      expect(out()).toContain("osme");
    });

    it("kaže da je otkazivanje samostalno i bez kazne", () => {
      expect(out()).toContain("Moj nalog");
      expect(out()).toMatch(/u svakom trenutku/i);
      expect(out()).toMatch(/napredak.*(ostaje|sa[čc]uvan)/i);
    });

    it("ne obećava kupon NAKI10 na mesečnu ratu", () => {
      expect(out()).toMatch(/NAKI10 ne (važi|umanjuje)/i);
    });

    it("kaže da kupon ipak važi za jednokratnu kupovinu i za Intesa rate", () => {
      expect(out()).toMatch(/važi.{0,80}jednokratn/i);
      expect(out()).toMatch(/rat[ae].{0,40}Intesa|Intesa.{0,40}rat[ae]/i);
    });

    it("kaže da mesečno plaćanje ide samo karticom", () => {
      expect(out()).toMatch(/samo.{0,30}kartic/i);
    });
  });
});
