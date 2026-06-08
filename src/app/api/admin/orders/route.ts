import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantAccessForOrder } from "@/lib/grant-access";
import { fiscalizeOrder } from "@/lib/fiscomm";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data: orders, error } = await admin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  // Admin auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { email, courseId, totalAmount, paymentMethod, markAsPaid } = await request.json();

    // Validate required fields
    if (!email || !courseId || !totalAmount || !paymentMethod) {
      return NextResponse.json(
        { error: "Sva polja su obavezna." },
        { status: 400 }
      );
    }

    // Load course by ID
    const { data: course, error: courseError } = await admin
      .from("courses")
      .select("id, slug, title, price")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Kurs nije pronađen." }, { status: 404 });
    }

    // Find or create user by email
    let userId: string;
    let userName: string;

    const { data: existingProfile } = await admin
      .from("user_profiles")
      .select("id, full_name")
      .eq("email", email.toLowerCase())
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
      userName = existingProfile.full_name ?? email;
      console.log(`[admin/orders] Existing user: ${email} (${userId})`);
    } else {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        console.error(`[admin/orders] Failed to create user ${email}:`, createError);
        return NextResponse.json(
          { error: "Greška pri kreiranju naloga." },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
      userName = email;
      console.log(`[admin/orders] Created new user: ${email} (${userId})`);

      await admin.from("user_profiles").upsert({
        id: userId,
        email,
        full_name: email,
        role: "student",
      });
    }

    // Generate order number
    const { generateOrderNumber } = await import("@/lib/order-utils");
    const orderNumber = await generateOrderNumber();

    // Build items
    const items = [
      {
        course_id: course.id,
        course_slug: course.slug,
        title: course.title,
        price: totalAmount,
      },
    ];

    // Create order as pending; grantAccessForOrder ga prebacuje u completed.
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: userId,
        email,
        full_name: userName,
        items,
        subtotal: totalAmount,
        total: totalAmount,
        payment_method: paymentMethod,
        order_number: orderNumber,
        payment_status: "pending",
        granted: false,
      })
      .select("*")
      .single();

    if (orderError || !order) {
      console.error("[admin/orders] Failed to insert order:", orderError);
      return NextResponse.json(
        { error: "Greška pri kreiranju narudžbine." },
        { status: 500 }
      );
    }

    console.log(`[admin/orders] Created order ${order.order_number} for ${email}`);

    // markAsPaid → isti tok kao "Potvrdi uplatu": course_unlocks → pristup (svi vezani kursevi),
    // welcome mejl, pa fiskalizacija. Bez ovoga je ručna narudžbina davala pristup samo "ljušturi"
    // proizvoda i nikad se nije fiskalizovala.
    if (markAsPaid) {
      const result = await grantAccessForOrder(order.id);
      if (!result.ok) {
        console.error(`[admin/orders] grantAccessForOrder failed for ${order.order_number}: ${result.error}`);
        return NextResponse.json(
          { error: result.error ?? "Greška pri dodeli pristupa." },
          { status: 500 }
        );
      }
      await fiscalizeOrder(order.id); // idempotentno; ne blokira pristup ako padne
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("[admin/orders] Error:", error);
    return NextResponse.json({ error: "Greška na serveru." }, { status: 500 });
  }
}
