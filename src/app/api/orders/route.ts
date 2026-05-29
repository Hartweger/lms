import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderNumber, calculatePaypalEur } from "@/lib/order-utils";
import { sendPaymentInstructionsEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { fullName, email, country, courseSlug, paymentMethod, couponCode: rawCouponCode } =
      await request.json();

    // Validate required fields
    if (!fullName || !email || !country || !courseSlug || !paymentMethod) {
      return NextResponse.json(
        { error: "Sva polja su obavezna." },
        { status: 400 }
      );
    }

    if (paymentMethod !== "uplatnica" && paymentMethod !== "paypal") {
      return NextResponse.json(
        { error: "Neispravna metoda plaćanja." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Load course by slug where is_purchasable = true
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, slug, title, price")
      .eq("slug", courseSlug)
      .eq("is_purchasable", true)
      .single();

    if (courseError || !course) {
      console.log(`[orders] Course not found or not purchasable: ${courseSlug}`);
      return NextResponse.json(
        { error: "Kurs nije dostupan za kupovinu." },
        { status: 404 }
      );
    }

    // Validate coupon if provided
    let discountPercent = 0;
    let validCouponCode: string | null = null;

    if (rawCouponCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", String(rawCouponCode).trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (coupon) {
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date();
        const notMaxed = coupon.max_uses === null || coupon.usage_count < coupon.max_uses;
        if (notExpired && notMaxed) {
          discountPercent = Number(coupon.amount);
          validCouponCode = coupon.code;
        }
      }
    }

    const discount = discountPercent > 0 ? Math.round(course.price * discountPercent / 100) : 0;
    const finalPrice = course.price - discount;

    // Find or create user by email
    let userId: string;

    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
      console.log(`[orders] Existing user: ${email} (${userId})`);
    } else {
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
        });

      if (createError || !newUser.user) {
        console.error(`[orders] Failed to create user ${email}:`, createError);
        return NextResponse.json(
          { error: "Greška pri kreiranju naloga. Pokušajte ponovo." },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
      console.log(`[orders] Created new user: ${email} (${userId})`);

      await supabase.from("user_profiles").upsert({
        id: userId,
        email,
        full_name: fullName,
        role: "student",
      });
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Calculate PayPal EUR price if needed
    const paypalEur =
      paymentMethod === "paypal"
        ? calculatePaypalEur(finalPrice)
        : undefined;

    // Build items JSONB
    const items = [
      {
        course_id: course.id,
        course_slug: course.slug,
        title: course.title,
        price: course.price,
      },
    ];

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        email,
        full_name: fullName,
        country,
        items,
        subtotal: course.price,
        discount,
        total: finalPrice,
        coupon_code: validCouponCode,
        payment_method: paymentMethod,
        order_number: orderNumber,
        paypal_note:
          paymentMethod === "paypal"
            ? `${paypalEur} EUR — paypal.me/natasahartweger1`
            : null,
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      console.error("[orders] Failed to insert order:", orderError);
      return NextResponse.json(
        { error: "Greška pri kreiranju narudžbine. Pokušajte ponovo." },
        { status: 500 }
      );
    }

    console.log(
      `[orders] Created order ${order.order_number} for ${email} — ${courseSlug} via ${paymentMethod}`
    );

    // Increment coupon usage count if coupon was applied
    if (validCouponCode) {
      const { data: coupon } = await supabase.from("coupons").select("usage_count").eq("code", validCouponCode).single();
      if (coupon) {
        await supabase.from("coupons").update({ usage_count: coupon.usage_count + 1 }).eq("code", validCouponCode);
      }
    }

    // Send payment instructions email
    await sendPaymentInstructionsEmail(
      email,
      fullName,
      course.title,
      order.order_number,
      finalPrice,
      paymentMethod,
      paypalEur
    );

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (error) {
    console.error("[orders] Error:", error);
    return NextResponse.json(
      { error: "Greška na serveru. Pokušajte ponovo." },
      { status: 500 }
    );
  }
}
