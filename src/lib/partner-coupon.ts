// src/lib/partner-coupon.ts
// Zajednička logika za kupon saradnika: validacija unosa iz admin forme i upis.
// Koriste je POST /api/admin/saradnici (novi saradnik + kod) i
// POST /api/admin/saradnici/[id]/kuponi (dodatni kod postojećem).
import type { SupabaseClient } from "@supabase/supabase-js";
import { krajDanaBeograd } from "@/lib/belgrade-date";

export interface KuponInput {
  code: string;
  percent: number;
  courseId: string;
  expiresDate: string | null; // YYYY-MM-DD ili null
}

/** Vrati očišćen unos kupona ili poruku greške. */
export function parseKuponInput(body: Record<string, unknown>): { ok: true; value: KuponInput } | { ok: false; error: string } {
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,30}$/.test(code)) return { ok: false, error: "Kod: 2-30 znakova, slova, cifre i crtica." };
  const percent = Math.round(Number(body.percent));
  if (!Number.isFinite(percent) || percent < 1 || percent > 100) return { ok: false, error: "Popust mora biti 1-100%." };
  const courseId = String(body.courseId ?? "").trim();
  if (!courseId) return { ok: false, error: "Proizvod je obavezan." };
  const raw = String(body.expiresDate ?? "").trim();
  if (raw && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { ok: false, error: "Datum nije validan." };
  return { ok: true, value: { code, percent, courseId, expiresDate: raw || null } };
}

/** Upiši kupon saradnika. Vraća grešku ako kod postoji ili upis padne, inače null. */
export async function insertPartnerCoupon(admin: SupabaseClient, partnerId: string, k: KuponInput): Promise<{ error: string; status: number } | null> {
  const { error } = await admin.from("coupons").insert({
    code: k.code,
    discount_type: "percent",
    amount: k.percent,
    applies_to_course_id: k.courseId,
    expires_at: k.expiresDate ? krajDanaBeograd(k.expiresDate) : null,
    is_active: true,
    partner_id: partnerId,
  });
  if (!error) return null;
  if (error.code === "23505") return { error: "Kupon sa tim kodom već postoji.", status: 409 };
  return { error: error.message, status: 500 };
}
