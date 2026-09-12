import { describe, it, expect } from "vitest";
import { computePartnerBalance } from "./partner-balance";

describe("computePartnerBalance", () => {
  it("prazno daje nule", () => {
    expect(computePartnerBalance([], [])).toEqual({ upisane: 0, pripada: 0, isplaceno: 0, saldo: 0 });
  });

  it("broji samo completed porudžbine", () => {
    const orders = [
      { payment_status: "completed", partner_fee: 5000 },
      { payment_status: "pending", partner_fee: 5000 },
      { payment_status: "refunded", partner_fee: 5000 },
    ];
    expect(computePartnerBalance(orders, [])).toEqual({ upisane: 1, pripada: 5000, isplaceno: 0, saldo: 5000 });
  });

  it("fee se čita sa porudžbine, pa promena iznosa ne dira stare prodaje", () => {
    const orders = [
      { payment_status: "completed", partner_fee: 5000 },
      { payment_status: "completed", partner_fee: 6000 },
    ];
    expect(computePartnerBalance(orders, []).pripada).toBe(11000);
  });

  it("porudžbina bez partner_fee (null) se broji kao upisana ali sa 0", () => {
    const orders = [{ payment_status: "completed", partner_fee: null }];
    expect(computePartnerBalance(orders, [])).toEqual({ upisane: 1, pripada: 0, isplaceno: 0, saldo: 0 });
  });

  it("isplate se oduzimaju, negativan saldo je dozvoljen", () => {
    const orders = [{ payment_status: "completed", partner_fee: 5000 }];
    const payouts = [{ amount: 4000 }, { amount: 3000 }];
    expect(computePartnerBalance(orders, payouts)).toEqual({ upisane: 1, pripada: 5000, isplaceno: 7000, saldo: -2000 });
  });
});
