import { describe, it, expect } from "vitest";
import {
  NAKI_SYSTEM_PROMPT,
  conversationMemoryAddon,
  examinerAddon,
  genderAddon,
  levelAskGuardAddon,
  supportAddon,
} from "./system-prompt";

describe("NAKI_SYSTEM_PROMPT - mesečno plaćanje", () => {
  it("zna da postoji mesečno plaćanje i za koji paket", () => {
    expect(NAKI_SYSTEM_PROMPT).toContain("3.199");
    expect(NAKI_SYSTEM_PROMPT).toContain("paket-a1-a2-b1");
  });

  it("ne obećava NAKI10 na mesečnu ratu", () => {
    expect(NAKI_SYSTEM_PROMPT).toMatch(/NAKI10 ne (važi|umanjuje)/i);
  });

  it("razdvaja pretplatu od Intesa rata - za rate kupon važi", () => {
    expect(NAKI_SYSTEM_PROMPT).toMatch(/rat[ae].{0,60}Intesa|Intesa.{0,60}rat[ae]/i);
  });
});

// 14.08.2026: Smile je izmislio Zoom jer platforma nigde nije pisala u promptu.
// Ista rupa je bila i kod NaKI-ja, pa je popravljeno na oba mesta.
describe("NAKI_SYSTEM_PROMPT - platforma i par", () => {
  it("kaže Google Meet i izričito zabranjuje Zoom", () => {
    expect(NAKI_SYSTEM_PROMPT).toContain("ISKLJUČIVO preko Google Meet-a");
    expect(NAKI_SYSTEM_PROMPT).toContain("NIKAD ne reci Zoom");
  });

  it("zna individualni kurs u paru sa 30% za drugu osobu", () => {
    expect(NAKI_SYSTEM_PROMPT).toContain("individualni kurs u paru");
    expect(NAKI_SYSTEM_PROMPT).toContain("30% popusta");
  });
});

describe("NAKI_SYSTEM_PROMPT - rod, nivo, varijanta jezika", () => {
  it("ne postavlja muški rod kao pretpostavku", () => {
    expect(NAKI_SYSTEM_PROMPT).not.toMatch(/mu[šs]ki kao default/i);
  });

  it("traži rodno neutralnu formulaciju dok rod nije poznat", () => {
    expect(NAKI_SYSTEM_PROMPT).toMatch(/dok rod .{0,20}(ne zna[šs]|nije poznat)/i);
    expect(NAKI_SYSTEM_PROMPT).toMatch(/ne poga[đd]aj|rod uop[šs]te ne treba/i);
  });

  it("ne nabraja samo A1, A2 i B1 kad pita za nivo", () => {
    expect(NAKI_SYSTEM_PROMPT).not.toContain('"Koji nivo učiš - A1, A2 ili B1?"');
  });

  it("prati varijantu kojom korisnik piše (ijekavica ostaje ijekavica)", () => {
    expect(NAKI_SYSTEM_PROMPT).toMatch(/ijekav/i);
    expect(NAKI_SYSTEM_PROMPT).not.toMatch(/Uvek odgovaraj na srpskom/);
  });
});

describe("NAKI_SYSTEM_PROMPT", () => {
  it("izričito zabranjuje dugu crticu", () => {
    expect(NAKI_SYSTEM_PROMPT).toContain("obična crtica");
  });
  it("sam ne sadrži dugu crticu koju bi model imitirao", () => {
    expect(NAKI_SYSTEM_PROMPT.replace(/nikada — ni –/, "")).not.toMatch(/[—–]/);
  });
});

