import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  user: null as { id: string } | null,
  role: null as string | null,
  roleError: null as { message: string } | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: h.user } }) },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () =>
            h.roleError
              ? { data: null, error: h.roleError }
              : { data: h.role === null ? null : { role: h.role }, error: null },
        }),
      }),
    }),
  }),
}));

import { requireAdmin, requireProfessorOrAdmin } from "./api-auth";

beforeEach(() => {
  h.user = null;
  h.role = null;
  h.roleError = null;
});

describe("requireAdmin", () => {
  it("odjavljen → 403", async () => {
    const auth = await requireAdmin();
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.response.status).toBe(403);
  });

  it("ulogovan bez admin role → 403", async () => {
    h.user = { id: "u1" };
    h.role = "professor";
    const auth = await requireAdmin();
    expect(auth.ok).toBe(false);
  });

  it("admin → ok sa user + admin klijentom", async () => {
    h.user = { id: "u1" };
    h.role = "admin";
    const auth = await requireAdmin();
    expect(auth.ok).toBe(true);
    if (auth.ok) {
      expect(auth.user.id).toBe("u1");
      expect(auth.admin).toBeTruthy();
    }
  });

  it("greška pri čitanju profila → 403 (ne pušta dalje)", async () => {
    h.user = { id: "u1" };
    h.roleError = { message: "db down" };
    const auth = await requireAdmin();
    expect(auth.ok).toBe(false);
  });
});

describe("requireProfessorOrAdmin", () => {
  it("professor → ok", async () => {
    h.user = { id: "p1" };
    h.role = "professor";
    expect((await requireProfessorOrAdmin()).ok).toBe(true);
  });

  it("admin → ok", async () => {
    h.user = { id: "a1" };
    h.role = "admin";
    expect((await requireProfessorOrAdmin()).ok).toBe(true);
  });

  it("običan polaznik → 403", async () => {
    h.user = { id: "s1" };
    h.role = "student";
    expect((await requireProfessorOrAdmin()).ok).toBe(false);
  });
});
