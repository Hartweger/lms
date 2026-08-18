// Novi PIN za dete. Uslov WHERE vezuje i id deteta I roditelj_id prijavljenog
// roditelja, pa zahtev nad tuđim detetom ne menja ništa i dobija 404 - isti
// odgovor kao za nepostojeće dete, da se tuđi ključevi ne mogu ispipavati.
//
// Uz novi PIN se brišu i brojač pokušaja i zaključavanje: roditelj koji menja
// PIN upravo rešava „dete je zaboravilo PIN pa se zaključalo".
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authKorisnik, nadjiRoditelja } from "@/lib/zack/roditelj";
import { napraviPinOtisak, pinJeIspravan, slabPin } from "@/lib/zack/pin";
import { jeUuid } from "@/lib/zack/upiti";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deteId: string }> }
) {
  const korisnik = await authKorisnik();
  if (!korisnik) return greska("Moraš prvo da se prijaviš.", 401);

  const { deteId } = await params;
  if (!jeUuid(deteId)) return greska("Nema takvog deteta", 404);

  let telo: unknown;
  try {
    telo = await request.json();
  } catch {
    return greska("Telo zahteva nije ispravan JSON", 400);
  }
  const pin = (telo as Record<string, unknown> | null)?.pin;
  if (typeof pin !== "string" || !pinJeIspravan(pin)) {
    return greska("PIN mora imati tačno četiri cifre.", 400);
  }
  if (slabPin(pin)) {
    return greska("Ovaj PIN je lako pogoditi. Izaberi cifre koje nisu sve iste ni u nizu.", 400);
  }

  try {
    const roditelj = await nadjiRoditelja(korisnik.id);
    if (!roditelj) return greska("Prvo potvrdi pristanak.", 403);

    const sb = createAdminClient();
    const pinHash = await napraviPinOtisak(pin);
    const { data, error } = await sb
      .from("zack_deca")
      .update({ pin_hash: pinHash, pin_pokusaji: 0, zakljucano_do: null })
      .eq("id", deteId)
      .eq("roditelj_id", roditelj.id)
      .select("id");
    if (error) throw new Error(`Ne mogu da upišem novi PIN: ${error.message}`);
    if (!data || data.length === 0) return greska("Nema takvog deteta", 404);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[zack/roditelj/pin]", e);
    return greska("Nešto je zapelo. Probaj ponovo za koji trenutak.", 500);
  }
}
