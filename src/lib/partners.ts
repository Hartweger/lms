// src/lib/partners.ts
// I/O za saradnike (afilijat kodovi): učitaj sve sa saldom, ili detalj jednog.
// Računica je u partner-balance.ts (čisto), ovde samo upiti.
import { createAdminClient } from "@/lib/supabase/admin";
import { computePartnerBalance, type PartnerBalance } from "@/lib/partner-balance";

export interface PartnerRow {
  id: string;
  name: string;
  email: string | null;
  fee_rsd: number;
  is_active: boolean;
  note: string | null;
  created_at: string;
}

export interface PartnerCode {
  id: string;
  code: string;
  amount: number;
  is_active: boolean;
  expires_at: string | null;
  usage_count: number;
  course_title: string | null;
}

export interface PartnerOrderRow {
  id: string;
  order_number: string | null;
  email: string;
  full_name: string;
  created_at: string;
  total: number;
  partner_fee: number | null;
  payment_status: string;
  product_title: string;
}

export interface PartnerPayoutRow {
  id: string;
  amount: number;
  paid_at: string;
  note: string | null;
}

export interface PartnerSummary extends PartnerRow, PartnerBalance {
  codes: PartnerCode[];
}

export interface PartnerDetail extends PartnerSummary {
  orders: PartnerOrderRow[];
  payouts: PartnerPayoutRow[];
}

type OrderRaw = {
  id: string; order_number: string | null; email: string; full_name: string; created_at: string;
  total: number; partner_fee: number | null; payment_status: string; partner_id: string;
  items: { title?: string }[] | null;
};

function mapOrder(o: OrderRaw): PartnerOrderRow {
  return {
    id: o.id, order_number: o.order_number, email: o.email, full_name: o.full_name,
    created_at: o.created_at, total: o.total, partner_fee: o.partner_fee,
    payment_status: o.payment_status, product_title: o.items?.[0]?.title ?? "-",
  };
}

type CouponRaw = {
  id: string; code: string; amount: number; is_active: boolean; expires_at: string | null;
  usage_count: number; partner_id: string; courses: { title: string } | null;
};

function mapCode(c: CouponRaw): PartnerCode {
  return {
    id: c.id, code: c.code, amount: Number(c.amount), is_active: c.is_active,
    expires_at: c.expires_at, usage_count: c.usage_count, course_title: c.courses?.title ?? null,
  };
}

const COUPON_SELECT = "id, code, amount, is_active, expires_at, usage_count, partner_id, courses:applies_to_course_id(title)";
const ORDER_SELECT = "id, order_number, email, full_name, created_at, total, partner_fee, payment_status, partner_id, items";

/** Svi saradnici sa kodovima i saldom. Aktivni prvi, pa po imenu. */
export async function loadPartnerSummaries(): Promise<PartnerSummary[]> {
  const admin = createAdminClient();
  const [pRes, cRes, oRes, payRes] = await Promise.all([
    admin.from("partners").select("*").order("is_active", { ascending: false }).order("name"),
    admin.from("coupons").select(COUPON_SELECT).not("partner_id", "is", null),
    admin.from("orders").select("payment_status, partner_fee, partner_id").not("partner_id", "is", null),
    admin.from("partner_payouts").select("partner_id, amount"),
  ]);
  if (pRes.error || cRes.error || oRes.error || payRes.error) {
    console.error("[partners] DB greška:", pRes.error ?? cRes.error ?? oRes.error ?? payRes.error);
  }
  const partners = (pRes.data ?? []) as PartnerRow[];
  const coupons = (cRes.data ?? []) as unknown as CouponRaw[];
  const orders = (oRes.data ?? []) as { payment_status: string; partner_fee: number | null; partner_id: string }[];
  const payouts = (payRes.data ?? []) as { partner_id: string; amount: number }[];

  return partners.map((p) => ({
    ...p,
    codes: coupons.filter((c) => c.partner_id === p.id).map(mapCode),
    ...computePartnerBalance(orders.filter((o) => o.partner_id === p.id), payouts.filter((x) => x.partner_id === p.id)),
  }));
}

/** Detalj jednog saradnika, ili null ako ne postoji. */
export async function loadPartnerDetail(id: string): Promise<PartnerDetail | null> {
  const admin = createAdminClient();
  const { data: partner, error } = await admin.from("partners").select("*").eq("id", id).maybeSingle();
  if (error || !partner) return null;
  const [cRes, oRes, payRes] = await Promise.all([
    admin.from("coupons").select(COUPON_SELECT).eq("partner_id", id).order("created_at"),
    admin.from("orders").select(ORDER_SELECT).eq("partner_id", id).order("created_at", { ascending: false }),
    admin.from("partner_payouts").select("id, amount, paid_at, note").eq("partner_id", id).order("paid_at", { ascending: false }),
  ]);
  const orders = ((oRes.data ?? []) as unknown as OrderRaw[]).map(mapOrder);
  const payouts = (payRes.data ?? []) as PartnerPayoutRow[];
  return {
    ...(partner as PartnerRow),
    codes: ((cRes.data ?? []) as unknown as CouponRaw[]).map(mapCode),
    orders,
    payouts,
    ...computePartnerBalance(orders, payouts),
  };
}
