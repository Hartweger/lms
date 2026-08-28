// Provera veze sa SEF-om. Otvara se u pretraživaču (ulogovan admin) i odmah kaže
// da li ključ radi i sa kojim okruženjem pričamo.
//
// Postoji zato što se pogrešan ili nezamenjen ključ inače otkriva tek na prvoj
// pravoj fakturi - a tada je već kasno da se bira trenutak.
//
// Gađa `getEfakturaVersion`: čita verziju sistema, ništa ne menja i ništa ne šalje.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { sefPodesen, sefJeDemo, sefVerzija } from "@/lib/sef";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const okruzenje = sefJeDemo() ? "DEMO" : "PRODUKCIJA";

  if (!sefPodesen()) {
    return NextResponse.json(
      { veza: "nema ključa", okruzenje, poruka: "SEF_API_KEY nije postavljen." },
      { status: 503 },
    );
  }

  const res = await sefVerzija();
  if (!res.ok) {
    return NextResponse.json(
      {
        veza: "NE RADI",
        okruzenje,
        poruka:
          res.status === 401 || res.status === 403
            ? "SEF odbija ključ. Najverovatnije je ključ sa drugog okruženja (demo ključ na produkciji ili obrnuto)."
            : res.greska,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    veza: "RADI",
    okruzenje,
    verzijaSefa: res.data,
    napomena:
      okruzenje === "DEMO"
        ? "Fakture poslate na SEF nisu prijavljene državi."
        : "Fakture poslate na SEF su zvanično predate.",
  });
}
