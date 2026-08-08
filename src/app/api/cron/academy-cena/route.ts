import { NextRequest, NextResponse } from "next/server";
import { withCronLog } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";

// NH Academy Gen II ima tri cene po fazama kampanje. Ranije se cena menjala ručno,
// što je značilo da jedan zaboravljen dan prodaje program 100 EUR jeftinije nego
// što treba. Zato ovaj posao svakog dana proveri koji je period i, ako se cena
// razlikuje, ispravi je.
//
// Kupon se NE koristi: CheckoutForm validira kupon iz URL-a samo za poznat mejl,
// pa bi anonimna kupovina prikazala punu cenu (vidi migraciju 082).

const SLUG = "nh-academy-gen2";

/** Granice su POSLEDNJI dan po beogradskom vremenu na kom važi ta cena. */
const CENE: { do: string | null; rsd: number; opis: string }[] = [
  { do: "2026-08-31", rsd: 57300, opis: "rani upis (490 EUR)" },
  { do: "2026-09-20", rsd: 69000, opis: "druga cena (590 EUR)" },
  { do: null, rsd: 80700, opis: "puna cena (690 EUR)" },
];

/** Datum u Beogradu kao YYYY-MM-DD - server radi u UTC-u, pa se ne sme uzeti toISOString. */
function danasUBeogradu() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function cenaZaDan(dan: string) {
  return CENE.find((c) => c.do === null || dan <= c.do)!;
}

async function cronHandler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const dan = danasUBeogradu();
  const ocekivana = cenaZaDan(dan);

  const { data: kurs, error } = await admin
    .from("courses")
    .select("id, price")
    .eq("slug", SLUG)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Proizvod ne postoji (npr. posle završetka generacije) - nije greška, samo nema šta da se radi.
  if (!kurs) return NextResponse.json({ dan, preskoceno: `nema proizvoda ${SLUG}` });

  const trenutna = Number(kurs.price);
  if (trenutna === ocekivana.rsd) {
    return NextResponse.json({ dan, cena: trenutna, promena: false });
  }

  const { error: e2 } = await admin
    .from("courses")
    .update({ price: ocekivana.rsd })
    .eq("id", kurs.id);
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  console.log(`[academy-cena] ${dan}: ${trenutna} → ${ocekivana.rsd} (${ocekivana.opis})`);
  return NextResponse.json({
    dan,
    promena: true,
    sa: trenutna,
    na: ocekivana.rsd,
    opis: ocekivana.opis,
  });
}

export const GET = withCronLog("academy-cena", cronHandler);
