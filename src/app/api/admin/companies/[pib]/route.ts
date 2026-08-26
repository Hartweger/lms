// Podaci firme po PIB-u: čitanje (popunjavanje forme za narudžbinu) i izmena
// (ekran /admin/firme).
//
// PIB se NE menja - on je identitet firme i veza sa narudžbinama. Ako je pogrešno
// unet, pravi se nova firma; stara ostaje uz svoje narudžbine.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pib: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { pib } = await params;

  const { data } = await auth.admin
    .from("companies")
    .select("pib, naziv, adresa, grad, maticni_broj, email")
    .eq("pib", pib.trim())
    .maybeSingle();

  return NextResponse.json({ firma: data ?? null });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pib: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { pib } = await params;
  const telo = (await request.json()) as {
    naziv?: string;
    adresa?: string;
    grad?: string;
    maticniBroj?: string;
    email?: string;
  };

  const naziv = telo.naziv?.trim();
  if (!naziv) {
    return NextResponse.json({ error: "Naziv firme ne sme da bude prazan." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("companies")
    .update({
      naziv,
      adresa: telo.adresa?.trim() || null,
      grad: telo.grad?.trim() || null,
      maticni_broj: telo.maticniBroj?.trim() || null,
      email: telo.email?.trim() || null,
    })
    .eq("pib", pib.trim())
    .select("pib, naziv, adresa, grad, maticni_broj, email")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Firma nije pronađena." }, { status: 400 });
  }

  return NextResponse.json({ firma: data });
}
