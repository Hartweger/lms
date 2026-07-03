import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  sendSpy: vi.fn(),
  sentry: { captureException: vi.fn() },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: h.sendSpy };
  },
}));
vi.mock("@sentry/nextjs", () => h.sentry);

import { sendWelcomeEmail } from "./email";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = "test-key";
});

describe("email → Sentry (Resend ne baca izuzetke, vraća {error})", () => {
  it("Resend {error} rezultat → Sentry.captureException (do sada tiho progutano)", async () => {
    h.sendSpy.mockResolvedValue({ data: null, error: { message: "domain is not verified", name: "validation_error" } });

    await sendWelcomeEmail("kupac@example.com", "Test", ["Kurs X"]);

    expect(h.sentry.captureException).toHaveBeenCalledTimes(1);
    const err = h.sentry.captureException.mock.calls[0][0] as Error;
    expect(String(err.message)).toContain("domain is not verified");
  });

  it("Resend throw (mrežna greška) → Sentry.captureException, fn ne baca dalje", async () => {
    h.sendSpy.mockRejectedValue(new Error("fetch failed"));

    await expect(sendWelcomeEmail("kupac@example.com", "Test", ["Kurs X"])).resolves.not.toThrow();

    expect(h.sentry.captureException).toHaveBeenCalled();
  });

  it("uspešno slanje → bez Sentry poziva", async () => {
    h.sendSpy.mockResolvedValue({ data: { id: "em_1" }, error: null });

    await sendWelcomeEmail("kupac@example.com", "Test", ["Kurs X"]);

    expect(h.sentry.captureException).not.toHaveBeenCalled();
  });
});
