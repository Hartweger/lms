import { describe, it, expect } from "vitest";
import { monthKey, kategorijaForItem, allocateOrderTotal, type FinOrder, expenseMonthsInYear, type ExpenseRow, buildFinansije, type FinansijeInput, fillGroupCourseIds, type CourseInfo, type GroupInfo } from "./finansije";

describe("monthKey", () => {
  it("vraća yyyy-mm iz ISO datuma", () => {
    expect(monthKey("2026-06-11")).toBe("2026-06");
    expect(monthKey("2026-06-11T14:30:00.000Z")).toBe("2026-06");
  });
});

describe("kategorijaForItem", () => {
  it("prepoznaje kategorije po slug-u", () => {
    expect(kategorijaForItem("video-a1", null)).toBe("video");
    expect(kategorijaForItem("grupni-a1", null)).toBe("grupni");
    expect(kategorijaForItem("paket-a1-a2", null)).toBe("video"); // paketi → video (nema zaseban Paketi red)
  });
  it("koristi course_type kad slug nije prefiksiran", () => {
    expect(kategorijaForItem("nemacki-1na1-a1", "individual")).toBe("individualni");
    expect(kategorijaForItem("osnove-gramatike", "video")).toBe("video");
  });
  it("paket-proizvodi idu po tipu: video-paket→video, 1:1 paket→individualni", () => {
    expect(kategorijaForItem("paket-a1-a2", "video")).toBe("video");
    expect(kategorijaForItem("paket-nivo-a1-individualni-standard", "individual")).toBe("individualni");
  });
  it("nepoznato → ostalo", () => {
    expect(kategorijaForItem("nesto", null)).toBe("ostalo");
  });
});

describe("allocateOrderTotal", () => {
  const order = (total: number, prices: number[]): FinOrder => ({
    id: "o1", user_id: "u1", created_at: "2026-06-01T10:00:00Z", total,
    items: prices.map((p, i) => ({ course_id: `c${i}`, course_slug: `kurs-${i}`, title: `Kurs ${i}`, price: p })),
  });

  it("jedna stavka dobija ceo total (i kad postoji popust)", () => {
    expect(allocateOrderTotal(order(9000, [12000]))).toEqual([
      { course_id: "c0", course_slug: "kurs-0", amount: 9000 },
    ]);
  });
  it("popust se deli proporcionalno i zbir = total", () => {
    // 12000 + 6000 = 18000, total 9000 → pola: 6000 + 3000
    const a = allocateOrderTotal(order(9000, [12000, 6000]));
    expect(a.map((x) => x.amount)).toEqual([6000, 3000]);
    expect(a.reduce((s, x) => s + x.amount, 0)).toBe(9000);
  });
  it("zaokruživanje ne gubi dinar - poslednja stavka pokupi ostatak", () => {
    const a = allocateOrderTotal(order(10000, [3000, 3000, 3000]));
    expect(a.reduce((s, x) => s + x.amount, 0)).toBe(10000);
  });
  it("bez stavki → prazno; cene 0 → sve na prvu stavku", () => {
    expect(allocateOrderTotal(order(5000, []))).toEqual([]);
    expect(allocateOrderTotal(order(5000, [0, 0]))[0].amount).toBe(5000);
  });
});

describe("expenseMonthsInYear", () => {
  const base: ExpenseRow = {
    id: "e1", name: "Vercel", category: "alati-hosting", amount: 2500,
    course_id: null, expense_date: "2026-03-15", recurring: false, ended_at: null, note: null,
  };

  it("jednokratni pada samo u svoj mesec", () => {
    expect(expenseMonthsInYear(base, 2026, "2026-06")).toEqual([3]);
    expect(expenseMonthsInYear(base, 2025, "2026-06")).toEqual([]);
  });
  it("mesečni bez kraja važi od početka do tekućeg meseca", () => {
    const e = { ...base, recurring: true };
    expect(expenseMonthsInYear(e, 2026, "2026-06")).toEqual([3, 4, 5, 6]);
  });
  it("mesečni sa krajem staje u mesecu ended_at", () => {
    const e = { ...base, recurring: true, ended_at: "2026-05-01" };
    expect(expenseMonthsInYear(e, 2026, "2026-12")).toEqual([3, 4, 5]);
  });
  it("mesečni pokriva celu narednu godinu do tekućeg meseca", () => {
    const e = { ...base, expense_date: "2025-11-01", recurring: true };
    expect(expenseMonthsInYear(e, 2026, "2026-02")).toEqual([1, 2]);
  });
});

