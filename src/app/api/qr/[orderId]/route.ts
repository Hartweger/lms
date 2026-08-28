// IPS QR kao slika, sa NAŠE adrese.
//
// Zašto postoji: QR se ranije služio sa Supabase Storage adrese, a mejl stiže sa
// hartweger.rs. Resend na to upozorava, a Gmail sliku sa strane adrese ume da
// oceni kao sumnjivu - što obara isporučivost celog mejla.
//
// Putanja nosi UUID narudžbine, ne broj (2026-419). Brojevi idu redom, pa bi se
// tuđi iznosi mogli pročitati prostim nabrajanjem; UUID se ne pogađa.
//
// Ruta je javna namerno - poštanski sandučići preuzimaju sliku bez prijave.
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildIpsString, BANK_FIRME } from "@/lib/order-utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  // Bez ovoga bi bilo koji tekst u putanji išao u upit ka bazi.
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return new NextResponse("Nepostojeća adresa", { status: 404 });
  }

  const tip = new URL(request.url).searchParams.get("tip");
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("total, order_number, company_order_group, predracun_broj, faktura_broj")
    .eq("id", orderId)
    .maybeSingle();

  if (!order?.order_number) {
    return new NextResponse("Nepostojeća adresa", { status: 404 });
  }

  let ips: string;
  if (order.company_order_group) {
    // Dokument firme pokriva celu grupu, pa je iznos zbir svih narudžbina u njoj,
    // a račun je onaj za pravna lica.
    const { data: grupa } = await admin
      .from("orders")
      .select("total")
      .eq("company_order_group", order.company_order_group);
    const ukupno = (grupa ?? []).reduce((a, o) => a + Number(o.total), 0);
    const broj = order.faktura_broj ?? order.predracun_broj ?? order.order_number;
    const naziv = tip === "faktura" ? "fakturi" : "predracunu";
    ips = buildIpsString(
      { total: ukupno, order_number: broj },
      { poziv: broj, svrha: `Placanje po ${naziv} ${broj}`, racun: BANK_FIRME.racun },
    );
  } else {
    ips = buildIpsString({ total: Number(order.total), order_number: order.order_number });
  }

  const png = await QRCode.toBuffer(ips, { width: 260, margin: 1, errorCorrectionLevel: "M" });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      // Iznos i poziv na broj se ne menjaju kad dokument jednom ode, pa slika sme
      // dugo da stoji u kešu poštanskog sandučeta.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
