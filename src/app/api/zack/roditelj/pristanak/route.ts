// Potvrda pristanka: pravi red u zack_roditelji za prijavljenog korisnika.
//
// U red se upisuje CEO tekst pristanka koji je roditelj video, ne oznaka
// verzije, da uvek postoji dokaz na šta je tačno pristao. Identitet dolazi
// iz sesije (auth.getUser nad njegovim tokenom), nikad iz tela zahteva.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authKorisnik, nadjiRoditelja } from "@/lib/zack/roditelj";
import { PRISTANAK_TEKST } from "@/lib/zack/pristanak";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

export async function POST() {
  const korisnik = await authKorisnik();
  if (!korisnik) return greska("Moraš prvo da se prijaviš.", 401);
  if (!korisnik.email) return greska("Nalog nema mejl adresu.", 400);

  try {
    // Dvaput kliknuto „Prihvatam" nije greška: pristanak već postoji i to je
    // uspeh, a postojeći red se ne prepisuje da se ne izgubi prvobitni tekst.
    const postojeci = await nadjiRoditelja(korisnik.id);
    if (postojeci) return NextResponse.json({ ok: true });

    const sb = createAdminClient();
    const { error } = await sb.from("zack_roditelji").insert({
      auth_user_id: korisnik.id,
      email: korisnik.email,
      pristanak_tekst: PRISTANAK_TEKST,
    });
    if (error) {
      // Trka dva istovremena klika: UNIQUE na auth_user_id znači da je prvi
      // klik već upisao pristanak, pa je i ovo uspeh.
      if (error.code === "23505") return NextResponse.json({ ok: true });
      throw new Error(`Ne mogu da upišem pristanak: ${error.message}`);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[zack/roditelj/pristanak]", e);
    return greska("Nešto je zapelo. Probaj ponovo za koji trenutak.", 500);
  }
}
