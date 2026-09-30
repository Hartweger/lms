import { describe, it, expect } from "vitest";
import { accessStatus, accessNote, remainingSessions, shouldShowRenew, isRenewable } from "./account";

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

describe("isRenewable", () => {
  it("video kurs → obnovljiv", () => {
    expect(isRenewable("video", "kurs-nemackog-jezika-a1-1")).toBe(true);
    expect(isRenewable(null, "neki-kurs")).toBe(true);
  });
  it("mesecni ind paket → nije obnovljiv kuponom", () => {
    expect(isRenewable("mesecni", "ind-paket-8")).toBe(false);
  });
  it("konverzacijski slug → nije obnovljiv kuponom", () => {
    expect(isRenewable("grupni", "kurs-konverzacije")).toBe(false);
    expect(isRenewable(null, "konverzacijski-b1-sadrzaj")).toBe(false);
  });
});

describe("accessNote", () => {
  const NEXT = "2026-07-07T17:46:00Z"; // sledeća naplata, 9 dana posle NOW

  it("bez pretplate - odbrojava do isteka kao i do sad", () => {
    expect(accessNote({ state: "active", daysLeft: 18 }, null, NOW))
      .toEqual({ text: "Pristup ističe za 18 dana", tone: "muted" });
    expect(accessNote({ state: "expiring", daysLeft: 5 }, null, NOW))
      .toEqual({ text: "Pristup ističe za 5 dana", tone: "alarm" });
  });

  it("daleki rok i trajan pristup - bez poruke", () => {
    expect(accessNote({ state: "active", daysLeft: 40 }, null, NOW)).toBeNull();
    expect(accessNote({ state: "none", daysLeft: null }, null, NOW)).toBeNull();
  });

  it("jedan dan se ne piše kao „1 dana“", () => {
    expect(accessNote({ state: "expiring", daysLeft: 1 }, null, NOW)?.text)
      .toBe("Pristup ističe za 1 dan");
    expect(accessNote({ state: "expiring", daysLeft: 2 }, null, NOW)?.text)
      .toBe("Pristup ističe za 2 dana");
  });

  // Jezgro prijave 30.09.2026: rok pretplate je „plaćeno do", pa pada na 7 dana
  // svakog meseca - odbrojavanje bi svaki put najavilo gubitak kursa koji se sam produžava.
  it("aktivna pretplata - datum naplate umesto odbrojavanja", () => {
    expect(accessNote({ state: "expiring", daysLeft: 7 }, NEXT, NOW))
      .toEqual({ text: "Produžava se automatski 7. 7. 2026.", tone: "muted" });
    expect(accessNote({ state: "active", daysLeft: 14 }, NEXT, NOW))
      .toEqual({ text: "Produžava se automatski 7. 7. 2026.", tone: "muted" });
  });

  it("pretplata sa naplatom koja se tek obrađuje - ćuti, ne plaši i ne obećava prošli datum", () => {
    expect(accessNote({ state: "expiring", daysLeft: 6 }, "2026-06-27T10:00:00Z", NOW)).toBeNull();
  });

  it("istekao pristup se prikazuje i kod aktivne pretplate - naplata je pala", () => {
    expect(accessNote({ state: "expired", daysLeft: -2 }, NEXT, NOW))
      .toEqual({ text: "Pristup je istekao", tone: "alarm" });
  });
});
