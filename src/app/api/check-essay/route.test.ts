import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  user: null as { id: string } | null,
  allowed: true,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: h.user } }) },
  }),
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => ({ allowed: h.allowed, remaining: 1 }) }));

import { POST } from "./route";

function essayRequest(body: Record<string, unknown> = { text: "Ich heiße Ana.", task: "Stell dich vor" }): Request {
  return new Request("https://test.local/api/check-essay", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  h.user = null;
  h.allowed = true;
  delete process.env.ANTHROPIC_API_KEY;
});

describe("POST /api/check-essay", () => {
  it("odjavljen korisnik → 401, bez trošenja AI tokena", async () => {
    const res = await POST(essayRequest());
    expect(res.status).toBe(401);
  });

  it("ulogovan korisnik → prolazi auth (fallback 200 bez API ključa)", async () => {
    h.user = { id: "u1" };
    const res = await POST(essayRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.feedback).toContain("nije dostupna");
  });

  it("rate limit → 429 i za ulogovane", async () => {
    h.user = { id: "u1" };
    h.allowed = false;
    const res = await POST(essayRequest());
    expect(res.status).toBe(429);
  });
});
