import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { refundOrder } from "@/lib/fiscomm";
import { revokeAccessForOrder } from "@/lib/grant-access";

/**
 * Storno potvrđene narudžbine: refundacioni fiskalni račun (Fiscomm) + oduzimanje pristupa
 * + `payment_status = "refunded"`. Zamena za dosadašnju ručnu izmenu u bazi, posle koje su
 * novac kod banke i fiskalni račun ostajali neusklađeni.
 *
 * ŠTA OVA RUTA NE RADI: ne vraća novac. Povraćaj ide kroz NestPay Merchant centar (a rate
 * banka radi ručno u pozadini). Redosled je namerno „prvo poreski dokument, pa novac" -
 * storno se sme izdati i pre nego što povraćaj legne na karticu.
 *
 * Redosled unutar rute: prvo fiskalni storno (jedini korak koji ume da padne na tuđem
 * servisu), pa tek onda oduzimanje pristupa. Obrnuto bi ostavljalo polaznika bez kursa a
 * sa važećim računom.
 *
 * ?bezRacuna=1 → preskače Fiscomm (za narudžbine koje nikad nisu fiskalizovane, npr.
 * uplatnica bez izdatog računa) i radi samo oduzimanje pristupa.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, order_number, payment_status, fiscal_referent_number, refund_referent_number")
    .eq("id", id)
    .single();
  if (orderError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (order.payment_status === "pending") {
    return NextResponse.json(
      { error: "Neplaćena narudžbina se ne stornira - obriši je ili sačekaj uplatu." },
      { status: 400 }
    );
  }

  const bezRacuna = new URL(request.url).searchParams.get("bezRacuna") === "1";

  let racun: "izdat" | "vec-postojao" | "preskocen" = "preskocen";
  if (!bezRacuna) {
    if (order.refund_referent_number) {
      racun = "vec-postojao";
    } else {
      const fisk = await refundOrder(id);
      if (!fisk.ok) {
        // Ništa nije dirano - pristup ostaje, admin vidi zašto i može da ponovi.
        return NextResponse.json(
          { error: `Fiskalni storno nije prošao (${fisk.error}). Pristup NIJE oduzet.` },
          { status: 400 }
        );
      }
      racun = "izdat";
    }
  }

  const revoke = await revokeAccessForOrder(id);
  if (!revoke.ok) {
    return NextResponse.json(
      { error: `Račun je storniran, ali oduzimanje pristupa je palo: ${revoke.error}` },
      { status: 500 }
    );
  }

  const { error: updateError } = await admin
    .from("orders")
    .update({ payment_status: "refunded", granted: false })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { data: updated } = await admin
    .from("orders")
    .select("payment_status, granted, refund_referent_number, refund_pdf_url, refunded_at")
    .eq("id", id)
    .single();

  return NextResponse.json({
    ok: true,
    racun,
    skinuto: revoke.skinuto,
    napomene: revoke.napomene,
    order: updated,
  });
}
