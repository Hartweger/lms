// Napredak jednog deteta za roditeljski panel. Uslov WHERE vezuje i id deteta
// I roditelj_id prijavljenog roditelja, pa zahtev nad tuđim detetom dobija 404
// - isti odgovor kao za nepostojeće dete, da se tuđi ključevi ne mogu
// ispipavati.
//
// GLAS EKRANA: bez prekora, bez poređenja među decom, bez procenata tačnosti.
// I BEZ SLIČICA - sličice su dečji svet. Roditelju se govori o rečima i
// značenju: koliko reči zna, koliko je vežbalo. Brojanje ipak ide istom
// logikom kao detetov album: izbledela se broji kao naučena, jer detetu ništa
// nije oduzeto. Kad dete nije vežbalo, rečenica je mirna i bez uzvičnika.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authKorisnik, nadjiRoditelja } from "@/lib/zack/roditelj";
import { jeUuid, zapisiSlicica } from "@/lib/zack/upiti";
import { stanjeZapisa } from "@/lib/zack/album";
import { nizZaPrikaz, opisGradiva, opisPoslednjeAktivnosti } from "@/lib/zack/izvestaj";
import { dokleSePopela } from "@/lib/zack/pojas";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

/** Današnji datum u detetovoj zoni, jer se i niz računa po njoj. */
function danasnjiDan(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deteId: string }> }
) {
  const korisnik = await authKorisnik();
  if (!korisnik) return greska("Moraš prvo da se prijaviš.", 401);

  const { deteId } = await params;
  if (!jeUuid(deteId)) return greska("Nema takvog deteta", 404);

  try {
    const roditelj = await nadjiRoditelja(korisnik.id);
    if (!roditelj) return greska("Prvo potvrdi pristanak.", 403);

    const sb = createAdminClient();
    const { data: dete, error } = await sb
      .from("zack_deca")
      .select("id, udzbenik_id, niz, poslednji_dan")
      .eq("id", deteId)
      .eq("roditelj_id", roditelj.id)
      .maybeSingle();
    if (error) throw new Error(`Ne mogu da pročitam dete: ${error.message}`);
    if (!dete) return greska("Nema takvog deteta", 404);

    const [lekcijeUpit, zapisi, rekordUpit, udzbenikUpit] = await Promise.all([
      sb
        .from("zack_lekcije")
        .select("broj, naziv, zack_reci(id)")
        .eq("udzbenik_id", dete.udzbenik_id)
        .order("broj"),
      // Iste sličice koje vidi i dete: isporučene, a izbledele se broje kao
      // zalepljene - ista logika kao brojac u detetovom albumu.
      zapisiSlicica(dete.id),
      // Najbolji skok ikada, preko svih lekcija. Bez rekorda nema ni reda na
      // ekranu, da prvi pokušaji ne počnu poređenjem.
      sb
        .from("zack_rekordi")
        .select("sprat")
        .eq("dete_id", dete.id)
        .eq("igra", "skakac")
        .order("sprat", { ascending: false })
        .limit(1),
      sb
        .from("zack_udzbenici")
        .select("razred")
        .eq("id", dete.udzbenik_id)
        .maybeSingle(),
    ]);
    if (lekcijeUpit.error) {
      throw new Error(`Ne mogu da pročitam lekcije: ${lekcijeUpit.error.message}`);
    }
    if (rekordUpit.error) {
      throw new Error(`Ne mogu da pročitam rekord: ${rekordUpit.error.message}`);
    }
    if (udzbenikUpit.error) {
      throw new Error(`Ne mogu da pročitam udžbenik: ${udzbenikUpit.error.message}`);
    }

    const sada = new Date();
    const poRecId = new Map(zapisi.map((z) => [z.rec_id, z]));

    let naucene = 0;
    let ukupno = 0;
    const lekcije = (lekcijeUpit.data ?? []).map((lekcija) => {
      let nauceneLekcije = 0;
      for (const rec of lekcija.zack_reci ?? []) {
        const stanje = stanjeZapisa(poRecId.get(rec.id), sada);
        if (stanje === "zalepljena" || stanje === "izbledela") nauceneLekcije++;
      }
      naucene += nauceneLekcije;
      ukupno += (lekcija.zack_reci ?? []).length;
      return {
        broj: lekcija.broj,
        naziv: lekcija.naziv,
        naucene: nauceneLekcije,
        ukupno: (lekcija.zack_reci ?? []).length,
      };
    });

    const danas = danasnjiDan();
    const najboljiSprat = rekordUpit.data?.[0]?.sprat;

    return NextResponse.json({
      reci: { naucene, ukupno },
      // „reči koje se uče u petom razredu" - nastavak rečenice „Zna X od Y".
      gradivo: opisGradiva(udzbenikUpit.data?.razred ?? null),
      lekcije,
      vezbaZaredom: nizZaPrikaz(dete.niz, dete.poslednji_dan, danas),
      // Sprat preveden u prizor („do grebena, 13. sprat"); ekranu je dozvoljeno
      // više detalja nego mejlu, ali i ovde uz objašnjenje koja je to igra.
      rekord: typeof najboljiSprat === "number" ? dokleSePopela(najboljiSprat) : null,
      aktivnost: opisPoslednjeAktivnosti(dete.poslednji_dan, danas),
    });
  } catch (e) {
    console.error("[zack/roditelj/napredak]", e);
    return greska("Nešto je zapelo. Probaj ponovo za koji trenutak.", 500);
  }
}
