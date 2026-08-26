// Popunjavanje podataka firme po PIB-u iz naše baze - firma koja je već kupovala
// ne mora da se kuca ponovo. Vraća `null` ako je nema, to nije greška.
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
    .select("pib, naziv, adresa, maticni_broj, email")
    .eq("pib", pib.trim())
    .maybeSingle();

  return NextResponse.json({ firma: data ?? null });
}
