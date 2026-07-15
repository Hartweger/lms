import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  allowed: true,
  sendEmail: vi.fn(),
  upsertContact: vi.fn(),
  logInteraction: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: h.sendEmail };
  },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => ({ allowed: h.allowed, remaining: 1 }) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/crm/contacts", () => ({
  upsertContact: h.upsertContact,
  logInteraction: h.logInteraction,
}));

import { POST } from "./route";

function kontaktRequest(over: Record<string, unknown> = {}): Request {
  return new Request("https://test.local/api/kontakt", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify({
      name: "Ana Anić",
      email: "ana@example.com",
      category: "placanje",
      message: "Zanima me kako da platim kurs na rate.",
      ...over,
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.allowed = true;
  h.sendEmail.mockResolvedValue({ data: { id: "email-1" }, error: null });
  h.upsertContact.mockResolvedValue("contact-1");
  process.env.RESEND_API_KEY = "re_test";
});

describe("POST /api/kontakt", () => {
  it("normalna poruka → 200, mejl poslat i CRM upisan", async () => {
    const res = await POST(kontaktRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(h.sendEmail).toHaveBeenCalledTimes(1);
    expect(h.upsertContact).toHaveBeenCalledTimes(1);
  });

  it("rate limit → 429, mejl se ne šalje", async () => {
    h.allowed = false;

    const res = await POST(kontaktRequest());

    expect(res.status).toBe(429);
    expect(h.sendEmail).not.toHaveBeenCalled();
    expect(h.upsertContact).not.toHaveBeenCalled();
  });

  it("popunjen honeypot → lažni 200, ali ni mejl ni CRM", async () => {
    const res = await POST(kontaktRequest({ website: "http://spam.example" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(h.sendEmail).not.toHaveBeenCalled();
    expect(h.upsertContact).not.toHaveBeenCalled();
    expect(h.logInteraction).not.toHaveBeenCalled();
  });

  it("neispravan email → 400", async () => {
    const res = await POST(kontaktRequest({ email: "nije-mejl" }));

    expect(res.status).toBe(400);
    expect(h.sendEmail).not.toHaveBeenCalled();
  });

  it("nepoznata kategorija → 400", async () => {
    const res = await POST(kontaktRequest({ category: "JepbvshJuXxQQZLFKHxCvq" }));

    expect(res.status).toBe(400);
    expect(h.sendEmail).not.toHaveBeenCalled();
  });

  it("predugačka poruka → 400", async () => {
    const res = await POST(kontaktRequest({ message: "a".repeat(5001) }));

    expect(res.status).toBe(400);
    expect(h.sendEmail).not.toHaveBeenCalled();
  });

  it("predugačko ime → 400", async () => {
    const res = await POST(kontaktRequest({ name: "a".repeat(201) }));

    expect(res.status).toBe(400);
    expect(h.sendEmail).not.toHaveBeenCalled();
  });

  it("prazna polja → 400", async () => {
    const res = await POST(kontaktRequest({ message: "" }));

    expect(res.status).toBe(400);
    expect(h.sendEmail).not.toHaveBeenCalled();
  });
});