function fixture(overrides: Partial<FinansijeInput> = {}): FinansijeInput {
  return {
    year: 2026, mesec: null, nowKey: "2026-06",
    orders: [
      // jun: video kurs 9000 (Ana)
      { id: "o1", user_id: "ana", created_at: "2026-06-03T10:00:00Z", total: 9000,
        items: [{ course_id: "c-video", course_slug: "osnove-gramatike", title: "Gramatika", price: 9000 }] },
      // jun: grupni 6000 (Maja, članica grupe g1)
      { id: "o2", user_id: "maja", created_at: "2026-06-05T10:00:00Z", total: 6000,
        items: [{ course_id: "c-grupni", course_slug: "grupni-a1", title: "Grupni A1", price: 6000 }] },
      // maj: individualni 14000 (Ivan, prof Hristina)
      { id: "o3", user_id: "ivan", created_at: "2026-05-10T10:00:00Z", total: 14000,
        items: [{ course_id: "c-ind", course_slug: "nemacki-1na1-a1", title: "1:1 A1", price: 14000 }] },
      // jun: individualni obnova (Ivan, prof Hristina) - 2. mesec plaćanja → retencija 2
      { id: "o4", user_id: "ivan", created_at: "2026-06-10T10:00:00Z", total: 14000,
        items: [{ course_id: "c-ind", course_slug: "nemacki-1na1-a1", title: "1:1 A1", price: 14000 }] },
    ],
    courses: [
      { id: "c-video", title: "Gramatika", slug: "osnove-gramatike", course_type: "video" },
      { id: "c-grupni", title: "Grupni A1", slug: "grupni-a1", course_type: "group" },
      { id: "c-ind", title: "1:1 A1", slug: "nemacki-1na1-a1", course_type: "individual" },
    ],
    professors: [
      { id: "p-hristina", full_name: "Hristina", honorar_ind: 1400, honorar_grp: 1600 },
      { id: "p-katarina", full_name: "Katarina", honorar_ind: 1600, honorar_grp: 1800 },
    ],
    lessons: [
      { lesson_date: "2026-06-02", professor_id: "p-hristina", course_id: "c-ind" },
      { lesson_date: "2026-06-09", professor_id: "p-hristina", course_id: "c-ind" },
    ],
    sessions: [
      { session_date: "2026-06-04", professor_id: "p-katarina", group_id: "g1", course_id: "c-grupni" },
      { session_date: "2026-06-11", professor_id: "p-katarina", group_id: "g1", course_id: "c-grupni" },
    ],
    expenses: [
      { id: "e1", name: "Meta oglasi", category: "oglasi", amount: 5000, course_id: null,
        expense_date: "2026-06-01", recurring: false, ended_at: null, note: null },
      { id: "e2", name: "Snimanje videa", category: "materijali", amount: 3000, course_id: "c-video",
        expense_date: "2026-06-01", recurring: false, ended_at: null, note: null },
    ],
    indProfByOrderId: { o3: "p-hristina", o4: "p-hristina" },
    indEnrollments: [{ professor_id: "p-hristina", user_id: "ivan", status: "active" }],
    groups: [{ id: "g1", level: "A1.1", status: "u_toku", max_seats: 6, professor_id: "p-katarina",
      purchasable_course_id: "c-grupni", session_time: "ut/čet 18h" }],
    groupMembers: [{ group_id: "g1", user_id: "maja", status: "active" }],
    royalties: [],
    ...overrides,
  };
}

