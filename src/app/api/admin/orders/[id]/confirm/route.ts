import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";

interface OrderItem {
  course_id: string;
  course_slug: string;
  title: string;
  price: number;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  // Load the order
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (orderError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (order.payment_status === "completed") {
    return NextResponse.json({ error: "Order already completed" }, { status: 400 });
  }

  const items: OrderItem[] = order.items ?? [];
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  // Resolve each purchased product (a sales shell like grupni/individualni/paket)
  // to the actual content course(s) it unlocks via course_unlocks.
  const purchasedIds = items.map((i) => i.course_id);
  const { data: unlocks } = await admin
    .from("course_unlocks")
    .select("purchasable_course_id, content_course_id")
    .in("purchasable_course_id", purchasedIds);

  const contentCourseIds = new Set<string>();
  for (const item of items) {
    const mapped = (unlocks ?? []).filter(
      (u) => u.purchasable_course_id === item.course_id
    );
    if (mapped.length > 0) {
      mapped.forEach((u) => contentCourseIds.add(u.content_course_id));
    } else {
      // No unlock mapping — fall back to the purchased course itself so a paid
      // order never grants nothing. Log it so unmapped products get noticed.
      console.warn(`[confirm] No course_unlocks for ${item.course_slug} (${item.course_id}) — granting product itself`);
      contentCourseIds.add(item.course_id);
    }
  }

  // Grant course access for each resolved content course
  for (const courseId of contentCourseIds) {
    const { data: existing } = await admin
      .from("course_access")
      .select("id")
      .eq("user_id", order.user_id)
      .eq("course_id", courseId)
      .single();

    if (!existing) {
      await admin.from("course_access").insert({
        user_id: order.user_id,
        course_id: courseId,
        expires_at: expiresAt.toISOString(),
      });
    }
  }

  // Mark order as completed
  await admin
    .from("orders")
    .update({ payment_status: "completed", granted: true })
    .eq("id", id);

  // Send welcome email
  const courseTitles = items.map((item) => item.title);
  await sendWelcomeEmail(order.email, order.full_name, courseTitles);

  return NextResponse.json({ ok: true });
}