describe("genderAddon", () => {
  // Rod se najčešće otkrije participom, ne imenom. Redosled reči varira, a "č/š/ž"
  // ruše \w u JavaScriptu - zato ovoliko slučajeva.
  it.each([
    "ja sam umorna danas",
    "juče sam učila cele večeri",
    "radila sam ceo dan",
    "sam samo htela da pitam",
    "nisam sigurna da li je tacno",
    "ja sam umoran",
    "juče sam učio ceo dan",
    "juče sam malo vežbao",
    "bio sam u Berlinu",
    "Ich heiße Marija",
    // Korisnik rod često kaže sam od sebe, bez našeg pitanja.
    "Zensko sam. Spremam Goethe B1.",
    "muško sam, učim A2",
    "ja sam žensko",
  ])("ćuti kad je rod poznat iz: %s", (t) => {
    expect(genderAddon([{ role: "user", content: t }])).toBe("");
  });

  const PITANJE = "Koji nivo učiš? I kako da ti se obraćam - u muškom ili ženskom rodu?";
  const posle = (odgovor: string) => [
    { role: "user" as const, content: "Vežbajmo razgovor" },
    { role: "assistant" as const, content: PITANJE },
    { role: "user" as const, content: odgovor },
  ];

  // Stvarni odgovori korisnika - ne stižu u obliku koji smo zamislili.
  it.each([
    "žensko",
    "muško sam",
    "ja sam žensko",
    "obraćaj mi se u ženskom rodu",
    "Zelim A2 da zenski rodom",
    "B1, muški",
    "u zenskom rodu molim",
  ])("prepoznaje odgovor na pitanje o rodu: %s", (t) => {
    expect(genderAddon(posle(t))).toBe("");
  });

  it("ne meša gramatički ženski rod imenice sa rodom korisnika", () => {
    const out = genderAddon([
      { role: "user", content: "objasni mi ženski rod imenica u nemačkom" },
    ]);
    expect(out).toMatch(/Rod korisnika NIJE poznat/);
  });

  it("kad rod nije poznat a nije ni pitao - traži da pita jednom", () => {
    const out = genderAddon([{ role: "user", content: "daj mi vežbu" }]);
    expect(out).toMatch(/Rod korisnika NIJE poznat/);
    expect(out).toMatch(/Pitaj ga jednom/);
  });

  it("kad je već pitao a odgovor nije stigao - NE pita ponovo", () => {
    const out = genderAddon([
      { role: "user", content: "Vežbajmo razgovor" },
      { role: "assistant", content: PITANJE },
      { role: "user", content: "ne bih rekao" },
    ]);
    expect(out).toMatch(/NE pitaj ponovo/);
    expect(out).not.toMatch(/Pitaj ga jednom/);
  });

  it("ne pita ponovo ni kad je pitanje daleko iza (uzrok ponavljanja 26.07)", () => {
    const dugacka = [
      { role: "user" as const, content: "Vežbajmo razgovor" },
      { role: "assistant" as const, content: PITANJE },
      ...Array.from({ length: 40 }, (_, i) => ({
        role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
        content: `poruka ${i}`,
      })),
    ];
    expect(genderAddon(dugacka)).toMatch(/NE pitaj ponovo/);
  });
});

describe("examinerAddon", () => {
  it.each(["Spremam Goethe B1", "kako izgleda telc ispit", "vezbam za ÖSD A1", "treba mi FIDE", "koji sertifikat vredi"])(
    "javi kredencijal kad se pomene ispit: %s",
    (t) => {
      const out = examinerAddon([t], []);
      expect(out).toMatch(/ispitiva[čc]/i);
      expect(out).toMatch(/program/i);
    }
  );

  it("ćuti kad ispit nije u priči", () => {
    expect(examinerAddon(["Kako se gradi Perfekt?"], [])).toBe("");
  });

  it("ne pali se na testove na platformi", () => {
    expect(examinerAddon(["uradio sam test iz lekcije 3"], [])).toBe("");
  });

  // Nataša je ispitivač za Goethe i TELC - NE za ÖSD ni FIDE. Kredencijal se ne sme proširiti.
  it("izričito zabranjuje da se kredencijal pripiše ÖSD-u ili FIDE", () => {
    const out = examinerAddon(["Spremam ÖSD B1"], []);
    expect(out).toContain("Goethe");
    expect(out).toContain("telc");
    expect(out).toMatch(/NE.{0,60}(ÖSD|OSD)/);
  });

  // Kredencijal se vezuje za PROGRAM, ne za to ko drži čas - Nataša ne vodi
  // grupne ni individualne kurseve.
  it("vezuje kredencijal za program, ne za izvođenje nastave", () => {
    const out = examinerAddon(["Spremam Goethe B1"], []);
    expect(out).toMatch(/ne (tvrdi|obe[ćc]avaj)/i);
  });

  it("ćuti kad je već pomenut u razgovoru", () => {
    const out = examinerAddon(["Spremam Goethe B1"], ["Program je pravila Nataša, licencirani ispitivač."]);
    expect(out).toBe("");
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
    expect(out).not.toMatch(/Korisnik se zove/);
  });

  it("ne bavi se rodom - to je posao genderAddon", () => {
    expect(conversationMemoryAddon(["daj mi vežbu"], null)).toBe("");
  });
});