describe("buildFinansije - P&L po mesecima", () => {
  it("prihod po kategoriji pada u pravi mesec", () => {
    const d = buildFinansije(fixture());
    const jun = d.months[5];
    expect(jun.prihod.video).toBe(9000);
    expect(jun.prihod.grupni).toBe(6000);
    expect(jun.prihod.individualni).toBe(14000);
    expect(jun.prihodUkupno).toBe(29000);
    expect(d.months[4].prihodUkupno).toBe(14000); // maj
  });
  it("honorari po profesorki: časovi × stopa", () => {
    const jun = buildFinansije(fixture()).months[5];
    expect(jun.honorari["p-hristina"]).toBe(2 * 1400);
    expect(jun.honorari["p-katarina"]).toBe(2 * 1800); // Katarina grp stopa je 1800 (premium)
    expect(jun.honorariUkupno).toBe(2800 + 3600);
  });
  it("troškovi po kategoriji i neto", () => {
    const jun = buildFinansije(fixture()).months[5];
    expect(jun.troskovi.oglasi).toBe(5000);
    expect(jun.troskovi.materijali).toBe(3000);
    expect(jun.neto).toBe(29000 - 6400 - 8000);
  });
  it("totals za celu godinu", () => {
    const d = buildFinansije(fixture());
    expect(d.totals.prihod).toBe(43000);
    expect(d.totals.honorari).toBe(6400);
    expect(d.totals.troskovi).toBe(8000);
    expect(d.totals.neto).toBe(43000 - 14400);
    expect(d.totals.marzaPct).toBe(Math.round(((43000 - 14400) / 43000) * 100));
  });
  it("porudžbine van godine ne ulaze u months", () => {
    const f = fixture();
    f.orders.push({ id: "o5", user_id: "x", created_at: "2025-12-01T10:00:00Z", total: 99999,
      items: [{ course_id: "c-video", course_slug: "osnove-gramatike", title: "G", price: 99999 }] });
    expect(buildFinansije(f).totals.prihod).toBe(43000);
  });
  it("istorijski honorar override zamenjuje časove za taj mesec", () => {
    const f = fixture();
    // jun u fixture-u ima honorare iz časova (Hristina 2800, Katarina 3600 = 6400)
    f.historyHonorari = [
      { month: 6, professor_id: "p-hristina", amount: 25200 },
      { month: 6, professor_id: "p-katarina", amount: 74280 },
    ];
    const jun = buildFinansije(f).months[5];
    expect(jun.honorari["p-hristina"]).toBe(25200); // override, NE 2800 iz časova
    expect(jun.honorari["p-katarina"]).toBe(74280);
    expect(jun.honorariUkupno).toBe(25200 + 74280); // časovi preskočeni
  });
  it("meseci bez override-a i dalje računaju honorare iz časova", () => {
    const f = fixture();
    f.historyHonorari = [{ month: 3, professor_id: "p-hristina", amount: 25200 }];
    const d = buildFinansije(f);
    expect(d.months[2].honorariUkupno).toBe(25200);       // mart: override
    expect(d.months[5].honorariUkupno).toBe(2800 + 3600); // jun: i dalje časovi
  });
  it("istorijski WC prihod ulazi u mesečni grid po kategoriji, ne u sekcije", () => {
    const f = fixture();
    f.historyRevenue = [
      { month: 3, kategorija: "video", amount: 11000 },
      { month: 3, kategorija: "grupni", amount: 18000 },
      { month: 3, kategorija: "individualni", amount: 22000 },
    ];
    const d = buildFinansije(f);
    expect(d.months[2].prihod.video).toBe(11000);      // mart
    expect(d.months[2].prihod.grupni).toBe(18000);
    expect(d.months[2].prihod.individualni).toBe(22000);
    expect(d.months[2].prihodUkupno).toBe(51000);
    expect(d.totals.prihod).toBe(43000 + 51000);
    // sekcije ostaju nativne - istorijski prihod ne pravi nove redove po kursevima
    expect(d.kursevi.every((k) => k.course_id !== "")).toBe(true);
  });
});

