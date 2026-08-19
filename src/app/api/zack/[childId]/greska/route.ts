// Beleženje grešaka: pogrešno odgovorene reči iz igara i promašena Milionerova
// pitanja. Iz ovoga ponavljanje kroz module zna šta da vrati pred dete, a
// Milioner koja pitanja da favorizuje.
//
// POŠALJI-I-ZABORAVI
// ------------------
// Igre ovaj poziv šalju u pozadini i NE čekaju odgovor: greška u igri ne sme da
// uspori igru, a pad mreže ne sme ništa da obori. Zato ovde nema ničega što se
// detetu javlja - odgovor čita samo log. Izgubljen poziv znači samo da se jedna
// greška ne zapamti, a to je gubitak koji sme da se desi: sledeća ista greška
// će je zapamtiti.
//
// JEDAN RED PO REČI (ILI PITANJU)
// -------------------------------
// Postojećem redu se uveća `broj` i osveži `poslednja_at`; nov red kreće od
// jedan. Nema običnog upserta jer uvećanje traži pročitan stari broj, pa se
// radi u dva koraka kao u `zaradi`: prvo se pročita šta postoji, pa se
// postojeće uvećava, a novo ubacuje. Trka dva brza poziva se razrešava na
// UNIQUE indeksu: duplikat pri ubacivanju se tiho proguta, jer je greška u tom
// slučaju već zapisana - samo joj je brojač za jedan tanji.
//
// ŠTA SME DA SE ZABELEŽI
// ----------------------
// Samo reč, odnosno pitanje, iz udžbenika ovog deteta. Tuđi ključevi se TIHO
// ispuštaju i prebroje u `odbijeno`, istim obrascem kao u `zaradi`: u istom
// spisku sa jednim nevažećim ključem mogu da stoje i pošteni, i oni moraju da
// prođu.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jeUuid,
  nadjiDete,
  pitanjaUUdzbeniku,
  reciUUdzbeniku,
  NAJVISE_RECI,
} from "@/lib/zack/upiti";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

/** Gornja granica SMALLINT kolone `broj`. Preko nje se ne broji dalje. */
const NAJVECI_BROJ = 32767;

/**
 * Spisak ključeva iz tela, pod zadatim imenom. Neposlat ili prazan spisak nije
 * greška, samo nema šta da se upiše - isti stav kao u `zaradi`. Neispravan
 * oblik ključa bi u Postgresu izazvao grešku i time 500 umesto poštenog 400,
 * zato se proverava pre upita.
 */
function citajIdove(
  telo: Record<string, unknown>,
  kljuc: "recIdovi" | "pitanjeIdovi"
): { ok: true; idovi: string[] } | { ok: false } {
  const sirovo = telo[kljuc];
  if (sirovo === undefined || sirovo === null) return { ok: true, idovi: [] };
  if (!Array.isArray(sirovo)) return { ok: false };
  if (!sirovo.every((v) => typeof v === "string" && jeUuid(v))) return { ok: false };
  return { ok: true, idovi: [...new Set(sirovo as string[])] };
}

