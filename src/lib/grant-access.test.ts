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
  sendAcademyWelcomeEmail: vi.fn(async () => {}),
  sendSubscriptionChargeEmail: vi.fn(async () => {}),
}));
vi.mock("@/lib/gas", () => ({ callGas: vi.fn(async () => ({})) }));
vi.mock("@/lib/ga4-mp", () => ({ sendGa4Purchase: vi.fn(async () => {}) }));
vi.mock("@/lib/meta-capi", () => ({ sendPurchaseEvent: vi.fn(async () => false) }));
vi.mock("@/lib/login-link", () => ({ createLoginLinkToken: vi.fn(() => "tok") }));
vi.mock("@/lib/first-lesson", () => ({ firstLessonForCourses: vi.fn(async () => null) }));

import { grantAccessForOrder, revokeAccessForOrder } from "./grant-access";
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

  it("trka (dupli klik na Potvrdi uplatu): dva istovremena poziva šalju welcome samo JEDNOM", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder()],
      course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-content" }],
    });

    const [r1, r2] = await Promise.all([grantAccessForOrder("o1"), grantAccessForOrder("o1")]);

    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);
    expect([r1, r2].filter((r) => r.ok)).toHaveLength(1);
    expect([r1, r2].find((r) => !r.ok)!.error).toBe("grant-in-progress");
    expect(h.fake.row("orders", (r) => r.id === "o1")!.payment_status).toBe("completed");
  });

  it("svež lock (paralelni grant u toku): poziv ne šalje ništa i vraća grant-in-progress", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder({ grant_lock_at: new Date().toISOString() })],
      course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-content" }],
    });

    const res = await grantAccessForOrder("o1");

    expect(res.ok).toBe(false);
    expect(res.error).toBe("grant-in-progress");
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
    expect(h.fake.row("course_access", () => true)).toBeUndefined();
  });

  it("bajat lock (crash usred granta) NE blokira retry: grant prolazi normalno", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder({ grant_lock_at: new Date(Date.now() - 20 * 60_000).toISOString() })],
      course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-content" }],
    });

    const res = await grantAccessForOrder("o1");

    expect(res.ok).toBe(true);
    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(h.fake.row("orders", (r) => r.id === "o1")!.payment_status).toBe("completed");
  });

  it("pao grant (course_access insert) ČISTI lock, da reconcile cron može odmah da ponovi", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder()],
      course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-content" }],
    });
    h.fake.failInsert("course_access", "RLS: nije dozvoljeno");

    const res = await grantAccessForOrder("o1");

    expect(res.ok).toBe(false);
    expect(h.fake.row("orders", (r) => r.id === "o1")!.grant_lock_at).toBeNull();
  });

  it("kupon: usage_count se uvećava kad porudžbina postane completed", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder({ coupon_code: "NAKI10" })],
      course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-content" }],
      coupons: [{ code: "NAKI10", usage_count: 0 }],
    });

    const res = await grantAccessForOrder("o1");

    expect(res.ok).toBe(true);
    expect(h.fake.row("coupons", (r) => r.code === "NAKI10")!.usage_count).toBe(1);
  });

  it("kupon: pao grant (order ostaje pending) NE troši usage_count", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder({ coupon_code: "NAKI10" })],
      course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-content" }],
      coupons: [{ code: "NAKI10", usage_count: 0 }],
    });
    h.fake.failInsert("course_access", "RLS: nije dozvoljeno");

    const res = await grantAccessForOrder("o1");

    expect(res.ok).toBe(false);
    expect(h.fake.row("coupons", (r) => r.code === "NAKI10")!.usage_count).toBe(0);
  });

  it("kupon: već completed order (retry) NE uvećava usage_count ponovo", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder({ payment_status: "completed", granted: true, coupon_code: "NAKI10" })],
      course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-content" }],
      coupons: [{ code: "NAKI10", usage_count: 1 }],
    });

    const res = await grantAccessForOrder("o1");

    expect(res.ok).toBe(true);
    expect(h.fake.row("coupons", (r) => r.code === "NAKI10")!.usage_count).toBe(1);
  });

  it("bez kupona: tabela coupons se uopšte ne dira", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder()],
      course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-content" }],
      coupons: [{ code: "NAKI10", usage_count: 0 }],
    });

    const res = await grantAccessForOrder("o1");

    expect(res.ok).toBe(true);
    expect(h.fake.calls.some((c) => c.table === "coupons")).toBe(false);
  });

  // NH Academy Gen II poklanja članstvo, ali samo do kraja programa (16.12.2026).
  // Podrazumevana godina dana bi polaznici koja kupi u septembru dala biblioteku
  // do septembra 2027 - devet meseci preko dogovorenog.
  describe("Academy Gen II → rok članstva", () => {
    function academyOrder(over: Record<string, unknown> = {}) {
      return videoOrder({
        items: [{ course_id: "c-academy", course_slug: "nh-academy-gen2", title: "NH Academy - Generacija II", price: 57300 }],
        ...over,
      });
    }
    const academySetup = {
      course_unlocks: [{ purchasable_course_id: "c-academy", content_course_id: "c-clanstvo" }],
      courses: [{ id: "c-clanstvo", slug: "nh-clanstvo-sadrzaj" }],
    };

    it("biblioteka članstva ističe 16.12.2026, a ne godinu dana od kupovine", async () => {
      h.fake = createFakeAdmin({ orders: [academyOrder()], ...academySetup });

      const res = await grantAccessForOrder("o1");

      expect(res.ok).toBe(true);
      const access = h.fake.row("course_access", (r) => r.course_id === "c-clanstvo")!;
      expect(new Date(access.expires_at as string).toISOString()).toBe("2026-12-16T22:59:59.000Z");
    });

    it("ne skraćuje rok polaznici koja već plaća članstvo duže od 16.12.", async () => {
      h.fake = createFakeAdmin({
        orders: [academyOrder()],
        ...academySetup,
        course_access: [{ id: "ca1", user_id: "u1", course_id: "c-clanstvo", expires_at: "2027-06-01T00:00:00.000Z" }],
      });

      const res = await grantAccessForOrder("o1");

      expect(res.ok).toBe(true);
      expect(h.fake.row("course_access", (r) => r.id === "ca1")!.expires_at).toBe("2027-06-01T00:00:00.000Z");
    });

    it("porudžbina bez Academy stavke i dalje dobija podrazumevanu godinu dana", async () => {
      h.fake = createFakeAdmin({
        orders: [videoOrder()],
        course_unlocks: [{ purchasable_course_id: "c-prod", content_course_id: "c-clanstvo" }],
        courses: [{ id: "c-clanstvo", slug: "nh-clanstvo-sadrzaj" }],
      });

      const res = await grantAccessForOrder("o1");

      expect(res.ok).toBe(true);
      const access = h.fake.row("course_access", (r) => r.course_id === "c-clanstvo")!;
      const zaGodinu = new Date(); zaGodinu.setFullYear(zaGodinu.getFullYear() + 1);
      // Tolerancija od minut: rok se računa od new Date() u trenutku granta.
      expect(Math.abs(new Date(access.expires_at as string).getTime() - zaGodinu.getTime())).toBeLessThan(60_000);
    });
  });
});

