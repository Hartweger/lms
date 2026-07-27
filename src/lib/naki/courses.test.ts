import { describe, it, expect } from "vitest";
import {
  couponPrice,
  LEVEL_VIDEO_COURSE,
  stickyLevel,
  courseUpsellAddon,
  appendCourseOffer,
  getLevelCourse,
} from "./courses";
import type { SupabaseClient } from "@supabase/supabase-js";

function fakeAdmin(result: { data: unknown; error: unknown }): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => result }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("couponPrice", () => {
  it("oduzme 10% i zaokruži", () => {
    expect(couponPrice(11600)).toBe(10440);
    expect(couponPrice(9999)).toBe(8999);
  });
});

describe("LEVEL_VIDEO_COURSE", () => {
  it("ima A1/A2/B1, nema B2/C1", () => {
    expect(Object.keys(LEVEL_VIDEO_COURSE).sort()).toEqual(["A1", "A2", "B1"]);
    expect(LEVEL_VIDEO_COURSE.B1.slug).toBe("video-kurs-b1");
  });
});

describe("stickyLevel", () => {
  it("vrati poslednji pomenuti nivo, neosetljivo na veličinu slova", () => {
    expect(stickyLevel(["učim b1", "daj mi vežbu"])).toBe("B1");
    expect(stickyLevel(["A2 sam", "a sad B1 vežbam"])).toBe("B1");
  });
  it("vrati null kad nema nivoa", () => {
    expect(stickyLevel(["zdravo", "daj vežbu"])).toBeNull();
  });
});

describe("courseUpsellAddon", () => {
  const B1 = { slug: "video-kurs-b1", title: "VIDEO kurs B1", price: 11600 };
  const svez = { level: "B1", alreadyRecommended: false, userTurns: 6 };

  it("ubaci slug, cenu i /kursevi, bez kupona", () => {
    const out = courseUpsellAddon(B1, svez);
    expect(out).toContain("video-kurs-b1");
    expect(out).toContain("11600");
    expect(out).toContain("/kursevi/");
    expect(out).not.toContain("NAKI10");
  });

  // Uslovna formulacija ("kad preporučuješ") davala je 4% sesija naspram 38% za blog,
  // koji je formulisan kao zapovest. Zato mora izričito.
  it("izričito NALAŽE preporuku, ne samo koji kurs", () => {
    const out = courseUpsellAddon(B1, svez);
    expect(out).toMatch(/PREPORU[ČC]I/);
    expect(out).toMatch(/jednom/i);
    expect(out).not.toMatch(/Kad ovom korisniku preporučuješ/);
  });

  it("ćuti kad je kurs već preporučen u ovoj sesiji", () => {
    expect(courseUpsellAddon(B1, { ...svez, alreadyRecommended: true })).toBe("");
  });

  it("za nivo bez svog video kursa (B2, C1) upućuje na opštu ponudu", () => {
    const out = courseUpsellAddon(null, { ...svez, level: "B2" });
    expect(out).toMatch(/PREPORU[ČC]I/);
    expect(out).toContain("/kursevi");
    expect(out).not.toMatch(/RSD/);
  });

  it("ćuti kad nivo uopšte nije poznat - nema šta da preporuči", () => {
    expect(courseUpsellAddon(null, { ...svez, level: null })).toBe("");
  });

  // Nalog "u ovom odgovoru" radi tamo gde opšte pravilo ne radi (isto kao kod mejla),
  // ali ne sme prerano - prvo neka korisnik oseti korist od rada.
  it("ćuti na početku razgovora", () => {
    expect(courseUpsellAddon(B1, { ...svez, userTurns: 1 })).toBe("");
    expect(courseUpsellAddon(B1, { ...svez, userTurns: 3 })).toBe("");
  });

  it("od četvrte korisničke poruke traži preporuku u TOM odgovoru", () => {
    const out = courseUpsellAddon(B1, { ...svez, userTurns: 4 });
    expect(out).toMatch(/ovaj odgovor|ovom odgovoru/i);
  });

  it("koristi običnu crticu, nikad — ni –", () => {
    const out = courseUpsellAddon(
      { slug: "video-kurs-a1", title: "VIDEO kurs A1", price: 11600 },
      { level: "A1", alreadyRecommended: false, userTurns: 6 }
    );
    expect(out).not.toMatch(/[—–]/);
  });
});

describe("appendCourseOffer", () => {
  const A2 = { slug: "video-kurs-a2", title: "VIDEO kurs A2", price: 11600 };
  const odgovor = "Tačno! **den Mann** je savršeno.";

  it("dopisuje ponudu sa nazivom, cenom i linkom", () => {
    const out = appendCourseOffer(odgovor, A2, "A2", 0);
    expect(out.startsWith(odgovor)).toBe(true);
    expect(out).toContain("VIDEO kurs A2");
    expect(out).toContain("11.600");
    expect(out).toContain("/kursevi/video-kurs-a2");
  });

  // Ako je model sam preporučio (a to ume lepše, u kontekstu), ne dupliramo.
  it("ne dira odgovor u kom je kurs već ponuđen", () => {
    const sa = odgovor + "\n\nPogledaj https://www.hartweger.rs/kursevi/video-kurs-a2";
    expect(appendCourseOffer(sa, A2, "A2", 0)).toBe(sa);
  });

  it("za nivo bez svog video kursa nudi opštu ponudu, bez cene", () => {
    const out = appendCourseOffer(odgovor, null, "B2", 0);
    expect(out).toContain("/kursevi");
    expect(out).not.toMatch(/RSD/);
  });

  it("ne dira odgovor kad nivo nije poznat", () => {
    expect(appendCourseOffer(odgovor, null, null, 0)).toBe(odgovor);
  });

  it("varira formulaciju da se ne ponavlja ista rečenica svima", () => {
    const varijante = new Set([0, 1, 2].map((i) => appendCourseOffer(odgovor, A2, "A2", i)));
    expect(varijante.size).toBe(3);
  });

  it("poštuje kućna pravila - obična crtica, bez emojija, latinica", () => {
    for (const i of [0, 1, 2]) {
      const out = appendCourseOffer(odgovor, A2, "A2", i);
      expect(out).not.toMatch(/[—–]/);
      expect(out).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
      expect(out).not.toMatch(/[а-яА-Я]/);
    }
  });
});

describe("getLevelCourse", () => {
  it("vrati kurs sa živom cenom za mapiran nivo", async () => {
    const c = await getLevelCourse(fakeAdmin({ data: { price: 11600 }, error: null }), "B1");
    expect(c).toEqual({ slug: "video-kurs-b1", title: "VIDEO kurs B1", price: 11600 });
  });
  it("null za nemapiran nivo (B2)", async () => {
    expect(await getLevelCourse(fakeAdmin({ data: { price: 1 }, error: null }), "B2")).toBeNull();
  });
  it("null kada cena nedostaje", async () => {
    expect(await getLevelCourse(fakeAdmin({ data: { price: null }, error: null }), "A1")).toBeNull();
  });
  it("null kada upit padne", async () => {
    expect(await getLevelCourse(fakeAdmin({ data: null, error: { msg: "x" } }), "A1")).toBeNull();
  });
  it("null za null nivo", async () => {
    expect(await getLevelCourse(fakeAdmin({ data: { price: 1 }, error: null }), null)).toBeNull();
  });
});
