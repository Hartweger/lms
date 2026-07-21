// src/app/api/admin/nestpay-status/route.ts
// Admin alatka: pitaj banku kakav je status porudžbine (CC5 ORDERSTATUS=QUERY).
// Koristi se za podršku („da li je uplata stvarno prošla?") i kao provera da API
// korisnik radi. Upit ide preko NESTPAY_API_USER/PASSWORD (Role = Api User u MC).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { queryTransaction, NESTPAY } from "@/lib/nestpay";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const oid = new URL(request.url).searchParams.get("oid")?.trim();
  if (!oid) {
    return NextResponse.json({ error: "Nedostaje ?oid=<broj porudžbine>" }, { status: 400 });
  }

  if (!NESTPAY.apiUser || !NESTPAY.apiPassword) {
    return NextResponse.json(
      { error: "NESTPAY_API_USER / NESTPAY_API_PASSWORD nisu podešeni u env-u." },
      { status: 500 },
    );
  }

  const result = await queryTransaction(oid);
  if (!result) {
    return NextResponse.json(
      { oid, ok: false, poruka: "Banka nije vratila odgovor (mrežna greška ili odbijen zahtev)." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    oid,
    ok: true,
    procReturnCode: result.procReturnCode,
    naplaceno: result.procReturnCode === "00",
    iznosRsd: result.amountRsd,
    iznosSirovo: result.amount, // banka vraća u parama
    statusTransakcije: result.transStatus,
  });
}