describe("revokeAccessForOrder", () => {
  it("briše pristup dodeljen tom narudžbinom i vraća potrošeni kupon", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder({ payment_status: "completed", granted: true, coupon_code: "OBNOVI50" })],
      course_access: [
        { id: "ca1", user_id: "u1", course_id: "c-content", source: "order:1001" },
        // Drugi kurs, druga narudžbina - storno ga ne sme dirati.
        { id: "ca2", user_id: "u1", course_id: "c-drugi", source: "order:999" },
      ],
      coupons: [{ code: "OBNOVI50", usage_count: 3 }],
    });

    const res = await revokeAccessForOrder("o1");

    expect(res.ok).toBe(true);
    expect(res.skinuto.courseAccess).toBe(1);
    expect(h.fake.row("course_access", (r) => r.id === "ca1")).toBeUndefined();
    expect(h.fake.row("course_access", (r) => r.id === "ca2")).toBeTruthy();
    expect(h.fake.row("coupons", (r) => r.code === "OBNOVI50")!.usage_count).toBe(2);
  });

  it("otkazuje individualni upis vezan za tu narudžbinu", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder({ payment_status: "completed", granted: true })],
      individual_enrollments: [
        { id: "ie1", order_id: "o1", course_id: "c-prod", status: "active" },
        { id: "ie2", order_id: "o2", course_id: "c-prod", status: "active" },
      ],
    });

    const res = await revokeAccessForOrder("o1");

    expect(res.ok).toBe(true);
    expect(res.skinuto.individualni).toBe(1);
    expect(h.fake.row("individual_enrollments", (r) => r.id === "ie1")!.status).toBe("cancelled");
    expect(h.fake.row("individual_enrollments", (r) => r.id === "ie2")!.status).toBe("active");
  });

  it("otkazuje grupni upis po nivou i traži ručno skidanje sa kalendara", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder({
        payment_status: "completed",
        granted: true,
        items: [{ course_id: "c-grupni", course_slug: "grupni-kurs-nemackog-jezika-a1-1", title: "Grupni A1.1", price: 19600 }],
      })],
      groups: [{ id: "g1", level: "A1.1" }],
      group_enrollments: [{ id: "ge1", group_id: "g1", user_id: "u1", status: "active" }],
    });

    const res = await revokeAccessForOrder("o1");

    expect(res.ok).toBe(true);
    expect(res.skinuto.grupni).toBe(1);
    expect(h.fake.row("group_enrollments", (r) => r.id === "ge1")!.status).toBe("cancelled");
    expect(res.napomene.some((n) => n.includes("kalendara"))).toBe(true);
  });

  it("idempotentan je - drugi poziv ne skida ništa i ne vraća kupon dvaput", async () => {
    h.fake = createFakeAdmin({
      orders: [videoOrder({ payment_status: "completed", granted: true, coupon_code: "OBNOVI50" })],
      course_access: [{ id: "ca1", user_id: "u1", course_id: "c-content", source: "order:1001" }],
      coupons: [{ code: "OBNOVI50", usage_count: 1 }],
    });

    await revokeAccessForOrder("o1");
    const drugi = await revokeAccessForOrder("o1");

    expect(drugi.ok).toBe(true);
    expect(drugi.skinuto.courseAccess).toBe(0);
    // Brojač je već na nuli - storno ga ne sme oterati u minus.
    expect(h.fake.row("coupons", (r) => r.code === "OBNOVI50")!.usage_count).toBe(0);
  });
});
