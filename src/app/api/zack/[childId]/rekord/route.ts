// Lični rekord: dokle se dete popelo u jednoj igri, na jednoj lekciji.
//
// REKORD SAMO RASTE
// -----------------
// Slabija partija ne dira bazu. Nema grane koja rekord smanjuje, ni na nulu ni
// na bilo šta drugo, i to je isto ono pravilo zbog kog izbledela sličica ne
// nestaje i zbog kog pad u skakaču ne obara visinu. Zato se ni sam upis ne
// oslanja samo na pročitanu vrednost: podizanje ide uz uslov `sprat < novi`, pa
// dve kartice u isti mah ne mogu da vrate slabiju partiju preko bolje.
//
// Rekord se ovde ne računa, nego prima. Visinu zna samo odigrana partija, a ova
// ruta odlučuje jedino da li je ono što je stiglo bolje od onoga što već stoji.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jeIgra, SPRATOVA_NAJVISE } from "@/lib/zack/pitanja";
import { jeUuid, lekcijaUUdzbeniku, nadjiDete, rekordZaIgru } from "@/lib/zack/upiti";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

/** Telo zahteva, tek pošto je sve provereno. */
type Zahtev = { lekcijaId: string; igra: string; sprat: number };

function citajTelo(telo: unknown): Zahtev | null {
  if (typeof telo !== "object" || telo === null || Array.isArray(telo)) return null;
  const o = telo as Record<string, unknown>;

  // Neispravan oblik ključa bi u Postgresu izazvao grešku i time 500 umesto
  // poštenog 400, zato se proverava pre upita.
  if (typeof o.lekcijaId !== "string" || !jeUuid(o.lekcijaId)) return null;
  // Ime igre se proverava spiskom, da u tabelu ne uđu izmišljene igre - svaka
  // nova vrednost je novi rekord koji nikad ni sa čim ne bi bio poređen.
  if (!jeIgra(o.igra)) return null;
  // Sprat veći od gornje granice penjanja nije mogao da bude odigran. Kolona je
  // SMALLINT, pa bi preveliki broj inače pukao u bazi.
  if (typeof o.sprat !== "number" || !Number.isInteger(o.sprat)) return null;
  if (o.sprat < 0 || o.sprat > SPRATOVA_NAJVISE) return null;

  return { lekcijaId: o.lekcijaId, igra: o.igra, sprat: o.sprat };
}

export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;

  const dete = await nadjiDete(childId);
  if (!dete) return greska("Nema takvog deteta", 404);

  let sirovo: unknown;
  try {
    sirovo = await request.json();
  } catch {
    return greska("Telo zahteva nije ispravan JSON", 400);
  }

  const zahtev = citajTelo(sirovo);
  if (!zahtev) return greska("Nedostaju ispravni lekcijaId, igra i sprat", 400);

  // Lekcija mora da bude iz udžbenika ovog deteta. Bez ove provere se ključem
  // tuđe lekcije upisuje rekord na spisku reči koji dete nikad nije videlo.
  if (!(await lekcijaUUdzbeniku(zahtev.lekcijaId, dete.udzbenik_id))) {
    return greska("Nema takve lekcije", 404);
  }

  const sb = createAdminClient();
  const stari = await rekordZaIgru(dete.id, zahtev.lekcijaId, zahtev.igra);

  // Slabija ili ista partija: baza se ne dira i vraća se ono što već stoji.
  if (stari !== null && zahtev.sprat <= stari) {
    return NextResponse.json({ rekord: stari, nov: false });
  }

  if (stari === null) {
    const { error } = await sb.from("zack_rekordi").insert({
      dete_id: dete.id,
      lekcija_id: zahtev.lekcijaId,
      igra: zahtev.igra,
      sprat: zahtev.sprat,
    });
    if (!error) return NextResponse.json({ rekord: zahtev.sprat, nov: true });
    // 23505 je UNIQUE: red je nastao između čitanja i upisa, pa se nastavlja
    // podizanjem postojećeg umesto da se detetu javi greška.
    if (error.code !== "23505") {
      console.error("[zack/rekord] upis prvog rekorda:", error);
      return greska("Rekord nije upisan", 500);
    }
  }

  const sada = new Date().toISOString();
  const { data: podignut, error: greskaUpisa } = await sb
    .from("zack_rekordi")
    .update({ sprat: zahtev.sprat, postavljen_at: sada })
    .eq("dete_id", dete.id)
    .eq("lekcija_id", zahtev.lekcijaId)
    .eq("igra", zahtev.igra)
    // Kočnica u samoj bazi: red se menja SAMO ako je stari sprat manji.
    .lt("sprat", zahtev.sprat)
    .select("sprat")
    .maybeSingle();
  if (greskaUpisa) {
    console.error("[zack/rekord] podizanje rekorda:", greskaUpisa);
    return greska("Rekord nije upisan", 500);
  }

  if (podignut) return NextResponse.json({ rekord: podignut.sprat, nov: true });

  // Uslov nije prošao, dakle u međuvremenu je upisan bolji ili isti rekord.
  // Vraća se ono što u bazi zaista stoji, nikad poslati broj.
  const sveziji = await rekordZaIgru(dete.id, zahtev.lekcijaId, zahtev.igra);
  return NextResponse.json({ rekord: sveziji ?? zahtev.sprat, nov: false });
}
