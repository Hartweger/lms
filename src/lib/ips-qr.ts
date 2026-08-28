import "server-only";
import QRCode from "qrcode";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BANK_FIRME, buildIpsString } from "@/lib/order-utils";

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

interface DokumentQr {
  total: number;
  broj: string;
  tip: "predracun" | "faktura";
}

/** IPS string za dokument firme - uvek na račun firme, sa brojem dokumenta kao pozivom. */
function dokumentIps(d: DokumentQr): string {
  const naziv = d.tip === "predracun" ? "predracunu" : "fakturi";
  return buildIpsString(
    { total: d.total, order_number: d.broj },
    { poziv: d.broj, svrha: `Placanje po ${naziv} ${d.broj}`, racun: BANK_FIRME.racun },
  );
}

/** IPS QR kao PNG bafer, za ugradnju u PDF predračuna ili fakture. */
export async function ipsQrBuffer(d: DokumentQr): Promise<Buffer | null> {
  try {
    return await QRCode.toBuffer(dokumentIps(d), { width: 260, margin: 1, errorCorrectionLevel: "M" });
  } catch (e) {
    console.error("[ips-qr] dokument QR pao:", e);
    return null;
  }
}
