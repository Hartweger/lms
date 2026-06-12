import { describe, it, expect } from "vitest";
import { canDeleteOrder, orderTotals, orderFiscalStatus, pendingPaymentState, shouldSendRecovery, recoveryAction, uplataReminderAction } from "./order-utils";

describe("canDeleteOrder", () => {
  it("dozvoljava brisanje pending narudžbine koja nije dodeljena", () =>
    expect(canDeleteOrder({ payment_status: "pending", granted: false })).toBe(true));

  it("zabranjuje brisanje potvrđene narudžbine", () =>
    expect(canDeleteOrder({ payment_status: "completed", granted: true })).toBe(false));

  it("zabranjuje brisanje ako je pristup dodeljen iako je status pending", () =>
    expect(canDeleteOrder({ payment_status: "pending", granted: true })).toBe(false));

  it("zabranjuje brisanje ako je status completed a granted false (fiskalizovano može da postoji)", () =>
    expect(canDeleteOrder({ payment_status: "completed", granted: false })).toBe(false));
});

describe("orderTotals", () => {
  it("zbraja potvrđene i pending iznose odvojeno", () =>
    expect(
      orderTotals([
        { payment_status: "completed", total: 3500 },
        { payment_status: "completed", total: 1500 },
        { payment_status: "pending", total: 2000 },
      ])
    ).toEqual({ confirmed: 5000, pending: 2000 }));

  it("prazna lista daje nule", () =>
    expect(orderTotals([])).toEqual({ confirmed: 0, pending: 0 }));

  it("ignoriše ostale statuse (npr. refunded) u oba zbira", () =>
    expect(
      orderTotals([
        { payment_status: "refunded", total: 9999 },
        { payment_status: "completed", total: 100 },
      ])
    ).toEqual({ confirmed: 100, pending: 0 }));
});

describe("orderFiscalStatus", () => {
  it("pending narudžbina nema fiskalni status (računa još nema)", () =>
    expect(orderFiscalStatus({ payment_status: "pending", fiscalized_at: null })).toBe("na"));

  it("potvrđena + fiskalizovana je ok", () =>
    expect(
      orderFiscalStatus({ payment_status: "completed", fiscalized_at: "2026-06-07T10:00:00Z" })
    ).toBe("ok"));

  it("potvrđena bez fiskalizacije je missing (upozorenje)", () =>
    expect(orderFiscalStatus({ payment_status: "completed", fiscalized_at: null })).toBe("missing"));
});

describe("pendingPaymentState", () => {
  const NOW = new Date("2026-06-09T18:00:00Z").getTime();
  const card = (nestpay: string | null, createdAt: string) => ({
    payment_status: "pending",
    payment_method: "kartica",
    nestpay_status: nestpay,
    created_at: createdAt,
  });

  it("nije pending → null", () =>
    expect(pendingPaymentState({ ...card(null, "2026-06-09T10:00:00Z"), payment_status: "completed" }, NOW)).toBe(null));

  it("uplatnica pending → waiting (normalno čeka)", () =>
    expect(pendingPaymentState({ payment_status: "pending", payment_method: "uplatnica", nestpay_status: null, created_at: "2026-06-01T10:00:00Z" }, NOW)).toBe("waiting"));

  it("kartica koju je banka odbila → declined", () =>
    expect(pendingPaymentState(card("failed", "2026-06-09T17:00:00Z"), NOW)).toBe("declined"));

  it("kartica započeta a nezavršena (starija od 15 min, bez callback-a) → incomplete", () =>
    expect(pendingPaymentState(card(null, "2026-06-09T17:00:00Z"), NOW)).toBe("incomplete"));

  it("sveža kartica u toku (mlađa od 15 min) → waiting, ne diži alarm prerano", () =>
    expect(pendingPaymentState(card(null, "2026-06-09T17:55:00Z"), NOW)).toBe("waiting"));

  it("kartica naplaćena ali još bez granta → waiting (pristup samo što nije)", () =>
    expect(pendingPaymentState(card("charged", "2026-06-09T17:00:00Z"), NOW)).toBe("waiting"));

  it("kartica_rate se tretira isto kao kartica", () =>
    expect(pendingPaymentState({ ...card("failed", "2026-06-09T17:00:00Z"), payment_method: "kartica_rate" }, NOW)).toBe("declined"));
});

describe("shouldSendRecovery", () => {
  const cand = { order_number: "2026-030", created_at: "2026-06-09T14:35:00Z", payment_status: "pending", courseSlug: "ind-a1-2" };

  it("nema drugih narudžbina → šalji", () =>
    expect(shouldSendRecovery(cand, [])).toBe(true));

  it("prešao na uplatnicu za isti kurs (novija narudžbina) → NE šalji (slučaj Jelena Vrećo)", () =>
    expect(shouldSendRecovery(cand, [
      { order_number: "2026-032", created_at: "2026-06-09T14:36:00Z", payment_status: "pending", courseSlug: "ind-a1-2" },
    ])).toBe(false));

  it("već platio isti kurs na drugi način (completed) → NE šalji", () =>
    expect(shouldSendRecovery(cand, [
      { order_number: "2026-040", created_at: "2026-06-10T09:00:00Z", payment_status: "completed", courseSlug: "ind-a1-2" },
    ])).toBe(false));

  it("druga narudžbina je za DRUGI kurs → svejedno šalji za ovaj", () =>
    expect(shouldSendRecovery(cand, [
      { order_number: "2026-033", created_at: "2026-06-09T15:00:00Z", payment_status: "pending", courseSlug: "video-b1" },
    ])).toBe(true));

  it("starija napuštena narudžbina za isti kurs ne blokira (ovo je najnoviji pokušaj) → šalji", () =>
    expect(shouldSendRecovery(cand, [
      { order_number: "2026-010", created_at: "2026-06-08T10:00:00Z", payment_status: "pending", courseSlug: "ind-a1-2" },
    ])).toBe(true));
});

