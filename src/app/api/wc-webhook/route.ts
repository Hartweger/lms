import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { grantAccess } from "@/lib/wc-sync";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-wc-webhook-signature") || "";
    const secret = process.env.WC_WEBHOOK_SECRET || "";

    // Validate HMAC signature
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("base64");

    if (signature !== expectedSig) {
      console.log("[wc-webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const order = JSON.parse(body);

    // WC sends a ping on webhook creation
    if (
      request.headers.get("x-wc-webhook-topic") ===
      "action.woocommerce.webhook_delivery"
    ) {
      console.log("[wc-webhook] Ping received");
      return NextResponse.json({ ok: true });
    }

    // Only process completed orders
    if (order.status !== "completed") {
      console.log(
        `[wc-webhook] Ignoring order ${order.id} with status: ${order.status}`
      );
      return NextResponse.json({ ok: true, skipped: true });
    }

    const email = order.billing?.email;
    const firstName = order.billing?.first_name || "";
    const lastName = order.billing?.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();

    // Extract product IDs and professor name from variations
    let professorName = "";
    const productIds: number[] = [];

    for (const item of order.line_items || []) {
      productIds.push(item.product_id);

      // Check meta_data for professor variation
      for (const meta of item.meta_data || []) {
        const key = (meta.key || "").toLowerCase();
        if (key.includes("profesor") || key.includes("teacher") || key.includes("nastavnik")) {
          professorName = meta.value || "";
        }
      }
    }

    if (!email) {
      console.log(`[wc-webhook] No email in order ${order.id}`);
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    console.log(
      `[wc-webhook] Processing order ${order.id}: ${email}, products: ${productIds}${professorName ? `, professor: ${professorName}` : ""}`
    );

    const result = await grantAccess(email, fullName, productIds);

    // Auto-assign professor if variation specified
    if (professorName && result.userId && result.coursesGranted.length > 0) {
      const { assignProfessor } = await import("@/lib/wc-sync");

      // Get course IDs for granted slugs
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminSupabase = createAdminClient();
      const courseIdsForAssign: string[] = [];

      for (const slug of result.coursesGranted) {
        const { data: course } = await adminSupabase
          .from("courses")
          .select("id")
          .eq("slug", slug)
          .single();
        if (course) courseIdsForAssign.push(course.id);
      }

      await assignProfessor(result.userId, courseIdsForAssign, professorName);
    }

    console.log(`[wc-webhook] Result for ${email}:`, result);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[wc-webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
