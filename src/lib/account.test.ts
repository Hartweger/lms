import { describe, it, expect } from "vitest";
import { accessStatus, remainingSessions, shouldShowRenew } from "./account";

const NOW = new Date("2026-06-28T10:00:00Z");

describe("accessStatus", () => {
  it("bez roka → trajan, ne prikazuje istek", () => {
    expect(accessStatus(null, NOW)).toEqual({ state: "none", daysLeft: null });
  });
  it("rok za 18 dana → aktivan", () => {
    expect(accessStatus("2026-07-16T10:00:00Z", NOW)).toEqual({ state: "active", daysLeft: 18 });
  });
  it("rok za 5 dana → uskoro istice", () => {
    expect(accessStatus("2026-07-03T10:00:00Z", NOW)).toEqual({ state: "expiring", daysLeft: 5 });
  });
  it("rok prosao → istekao", () => {
    expect(accessStatus("2026-06-20T10:00:00Z", NOW)).toEqual({ state: "expired", daysLeft: -8 });
  });
});

describe("remainingSessions", () => {
  it("paket 8, iskorisceno 3 → 5", () => {
    expect(remainingSessions(8, 3)).toBe(5);
  });
  it("ne ide ispod 0", () => {
    expect(remainingSessions(8, 10)).toBe(0);
  });
});

describe("shouldShowRenew", () => {
  it("prikazuje obnovu samo kad postoji rok i nije trajan", () => {
    expect(shouldShowRenew({ state: "expiring", daysLeft: 5 })).toBe(true);
    expect(shouldShowRenew({ state: "expired", daysLeft: -1 })).toBe(true);
    expect(shouldShowRenew({ state: "active", daysLeft: 40 })).toBe(false);
    expect(shouldShowRenew({ state: "none", daysLeft: null })).toBe(false);
  });
});
