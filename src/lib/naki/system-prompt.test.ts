import { describe, it, expect } from "vitest";
import {
  NAKI_SYSTEM_PROMPT,
  conversationMemoryAddon,
  levelAskGuardAddon,
  supportAddon,
} from "./system-prompt";

describe("NAKI_SYSTEM_PROMPT", () => {
  it("izričito zabranjuje dugu crticu", () => {
    expect(NAKI_SYSTEM_PROMPT).toContain("obična crtica");
  });
  it("sam ne sadrži dugu crticu koju bi model imitirao", () => {
    expect(NAKI_SYSTEM_PROMPT.replace(/nikada — ni –/, "")).not.toMatch(/[—–]/);
  });
});

describe("levelAskGuardAddon", () => {
  it("prazno kad NaKI još nije pitao za nivo", () => {
    expect(levelAskGuardAddon(["Zdravo! Čime da ti pomognem?"], null)).toBe("");
  });

  it("prazno kad je nivo poznat (conversationMemoryAddon to već pokriva)", () => {
    expect(levelAskGuardAddon(["Koji nivo učiš - A1, A2 ili B1?"], "B1")).toBe("");
  });

  it("zabranjuje ponovno pitanje kad je već pitao a nivo je i dalje nepoznat", () => {
    const out = levelAskGuardAddon(["Koji nivo učiš - A1, A2 ili B1?"], null);
    expect(out).toContain("Već si pitao za nivo");
    expect(out).toContain("NE pitaj ponovo");
    expect(out).toContain("proceni nivo");
  });

  it("hvata i varijantu 'koji je tvoj nivo'", () => {
    expect(levelAskGuardAddon(["A koji je tvoj nivo?"], null)).toContain("Već si pitao za nivo");
  });
});

describe("supportAddon", () => {
  it("prazno za obično pitanje o gramatici", () => {
    expect(supportAddon(["Kako se gradi Perfekt?"])).toBe("");
  });

  it("reaguje na 'uplatila sam kurs a ne znam da ga otvorim'", () => {
    const out = supportAddon(["Ja sam uplatila kurs za fide i ne znam da ga otvorim"]);
    expect(out).toContain("info@hartweger.rs");
    expect(out).toContain("/prijava");
  });

  it("reaguje na 'gde su lekcije'", () => {
    expect(supportAddon(["Gde su lekcije"])).toContain("info@hartweger.rs");
  });

  it("reaguje na problem sa lozinkom", () => {
    expect(supportAddon(["ne mogu da se ulogujem, zaboravila sam lozinku"])).toContain("info@hartweger.rs");
  });

  it("reaguje na pitanje o WhatsApp grupi", () => {
    expect(supportAddon(["Kako da se pridruzim What's up grupi?"])).toContain("info@hartweger.rs");
  });

  it("gleda samo poslednju poruku, ne celu istoriju", () => {
    expect(supportAddon(["gde su lekcije", "Kako se gradi Perfekt?"])).toBe("");
  });

  it("ne pali se na vežbu koja slučajno pominje reč nalog u nemačkom kontekstu", () => {
    expect(supportAddon(["kako se kaže lozinka na nemačkom"])).toBe("");
  });

  it("ne pali se kad kupovina služi samo kao kontekst, bez problema", () => {
    expect(supportAddon(["kupila sam kurs b1.1 vec"])).toBe("");
  });

  it("ne pali se na pitanje o sadržaju kupljenog kursa", () => {
    const out = supportAddon([
      "kupila sam video kurs i ima isto na kraju svake lekcije reči ali nisam sabrala koliko",
    ]);
    expect(out).toBe("");
  });

  it("reaguje kad uz kupovinu ide i problem", () => {
    expect(supportAddon(["Uplatio sam neki kurs ali nisam siguran kako da pocnem"])).toContain(
      "info@hartweger.rs"
    );
  });
});

describe("conversationMemoryAddon", () => {
  it("ubacuje zapamćeni nivo i zabranjuje ponovno pitanje", () => {
    const out = conversationMemoryAddon(["zdravo", "ucim B1"], "B1");
    expect(out).toContain("nivo B1");
    expect(out).toContain('NE pitaj ponovo "koji nivo"');
  });

  it("prazno kad nema ni nivoa ni imena", () => {
    expect(conversationMemoryAddon(["daj mi vežbu"], null)).toBe("");
  });

  it("hvata ime iz 'ich heiße' i normalizuje veliko slovo", () => {
    const out = conversationMemoryAddon(["Ich heiße marija"], null);
    expect(out).toContain("Korisnik se zove Marija");
    expect(out).toContain("DOSLEDNO isti gramatički rod");
  });

  it("hvata ime iz 'zovem se'", () => {
    expect(conversationMemoryAddon(["zovem se Aleksandra"], "A1")).toContain("Aleksandra");
  });

  it("ne hvata lažno ime iz 'ja sam umorna'", () => {
    const out = conversationMemoryAddon(["ja sam umorna danas"], null);
    expect(out).toBe("");
  });
});
