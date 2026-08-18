import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { izracunajBrisanje, normalizujDe, pripremiReci } from "@/lib/zack/lekcija-upis";

// Upis jedne lekcije sa spiskom reči. Namerno je sve u jednom pozivu, jer je
// lekcija najmanja celina koju Nataša unosi i nema smisla da se pola upiše.
//
// ZAŠTO SE REČ PREPOZNAJE PO NEMAČKOM OBLIKU (`de`), A NE PO POZICIJI
// ------------------------------------------------------------------
// zack_slicice.rec_id ima ON DELETE CASCADE. Znači, čim se red iz zack_reci
// obriše, kaskadno nestaju sličice SVE DECE za tu reč. Prva verzija ove rute
// radila je `delete` nad svim rečima lekcije pa `insert` ponovo, pa bi svaka
// ispravka jedne kucaće greške tiho, na uspešnom pozivu, obrisala celu stranu
// albuma svakom detetu.
//
// Zato reč sada ima svoj ključ: UNIQUE (lekcija_id, de). Ponovni unos radi
// `upsert` na tom ključu, pa reč koja ostaje u spisku zadržava svoj `id` i
// sličice dece prežive i ispravku prevoda, i promenu roda, i premeštanje reči
// gore-dole. Briše se isključivo ono što je Nataša stvarno izbacila iz spiska,
// i to se vraća u odgovoru kao `obrisaneReci`, da brisanje ne bude nevidljivo.
// Pazi: pošto je `de` ključ, ispravka samog nemačkog oblika JESTE brisanje -
// stara reč nestaje sa svim sličicama, a nova ulazi prazna.
//
// NE VRAĆAJ `delete` nad celom lekcijom. To nije čišćenje spiska, to je
// oduzimanje detetu onoga što je zaradilo.
//
// ZAŠTO SE PRVO PITA, PA TEK ONDA PIŠE
// ------------------------------------
// Lekcija se pogađa po (udzbenik_id, broj). Omaška u broju - spisak za lekciju
// 7 poslat pod brojem 1 - gađa tuđu lekciju i briše njene reči. Zato se ovde
// prvo samo ČITA šta bi nestalo, pa ako bi nešto nestalo a potvrda nije stigla,
// vraća se 409 i baza se ne dira ni na koji način. Piše se tek kad je jasno da
// se ništa ne gubi ili da je gubitak potvrđen.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PostojecaRec = { id: string; de: string };

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

