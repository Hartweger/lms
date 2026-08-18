// Pravljenje dečjeg profila. Sme samo prijavljeni roditelj SA pristankom,
// i dete se vezuje za NJEGOV red iz baze - roditelj_id se nikad ne uzima
// iz tela zahteva.
//
// Kod deteta mora biti jedinstven u celoj tabeli, jer se dete prijavljuje
// samo kodom i PIN-om. Umesto „proveri pa upiši" (koje ume da izgubi trku),
// upis se prosto pokuša, a sudar na UNIQUE(kod) znači „izvuci novi kod".
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authKorisnik, nadjiRoditelja } from "@/lib/zack/roditelj";
import { napraviKod } from "@/lib/zack/kod";
import { napraviPinOtisak, pinJeIspravan, slabPin } from "@/lib/zack/pin";
import { jeUuid } from "@/lib/zack/upiti";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

/** Ime je detetovo, pa granica postoji samo da unos ne bude proizvoljno dug. */
const IME_NAJVISE = 40;

/**
 * Azbuka koda daje 31^4 kombinacija, pa je i pri hiljadama dece šansa sudara
 * po izvlačenju sitna. Dvadeset pokušaja znači da 503 ispod praktično ne može
 * da se desi dok tabela ne bude ozbiljno puna.
 */
const IZVLACENJA_KODA = 20;

export async function POST(request: Request) {
  const korisnik = await authKorisnik();
  if (!korisnik) return greska("Moraš prvo da se prijaviš.", 401);

  let telo: unknown;
  try {
    telo = await request.json();
  } catch {
    return greska("Telo zahteva nije ispravan JSON", 400);
  }
  if (typeof telo !== "object" || telo === null || Array.isArray(telo)) {
    return greska("Telo zahteva mora biti objekat", 400);
  }
  const { ime, udzbenikId, pin } = telo as Record<string, unknown>;

  const cistoIme = typeof ime === "string" ? ime.trim() : "";
  if (!cistoIme) return greska("Upiši ime deteta.", 400);
  if (cistoIme.length > IME_NAJVISE) return greska("Ime je predugačko.", 400);
  if (typeof udzbenikId !== "string" || !jeUuid(udzbenikId)) {
    return greska("Izaberi udžbenik.", 400);
  }
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
    const { data: udzbenik, error: greskaUdzbenika } = await sb
      .from("zack_udzbenici")
      .select("id")
      .eq("id", udzbenikId)
      .maybeSingle();
    if (greskaUdzbenika) throw new Error(`Ne mogu da proverim udžbenik: ${greskaUdzbenika.message}`);
    if (!udzbenik) return greska("Izaberi udžbenik.", 400);

    const pinHash = await napraviPinOtisak(pin);

    for (let i = 0; i < IZVLACENJA_KODA; i++) {
      const kod = napraviKod(Math.random);
      const { data: dete, error } = await sb
        .from("zack_deca")
        .insert({
          ime: cistoIme,
          udzbenik_id: udzbenikId,
          roditelj_id: roditelj.id,
          kod,
          pin_hash: pinHash,
        })
        .select("id, ime, kod")
        .single();
      if (!error) {
        // U odgovoru NIKAD nema PIN-a ni otiska: roditelj PIN već zna,
        // a otisak ne sme da napusti bazu.
        return NextResponse.json({ dete });
      }
      // Sudar koda sa postojećim detetom: izvuci novi i pokušaj opet.
      if (error.code !== "23505") {
        throw new Error(`Ne mogu da upišem dete: ${error.message}`);
      }
    }
    return greska("Nismo uspeli da izvučemo slobodan kod. Probaj ponovo.", 503);
  } catch (e) {
    console.error("[zack/roditelj/deca]", e);
    return greska("Nešto je zapelo. Probaj ponovo za koji trenutak.", 500);
  }
}
