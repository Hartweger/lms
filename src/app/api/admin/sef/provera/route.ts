// Provera veze sa SEF-om. Otvara se u pretraživaču (ulogovan admin) i odmah kaže
// da li ključ radi i sa kojim okruženjem pričamo.
//
// Postoji zato što se pogrešan ili nezamenjen ključ inače otkriva tek na prvoj
// pravoj fakturi - a tada je već kasno da se bira trenutak.
//
// Gađa `getEfakturaVersion`: čita verziju sistema, ništa ne menja i ništa ne šalje.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { sefPodesen, sefJeDemo, sefVerzija, procitajStatus } from "@/lib/sef";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  // ?invoiceId=470879420 pita SEF za status konkretne fakture. Služi da se odvoji
  // „status još nije stigao" od „čitanje statusa uopšte ne radi" - a to se inače
  // ne vidi, jer oba izgledaju kao faktura koja zauvek stoji na „šalje se".
  const invoiceId = new URL(request.url).searchParams.get("invoiceId");
  let faktura: unknown = undefined;
  if (invoiceId) {
    const st = await procitajStatus(invoiceId);
    faktura = st.ok
      ? { invoiceId, status: st.data.status ?? "(SEF nije vratio status)", odgovor: st.data }
      : { invoiceId, greska: st.greska, httpStatus: st.status };
  }

  return NextResponse.json({
    veza: "RADI",
    okruzenje,
    verzijaSefa: res.data,
    ...(faktura ? { faktura } : {}),
    napomena:
      okruzenje === "DEMO"
        ? "Fakture poslate na SEF nisu prijavljene državi."
        : "Fakture poslate na SEF su zvanično predate.",
  });
}