function jeNeprazanTekst(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Polje pravila: sme da se ne pošalje, sme da bude null, a ako se pošalje kao
 * nešto treće mora biti tekst. Neposlato polje je najčešći slučaj i nije greška.
 */
function citajPravilo(v: unknown): { ok: true; vrednost: string | null } | { ok: false } {
  if (v === undefined) return { ok: true, vrednost: null };
  if (v === null) return { ok: true, vrednost: null };
  if (typeof v === "string") return { ok: true, vrednost: v.trim() || null };
  return { ok: false };
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  // 1. Telo zahteva. Neispravan JSON baca SyntaxError, koji bi bez ovoga
  // izleteo kao goli 500 bez ijedne upotrebljive poruke.
  let telo: unknown;
  try {
    telo = await request.json();
  } catch {
    return greska("Telo zahteva nije ispravan JSON", 400);
  }
  if (typeof telo !== "object" || telo === null || Array.isArray(telo)) {
    return greska("Telo zahteva mora biti objekat", 400);
  }
  const body = telo as Record<string, unknown>;

  // 2. SVE provere idu pre ijednog dodira baze. Ono što može da bude odbijeno
  // mora da bude odbijeno dok u bazi još ništa nije pomereno.
  const udzbenikId = body.udzbenikId;
  const naziv = body.naziv;
  const broj = body.broj;

  if (!jeNeprazanTekst(udzbenikId)) {
    return greska("Nedostaje udzbenikId", 400);
  }
  if (!UUID.test(udzbenikId.trim())) {
    return greska("udzbenikId nije ispravan", 400);
  }
  if (!jeNeprazanTekst(naziv)) {
    return greska("Nedostaje naziv lekcije", 400);
  }
  if (typeof broj !== "number" || !Number.isInteger(broj) || broj < 1 || broj > 32767) {
    return greska("Broj lekcije mora biti ceo broj između 1 i 32767", 400);
  }

  const praviloNaslov = citajPravilo(body.praviloNaslov);
  const praviloTekst = citajPravilo(body.praviloTekst);
  const praviloPrimer = citajPravilo(body.praviloPrimer);
  if (!praviloNaslov.ok || !praviloTekst.ok || !praviloPrimer.ok) {
    return greska("Polja pravila moraju biti tekst", 400);
  }

  const priprema = pripremiReci(body.reci);
  if (!priprema.ok) {
    return greska(priprema.greska, 400);
  }
  const pripremljene = priprema.reci;

  // 3. Da li lekcija sa tim brojem već postoji. Ovo je samo čitanje.
  const { data: postojecaLekcija, error: greskaTrazenja } = await admin
    .from("zack_lekcije")
    .select("id")
    .eq("udzbenik_id", udzbenikId.trim())
    .eq("broj", broj)
    .maybeSingle();

  if (greskaTrazenja) {
    console.error("[zack/lekcija] traženje lekcije:", greskaTrazenja);
    return greska("Lekcija nije pročitana", 500);
  }

  // 4. Šta bi nestalo. Isto tako, samo čitanje.
  let postojece: PostojecaRec[] = [];
  if (postojecaLekcija) {
    const { data, error: greskaCitanja } = await admin
      .from("zack_reci")
      .select("id, de")
      .eq("lekcija_id", postojecaLekcija.id);

    if (greskaCitanja) {
      console.error("[zack/lekcija] čitanje postojećih reči:", greskaCitanja);
      return greska("Postojeće reči lekcije nisu pročitane", 500);
    }
    postojece = (data ?? []) as PostojecaRec[];
  }

  const zaBrisanje = izracunajBrisanje(
    postojece,
    pripremljene.map((r) => r.de)
  );
  const zaBrisanjeSet = new Set(zaBrisanje);
  const obrisaceSe = postojece.filter((r) => zaBrisanjeSet.has(r.id)).map((r) => normalizujDe(r.de));

  // 5. Ako bi se nešto brisalo a potvrda nije stigla, stajemo ovde. Do sada nije
  // upisano ništa, pa Nataša koja je pogrešila broj lekcije vidi tuđe reči u
  // odgovoru i može da odustane, a u bazi je sve ostalo netaknuto.
  if (zaBrisanje.length > 0 && body.potvrdaBrisanja !== true) {
    const { count, error: greskaBrojanja } = await admin
      .from("zack_slicice")
      .select("id", { count: "exact", head: true })
      .in("rec_id", zaBrisanje);

    if (greskaBrojanja) {
      console.error("[zack/lekcija] brojanje sličica:", greskaBrojanja);
      return greska("Sličice nisu prebrojane", 500);
    }

    const brojSlicica = count ?? 0;
    return NextResponse.json(
      {
        potrebnaPotvrda: true,
        obrisaceSe,
        brojSlicica,
        poruka:
          `Ovaj upis briše ${obrisaceSe.length} reči iz lekcije ${broj}, a sa njima i ` +
          `${brojSlicica} već zarađenih sličica dece. Ako ovo nije lekcija koju si htela, ` +
          `proveri broj lekcije. Ako jeste, pošalji ponovo sa potvrdaBrisanja: true.`,
      },
      { status: 409 }
    );
  }

  // 6. Od ovog reda počinje upis. Polja pravila se upisuju samo ako su stvarno
  // poslata, da ponovni unos spiska reči bez pravila ne obriše pravilo koje već
  // stoji.
  const zaUpisLekcije: Record<string, unknown> = {
    udzbenik_id: udzbenikId.trim(),
    broj,
    naziv: naziv.trim(),
  };
  if (body.praviloNaslov !== undefined) zaUpisLekcije.pravilo_naslov = praviloNaslov.vrednost;
  if (body.praviloTekst !== undefined) zaUpisLekcije.pravilo_tekst = praviloTekst.vrednost;
  if (body.praviloPrimer !== undefined) zaUpisLekcije.pravilo_primer = praviloPrimer.vrednost;

  const { data: lekcija, error: greskaLekcije } = await admin
    .from("zack_lekcije")
    .upsert(zaUpisLekcije, { onConflict: "udzbenik_id,broj" })
    .select("id")
    .single();

  if (greskaLekcije || !lekcija) {
    console.error("[zack/lekcija] upis lekcije:", greskaLekcije);
    if (greskaLekcije?.code === "23503") {
      return greska("Udžbenik sa tim id-jem ne postoji", 400);
    }
    return greska("Lekcija nije upisana", 500);
  }
  const lekcijaId: string = lekcija.id;

  // 7. Brisanje ide PRE upisa reči i taj redosled se ne menja: reč koja se briše
  // i dalje drži svoj redni_broj, pa bi nova reč koja dobija taj isti redni_broj
  // pukla o UNIQUE (lekcija_id, redni_broj). Odloženo ograničenje pomaže samo
  // unutar jednog upisa, a ovo su dva odvojena poziva.
  if (zaBrisanje.length > 0) {
    // Jedini put na kome sličice i dalje nestaju. Ispravno je, jer je Nataša
    // reč stvarno izbacila i potvrdila brisanje, ali se spisak vraća u odgovoru.
    const { error: greskaBrisanja } = await admin
      .from("zack_reci")
      .delete()
      .in("id", zaBrisanje);
    if (greskaBrisanja) {
      console.error("[zack/lekcija] brisanje izbačenih reči:", greskaBrisanja);
      return greska("Izbačene reči nisu obrisane", 500);
    }
  }

  // 8. Upis reči bez brisanja. Reč koja ostaje zadržava svoj id, pa sličice
  // dece prežive.
  const { error: greskaReci } = await admin.from("zack_reci").upsert(
    pripremljene.map((r) => ({ lekcija_id: lekcijaId, ...r })),
    { onConflict: "lekcija_id,de" }
  );

  if (greskaReci) {
    console.error("[zack/lekcija] upis reči:", greskaReci);
    return greska("Reči lekcije nisu upisane", 500);
  }

  return NextResponse.json({
    ok: true,
    lekcijaId,
    upisanoReci: pripremljene.length,
    obrisanoReci: zaBrisanje.length,
    obrisaneReci: obrisaceSe,
  });
}
