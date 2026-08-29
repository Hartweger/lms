import { describe, it, expect } from "vitest";
import { rasporedPomeren, imaTermin, profesorkaPromenjena } from "./GrupeAdmin";

// Upozorenje se pali kad je grupa VEĆ imala termin (gcal/Meet) i menja joj se raspored -
// tada PATCH sam ne dira ni group_sessions ni gcal, pa treba „Napravi / osveži termin".
// Povod: B2.1/B2.2 avgust 2026 (sesije i kalendar ostali na starom datumu, honorar brojao fantome).

const grupa = {
  professor_id: "prof-marija",
  start_date: "2026-08-26",
  days: [3, 6],
  session_time: "17:00-18:00",
  duration_weeks: 8,
  sessions_count: 15,
  gcal_event_id: "abc123",
  meet_link: "https://meet.google.com/x",
};

describe("imaTermin", () => {
  it("ima termin kad postoji gcal event ILI Meet link", () => {
    expect(imaTermin(grupa)).toBe(true);
    expect(imaTermin({ gcal_event_id: "abc", meet_link: null })).toBe(true);
    expect(imaTermin({ gcal_event_id: null, meet_link: "https://meet…" })).toBe(true);
  });
  it("nema termin kad su oba prazna", () => {
    expect(imaTermin({ gcal_event_id: null, meet_link: null })).toBe(false);
    expect(imaTermin(null)).toBe(false);
  });
});

describe("rasporedPomeren", () => {
  it("promena datuma početka = pomeren", () =>
    expect(rasporedPomeren(grupa, { ...grupa, start_date: "2026-09-09" })).toBe(true));
  it("promena dana = pomeren", () =>
    expect(rasporedPomeren(grupa, { ...grupa, days: [2, 4] })).toBe(true));
  it("promena sata = pomeren", () =>
    expect(rasporedPomeren(grupa, { ...grupa, session_time: "19:00-20:00" })).toBe(true));
  it("promena trajanja ili broja časova = pomeren", () => {
    expect(rasporedPomeren(grupa, { ...grupa, duration_weeks: 7 })).toBe(true);
    expect(rasporedPomeren(grupa, { ...grupa, sessions_count: 14 })).toBe(true);
  });

  it("isti raspored = nije pomeren (novi niz dana sa istim vrednostima ne pali upozorenje)", () => {
    expect(rasporedPomeren(grupa, { ...grupa })).toBe(false);
    expect(rasporedPomeren(grupa, { ...grupa, days: [3, 6] })).toBe(false);
  });
  it("promena polja koje ne utiče na termine = nije pomeren", () => {
    expect(rasporedPomeren(grupa, { ...grupa, max_seats: 8 })).toBe(false);
    expect(rasporedPomeren(grupa, { ...grupa, price: 21200 })).toBe(false);
  });
  it("null → nije pomeren (nova grupa i duplikat nemaju polazno stanje)", () => {
    expect(rasporedPomeren(null, grupa)).toBe(false);
    expect(rasporedPomeren(grupa, null)).toBe(false);
  });
  it("undefined i null se tretiraju isto (grupa bez sessions_count)", () => {
    expect(rasporedPomeren({ ...grupa, sessions_count: null }, { ...grupa, sessions_count: undefined })).toBe(false);
  });
});

// Promena profesorke je poseban slučaj: gcal serija je u KALENDARU profesorke, pa „Osveži termin"
// mora da preseli termin (nov Meet link), a ne da pomera postojeći.
// Povod: B1.1 29.08.2026 - event ostao kod Suzane, grupa prešla Mariji, moveTerm vratio "Not Found".
describe("profesorkaPromenjena", () => {
  it("druga profesorka = promenjena", () =>
    expect(profesorkaPromenjena(grupa, { ...grupa, professor_id: "prof-suzana" })).toBe(true));

  it("ista profesorka = nije promenjena", () =>
    expect(profesorkaPromenjena(grupa, { ...grupa })).toBe(false));

  it("promena rasporeda bez promene profesorke = nije promenjena", () =>
    expect(profesorkaPromenjena(grupa, { ...grupa, start_date: "2026-09-09", days: [2, 4] })).toBe(false));

  it("null → nije promenjena (nova grupa i duplikat nemaju polazno stanje)", () => {
    expect(profesorkaPromenjena(null, grupa)).toBe(false);
    expect(profesorkaPromenjena(grupa, null)).toBe(false);
  });

  it("grupa bez profesorke se ne računa kao zamena (prazno → izabrano nije preseljenje)", () => {
    expect(profesorkaPromenjena({ ...grupa, professor_id: null }, grupa)).toBe(false);
    expect(profesorkaPromenjena(grupa, { ...grupa, professor_id: null })).toBe(false);
  });

  it("promena profesorke NE pali upozorenje o pomerenom rasporedu (dve različite poruke)", () =>
    expect(rasporedPomeren(grupa, { ...grupa, professor_id: "prof-suzana" })).toBe(false));
});
