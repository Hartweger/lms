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
    const productIds = (order.line_items || []).map(
      (item: { product_id: number }) => item.product_id
    );

    if (!email) {
      console.log(`[wc-webhook] No email in order ${order.id}`);
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    console.log(
      `[wc-webhook] Processing order ${order.id}: ${email}, products: ${productIds}`
    );

    const result = await grantAccess(email, fullName, productIds);

    console.log(`[wc-webhook] Result for ${email}:`, result);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[wc-webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
