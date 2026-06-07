import { describe, it, expect } from "vitest";
import { formatDays, formatPocetak, mapGroupToRaspored, nextExpiry } from "./groups";
import { computeSeats } from "./groups";

describe("formatDays", () => {
  it("mapira brojeve dana u srpske skraćenice", () => {
    expect(formatDays([1, 3])).toBe("pon, sre");
    expect(formatDays([])).toBe("");
    expect(formatDays(null)).toBe("");
  });
});

describe("formatPocetak", () => {
  it("YYYY-MM-DD → dd.MM.yyyy", () => {
    expect(formatPocetak("2026-06-15")).toBe("15.06.2026");
    expect(formatPocetak(null)).toBe("");
  });
});

describe("nextExpiry (nikad ne skraćuj)", () => {
  it("uzima veći od postojećeg i danas+365", () => {
    const far = Date.now() + 800 * 86400000;
    expect(nextExpiry(far)).toBe(far);                 // postojeći dalji → ostaje
    expect(nextExpiry(null)).toBeGreaterThan(Date.now()); // novi = ~danas+365
  });
});

describe("mapGroupToRaspored", () => {
  it("mapira red grupe u GrupaRaspored oblik", () => {
    const r = mapGroupToRaspored(
      { level: "A1.1", status: "otvoren", start_date: "2026-06-15", duration_weeks: 8, days: [1, 3], session_time: "18:00", max_seats: 6, manual_enrolled: null },
      "Nataša Hartweger", 2,
    );
    expect(r).toMatchObject({
      nivo: "A1.1", prof: "Nataša Hartweger", status: "Otvoren za upis",
      pocetak: "15.06.2026", trajanje: "8", dani: "pon, sre", sat: "18:00",
      maks: "6", upisanih: "2", slobodnih: "4", full: false,
    });
  });
});

describe("computeSeats (osnova + nove uplate)", () => {
  it("manual kao osnova, bez novih uplata", () =>
    expect(computeSeats({ maxSeats: 6, manualEnrolled: 3, activeEnrollments: 0 }))
      .toEqual({ enrolled: 3, slobodnih: 3, full: false }));
  it("osnova + nove uplate popune grupu", () =>
    expect(computeSeats({ maxSeats: 6, manualEnrolled: 3, activeEnrollments: 3 }))
      .toEqual({ enrolled: 6, slobodnih: 0, full: true }));
  it("bez osnove (null) broji samo uplate", () =>
    expect(computeSeats({ maxSeats: 6, manualEnrolled: null, activeEnrollments: 2 }))
      .toEqual({ enrolled: 2, slobodnih: 4, full: false }));
  it("preko kapaciteta → slobodnih 0, full true", () =>
    expect(computeSeats({ maxSeats: 6, manualEnrolled: 5, activeEnrollments: 3 }))
      .toEqual({ enrolled: 8, slobodnih: 0, full: true }));
});
