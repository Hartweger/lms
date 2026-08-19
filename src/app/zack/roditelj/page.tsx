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
      .select("id, ime, kod, udzbenik_id")
      .eq("roditelj_id", roditelj.id)
      .order("created_at"),
    sb.from("zack_udzbenici").select("id, naziv, izdavac, razred").order("razred"),
  ]);
  if (decaUpit.error) throw new Error(`Ne mogu da pročitam decu: ${decaUpit.error.message}`);
  if (udzbeniciUpit.error) {
    throw new Error(`Ne mogu da pročitam udžbenike: ${udzbeniciUpit.error.message}`);
  }

  const udzbenici = udzbeniciUpit.data ?? [];
  const naziviUdzbenika = new Map(udzbenici.map((u) => [u.id, u.naziv]));

  return (
    <UskiStub>
      <RoditeljPanel
        email={roditelj.email}
        deca={(decaUpit.data ?? []).map((d) => ({
          id: d.id,
          ime: d.ime,
          kod: d.kod,
          udzbenik: naziviUdzbenika.get(d.udzbenik_id) ?? "",
        }))}
        udzbenici={udzbenici}
        izvestajUkljucen={roditelj.izvestaj_ukljucen}
      />
    </UskiStub>
  );
}
