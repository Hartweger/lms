// Podsetnik pred istek poklona (/poklon). Cron ide jednom dnevno, a ruta SAMA
// bira kome je vreme: detetu čiji poklon ističe za najviše tri dana, a kome
// podsetnik još nije poslat.
//
// ZAŠTO SE GLEDA PORUDŽBINA, A NE SAMO DATUM
// ------------------------------------------
// `clanstvo_do` jednak roku poklona može teorijski da nastane i drugim putem.
// Poklon-porudžbina je jedini pouzdan dokaz da je dete DOBILO poklon, pa se
// spisak pravi od nje - i mejl ide na adresu sa te porudžbine, istu na koju je
// poklon i stigao.
//
// UPIS PRE SLANJA: isto pravilo kao u zack-izvestaj rutu. Pad slanja znači
// izgubljen podsetnik (sitnica), a obrnut red bi sutra doneo isti mejl opet
// (dosađivanje, a zack! nigde ne opominje).
//
// Roditelj koji je u međuvremenu uključio članstvo se preskače sam: njegovom
// detetu je `clanstvo_do` pomeren preko roka poklona, pa vremeZaPodsetnik
// vrati false.
import { NextRequest, NextResponse } from "next/server";
import { withCronLog, must } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendZackPoklonPodsetnikEmail } from "@/lib/email";
import { ZACK_PROMO_RSD } from "@/lib/zack/clanstvo";
import { jePoklonStavka, vremeZaPodsetnik } from "@/lib/zack/poklon";

type Stavka = { dete_id?: string | null };

async function cronHandler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createAdminClient();
  const sada = new Date();

  // Poklon-porudžbine se ne mogu filtrirati u upitu (oznaka živi u JSONB nizu),
  // pa se čitaju zack! porudžbine i prosejavaju istom funkcijom koju koristi i
  // dodela pristupa - jedno mesto zna šta je poklon.
  const porudzbine = must(
    await sb
      .from("orders")
      .select("id, email, full_name, items")
      .eq("payment_status", "completed")
      .eq("payment_method", "poklon"),
    "orders poklon"
  );

  let poslato = 0;
  let preskoceno = 0;

  for (const o of porudzbine ?? []) {
    const stavke = Array.isArray(o.items) ? (o.items as Stavka[]) : [];
    if (!stavke.some((s) => jePoklonStavka(s))) continue;
    const deteId = stavke[0]?.dete_id;
    if (!deteId) continue;

    const { data: dete } = await sb
      .from("zack_deca")
      .select("id, ime, clanstvo_do, poklon_podsetnik_at")
      .eq("id", deteId)
      .maybeSingle();
    // Dete koje roditelj obriše ne dobija podsetnik - i to je u redu.
    if (!dete) continue;
    if (dete.poklon_podsetnik_at) continue;
    if (!vremeZaPodsetnik(sada, dete.clanstvo_do)) {
      preskoceno++;
      continue;
    }

    // Upis PRE slanja - vidi zaglavlje. Pad upisa obara cron kroz must, pa
    // cron-health digne alarm, a mejl tada nije ni poslat.
    must(
      await sb
        .from("zack_deca")
        .update({ poklon_podsetnik_at: sada.toISOString() })
        .eq("id", dete.id)
        .select("id"),
      "zack_deca podsetnik upis"
    );

    await sendZackPoklonPodsetnikEmail(o.email, o.full_name, {
      imeDeteta: dete.ime,
      vaziDo: dete.clanstvo_do!,
      mesecnoRsd: ZACK_PROMO_RSD,
    });
    poslato++;
  }

  console.log(`[cron/zack-poklon-podsetnik] poslato ${poslato}, van prozora ${preskoceno}`);
  return NextResponse.json({ poslato, preskoceno });
}

export const GET = withCronLog("zack-poklon-podsetnik", cronHandler);
