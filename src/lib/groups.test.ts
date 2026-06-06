import { describe, it, expect } from "vitest";
import { formatDays, formatPocetak, mapGroupToRaspored, nextExpiry } from "./groups";

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
      { level: "A1.1", status: "otvoren", start_date: "2026-06-15", duration_weeks: 8, days: [1, 3], session_time: "18:00", max_seats: 6 },
      "Nataša Hartweger", 2,
    );
    expect(r).toMatchObject({
      nivo: "A1.1", prof: "Nataša Hartweger", status: "Otvoren za upis",
      pocetak: "15.06.2026", trajanje: "8", dani: "pon, sre", sat: "18:00",
      maks: "6", upisanih: "2", slobodnih: "4",
    });
  });
});
