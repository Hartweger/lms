import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeAdmin } from "@/lib/test/fake-admin";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof import("./test/fake-admin").createFakeAdmin>,
  sentry: { captureException: vi.fn() },
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.admin }));
vi.mock("@sentry/nextjs", () => h.sentry);
vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: vi.fn(async () => {}),
  sendGrupniWelcomeEmail: vi.fn(async () => {}),
  sendProfNewStudentEmail: vi.fn(async () => {}),
  sendIndividualWelcomeEmail: vi.fn(async () => {}),
  sendProfNewIndividualStudentEmail: vi.fn(async () => {}),
}));
vi.mock("@/lib/gas", () => ({ callGas: vi.fn(async () => ({})) }));
vi.mock("@/lib/ga4-mp", () => ({ sendGa4Purchase: vi.fn(async () => {}) }));
vi.mock("@/lib/meta-capi", () => ({ sendPurchaseEvent: vi.fn(async () => false) }));
vi.mock("@/lib/login-link", () => ({ createLoginLinkToken: vi.fn(() => "tok") }));
vi.mock("@/lib/first-lesson", () => ({ firstLessonForCourses: vi.fn(async () => null) }));

import { grantAccessForOrder } from "./grant-access";
import { sendWelcomeEmail, sendIndividualWelcomeEmail } from "@/lib/email";

function videoOrder(over: Record<string, unknown> = {}) {
  return {
    id: "o1",
    order_number: 1001,
    payment_status: "pending",
    granted: false,
    user_id: "u1",
    email: "kupac@example.com",
    full_name: "Test Kupac",
    items: [{ course_id: "c-prod", course_slug: "video-osnove", title: "Video kurs", price: 4800 }],
    meta_purchase_sent: false,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("grantAccessForOrder", () => {
  it("dodeljuje pristup, markira completed+granted i šalje welcome (happy path)", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder()],
      course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-content" }],
    });

    const res = await grantAccessForOrder("o1");

    expect(res.ok).toBe(true);
    const access = h.fake.row("course_access", (r) => r.user_id === "u1" && r.course_id === "c-content");
    expect(access).toBeTruthy();
    expect(access!.source).toBe("order:1001");
    const order = h.fake.row("orders", (r) => r.id === "o1")!;
    expect(order.payment_status).toBe("completed");
    expect(order.granted).toBe(true);
    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);
  });

  it("NE markira order completed kad insert u course_access padne (vraća ok:false + Sentry)", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder()],
      course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-content" }],
    });
    h.fake.failInsert("course_access", "RLS: nije dozvoljeno");

    const res = await grantAccessForOrder("o1");

    expect(res.ok).toBe(false);
    const order = h.fake.row("orders", (r) => r.id === "o1")!;
    expect(order.payment_status).toBe("pending"); // ostaje pending → reconcile cron će ponoviti
    expect(order.granted).toBe(false);
    expect(h.sentry.captureException).toHaveBeenCalled();
    expect(sendWelcomeEmail).not.toHaveBeenCalled(); // ne obećavaj kupcu pristup koji nije upisan
  });

  it("individualni tok pao (best-effort) → Sentry, ali order ipak completed", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder({
        items: [{ course_id: "c-ind", course_slug: "individualni-b1", title: "1:1 B1", price: 30000, professor_id: "prof-1", package_lessons: 8 }],
      })],
      course_unlocks: [],
      user_profiles: [{ id: "prof-1", full_name: "Prof", email: "prof@example.com" }],
    });
    (sendIndividualWelcomeEmail as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Resend pao"));

    const res = await grantAccessForOrder("o1");

    expect(res.ok).toBe(true); // best-effort: 1:1 mejl ne sme da obori dodelu pristupa
    expect(h.fake.row("orders", (r) => r.id === "o1")!.payment_status).toBe("completed");
    expect(h.sentry.captureException).toHaveBeenCalled(); // ...ali pad mora da se VIDI
  });

  it("obnova: postojeći course_access (npr. wp-migracija) se PRODUŽAVA na +1g od kupovine", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder()],
      course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-content" }],
      course_access: [{
        id: "ca1", user_id: "u1", course_id: "c-content",
        expires_at: "2026-07-05T15:01:29+00:00", source: "wp-migration-2026-06",
      }],
    });

    const res = await grantAccessForOrder("o1");

    expect(res.ok).toBe(true);
    const access = h.fake.row("course_access", (r) => r.id === "ca1")!;
    expect(new Date(access.expires_at as string).getTime())
      .toBeGreaterThan(Date.now() + 360 * 24 * 3600 * 1000); // ~1 godina od sada
    expect(access.source).toBe("order:1001");
    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);
  });

  it("obnova NE skraćuje: postojeći rok duži od +1g ostaje netaknut", async () => {
    const daleko = "2099-01-01T00:00:00+00:00";
    h.fake = createFakeAdmin({
      orders: [videoOrder()],
      course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-content" }],
      course_access: [{
        id: "ca1", user_id: "u1", course_id: "c-content",
        expires_at: daleko, source: "poklon",
      }],
    });

    const res = await grantAccessForOrder("o1");

    expect(res.ok).toBe(true);
    const access = h.fake.row("course_access", (r) => r.id === "ca1")!;
    expect(access.expires_at).toBe(daleko);
    expect(access.source).toBe("poklon");
  });

  it("idempotentno: već completed order ne dobija ni insert ni mejl", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder({ payment_status: "completed", granted: true })],
      course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-content" }],
    });

    const res = await grantAccessForOrder("o1");

    expect(res.ok).toBe(true);
    expect(h.fake.row("course_access", () => true)).toBeUndefined();
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });
});
