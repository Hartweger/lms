import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") ?? "").trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Kod je obavezan." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (error || !coupon) {
    return NextResponse.json(
      { error: "Kupon ne postoji ili nije aktivan." },
      { status: 404 }
    );
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Kupon je istekao." },
      { status: 400 }
    );
  }

  if (coupon.max_uses != null && coupon.usage_count >= coupon.max_uses) {
    return NextResponse.json(
      { error: "Kupon je iskorišćen maksimalan broj puta." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    code: coupon.code,
    discountPercent: Number(coupon.amount),
  });
}
