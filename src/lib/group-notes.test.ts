import { describe, expect, it } from "vitest";
import { pickSessionForNote, withoutNotedSessions } from "./group-notes";

describe("pickSessionForNote", () => {
  it("nema sesije za datum -> none", () => {
    expect(pickSessionForNote([])).toEqual({ kind: "none" });
  });
  it("aktivna sesija -> found", () => {
    expect(pickSessionForNote([{ id: "s1", cancelled: false }])).toEqual({ kind: "found", sessionId: "s1" });
  });
  it("sesija označena kao otkazana -> cancelled (beleška se ne veže na otkazan čas)", () => {
    expect(pickSessionForNote([{ id: "s1", cancelled: true }])).toEqual({ kind: "cancelled" });
  });
});

describe("withoutNotedSessions", () => {
  it("izbacuje sesije koje imaju belešku, ostale vraća", () => {
    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(withoutNotedSessions(rows, new Set(["b"]))).toEqual([{ id: "a" }, { id: "c" }]);
  });
  it("prazan skup beleški ne menja listu", () => {
    expect(withoutNotedSessions([{ id: "a" }], new Set())).toEqual([{ id: "a" }]);
  });
});
