// Dvonedeljni zack! izveštaj roditeljima. Cron se poziva jednom dnevno, a ruta
// SAMA bira kome je vreme: roditelj je na redu kad mu je poslednji izveštaj
// stariji od 13 dana (ili ga još nema). Tako „na dve nedelje" radi bez ikakvog
// posebnog rasporeda.
//
// REDOSLED UPISA I SLANJA JE NAMERAN
// ----------------------------------
// Prvo se upiše poslednji_izvestaj_at, pa se tek onda šalje. Ako slanje padne,
// roditelj taj izveštaj preskoči i sledeći dobije za dve nedelje - to je bolje
// od obrnutog reda, gde bi pad upisa POSLE slanja sutra doneo isti mejl još
// jednom. Izgubljen izveštaj je sitnica, dupli je dosađivanje.
//
// GAŠENJE: isto pravilo kao za newsletter - ne opominjati. Dva prazna perioda
// zaredom (mesec dana tišine) znače poslednji miran mejl i izvestaj_ukljucen =
// FALSE. Prekidač u panelu ih vraća.
import { NextRequest, NextResponse } from "next/server";
import { withCronLog, must } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  renderZackIzvestajEmail,
  renderZackOprostajEmail,
  sendZackIzvestajEmail,
} from "@/lib/email";
import {
  DANA_PERIODA,
  gasiSe,
  izvestajRoditelja,
  naRedu,
  noviBrojPraznih,
  type DeteZaIzvestaj,
  type LekcijaZaIzvestaj,
} from "@/lib/zack/izvestaj";

async function cronHandler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createAdminClient();
  const sada = new Date();
  const od = new Date(sada.getTime() - DANA_PERIODA * 24 * 60 * 60 * 1000);

  const roditelji = must(
    await sb
      .from("zack_roditelji")
      .select("id, email, poslednji_izvestaj_at, praznih_zaredom")
      .eq("izvestaj_ukljucen", true),
    "zack_roditelji"
  );

  // Razred po udžbeniku, za rečenicu „reči koje se uče u petom razredu".
  const udzbenici = must(
    await sb.from("zack_udzbenici").select("id, razred"),
    "zack_udzbenici"
  );
  const razredUdzbenika = new Map((udzbenici ?? []).map((u) => [u.id, u.razred]));

  // Spisak lekcija sa rečima se ne menja od roditelja do roditelja, pa se za
  // svaki udžbenik čita najviše jednom.
  const lekcijeUdzbenika = new Map<string, LekcijaZaIzvestaj[]>();
  async function lekcijeZa(udzbenikId: string): Promise<LekcijaZaIzvestaj[]> {
    const kesirane = lekcijeUdzbenika.get(udzbenikId);
    if (kesirane) return kesirane;
    const lekcije = must(
      await sb
        .from("zack_lekcije")
        .select("broj, naziv, zack_reci(id)")
        .eq("udzbenik_id", udzbenikId)
        .order("broj"),
      "zack_lekcije"
    );
    const sredjene = (lekcije ?? []).map((l) => ({
      broj: l.broj,
      naziv: l.naziv,
      recIdovi: (l.zack_reci ?? []).map((r) => r.id),
    }));
    lekcijeUdzbenika.set(udzbenikId, sredjene);
    return sredjene;
  }

  let poslato = 0;
  let ugaseno = 0;

  for (const roditelj of roditelji ?? []) {
    if (!naRedu(roditelj.poslednji_izvestaj_at, sada)) continue;

    const deca = must(
      await sb
        .from("zack_deca")
        .select("id, ime, udzbenik_id")
        .eq("roditelj_id", roditelj.id)
        .order("created_at"),
      "zack_deca"
    );
    // Roditelj bez ijednog deteta nema o čemu da dobije izveštaj: preskače se
    // bez upisa, pa prvi izveštaj stiže već sutradan pošto dete bude dodato.
    if (!deca || deca.length === 0) continue;

    const zaIzvestaj: DeteZaIzvestaj[] = [];
    for (const dete of deca) {
      // Sve sličice deteta, i one koje još čekaju u kesici: zarađena je
      // zarađena, roditelju se ne krije ono što dete još nije otvorilo.
      const zapisi = must(
        await sb
          .from("zack_slicice")
          .select("rec_id, zaradjena_at, zalepljena_at, poslednje_tacno_at")
          .eq("dete_id", dete.id),
        "zack_slicice"
      );
      zaIzvestaj.push({
        ime: dete.ime,
        razred: razredUdzbenika.get(dete.udzbenik_id) ?? null,
        lekcije: await lekcijeZa(dete.udzbenik_id),
        zapisi: zapisi ?? [],
      });
    }

    const izvestaj = izvestajRoditelja(zaIzvestaj, od, sada);
    const praznih = noviBrojPraznih(izvestaj.svaPrazna, roditelj.praznih_zaredom);
    const gasenje = gasiSe(praznih);

    // Upis PRE slanja - vidi zaglavlje fajla. Pad upisa obara cron kroz must,
    // pa cron-health digne alarm, a mejl tada nije ni poslat.
    must(
      await sb
        .from("zack_roditelji")
        .update({
          poslednji_izvestaj_at: sada.toISOString(),
          praznih_zaredom: praznih,
          ...(gasenje ? { izvestaj_ukljucen: false } : {}),
        })
        .eq("id", roditelj.id)
        .select("id"),
      "zack_roditelji upis"
    );

    const mejl = gasenje ? renderZackOprostajEmail() : renderZackIzvestajEmail(izvestaj.deca);
    await sendZackIzvestajEmail(roditelj.email, mejl);

    if (gasenje) ugaseno++;
    else poslato++;
  }

  console.log(`[cron/zack-izvestaj] poslato ${poslato}, ugašeno ${ugaseno}`);
  return NextResponse.json({ poslato, ugaseno });
}

export const GET = withCronLog("zack-izvestaj", cronHandler);
