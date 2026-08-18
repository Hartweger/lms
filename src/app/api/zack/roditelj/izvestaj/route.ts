// Prekidač dvonedeljnog izveštaja. Roditelj njime i gasi i vraća izveštaje -
// uključujući slučaj kad su se sami ugasili posle mesec dana tišine.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authKorisnik, nadjiRoditelja } from "@/lib/zack/roditelj";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

export async function POST(request: Request) {
  const korisnik = await authKorisnik();
  if (!korisnik) return greska("Moraš prvo da se prijaviš.", 401);

  let telo: unknown;
  try {
    telo = await request.json();
  } catch {
    return greska("Telo zahteva nije ispravan JSON", 400);
  }
  const ukljucen = (telo as Record<string, unknown> | null)?.ukljucen;
  if (typeof ukljucen !== "boolean") {
    return greska("Nedostaje ukljucen (true ili false)", 400);
  }

  try {
    const roditelj = await nadjiRoditelja(korisnik.id);
    if (!roditelj) return greska("Prvo potvrdi pristanak.", 403);

    const sb = createAdminClient();
    const { error } = await sb
      .from("zack_roditelji")
      .update({
        izvestaj_ukljucen: ukljucen,
        // Paljenje briše i brojač praznih perioda: bez ovoga bi se izveštaj
        // koji se sam ugasio posle prvog sledećeg mirnog perioda ODMAH opet
        // ugasio, jer bi brojač već stajao na pragu gašenja.
        ...(ukljucen ? { praznih_zaredom: 0 } : {}),
      })
      .eq("id", roditelj.id);
    if (error) throw new Error(`Ne mogu da upišem prekidač izveštaja: ${error.message}`);

    return NextResponse.json({ ukljucen });
  } catch (e) {
    console.error("[zack/roditelj/izvestaj]", e);
    return greska("Nešto je zapelo. Probaj ponovo za koji trenutak.", 500);
  }
}
