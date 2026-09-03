// Ručno povlačenje ulaznih faktura sa SEF-a.
//
// Isti posao koji dnevni cron radi u 5:30, ali na Natašin klik - kad ne želi da
// čeka jutro. Idempotentno: upsert po `sef_invoice_id`, pa ponovno povlačenje ne
// pravi duplikate i ne dira već donete odluke.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { pregledUlaznihFaktura, sefPodesen } from "@/lib/sef";
import { uRed, jeZaKnjizenje } from "@/lib/sef-ulazne";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (!sefPodesen()) {
    return NextResponse.json({ error: "SEF ključ nije postavljen." }, { status: 503 });
  }

  // Koliko dana unazad; podrazumevano 35, kao u cronu.
  const dana = Math.min(Number(new URL(request.url).searchParams.get("dana") ?? 35) || 35, 365);
  const danas = new Date();
  const od = new Date(danas.getTime() - dana * 24 * 3600_000);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  const pregled = await pregledUlaznihFaktura(ymd(od), ymd(danas));
  if (!pregled.ok) {
    return NextResponse.json({ error: `SEF nije odgovorio: ${pregled.greska}` }, { status: 502 });
  }

  const redovi = pregled.data
    .map(uRed)
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .filter((r) => jeZaKnjizenje(r.status));

  if (redovi.length === 0) {
    return NextResponse.json({ stiglo: pregled.data.length, upisano: 0, dana });
  }

  const { error } = await auth.admin
    .from("sef_purchase_invoices")
    .upsert(redovi, { onConflict: "sef_invoice_id" });

  if (error) {
    return NextResponse.json({ error: `Upis nije uspeo: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ stiglo: pregled.data.length, upisano: redovi.length, dana });
}
