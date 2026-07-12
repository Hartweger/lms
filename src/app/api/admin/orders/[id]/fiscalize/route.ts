import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { fiscalizeOrder } from "@/lib/fiscomm";

// Ručna (ponovna) fiskalizacija već potvrđene narudžbine koja nije fiskalizovana -
// npr. starije ručne narudžbine napravljene pre nego što je create ruta počela da fiskalizuje.
// fiscalizeOrder je idempotentan: preskače ako je već fiskalizovano.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id")
    .eq("id", id)
    .single();
  if (orderError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const result = await fiscalizeOrder(id);
  if (!result.ok) return NextResponse.json({ error: result.error ?? "fiscalization_failed" }, { status: 400 });

  // Vrati osvežena fiskalna polja da UI prikaže "Račun".
  const { data: updated } = await admin
    .from("orders")
    .select("fiscal_referent_number, fiscal_pdf_url, fiscalized_at")
    .eq("id", id)
    .single();

  return NextResponse.json({ ok: true, order: updated });
}
