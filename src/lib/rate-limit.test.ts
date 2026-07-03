import { describe, it, expect, vi, afterEach } from "vitest";
import { rateLimit } from "./rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("podrazumevano: 10 zahteva u minuti po ključu", () => {
    const key = `default-${Math.random()}`;
    for (let i = 0; i < 10; i++) expect(rateLimit(key).allowed).toBe(true);
    expect(rateLimit(key).allowed).toBe(false);
  });

  it("prima custom max i windowMs", () => {
    const key = `custom-${Math.random()}`;
    const opts = { max: 2, windowMs: 10 * 60 * 1000 };
    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(false);
  });

  it("custom prozor se resetuje posle isteka", () => {
    vi.useFakeTimers();
    const key = `window-${Math.random()}`;
    const opts = { max: 1, windowMs: 10 * 60 * 1000 };
    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(false);
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(rateLimit(key, opts).allowed).toBe(true);
  });

  it("različiti ključevi imaju odvojene brojače", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    const opts = { max: 1, windowMs: 60_000 };
    expect(rateLimit(a, opts).allowed).toBe(true);
    expect(rateLimit(b, opts).allowed).toBe(true);
  });
});