describe("buildFinansije - marže po kursevima", () => {
  it("kurs: prihod − honorar − direktni troškovi", () => {
    const d = buildFinansije(fixture());
    const video = d.kursevi.find((k) => k.course_id === "c-video")!;
    expect(video.prihod).toBe(9000);
    expect(video.honorar).toBe(0);
    expect(video.direktniTroskovi).toBe(3000);
    expect(video.marza).toBe(6000);
    const ind = d.kursevi.find((k) => k.course_id === "c-ind")!;
    expect(ind.prihod).toBe(28000);
    expect(ind.honorar).toBe(2800);
    expect(ind.marza).toBe(25200);
  });
  it("opšti troškovi = nealocirani; kursevi sortirani po marži", () => {
    const d = buildFinansije(fixture());
    expect(d.opstiTroskovi).toBe(5000);
    const marze = d.kursevi.map((k) => k.marza);
    expect([...marze].sort((a, b) => b - a)).toEqual(marze);
  });
  it("mesec filter sužava sekcije, ali ne P&L", () => {
    const d = buildFinansije(fixture({ mesec: 5 })); // samo maj
    const ind = d.kursevi.find((k) => k.course_id === "c-ind")!;
    expect(ind.prihod).toBe(14000);  // samo majska porudžbina
    expect(ind.honorar).toBe(0);     // junski časovi ispadaju
    expect(d.months[5].prihodUkupno).toBe(29000); // P&L i dalje cela godina
  });
});

describe("buildFinansije - grupe", () => {
  it("zarada grupe = prihod članova − sesije × stopa", () => {
    const d = buildFinansije(fixture());
    const g = d.grupe.find((x) => x.group_id === "g1")!;
    expect(g.clanovi).toBe(1);
    expect(g.maxSeats).toBe(6);
    expect(g.level).toBe("A1.1");          // Fix 1: level se prenosi iz GroupInfo
    expect(g.prihod).toBe(6000);          // Majina porudžbina
    expect(g.honorar).toBe(2 * 1800);     // 2 sesije × Katarina grp stopa (1800)
    expect(g.zarada).toBe(6000 - 3600);
    expect(g.zaradaPoClanu).toBe(2400);
    expect(g.profesorka).toBe("Katarina");
  });
  it("grupa ispod break-even ima negativnu zaradu", () => {
    const f = fixture();
    f.orders = f.orders.filter((o) => o.id !== "o2"); // bez Majine uplate
    const g = buildFinansije(f).grupe.find((x) => x.group_id === "g1")!;
    expect(g.prihod).toBe(0);
    expect(g.zarada).toBe(-3600);
  });
  it("uplata ide aktivnoj grupi kad je polaznik bio u više grupa istog kursa", () => {
    const f = fixture();
    f.groups.push({ id: "g0", level: "A1.1", status: "zavrsena", max_seats: 6, professor_id: "p-katarina",
      purchasable_course_id: "c-grupni", session_time: "pon/sre 18h" });
    // g0 namerno PRE g1 u groupMembers - bez fixa bi find() pokupio g0
    f.groupMembers = [{ group_id: "g0", user_id: "maja", status: "cancelled" }, ...f.groupMembers];
    const d = buildFinansije(f);
    expect(d.grupe.find((x) => x.group_id === "g1")!.prihod).toBe(6000);
    expect(d.grupe.find((x) => x.group_id === "g0")?.prihod ?? 0).toBe(0);
  });
});

