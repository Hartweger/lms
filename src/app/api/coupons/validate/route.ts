import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailOwnsCourse, emailOwnsAnyVideoCourse } from "@/lib/coupon-ownership";

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

  // video_only: kupon važi samo na video kurseve (course_type='video').
  if (coupon.video_only && courseSlug) {
    const { data: course } = await supabase
      .from("courses").select("course_type").eq("slug", courseSlug).maybeSingle();
    if (course && course.course_type !== "video") {
      return NextResponse.json(
        { error: "Ovaj kod važi samo za video kurseve." },
        { status: 400 }
      );
    }
  }

  // once_per_email: isti mejl može da iskoristi kod samo jednom.
  if (coupon.once_per_email && email) {
    const { data: prior } = await supabase
      .from("orders")
      .select("id")
      .eq("coupon_code", coupon.code)
      .ilike("email", email)
      .limit(1);
    if (prior && prior.length) {
      return NextResponse.json(
        { error: "Ovaj kod si već iskoristio/la." },
        { status: 400 }
      );
    }
  }

  // new_customers_only: samo za mejlove koji još nemaju nijedan video kurs (npr. NAKI10).
  if (coupon.new_customers_only && email && (await emailOwnsAnyVideoCourse(supabase, email))) {
    return NextResponse.json(
      { error: "Ovaj kod važi samo za prvu kupovinu video kursa." },
      { status: 400 }
    );
  }

  // renewal_only: važi samo za obnovu kursa koji polaznik već poseduje (po mejlu).
  if (coupon.renewal_only) {
    if (!email) {
      return NextResponse.json(
        { error: "Unesi svoj mejl iznad pa primeni kod - ovaj kod važi za obnovu tvog kursa." },
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

  // applies_to_course_id: kupon se sme iskoristiti samo na tačno taj kurs
  // (npr. FSP1NA1 važi samo na individualni FSP, ne na bilo koji 1:1 kurs).
  if (coupon.applies_to_course_id) {
    const { data: course } = await supabase
      .from("courses").select("id").eq("slug", courseSlug).maybeSingle();
    if (!course || course.id !== coupon.applies_to_course_id) {
      return NextResponse.json(
        { error: "Ovaj kod važi samo za individualni FSP kurs." },
        { status: 400 }
      );
    }
  }

  // requires_course_id: kupon važi samo ako mejl već poseduje taj kurs
  // (npr. FSP1NA1: mora da imaš kupljen video FSP).
  if (coupon.requires_course_id) {
    if (!email) {
      return NextResponse.json(
        { error: "Unesi svoj mejl iznad pa primeni kod - proveravamo da li imaš video FSP kurs." },
        { status: 400 }
      );
    }
    const owns = await emailOwnsCourse(supabase, email, coupon.requires_course_id);
    if (!owns) {
      return NextResponse.json(
        { error: "Ovaj kod važi samo za polaznike koji su kupili video FSP kurs (na taj mejl)." },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({
    code: coupon.code,
    discountType: coupon.discount_type,
    amount: Number(coupon.amount),
  });
}