describe("recoveryAction", () => {
  const T0 = new Date("2026-06-09T12:00:00Z").getTime();
  const ord = (stage: number, createdAt: string) => ({ order_number: "2026-050", created_at: createdAt, recovery_stage: stage, courseSlug: "video-a1" });
  const at = (mins: number) => T0 + mins * 60000;
  const day = 1440;

  it("sveža (30 min) stage 0 → none (čeka 1h)", () =>
    expect(recoveryAction(ord(0, "2026-06-09T12:00:00Z"), [], at(30))).toBe("none"));

  it("posle 1h, stage 0 → mejl1", () =>
    expect(recoveryAction(ord(0, "2026-06-09T12:00:00Z"), [], at(75))).toBe("mejl1"));

  it("stage 1, posle 3 dana → mejl2", () =>
    expect(recoveryAction(ord(1, "2026-06-09T12:00:00Z"), [], at(3 * day + 5))).toBe("mejl2"));

  it("stage 1, tek 2 dana → none (još rano za 2. podsetnik)", () =>
    expect(recoveryAction(ord(1, "2026-06-09T12:00:00Z"), [], at(2 * day))).toBe("none"));

  it("stage 2, posle 7 dana → cancel (+ mejl)", () =>
    expect(recoveryAction(ord(2, "2026-06-09T12:00:00Z"), [], at(7 * day + 5))).toBe("cancel"));

  it("stage 3 (sve odrađeno) → none", () =>
    expect(recoveryAction(ord(3, "2026-06-09T12:00:00Z"), [], at(30 * day))).toBe("none"));

  it("superseded (prešao na uplatnicu) → nikad mejl; posle 7d tiho otkaži", () => {
    const others = [{ order_number: "2026-051", created_at: "2026-06-09T12:01:00Z", payment_status: "pending", courseSlug: "video-a1" }];
    expect(recoveryAction(ord(0, "2026-06-09T12:00:00Z"), others, at(75))).toBe("none");
    expect(recoveryAction(ord(0, "2026-06-09T12:00:00Z"), others, at(7 * day + 5))).toBe("cancel-silent");
  });
});

describe("uplataReminderAction", () => {
  const T0 = new Date("2026-06-09T12:00:00Z").getTime();
  const ord = (stage: number) => ({ order_number: "2026-060", created_at: "2026-06-09T12:00:00Z", recovery_stage: stage, courseSlug: "grupni-b1" });
  const atDays = (d: number) => T0 + d * 86400000;

  it("sveža (1 dan) stage 0 → none (uplata možda putuje)", () =>
    expect(uplataReminderAction(ord(0), [], atDays(1))).toBe("none"));

  it("posle 3 dana, stage 0 → mejl1", () =>
    expect(uplataReminderAction(ord(0), [], atDays(3.1))).toBe("mejl1"));

  it("stage 1, posle 8 dana → mejl2", () =>
    expect(uplataReminderAction(ord(1), [], atDays(8.1))).toBe("mejl2"));

  it("stage 1, tek 5 dana → none", () =>
    expect(uplataReminderAction(ord(1), [], atDays(5))).toBe("none"));

  it("stage 2 → none zauvek (NEMA automatskog otkazivanja)", () => {
    expect(uplataReminderAction(ord(2), [], atDays(30))).toBe("none");
    expect(uplataReminderAction(ord(2), [], atDays(365))).toBe("none");
  });

  it("platio isti kurs drugom narudžbinom → nikad mejl; posle 7d tiho otkaži", () => {
    const others = [{ order_number: "2026-061", created_at: "2026-06-08T10:00:00Z", payment_status: "completed", courseSlug: "grupni-b1" }];
    expect(uplataReminderAction(ord(0), others, atDays(3.1))).toBe("none");
    expect(uplataReminderAction(ord(0), others, atDays(7.1))).toBe("cancel-silent");
  });

  it("novija narudžbina za isti kurs (prešao na karticu) → tiho otkaži posle 7d", () => {
    const others = [{ order_number: "2026-062", created_at: "2026-06-10T09:00:00Z", payment_status: "pending", courseSlug: "grupni-b1" }];
    expect(uplataReminderAction(ord(0), others, atDays(3.1))).toBe("none");
    expect(uplataReminderAction(ord(0), others, atDays(7.1))).toBe("cancel-silent");
  });

  it("druga narudžbina za DRUGI kurs ne utiče → mejl1 normalno", () => {
    const others = [{ order_number: "2026-063", created_at: "2026-06-10T09:00:00Z", payment_status: "completed", courseSlug: "video-a1" }];
    expect(uplataReminderAction(ord(0), others, atDays(3.1))).toBe("mejl1");
  });
});

describe("uplataReminderAction — razmak između podsetnika", () => {
  const T0 = new Date("2026-06-09T12:00:00Z").getTime();
  const atDays = (d: number) => T0 + d * 86400000;

  it("zaostala narudžbina: mejl2 tek 4 dana posle mejl1, ne odmah sutradan", () => {
    const stara = {
      order_number: "2026-070", created_at: "2026-06-09T12:00:00Z", recovery_stage: 1,
      courseSlug: "grupni-b1", recovery_email_sent_at: new Date(atDays(10)).toISOString(),
    };
    expect(uplataReminderAction(stara, [], atDays(10.5))).toBe("none");
    expect(uplataReminderAction(stara, [], atDays(14.1))).toBe("mejl2");
  });
});