describe("buildFinansije - profesorke", () => {
  it("prihod profesorke: individualni preko order→enrollment, grupni preko njenih grupa", () => {
    const d = buildFinansije(fixture());
    const hristina = d.profesorke.find((p) => p.professor_id === "p-hristina")!;
    expect(hristina.prihod).toBe(28000);  // obe Ivanove porudžbine 2026 (maj + jun)
    const katarina = d.profesorke.find((p) => p.professor_id === "p-katarina")!;
    expect(katarina.prihod).toBe(6000);   // Majina grupna uplata
    expect(katarina.honorar).toBe(3600);
    expect(katarina.neto).toBe(2400);
  });
  it("sortirane po neto doprinosu", () => {
    const neto = buildFinansije(fixture()).profesorke.map((p) => p.neto);
    expect([...neto].sort((a, b) => b - a)).toEqual(neto);
  });
  it("retencija = prosek različitih meseci plaćanja po polazniku (cela istorija)", () => {
    const d = buildFinansije(fixture());
    const hristina = d.profesorke.find((p) => p.professor_id === "p-hristina")!;
    // Ivan ima uplatu u maju (pre nowKey="2026-06") → ostaje, 2 meseca plaćanja
    expect(hristina.retencijaMeseci).toBe(2);  // Ivan: maj + jun
    const katarina = d.profesorke.find((p) => p.professor_id === "p-katarina")!;
    // Maja je tek počela u junu (== nowKey) → isključena iz proseka → null (nema starijih polaznika)
    expect(katarina.retencijaMeseci).toBeNull();  // Maja: najraniji jun == nowKey → isključena
  });
  it("aktivni polaznici: ind enrollment active + grupni active članovi", () => {
    const d = buildFinansije(fixture());
    expect(d.profesorke.find((p) => p.professor_id === "p-hristina")!.aktivniPolaznici).toBe(1);
    expect(d.profesorke.find((p) => p.professor_id === "p-katarina")!.aktivniPolaznici).toBe(1);
  });
  it("1:1 paket (slug počinje sa 'paket') atribuira prihod profesorki ako ima individual_enrollment", () => {
    // Realni slugovi 1:1 paketa počinju sa "paket-nivo-..." → kategorijaForItem vrati "paket",
    // ali order ima individual_enrollment sa professor_id → mora se atribuirati Hristini.
    const f = fixture({
      orders: [
        ...fixture().orders,
        // o5: jun, Lena kupuje 1:1 paket (slug počinje "paket-"), ali enrollment postoji za Hristinu
        { id: "o5", user_id: "lena", created_at: "2026-06-15T10:00:00Z", total: 14000,
          items: [{ course_id: "c-ind-paket", course_slug: "paket-nivo-a1-individualni-standard", title: "1:1 paket A1", price: 14000 }] },
      ],
      courses: [
        ...fixture().courses,
        { id: "c-ind-paket", title: "1:1 paket A1", slug: "paket-nivo-a1-individualni-standard", course_type: "individual" },
      ],
      indProfByOrderId: { ...fixture().indProfByOrderId, o5: "p-hristina" },
    });
    const d = buildFinansije(f);
    const hristina = d.profesorke.find((p) => p.professor_id === "p-hristina")!;
    // Hristina je imala 28000 (o3+o4), sad + 14000 (o5) = 42000
    expect(hristina.prihod).toBe(42000);
  });
});

describe("fillGroupCourseIds", () => {
  const courses: CourseInfo[] = [
    { id: "c-grupni-b12", title: "Grupni B1.2", slug: "grupni-kurs-nemackog-b1-2", course_type: "group" },
    { id: "c-video-a1", title: "Video A1", slug: "osnove-gramatike", course_type: "video" },
    { id: "c-grupni-a11", title: "Grupni A1.1", slug: "grupni-kurs-nemackog-jezika-a1-1", course_type: "group" },
  ];

  it("grupa sa null purchasable_course_id dobija course_id prema nivou", () => {
    const groups: GroupInfo[] = [
      { id: "g1", level: "B1.2", status: "u_toku", max_seats: 6, professor_id: "p1",
        purchasable_course_id: null, session_time: null },
    ];
    const result = fillGroupCourseIds(groups, courses);
    expect(result[0].purchasable_course_id).toBe("c-grupni-b12");
  });

  it("grupa koja već ima purchasable_course_id se NE dira", () => {
    const groups: GroupInfo[] = [
      { id: "g2", level: "B1.2", status: "u_toku", max_seats: 6, professor_id: "p1",
        purchasable_course_id: "existing-id", session_time: null },
    ];
    const result = fillGroupCourseIds(groups, courses);
    expect(result[0].purchasable_course_id).toBe("existing-id");
  });

  it("nivo bez grupnog kursa ostaje null", () => {
    const groups: GroupInfo[] = [
      { id: "g3", level: "C2.1", status: "u_toku", max_seats: 6, professor_id: "p1",
        purchasable_course_id: null, session_time: null },
    ];
    const result = fillGroupCourseIds(groups, courses);
    expect(result[0].purchasable_course_id).toBeNull();
  });

  it("ne menja originalne objekte (immutability)", () => {
    const groups: GroupInfo[] = [
      { id: "g4", level: "A1.1", status: "u_toku", max_seats: 6, professor_id: "p1",
        purchasable_course_id: null, session_time: null },
    ];
    const result = fillGroupCourseIds(groups, courses);
    expect(groups[0].purchasable_course_id).toBeNull(); // original nepromenjen
    expect(result[0].purchasable_course_id).toBe("c-grupni-a11");
  });

  it("video i ne-grupni kursevi se ignorišu pri mapiranju", () => {
    const onlyVideoAndNonGrupni: CourseInfo[] = [
      { id: "c-video", title: "Video", slug: "osnove-gramatike", course_type: "video" },
      { id: "c-ind", title: "Ind", slug: "individualni-kurs-nemackog-jezika-b1-2", course_type: "individual" },
    ];
    const groups: GroupInfo[] = [
      { id: "g5", level: "B1.2", status: "u_toku", max_seats: 6, professor_id: "p1",
        purchasable_course_id: null, session_time: null },
    ];
    const result = fillGroupCourseIds(groups, onlyVideoAndNonGrupni);
    expect(result[0].purchasable_course_id).toBeNull();
  });
});

