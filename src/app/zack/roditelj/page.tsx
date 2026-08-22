// Roditeljska strana dečje aplikacije. Jedna adresa, tri stanja:
// 1. neprijavljen  -> mejl i magic link (isti tok kao ostatak platforme)
// 2. bez pristanka -> ceo tekst pristanka i dugme „Prihvatam"
// 3. sa pristankom -> spisak dece, kodovi, novi PIN, dodavanje deteta
//
// Redosled je i bezbednosno pravilo: bez reda u zack_roditelji (= bez
// pristanka) nema panela, pa ni pravljenja dece - i rute to isto proveravaju,
// ovde je samo prvi zid.
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nadjiRoditelja } from "@/lib/zack/roditelj";
import { UskiStub } from "../Ukras";
import RoditeljPrijava from "./RoditeljPrijava";
import PristanakEkran from "./PristanakEkran";
import RoditeljPanel from "./RoditeljPanel";

// Roditeljska strana sme da nosi ime škole - detetov deo ne.
export const metadata: Metadata = { title: "zack! za roditelje | Hartweger" };

// Spisak dece se menja odmah po dodavanju, keširana strana bi lagala.
export const dynamic = "force-dynamic";

export default async function RoditeljPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const korisnik = data.user;

  if (!korisnik) {
    return (
      <UskiStub>
        <RoditeljPrijava />
      </UskiStub>
    );
  }

  const roditelj = await nadjiRoditelja(korisnik.id);
  if (!roditelj) {
    return (
      <UskiStub>
        <PristanakEkran email={korisnik.email ?? ""} />
      </UskiStub>
    );
  }

  const sb = createAdminClient();
  // Dva ravna upita umesto ugnježdenog: ugnježdeni kroz strani ključ ume da
  // tiho vrati prazno kad veza nije onakva kakvom je smatramo.
  const [decaUpit, udzbeniciUpit] = await Promise.all([
    sb
      .from("zack_deca")
      .select("id, ime, kod, udzbenik_id, oslobodjeno, clanstvo_do")
      .eq("roditelj_id", roditelj.id)
      .order("created_at"),
    // Samo sadržaj po planu i programu (odluka 19.08). Bez ovog filtera panel
    // je roditelju koji dodaje drugo dete nudio i stare Maximal zapise - a to
    // su prelazni sadržaji (Maximal 1 ima JEDNU probnu lekciju), pa bi dete
    // dobilo skoro prazan album bez ijednog upozorenja.
    sb
      .from("zack_udzbenici")
      .select("id, naziv, izdavac, razred")
      .eq("izdavac", "Po planu i programu")
      .order("razred"),
  ]);
  if (decaUpit.error) throw new Error(`Ne mogu da pročitam decu: ${decaUpit.error.message}`);
  if (udzbeniciUpit.error) {
    throw new Error(`Ne mogu da pročitam udžbenike: ${udzbeniciUpit.error.message}`);
  }

  const udzbenici = udzbeniciUpit.data ?? [];
  const naziviUdzbenika = new Map(udzbenici.map((u) => [u.id, u.naziv]));
  const deca = decaUpit.data ?? [];

  // Aktivne mesečne serije za ovu decu - osnova za „Otkaži" (postojeći cancel
  // tok iz /api/pretplata/otkazi; pretplata glasi na roditeljev nalog).
  const pretplatePoDetetu = new Map<string, string>();
  if (deca.length > 0) {
    const { data: pretplate, error: pretplateGreska } = await sb
      .from("subscriptions")
      .select("id, dete_id")
      .in("dete_id", deca.map((d) => d.id))
      .eq("status", "active");
    if (pretplateGreska) {
      throw new Error(`Ne mogu da pročitam članstva: ${pretplateGreska.message}`);
    }
    for (const p of pretplate ?? []) {
      if (p.dete_id) pretplatePoDetetu.set(p.dete_id, p.id);
    }
  }

  const sada = new Date();

  return (
    <UskiStub>
      <RoditeljPanel
        email={roditelj.email}
        deca={deca.map((d) => {
          const pretplataId = pretplatePoDetetu.get(d.id) ?? null;
          const vaziDoDatum = d.clanstvo_do ? new Date(d.clanstvo_do) : null;
          const placenoVazi = !!vaziDoDatum && vaziDoDatum > sada;
          // Datum se formatira OVDE, na serveru, da klijent ne hidrira drugi
          // ispis od onog koji je stigao u HTML-u.
          const vaziDo =
            placenoVazi && vaziDoDatum
              ? // sr-RS datum nosi završnu tačku - skida se, jer u panelu iza
                // datuma dolazi zapeta ili tačka rečenice.
                vaziDoDatum.toLocaleDateString("sr-RS").replace(/\.$/, "")
              : null;
          return {
            id: d.id,
            ime: d.ime,
            kod: d.kod,
            udzbenik: naziviUdzbenika.get(d.udzbenik_id) ?? "",
            clanstvo: {
              stanje: d.oslobodjeno
                ? ("oslobodjeno" as const)
                : pretplataId
                  ? ("aktivno" as const)
                  : placenoVazi
                    ? ("otkazano-vazi" as const)
                    : ("neaktivno" as const),
              vaziDo,
              pretplataId,
            },
          };
        })}
        udzbenici={udzbenici}
        izvestajUkljucen={roditelj.izvestaj_ukljucen}
      />
    </UskiStub>
  );
}
