import "server-only";
import QRCode from "qrcode";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildIpsString } from "@/lib/order-utils";

// Generiše IPS QR (PNG) za uplatnicu i okači na Supabase Storage; vrati public URL (ili null).
export async function generateIpsQrUrl(
  admin: SupabaseClient,
  order: { total: number; order_number: string }
): Promise<string | null> {
  try {
    const ips = buildIpsString(order);
    const buf = await QRCode.toBuffer(ips, { width: 260, margin: 1, errorCorrectionLevel: "M" });
    const dest = `uplatnice/${order.order_number}.png`;
    const { error } = await admin.storage.from("blog-media").upload(dest, buf, {
      contentType: "image/png",
      upsert: true,
    });
    if (error) throw error;
    return admin.storage.from("blog-media").getPublicUrl(dest).data.publicUrl;
  } catch (e) {
    console.error("[ips-qr] generisanje palo:", e);
    return null;
  }
}