describe("buildFinansije - autorski procenti", () => {
  // Fixture sa video FSP kursom i Milicom kao autoricom (50%)
  function royaltyFixture(orderOverrides: Partial<FinansijeInput> = {}): FinansijeInput {
    return fixture({
      courses: [
        ...fixture().courses,
        { id: "c-fsp", title: "VIDEO FSP", slug: "fsp", course_type: "video" },
      ],
      professors: [
        ...fixture().professors,
        { id: "p-milica", full_name: "Milica", honorar_ind: 1400, honorar_grp: 1600 },
      ],
      orders: [
        ...fixture().orders,
        // jun: doc1 kupuje VIDEO FSP 24000
        { id: "o-fsp", user_id: "doc1", created_at: "2026-06-15T10:00:00Z", total: 24000,
          items: [{ course_id: "c-fsp", course_slug: "fsp", title: "VIDEO FSP", price: 24000 }] },
      ],
      royalties: [{ course_id: "c-fsp", professor_id: "p-milica", percent: 50 }],
      ...orderOverrides,
    });
  }

  it("jun P&L: honorari[p-milica] === 12000 (50% od 24000)", () => {
    const d = buildFinansije(royaltyFixture());
    const jun = d.months[5];
    expect(jun.honorari["p-milica"]).toBe(12000);
    expect(jun.honorariUkupno).toBe(2800 + 3600 + 12000); // hristina + katarina + milica royalty
  });

  it("kurs c-fsp: prihod 24000, honorar 12000, marza 12000", () => {
    const d = buildFinansije(royaltyFixture());
    const fsp = d.kursevi.find((k) => k.course_id === "c-fsp")!;
    expect(fsp.prihod).toBe(24000);
    expect(fsp.honorar).toBe(12000);
    expect(fsp.marza).toBe(12000);
  });

  it("profesorka Milica: prihod 24000, honorar 12000, neto 12000, retencijaMeseci null, aktivniPolaznici 0", () => {
    const d = buildFinansije(royaltyFixture());
    const milica = d.profesorke.find((p) => p.professor_id === "p-milica")!;
    expect(milica).toBeDefined();
    expect(milica.prihod).toBe(24000);
    expect(milica.honorar).toBe(12000);
    expect(milica.neto).toBe(12000);
    // Video kupci NISU njeni polaznici - retencija i aktivni ne računaju se za autorski prihod
    expect(milica.retencijaMeseci).toBeNull();
    expect(milica.aktivniPolaznici).toBe(0);
  });

  it("popust slučaj: total 18000 uz price 24000 → royalty 9000 (od plaćenog iznosa)", () => {
    const d = buildFinansije(royaltyFixture({
      orders: [
        ...fixture().orders,
        // doc1 kupuje FSP sa popustom - total 18000, ali price u items 24000
        { id: "o-fsp-popust", user_id: "doc1", created_at: "2026-06-15T10:00:00Z", total: 18000,
          items: [{ course_id: "c-fsp", course_slug: "fsp", title: "VIDEO FSP", price: 24000 }] },
      ],
    }));
    const jun = d.months[5];
    expect(jun.honorari["p-milica"]).toBe(9000); // 50% od 18000 (plaćeni iznos, ne puna cena)
    const fsp = d.kursevi.find((k) => k.course_id === "c-fsp")!;
    expect(fsp.prihod).toBe(18000);
    expect(fsp.honorar).toBe(9000);
  });
});

