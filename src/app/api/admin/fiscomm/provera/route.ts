// Provera veze sa Fiscommom. Otvara se u pretraživaču (ulogovan admin) i odmah kaže
// koji API je aktivan (2.0 ili stari) i da li Fiscomm prihvata ključ iz env-a.
//
// Postoji iz istog razloga kao /api/admin/sef/provera: pogrešan ili nezamenjen ključ
// se inače otkriva tek na prvoj pravoj porudžbini - kad je već kasno.
//
// Ništa ne izdaje: na 2.0 gađa /auth/api-key/me (podaci o ključu), na starom /system.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { fiscommCfg } from "@/lib/fiscomm";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const c = fiscommCfg();
  const api = c.v2 ? "Fiscomm 2.0 (api.fiscomm.rs)" : "stari v0.1.0 (cloudfunctions)";

  if (!c.apiKey) {
    return NextResponse.json(
      { veza: "nema ključa", api, poruka: "FISCOMM_API_KEY nije postavljen." },
      { status: 503 },
    );
  }

  const res = await fetch(`${c.apiUrl}${c.v2 ? "/auth/api-key/me" : "/system"}`, {
    headers: { Authorization: `Bearer ${c.apiKey}`, Accept: "application/json" },
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text.slice(0, 300); }

  if (!res.ok) {
    return NextResponse.json(
      {
        veza: "NE RADI",
        api,
        httpStatus: res.status,
        poruka:
          res.status === 401 || res.status === 403
            ? "Fiscomm odbija ključ. Najverovatnije ključ i URL nisu iz iste generacije (stari ključ na 2.0 ili obrnuto)."
            : data,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ veza: "RADI", api, kljuc: data });
}
