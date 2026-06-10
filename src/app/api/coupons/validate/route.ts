import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailOwnsCourse } from "@/lib/coupon-ownership";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") ?? "").trim().toUpperCase();
  const courseSlug = (searchParams.get("courseSlug") ?? "").trim();
  const email = (searchParams.get("email") ?? "").trim();

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
    return NextResponse.json({ error: "Kupon je istekao." }, { status: 400 });
  }

  if (coupon.max_uses != null && coupon.usage_count >= coupon.max_uses) {
    return NextResponse.json(
      { error: "Kupon je iskorišćen maksimalan broj puta." },
      { status: 400 }
    );
  }

  // renewal_only: važi samo za obnovu kursa koji polaznik već poseduje (po mejlu).
  if (coupon.renewal_only) {
    if (!email) {
      return NextResponse.json(
        { error: "Unesi svoj mejl iznad pa primeni kod — ovaj kod važi za obnovu tvog kursa." },
        { status: 400 }
      );
    }
    const { data: course } = await supabase
      .from("courses").select("id").eq("slug", courseSlug).maybeSingle();
    const owns = course ? await emailOwnsCourse(supabase, email, course.id) : false;
    if (!owns) {
      return NextResponse.json(
        { error: "Ovaj kod važi samo za obnovu kursa koji već imaš (na mejl na koji je stigao podsetnik)." },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({
    code: coupon.code,
    discountPercent: Number(coupon.amount),
  });
}
