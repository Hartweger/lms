// PDF ulazne fakture, povučen sa SEF-a i prosleđen u pretraživač.
//
// Postoji da Nataša ne mora da otvara SEF portal samo da bi videla šta joj je
// dobavljač poslao.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { ulaznaFakturaPdf } from "@/lib/sef";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { data: f } = await auth.admin
    .from("sef_purchase_invoices")
    .select("sef_invoice_id, broj_dokumenta")
    .eq("id", id)
    .maybeSingle();

  if (!f) return NextResponse.json({ error: "Faktura nije pronađena." }, { status: 404 });

  const pdf = await ulaznaFakturaPdf(f.sef_invoice_id);
  if (!pdf) {
    return NextResponse.json(
      { error: "SEF nije vratio PDF. Pokušaj ponovo ili pogledaj u SEF panelu." },
      { status: 502 },
    );
  }

  const ime = (f.broj_dokumenta ?? f.sef_invoice_id).replace(/[^\w.-]/g, "-");
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ulazna-${ime}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
