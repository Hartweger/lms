import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { normalizujDe } from "@/lib/zack/lekcija-upis";
import { pripremiRecenice } from "@/lib/zack/recenica-upis";

// Upis SVIH rečenica jedne lekcije odjednom, iz tabele koju Nataša nalepi.
// Lekcija je najmanja celina koja ima smisla: rečenice se pišu uz spisak reči
// te lekcije, pa nema razloga da se pola upiše.
//
// ZAŠTO OVDE SME `delete` PA `insert`, A KOD REČI NE SME
// -----------------------------------------------------
// Kod reči je brisanje zabranjeno jer zack_slicice.rec_id ima ON DELETE
// CASCADE - obrisana reč nosi sa sobom zarađene sličice sve dece. Na rečenici
// ne visi ništa detetovo. Sličice i greške se knjiže na GLAVNU REČ (`rec_id`),
// nikad na sam red rečenice, pa zamena spiska rečenica ne oduzima nikome ništa:
// album, kesica, niz i memorija grešaka posle ovog upisa izgledaju isto kao
// pre njega. Zato ovde nema ni ključa (lekcija_id, de) kao spasa ni potvrde
// brisanja - nema šta da se potvrđuje.
//
// Zamena, a ne upsert, jer redni_broj prati red u tabeli: da se samo pisalo
// preko postojećeg, izbačena rečenica bi ostala da visi, a premeštanje dve
// rečenice gore-dole puklo bi o UNIQUE (lekcija_id, redni_broj).
//
// ŠTA AKO INSERT PADNE POSLE DELETE-a
// -----------------------------------
// Ovo nisu dva poziva u jednoj transakciji, pa taj prozor postoji: lekcija
// ostaje bez rečenica dok se spisak ne pošalje ponovo. Posledica je da se
// rečenični deo lekcije tada prosto ne pojavi - i to je sve. Ni tada se ne
// dira ništa detetovo, jer na rečenicama ništa detetovo i ne stoji. Odgovor u
// tom slučaju jasno kaže da rečenice nisu upisane, da se ne bi mislilo da je
// prošlo.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

function jeNeprazanTekst(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
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

  // 2. SVE provere idu pre ijednog dodira baze, isto kao pri upisu reči.
  const udzbenikId = body.udzbenikId;
  const broj = body.broj;

  if (!jeNeprazanTekst(udzbenikId)) {
    return greska("Nedostaje udzbenikId", 400);
  }
  if (!UUID.test(udzbenikId.trim())) {
    return greska("udzbenikId nije ispravan", 400);
  }
  if (typeof broj !== "number" || !Number.isInteger(broj) || broj < 1 || broj > 32767) {
    return greska("Broj lekcije mora biti ceo broj između 1 i 32767", 400);
  }

  // 3. Lekcija se pogađa po (udzbenik_id, broj), isto kao pri upisu reči.
  // Ovde se lekcija NE pravi: rečenice se kače na reči, pa lekcija bez reči
  // nema glavnu reč ni za jednu rečenicu.
  const { data: lekcija, error: greskaTrazenja } = await admin
    .from("zack_lekcije")
    .select("id")
    .eq("udzbenik_id", udzbenikId.trim())
    .eq("broj", broj)
    .maybeSingle();

  if (greskaTrazenja) {
    console.error("[zack/recenice] traženje lekcije:", greskaTrazenja);
    return greska("Lekcija nije pročitana", 500);
  }
  if (!lekcija) {
    return greska(`Lekcija ${broj} ne postoji - prvo upiši reči lekcije`, 400);
  }
  const lekcijaId: string = lekcija.id;

  // 4. Reči te lekcije, po nemačkom obliku. Iz njih `pripremiRecenice` pogađa
  // glavnu reč svake rečenice. Ključ se normalizuje istom funkcijom kojom se
  // normalizuje i pri upisu reči, da razmak viška u nalepljenoj tabeli ne bi
  // značio „nije reč ove lekcije".
  const { data: reci, error: greskaReci } = await admin
    .from("zack_reci")
    .select("id, de")
    .eq("lekcija_id", lekcijaId);

  if (greskaReci) {
    console.error("[zack/recenice] čitanje reči lekcije:", greskaReci);
    return greska("Reči lekcije nisu pročitane", 500);
  }

  const poDe = new Map<string, string>();
  for (const rec of (reci ?? []) as { id: string; de: string }[]) {
    poDe.set(normalizujDe(rec.de), rec.id);
  }

  // 5. Provera celog spiska. Prva pokvarena rečenica ruši ceo upis, sa brojem
  // reda u poruci: pola upisane lekcije bi detetu davalo pitanja bez rešenja.
  const priprema = pripremiRecenice(body.recenice, poDe);
  if (!priprema.ok) {
    return greska(priprema.greska, 400);
  }

  // 6. Od ovog reda počinje upis. Do sada baza nije pomerena ni za red.
  const { error: greskaBrisanja } = await admin
    .from("zack_recenice")
    .delete()
    .eq("lekcija_id", lekcijaId);

  if (greskaBrisanja) {
    console.error("[zack/recenice] brisanje starih rečenica:", greskaBrisanja);
    return greska("Stare rečenice lekcije nisu obrisane", 500);
  }

  const { error: greskaUpisa } = await admin
    .from("zack_recenice")
    .insert(priprema.recenice.map((r) => ({ lekcija_id: lekcijaId, ...r })));

  if (greskaUpisa) {
    console.error("[zack/recenice] upis rečenica:", greskaUpisa);
    return greska("Rečenice lekcije nisu upisane, lekcija je ostala bez njih", 500);
  }

  return NextResponse.json({ ok: true, upisano: priprema.recenice.length });
}