export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;

  const dete = await nadjiDete(childId);
  if (!dete) return greska("Nema takvog deteta", 404);

  let telo: unknown;
  try {
    telo = await request.json();
  } catch {
    return greska("Telo zahteva nije ispravan JSON", 400);
  }
  if (typeof telo !== "object" || telo === null || Array.isArray(telo)) {
    return greska("Telo zahteva mora biti objekat", 400);
  }

  const reci = citajIdove(telo as Record<string, unknown>, "recIdovi");
  const pitanja = citajIdove(telo as Record<string, unknown>, "pitanjeIdovi");
  if (!reci.ok || !pitanja.ok) {
    return greska("recIdovi i pitanjeIdovi moraju biti spiskovi ključeva", 400);
  }
  if (reci.idovi.length + pitanja.idovi.length > NAJVISE_RECI) {
    return greska(`Najviše ${NAJVISE_RECI} grešaka odjednom`, 400);
  }

  try {
    // Sve što nije iz udžbenika ovog deteta otpada ovde, pre ijednog upisa.
    const [naseReci, nasaPitanja] = await Promise.all([
      reciUUdzbeniku(reci.idovi, dete.udzbenik_id),
      pitanjaUUdzbeniku(pitanja.idovi, dete.udzbenik_id),
    ]);
    const recIdovi = reci.idovi.filter((id) => naseReci.has(id));
    const pitanjeIdovi = pitanja.idovi.filter((id) => nasaPitanja.has(id));
    const odbijeno =
      reci.idovi.length + pitanja.idovi.length - recIdovi.length - pitanjeIdovi.length;
    if (odbijeno > 0) {
      console.warn(`[zack/greska] odbijeno ${odbijeno} ključeva van udžbenika deteta ${dete.id}`);
    }

    if (recIdovi.length === 0 && pitanjeIdovi.length === 0) {
      return NextResponse.json({ ok: true, zabelezeno: 0, uvecano: 0, odbijeno });
    }

    const sb = createAdminClient();

    // 1. Šta već postoji. Jedan upit pokriva obe vrste ključa. `or` prima samo
    // stvarno poslate spiskove; da su oba prazna, ne bi se ni stiglo dovde.
    // Ključevi su prošli proveru oblika uuid, pa smeju u tekst uslova.
    const uslovi: string[] = [];
    if (recIdovi.length > 0) uslovi.push(`rec_id.in.(${recIdovi.join(",")})`);
    if (pitanjeIdovi.length > 0) uslovi.push(`pitanje_id.in.(${pitanjeIdovi.join(",")})`);
    const { data: postojece, error: greskaCitanja } = await sb
      .from("zack_greske")
      .select("id, broj, rec_id, pitanje_id")
      .eq("dete_id", dete.id)
      .or(uslovi.join(","));
    if (greskaCitanja) {
      console.error("[zack/greska] čitanje postojećih:", greskaCitanja);
      return greska("Greške nisu pročitane", 500);
    }

    // 2. Postojećima broj + 1 (do granice SMALLINT kolone) i svež datum.
    // Redovi se uvećavaju pojedinačno jer svaki nosi svoj broj; poziva sa više
    // od par grešaka u praksi nema, granica od 50 je samo zaštita tela zahteva.
    const sada = new Date().toISOString();
    const uvecanja = await Promise.all(
      (postojece ?? []).map((red) =>
        sb
          .from("zack_greske")
          .update({ broj: Math.min(red.broj + 1, NAJVECI_BROJ), poslednja_at: sada })
          .eq("id", red.id)
      )
    );
    const palo = uvecanja.find((u) => u.error);
    if (palo?.error) {
      console.error("[zack/greska] uvećavanje:", palo.error);
      return greska("Greške nisu osvežene", 500);
    }

    // 3. Novi redovi kreću od jedan.
    const imamRec = new Set((postojece ?? []).map((r) => r.rec_id).filter(Boolean));
    const imamPitanje = new Set((postojece ?? []).map((r) => r.pitanje_id).filter(Boolean));
    const novi = [
      ...recIdovi
        .filter((id) => !imamRec.has(id))
        .map((id) => ({ dete_id: dete.id, rec_id: id, broj: 1, poslednja_at: sada })),
      ...pitanjeIdovi
        .filter((id) => !imamPitanje.has(id))
        .map((id) => ({ dete_id: dete.id, pitanje_id: id, broj: 1, poslednja_at: sada })),
    ];

    let zabelezeno = 0;
    if (novi.length > 0) {
      const { data, error } = await sb.from("zack_greske").insert(novi).select("id");
      if (error) {
        if (error.code === "23505") {
          // Trka dva brza poziva: red je u međuvremenu upisao onaj drugi.
          console.warn("[zack/greska] duplikat u trci, preskačem:", error.message);
        } else {
          console.error("[zack/greska] upis novih:", error);
          return greska("Greške nisu upisane", 500);
        }
      } else {
        zabelezeno = (data ?? []).length;
      }
    }

    return NextResponse.json({
      ok: true,
      zabelezeno,
      uvecano: (postojece ?? []).length,
      odbijeno,
    });
  } catch (e) {
    // Sirova poruka iz Postgresa ide u log, detetu se ne prosleđuje.
    console.error("[zack/greska] beleženje:", e);
    return greska("Greške nisu zabeležene", 500);
  }
}