describe("buildFinansije - isplate i aktivnosti po profesorki", () => {
  it("isplaceno = zbir isplata u periodu; van perioda ne ulazi", () => {
    const f = fixture({ mesec: 6 });
    f.payments = [
      { professor_id: "p-hristina", payment_date: "2026-06-15", amount: 2000 },
      { professor_id: "p-hristina", payment_date: "2026-06-28", amount: 500 },
      { professor_id: "p-hristina", payment_date: "2026-05-15", amount: 9999 }, // maj - van perioda
      { professor_id: "p-katarina", payment_date: "2026-06-20", amount: 3600 },
    ];
    const d = buildFinansije(f);
    const hristina = d.profesorke.find((p) => p.professor_id === "p-hristina")!;
    const katarina = d.profesorke.find((p) => p.professor_id === "p-katarina")!;
    expect(hristina.isplaceno).toBe(2500);
    expect(katarina.isplaceno).toBe(3600);
  });

  it("aktivnosti u periodu ulaze u zaradjeno i saldo, van perioda ne", () => {
    const f = fixture({ mesec: 6 });
    f.activities = [
      { professor_id: "p-hristina", activity_date: "2026-06-10", amount: 700 },
      { professor_id: "p-hristina", activity_date: "2026-03-10", amount: 9999 }, // mart - van perioda
    ];
    const d = buildFinansije(f);
    const hristina = d.profesorke.find((p) => p.professor_id === "p-hristina")!;
    expect(hristina.aktivnosti).toBe(700);
    expect(hristina.zaradjeno).toBe(2800 + 700);
    expect(hristina.saldoPerioda).toBe(3500); // ništa isplaćeno
  });

  it("saldoPerioda = zaradjeno - isplaceno; neto odbija i aktivnosti", () => {
    const f = fixture({ mesec: 6 });
    f.activities = [{ professor_id: "p-hristina", activity_date: "2026-06-10", amount: 700 }];
    f.payments = [{ professor_id: "p-hristina", payment_date: "2026-06-15", amount: 3000 }];
    const d = buildFinansije(f);
    const hristina = d.profesorke.find((p) => p.professor_id === "p-hristina")!;
    expect(hristina.saldoPerioda).toBe(2800 + 700 - 3000);
    expect(hristina.neto).toBe(14000 - 3500);
  });

  it("bez payments/activities polja (stari pozivi) sve je 0 i ništa ne puca", () => {
    const d = buildFinansije(fixture({ mesec: 6 }));
    const hristina = d.profesorke.find((p) => p.professor_id === "p-hristina")!;
    expect(hristina.isplaceno).toBe(0);
    expect(hristina.aktivnosti).toBe(0);
    expect(hristina.zaradjeno).toBe(hristina.honorar);
    expect(hristina.saldoPerioda).toBe(hristina.honorar);
  });

  it("cela godina (mesec=null): isplate iz svih meseci godine se sabiraju", () => {
    const f = fixture(); // mesec: null
    f.payments = [
      { professor_id: "p-hristina", payment_date: "2026-05-15", amount: 1000 },
      { professor_id: "p-hristina", payment_date: "2026-06-15", amount: 2000 },
      { professor_id: "p-hristina", payment_date: "2025-12-31", amount: 9999 }, // druga godina
    ];
    const d = buildFinansije(f);
    expect(d.profesorke.find((p) => p.professor_id === "p-hristina")!.isplaceno).toBe(3000);
  });
});
