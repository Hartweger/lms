import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdmin } from "@/lib/test/fake-admin";
import { NextResponse } from "next/server";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof import("@/lib/test/fake-admin").createFakeAdmin>,
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.admin }));

import { withCronLog, findCronProblems, EXPECTED_CRONS } from "./cron-log";

function req(): Request {
  return new Request("https://test.local/api/cron/nesto", {
    headers: { authorization: "Bearer tajna" },
  });
}

beforeEach(() => {
  h.fake = createFakeAdmin();
});

describe("withCronLog", () => {
  it("uspešan prolaz → red u cron_runs sa ok=true", async () => {
    const wrapped = withCronLog("proba", async () => NextResponse.json({ done: 1 }));
    const res = await wrapped(req());

    expect(res.status).toBe(200);
    const row = h.fake.row("cron_runs", (r) => r.name === "proba");
    expect(row).toBeTruthy();
    expect(row!.ok).toBe(true);
    expect(row!.status).toBe(200);
  });

  it("500 odgovor → ok=false", async () => {
    const wrapped = withCronLog("proba", async () => NextResponse.json({ error: "x" }, { status: 500 }));
    await wrapped(req());
    expect(h.fake.row("cron_runs", (r) => r.name === "proba")!.ok).toBe(false);
  });

  it("401 (scan/pogrešan secret) se NE beleži", async () => {
    const wrapped = withCronLog("proba", async () => NextResponse.json({ error: "no" }, { status: 401 }));
    await wrapped(req());
    expect(h.fake.row("cron_runs", (r) => r.name === "proba")).toBeUndefined();
  });

  it("handler baci grešku → zabeleži ok=false pa rethrow", async () => {
    const wrapped = withCronLog("proba", async () => { throw new Error("pukao"); });
    await expect(wrapped(req())).rejects.toThrow("pukao");
    expect(h.fake.row("cron_runs", (r) => r.name === "proba")!.ok).toBe(false);
  });

  it("pad upisa loga ne sme da obori cron", async () => {
    h.fake.failInsert("cron_runs");
    const wrapped = withCronLog("proba", async () => NextResponse.json({ done: 1 }));
    const res = await wrapped(req());
    expect(res.status).toBe(200);
  });
});

describe("findCronProblems", () => {
  const now = Date.parse("2026-07-03T16:00:00Z");
  const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
  const expected = [
    { name: "dnevni", maxAgeHours: 26 },
    { name: "nedeljni", maxAgeHours: 170 },
  ];

  it("svež uspešan prolaz → bez problema", () => {
    const runs = [
      { name: "dnevni", ok: true, created_at: hoursAgo(5) },
      { name: "nedeljni", ok: true, created_at: hoursAgo(100) },
    ];
    expect(findCronProblems(expected, runs, now)).toEqual([]);
  });

  it("star poslednji prolaz → kasni", () => {
    const runs = [
      { name: "dnevni", ok: true, created_at: hoursAgo(30) },
      { name: "nedeljni", ok: true, created_at: hoursAgo(100) },
    ];
    expect(findCronProblems(expected, runs, now)).toEqual([{ name: "dnevni", problem: "kasni" }]);
  });

  it("poslednji prolaz pao → pao (i kad je svež)", () => {
    const runs = [
      { name: "dnevni", ok: false, created_at: hoursAgo(2) },
      { name: "nedeljni", ok: true, created_at: hoursAgo(100) },
    ];
    expect(findCronProblems(expected, runs, now)).toEqual([{ name: "dnevni", problem: "pao" }]);
  });

  it("bez zapisa dok je sistem mlad → bez lažnog alarma", () => {
    // najstariji zapis u tabeli je od pre 3h - dnevni cron još nije ni trebalo da prođe
    const runs = [{ name: "nedeljni", ok: true, created_at: hoursAgo(3) }];
    expect(findCronProblems(expected, runs, now)).toEqual([]);
  });

  it("bez zapisa a sistem stariji od očekivanog intervala → nema-zapisa", () => {
    const runs = [{ name: "nedeljni", ok: true, created_at: hoursAgo(48) }];
    expect(findCronProblems(expected, runs, now)).toEqual([{ name: "dnevni", problem: "nema-zapisa" }]);
  });
});

describe("EXPECTED_CRONS", () => {
  it("pokriva svih 16 cron ruta iz vercel.json", () => {
    expect(EXPECTED_CRONS.map((c) => c.name).sort()).toEqual([
      "access-audit", "activation", "business-summary", "close-groups",
      "eseji-pregled", "expiry-reminder", "grupe-podsetnik", "honorari",
      "inactivity", "jutarnji-pregled", "naki-content-weekly", "nestpay-reconcile",
      "prof-podsetnik", "review-recert", "review-request", "test-funnel",
    ]);
  });
});
