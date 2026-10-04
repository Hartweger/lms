import { describe, it, expect } from "vitest";
import { gradeTyping, buildQuizOptions } from "./flashcard-grading";
import type { FlashcardItem } from "./flashcard-types";

const vater: FlashcardItem = { front: "Vater", back: "otac", article: "der", plural: "Väter" };

describe("gradeTyping - smer SR→DE (ukucaj nemački)", () => {
  it("tačan unos", () => {
    expect(gradeTyping("Vater", vater, "sr-de").status).toBe("correct");
  });
  it("član nije obavezan, ali se prihvata i sa članom", () => {
    expect(gradeTyping("der Vater", vater, "sr-de").status).toBe("correct");
  });
  it("malo slovo i razmaci tolerišu se", () => {
    expect(gradeTyping("  vater ", vater, "sr-de").status).toBe("correct");
  });
  it("jedno slovo greške → almost (priznato), sa punim oblikom", () => {
    const r = gradeTyping("Vator", vater, "sr-de");
    expect(r.status).toBe("almost");
    expect(r.fullForm).toContain("der Vater");
  });
  it("potpuno pogrešno → wrong", () => {
    expect(gradeTyping("Hund", vater, "sr-de").status).toBe("wrong");
  });
  it("kratke reči (<4 slova) ne prolaze kao 'almost'", () => {
    const da: FlashcardItem = { front: "da", back: "da" };
    expect(gradeTyping("ja", da, "sr-de").status).toBe("wrong");
  });
  it("ß/umlaut tolerancija", () => {
    const strasse: FlashcardItem = { front: "Straße", back: "ulica" };
    expect(gradeTyping("strasse", strasse, "sr-de").status).toBe("correct");
  });
  it("pun rečnički oblik (jednina + množina) se prihvata", () => {
    expect(gradeTyping("der Vater, Väter", vater, "sr-de").status).toBe("correct");
    expect(gradeTyping("Vater, Väter", vater, "sr-de").status).toBe("correct");
  });
  it("ono što se prikazuje kao tačan odgovor mora i da se prihvata", () => {
    const schueler: FlashcardItem = { front: "Schüler", back: "učenik", article: "der", plural: "die Schüler" };
    const ff = gradeTyping("", schueler, "sr-de").fullForm; // "der Schüler, die Schüler"
    expect(gradeTyping(ff, schueler, "sr-de").status).toBe("correct");
  });
});

describe("gradeTyping - smer DE→SR (ukucaj srpski) sa više prevoda", () => {
  const hallo: FlashcardItem = { front: "Hallo", back: "Zdravo|Ćao" };
  it("bilo koji prevod je tačan", () => {
    expect(gradeTyping("ćao", hallo, "de-sr").status).toBe("correct");
    expect(gradeTyping("zdravo", hallo, "de-sr").status).toBe("correct");
  });
});

describe("buildQuizOptions", () => {
  const pool: FlashcardItem[] = [
    { front: "Vater", back: "otac" }, { front: "Mutter", back: "majka" },
    { front: "Bruder", back: "brat" }, { front: "Schwester", back: "sestra" },
  ];
  it("vraća 4 opcije sa tačnim odgovorom unutra (smer DE→SR)", () => {
    const r = buildQuizOptions(pool[0], pool, "de-sr");
    expect(r).not.toBeNull();
    expect(r!.options).toHaveLength(4);
    expect(r!.options[r!.correctIndex]).toBe("otac");
    expect(new Set(r!.options).size).toBe(4); // bez duplikata
  });
  it("ako nema dovoljno kartica (<4) → null", () => {
    expect(buildQuizOptions(pool[0], pool.slice(0, 2), "de-sr")).toBeNull();
  });
});

describe("prijave polaznika A1 (04.10.2026)", () => {
  const zahl: FlashcardItem = { front: "Zahl", back: "broj", article: "die", plural: "die Zahlen" };
  const nummer: FlashcardItem = { front: "Nummer", back: "broj", article: "die", plural: "die Nummern" };
  const sieSg: FlashcardItem = { front: "sie (Sg.)", back: "ona" };
  const sieAll: FlashcardItem = { front: "sie (Pl.)", back: "oni" };
  const mein: FlashcardItem = { front: "mein-", back: "moj" };
  const set = [zahl, nummer, sieSg, sieAll, mein, { front: "Vater", back: "otac" }, { front: "Mutter", back: "majka" }];

  it("mein bez crtice je tačno, i dalje i sa crticom", () => {
    expect(gradeTyping("mein", mein, "sr-de").status).toBe("correct");
    expect(gradeTyping("mein-", mein, "sr-de").status).toBe("correct");
  });
  it("sie bez (Sg.)/(Pl.) je tačno", () => {
    expect(gradeTyping("sie", sieSg, "sr-de").status).toBe("correct");
    expect(gradeTyping("sie", sieAll, "sr-de").status).toBe("correct");
  });
  it("broj: Zahl i Nummer se prihvataju za obe kartice", () => {
    expect(gradeTyping("Nummer", zahl, "sr-de", set).status).toBe("correct");
    expect(gradeTyping("die Zahl", nummer, "sr-de", set).status).toBe("correct");
    expect(gradeTyping("Vater", zahl, "sr-de", set).status).toBe("wrong");
  });
  it("kviz ne nudi drugu karticu sa istim promptom kao pogrešan odgovor", () => {
    for (let i = 0; i < 3; i++) {
      const r = buildQuizOptions(zahl, set, "sr-de")!;
      expect(r.options).not.toContain("Nummer");
    }
  });
});
