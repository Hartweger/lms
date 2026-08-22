// Ceo niz mejlova oko poklona, iz JEDNE rute. Cron ide jednom dnevno i za svako
// dete koje je dobilo poklon proverava šta mu je danas na redu:
//
//   1. dan   - fali PIN            (bez njega prijava fizički ne radi)
//   3. dan   - kod čeka           (samo ako dete IMA PIN a nije se prijavilo)
//   7. dan   - anketa o utiscima  (samo ako dete STVARNO vežba)
//   -3 dana  - poklon ističe
//   +1 dan   - poklon je prošao, album ostaje
//
// Jedno dete može u jednom prolazu dobiti najviše JEDAN mejl (`nastavi`), pa se
// ni u najgorem slučaju ne desi da mu istog jutra stignu dva.
//
// ZAŠTO SE GLEDA PORUDŽBINA, A NE SAMO DATUM
// ------------------------------------------
// `clanstvo_do` jednak roku poklona može teorijski da nastane i drugim putem.
// Poklon-porudžbina je jedini pouzdan dokaz da je dete DOBILO poklon, pa se
// spisak pravi od nje - i mejl ide na adresu sa te porudžbine, istu na koju je
// poklon i stigao.
//
// UPIS PRE SLANJA: isto pravilo kao u zack-izvestaj rutu. Pad slanja znači
// izgubljen mejl (sitnica), a obrnut red bi sutra doneo isti mejl opet
// (dosađivanje, a zack! nigde ne opominje).
//
// Roditelj koji je u međuvremenu uključio članstvo preskače se sam: njegovom
// detetu je `clanstvo_do` pomeren preko roka poklona, pa i podsetnik i anketa i
// istek vrate false.
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { withCronLog, must } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendZackAktivacijaEmail,
  sendZackPinPodsetnikEmail,
  sendZackAnketaEmail,
  sendZackIstekEmail,
  sendZackPoklonPodsetnikEmail,
} from "@/lib/email";
import { ZACK_PROMO_RSD } from "@/lib/zack/clanstvo";
import { jePoklonStavka, vremeZaPodsetnik } from "@/lib/zack/poklon";
import { vremeZaAktivaciju, vremeZaAnketu, vremeZaIstek, vremeZaPin } from "@/lib/zack/anketa";

type Stavka = { dete_id?: string | null };

/** Kolone-tragovi na detetu; nabrojane da se ime kolone ne može omaći u kucanju. */
type Trag =
  | "pin_podsetnik_at"
  | "aktivacija_podsetnik_at"
  | "anketa_poslata_at"
  | "poklon_podsetnik_at"
  | "istek_mejl_at";

async function cronHandler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createAdminClient();
  const sada = new Date();
  const brojac = { pin: 0, aktivacija: 0, anketa: 0, podsetnik: 0, istek: 0, preskoceno: 0 };

  // Poklon-porudžbine se ne mogu filtrirati u upitu (oznaka živi u JSONB nizu),
  // pa se čitaju poklon-porudžbine i prosejavaju istom funkcijom koju koristi i
  // dodela pristupa - jedno mesto zna šta je poklon.
  const porudzbine = must(
    await sb
      .from("orders")
      .select("id, email, full_name, items")
      .eq("payment_status", "completed")
      .eq("payment_method", "poklon"),
    "orders poklon"
  );

  for (const o of porudzbine ?? []) {
    const stavke = Array.isArray(o.items) ? (o.items as Stavka[]) : [];
    if (!stavke.some((s) => jePoklonStavka(s))) continue;
    const deteId = stavke[0]?.dete_id;
    if (!deteId) continue;

    const { data: dete } = await sb
      .from("zack_deca")
      .select(
        "id, ime, kod, pin_hash, created_at, poslednji_dan, clanstvo_do, pin_podsetnik_at, aktivacija_podsetnik_at, anketa_poslata_at, poklon_podsetnik_at, istek_mejl_at"
      )
      .eq("id", deteId)
      .maybeSingle();
    // Dete koje roditelj obriše ne dobija ništa - i to je u redu.
    if (!dete) continue;

    const stanje = {
      sada,
      napravljeno: dete.created_at,
      poslednjiDan: dete.poslednji_dan,
      pinPostavljen: dete.pin_hash !== null,
      clanstvoDo: dete.clanstvo_do,
    };

    /** Upis traga PA slanje - vidi zaglavlje. Pad upisa obara cron kroz must. */
    const obelezi = async (kolona: Trag) => {
      must(
        await sb
          .from("zack_deca")
          .update({ [kolona]: sada.toISOString() } as Record<Trag, string>)
          .eq("id", dete.id)
          .select("id"),
        `zack_deca ${kolona}`
      );
    };

    // Redosled provera je redosled po hitnosti: bez PIN-a dete NE MOŽE da uđe,
    // pa to ide prvo; mejl o isteku je najmanje hitan.
    if (!dete.pin_podsetnik_at && vremeZaPin(stanje)) {
      await obelezi("pin_podsetnik_at");
      await sendZackPinPodsetnikEmail(o.email, o.full_name, {
        imeDeteta: dete.ime,
        kod: dete.kod,
      });
      brojac.pin++;
      continue;
    }

    if (!dete.aktivacija_podsetnik_at && vremeZaAktivaciju(stanje)) {
      await obelezi("aktivacija_podsetnik_at");
      await sendZackAktivacijaEmail(o.email, o.full_name, {
        imeDeteta: dete.ime,
        kod: dete.kod,
        pinNijePostavljen: dete.pin_hash === null,
      });
      brojac.aktivacija++;
      continue;
    }

    if (!dete.anketa_poslata_at && vremeZaAnketu(stanje)) {
      // Red ankete mora da postoji PRE mejla: prvo pitanje se odgovara klikom
      // iz mejla, pa link vodi na nešto što već čeka odgovor.
      const token = crypto.randomBytes(24).toString("base64url");
      const { error } = await sb.from("zack_ankete").insert({ dete_id: dete.id, token });
      if (error) throw new Error(`Ne mogu da otvorim anketu za dete ${dete.id}: ${error.message}`);
      await obelezi("anketa_poslata_at");
      await sendZackAnketaEmail(o.email, o.full_name, { imeDeteta: dete.ime, token });
      brojac.anketa++;
      continue;
    }

    if (!dete.poklon_podsetnik_at && vremeZaPodsetnik(sada, dete.clanstvo_do)) {
      await obelezi("poklon_podsetnik_at");
      await sendZackPoklonPodsetnikEmail(o.email, o.full_name, {
        imeDeteta: dete.ime,
        vaziDo: dete.clanstvo_do!,
        mesecnoRsd: ZACK_PROMO_RSD,
      });
      brojac.podsetnik++;
      continue;
    }

    if (!dete.istek_mejl_at && vremeZaIstek(sada, dete.clanstvo_do)) {
      await obelezi("istek_mejl_at");
      await sendZackIstekEmail(o.email, o.full_name, {
        imeDeteta: dete.ime,
        mesecnoRsd: ZACK_PROMO_RSD,
      });
      brojac.istek++;
      continue;
    }

    brojac.preskoceno++;
  }

  console.log(
    `[cron/zack-poklon-mejlovi] pin ${brojac.pin}, aktivacija ${brojac.aktivacija}, anketa ${brojac.anketa}, ` +
      `podsetnik ${brojac.podsetnik}, istek ${brojac.istek}, bez posla ${brojac.preskoceno}`
  );
  return NextResponse.json(brojac);
}

export const GET = withCronLog("zack-poklon-mejlovi", cronHandler);
