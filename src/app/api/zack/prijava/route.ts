// Prijava deteta kodom i PIN-om.
//
// DVA PRAVILA KOJA DRŽE OVU RUTU
// ------------------------------
// 1. Kod se ne sme nabrajati. Odgovor za „nema takvog koda" i „PIN ne valja"
//    je ISTA poruka sa ISTIM statusom, a da se razlika ne oda ni kroz vreme
//    (scrypt traje osetno), za nepostojeći kod se PIN svejedno samelje nad
//    lažnim otiskom pa tek onda odbije.
// 2. Poruke su bez prekora. Ovo kuca dete od deset godina: greška je mirna
//    rečenica šta da uradi, ne prekor šta je pogrešilo.
//
// Peta greška zaključava na 15 minuta (logika u zakljucavanje.ts), i dok
// zaključavanje traje NI TAČAN PIN ne prolazi - inače bi pogađanje samo
// nastavilo kroz zaključan prozor.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { kodJeIspravan, normalizujKod } from "@/lib/zack/kod";
import { pinJeIspravan, pinSePoklapa } from "@/lib/zack/pin";
import {
  jeZakljucano,
  preostaloMinuta,
  stanjePosleGreske,
} from "@/lib/zack/zakljucavanje";

const NE_POKLAPA_SE = "Kod ili PIN se ne poklapaju. Probaj ponovo.";

// Ispravan scrypt otisak PIN-a koji nijedno dete nema. Postoji samo da
// nepostojeći kod košta isto vremena kao pogrešan PIN.
const LAZNI_OTISAK =
  "scrypt$16384$8$1$u2oA2qfcrjY43vKmuadZ0g==$4DsQjsvFIXIOMOcv3aPaVzVJ9NiytBDEVHy624wMcM4=";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

/** „1 minut", „2 minuta", „21 minut" - broj menja oblik imenice. */
function recMinuta(n: number): string {
  return n % 10 === 1 && n % 100 !== 11 ? "minut" : "minuta";
}

function porukaZakljucano(zakljucanoDo: string, sada: Date) {
  const n = preostaloMinuta(zakljucanoDo, sada);
  return greska(`Sačekaj ${n} ${recMinuta(n)} pa probaj ponovo.`, 423);
}

export async function POST(request: Request) {
  let telo: unknown;
  try {
    telo = await request.json();
  } catch {
    return greska("Telo zahteva nije ispravan JSON", 400);
  }
  const { kod, pin } = (telo as Record<string, unknown> | null) ?? {};

  // Pogrešan OBLIK sme da se odbije odmah i bez mlevenja: ne otkriva ništa
  // o postojećim kodovima, jer nijedan kod ni PIN takvog oblika ne postoji.
  if (
    typeof kod !== "string" ||
    typeof pin !== "string" ||
    !kodJeIspravan(kod) ||
    !pinJeIspravan(pin)
  ) {
    return greska(NE_POKLAPA_SE, 401);
  }

  try {
    const sb = createAdminClient();
    const { data: dete, error } = await sb
      .from("zack_deca")
      .select("id, pin_hash, pin_pokusaji, zakljucano_do")
      .eq("kod", normalizujKod(kod))
      .maybeSingle();
    if (error) throw new Error(`Ne mogu da potražim kod: ${error.message}`);

    const sada = new Date();

    // Nepostojeći kod (ili probno dete bez PIN-a, koje se i ne prijavljuje
    // ovuda) prolazi kroz isto mlevenje i dobija istu poruku.
    if (!dete || !dete.pin_hash) {
      await pinSePoklapa(pin, LAZNI_OTISAK);
      return greska(NE_POKLAPA_SE, 401);
    }

    const zakljucanoDo = dete.zakljucano_do;
    if (zakljucanoDo && jeZakljucano(zakljucanoDo, sada)) {
      return porukaZakljucano(zakljucanoDo, sada);
    }

    const poklapaSe = await pinSePoklapa(pin, dete.pin_hash);

    if (!poklapaSe) {
      const novo = stanjePosleGreske(dete.pin_pokusaji, sada);
      const { error: greskaUpisa } = await sb
        .from("zack_deca")
        .update({
          pin_pokusaji: novo.pokusaji,
          zakljucano_do: novo.zakljucanoDo ? novo.zakljucanoDo.toISOString() : null,
        })
        .eq("id", dete.id);
      if (greskaUpisa) throw new Error(`Ne mogu da upišem pokušaj: ${greskaUpisa.message}`);

      if (novo.zakljucanoDo) {
        return porukaZakljucano(novo.zakljucanoDo.toISOString(), sada);
      }
      return greska(NE_POKLAPA_SE, 401);
    }

    // Uspeh briše brojač, da sutrašnja jedna omaška ne zaključa iz prve.
    const { error: greskaReseta } = await sb
      .from("zack_deca")
      .update({ pin_pokusaji: 0, zakljucano_do: null })
      .eq("id", dete.id);
    if (greskaReseta) throw new Error(`Ne mogu da obrišem brojač: ${greskaReseta.message}`);

    return NextResponse.json({ childId: dete.id });
  } catch (e) {
    // U log ide samo greška - nikad kod ni PIN iz zahteva.
    console.error("[zack/prijava]", e);
    return greska("Nešto je zapelo. Probaj ponovo za koji trenutak.", 500);
  }
}
