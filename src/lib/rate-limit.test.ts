import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: (...args: unknown[]) => ({ single: () => rpcMock(...args) }),
  }),
}));

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

describe("rateLimit (DB + in-memory fallback)", () => {
  beforeEach(() => {
    vi.resetModules();
    rpcMock.mockReset();
  });

  it("vraća odluku iz RPC-a kad baza radi", async () => {
    rpcMock.mockResolvedValue({ data: { allowed: true, remaining: 4 }, error: null });
    const { rateLimit } = await import("./rate-limit");

    const res = await rateLimit("test:1.2.3.4", { max: 5, windowMs: 60000 });
    expect(res).toEqual({ allowed: true, remaining: 4 });
    expect(rpcMock).toHaveBeenCalledWith("rate_limit_hit", {
      p_key: "test:1.2.3.4",
      p_max: 5,
      p_window_ms: 60000,
    });
  });

  it("podrazumevano šalje 10 zahteva u minuti", async () => {
    rpcMock.mockResolvedValue({ data: { allowed: true, remaining: 9 }, error: null });
    const { rateLimit } = await import("./rate-limit");

    await rateLimit("test:default");
    expect(rpcMock).toHaveBeenCalledWith("rate_limit_hit", {
      p_key: "test:default",
      p_max: 10,
      p_window_ms: 60000,
    });
  });

  it("blokira kad RPC kaže da je limit potrošen", async () => {
    rpcMock.mockResolvedValue({ data: { allowed: false, remaining: 0 }, error: null });
    const { rateLimit } = await import("./rate-limit");

    const res = await rateLimit("test:1.2.3.4");
    expect(res.allowed).toBe(false);
  });

  it("pada nazad na in-memory kad RPC vrati grešku i tamo broji", async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error("db down") });
    const { rateLimit } = await import("./rate-limit");

    expect((await rateLimit("fb:ip", { max: 2, windowMs: 60000 })).allowed).toBe(true);
    expect((await rateLimit("fb:ip", { max: 2, windowMs: 60000 })).allowed).toBe(true);
    expect((await rateLimit("fb:ip", { max: 2, windowMs: 60000 })).allowed).toBe(false);
  });

  it("pada nazad na in-memory i kad RPC baci (mreža)", async () => {
    rpcMock.mockRejectedValue(new Error("fetch failed"));
    const { rateLimit } = await import("./rate-limit");

    expect((await rateLimit("fb2:ip", { max: 1, windowMs: 60000 })).allowed).toBe(true);
    expect((await rateLimit("fb2:ip", { max: 1, windowMs: 60000 })).allowed).toBe(false);
  });

  it("in-memory fallback: različiti ključevi imaju odvojene brojače", async () => {
    rpcMock.mockRejectedValue(new Error("db down"));
    const { rateLimit } = await import("./rate-limit");

    expect((await rateLimit("a:ip", { max: 1, windowMs: 60000 })).allowed).toBe(true);
    expect((await rateLimit("b:ip", { max: 1, windowMs: 60000 })).allowed).toBe(true);
  });
});
