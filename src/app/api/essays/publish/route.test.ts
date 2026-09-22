import { describe, it, expect, vi, beforeEach } from "vitest";

type Row = Record<string, unknown>;

const h = vi.hoisted(() => ({
  user: { id: "prof1" } as { id: string } | null,
  role: "professor" as string,
  essay: {} as Row,
  updates: [] as Row[],
  emails: [] as Row[],
  certChecks: 0,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: h.user } }) },
  }),
}));

// Minimalni lažni service-role klijent: lanac metoda se pamti, a odgovor zavisi od tabele.
vi.mock("@/lib/supabase/admin", () => {
  const resolve = (table: string, op: string, cols: string, payload?: Row) => {
    if (table === "user_profiles" && cols.includes("role")) return { data: { role: h.role }, error: null };
    if (table === "user_profiles") return { data: { full_name: "Ana Anić", email: "ana@test.local" }, error: null };
    if (table === "essay_submissions" && op === "update") {
      h.updates.push(payload ?? {});
      return { data: null, error: null };
    }
    if (table === "essay_submissions") return { data: h.essay, error: null };
    if (table === "exercise_questions") return { data: { options: { maxPoints: 5 } }, error: null };
    if (table === "professor_students") return { data: { id: "link1" }, error: null };
    return { data: null, error: null };
  };
  const builder = (table: string) => {
    let op = "select";
    let cols = "";
    let payload: Row | undefined;
    const b: Record<string, unknown> = {};
    const chain = () => b;
    b.select = (c = "") => { cols = c; return b; };
    b.update = (p: Row) => { op = "update"; payload = p; return b; };
    b.eq = chain; b.in = chain; b.limit = chain; b.order = chain;
    b.single = async () => resolve(table, op, cols, payload);
    b.maybeSingle = async () => resolve(table, op, cols, payload);
    b.then = (ok: (v: unknown) => unknown) => Promise.resolve(resolve(table, op, cols, payload)).then(ok);
    return b;
  };
  return { createAdminClient: () => ({ from: builder }) };
});

vi.mock("@/lib/email", () => ({
  sendEssayFeedbackEmail: async (o: Row) => { h.emails.push(o); },
}));
vi.mock("@/lib/certificate-check", () => ({
  checkAndIssueCertificate: async () => { h.certChecks++; return { eligible: false }; },
}));

import { POST } from "./route";

const publishedEssay = (): Row => ({
  id: "e1",
  status: "published",
  user_id: "s1",
  lesson_id: "l1",
  exercise_id: "x1",
  professor_feedback: "Dobro, ali pazi na članove.",
  professor_score: 3,
  ai_corrections: [{ original: "der Haus", corrected: "das Haus", explanation: "" }],
  lessons: { title: "Lektion 5", course_id: "c1" },
});

function req(body: Row): Request {
  return new Request("https://test.local/api/essays/publish", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  h.user = { id: "prof1" };
  h.role = "professor";
  h.essay = publishedEssay();
  h.updates = [];
  h.emails = [];
  h.certChecks = 0;
});

describe("POST /api/essays/publish - izmena posle objave", () => {
  it("objavljen rad: izmenjen komentar se upiše, učenik dobije mejl označen kao izmena", async () => {
    const res = await POST(req({ essayId: "e1", professorFeedback: "Odlično, članovi su sada tačni.", professorScore: 4 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, updated: true });
    expect(h.updates).toHaveLength(1);
    expect(h.updates[0]).toMatchObject({ professor_feedback: "Odlično, članovi su sada tačni.", professor_score: 4, status: "published" });
    expect(h.emails).toHaveLength(1);
    expect(h.emails[0]).toMatchObject({ to: "ana@test.local", score: 4, updated: true });
    expect(h.certChecks).toBe(1);
  });

  it("objavljen rad: samo ispravke izmenjene → takođe upis + mejl", async () => {
    const res = await POST(req({
      essayId: "e1",
      professorFeedback: "Dobro, ali pazi na članove.",
      professorScore: 3,
      corrections: [{ original: "der Haus", corrected: "das Haus", explanation: "Haus je srednjeg roda" }],
    }));
    expect(res.status).toBe(200);
    expect(h.updates).toHaveLength(1);
    expect(h.emails).toHaveLength(1);
  });

  it("objavljen rad bez ikakve promene → ništa se ne upisuje i mejl se NE šalje", async () => {
    const res = await POST(req({
      essayId: "e1",
      professorFeedback: "Dobro, ali pazi na članove.",
      professorScore: 3,
      corrections: [{ original: "der Haus", corrected: "das Haus", explanation: "" }],
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, unchanged: true });
    expect(h.updates).toHaveLength(0);
    expect(h.emails).toHaveLength(0);
    expect(h.certChecks).toBe(0);
  });

  it("prva objava (pending) → upis + običan mejl, bez oznake izmene", async () => {
    h.essay = { ...publishedEssay(), status: "pending", professor_feedback: null, professor_score: null };
    const res = await POST(req({ essayId: "e1", professorFeedback: "Bravo!", professorScore: 5 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(h.updates).toHaveLength(1);
    expect(h.emails).toHaveLength(1);
    expect(h.emails[0]).toMatchObject({ score: 5, updated: false });
  });

  it("odjavljen → 403", async () => {
    h.user = null;
    const res = await POST(req({ essayId: "e1", professorFeedback: "x", professorScore: 3 }));
    expect(res.status).toBe(403);
  });
});
