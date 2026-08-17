import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

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
// i to se vraća u odgovoru kao `obrisanoReci`, da brisanje ne bude nevidljivo.
//
// NE VRAĆAJ `delete` nad celom lekcijom. To nije čišćenje spiska, to je
// oduzimanje detetu onoga što je zaradilo.

const RODOVI = ["der", "die", "das", "nema"] as const;
const VRSTE = ["imenica", "glagol", "pridev", "ostalo"] as const;

type Rod = (typeof RODOVI)[number];
type Vrsta = (typeof VRSTE)[number];

type PripremljenaRec = {
  redni_broj: number;
  de: string;
  sr: string;
  rod: Rod;
  mnozina: string | null;
  vrsta: Vrsta;
  izuzetak: boolean;
};

type PostojecaRec = { id: string; de: string };

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

function jeNeprazanTekst(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function jeRod(v: unknown): v is Rod {
  return typeof v === "string" && (RODOVI as readonly string[]).includes(v);
}

function jeVrsta(v: unknown): v is Vrsta {
  return typeof v === "string" && (VRSTE as readonly string[]).includes(v);
}

/** Polje pravila: sme da se ne pošalje, a ako se pošalje mora biti tekst ili null. */
function citajPravilo(v: unknown): { ok: true; vrednost: string | null } | { ok: false } {
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
    return greska("Telo zahteva nije ispravan JSON", 400);
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

  if (!Array.isArray(body.reci) || body.reci.length === 0) {
    return greska("Lekcija mora imati bar jednu reč", 400);
  }
  const ulazneReci: unknown[] = body.reci;

  const pripremljene: PripremljenaRec[] = [];
  const videnoDe = new Map<string, number>();

  for (let i = 0; i < ulazneReci.length; i++) {
    const red = i + 1;
    const sirova = ulazneReci[i];
    if (typeof sirova !== "object" || sirova === null || Array.isArray(sirova)) {
      return greska(`Reč broj ${red}: red nije ispravno popunjen`, 400);
    }
    const r = sirova as Record<string, unknown>;

    if (!jeNeprazanTekst(r.de)) {
      return greska(`Reč broj ${red}: nedostaje nemačka reč`, 400);
    }
    if (!jeNeprazanTekst(r.sr)) {
      return greska(`Reč broj ${red}: nedostaje prevod na naš jezik`, 400);
    }

    const de = r.de.trim();
    const vecViden = videnoDe.get(de);
    if (vecViden !== undefined) {
      return greska(
        `Reč broj ${red}: nemačka reč „${de}" već postoji u spisku, pod brojem ${vecViden}`,
        400
      );
    }
    videnoDe.set(de, red);

    let rod: Rod = "nema";
    if (r.rod !== undefined && r.rod !== null) {
      if (!jeRod(r.rod)) {
        return greska(
          `Reč broj ${red}: rod „${String(r.rod)}" nije dozvoljen, koristi der, die, das ili nema`,
          400
        );
      }
      rod = r.rod;
    }

    let vrsta: Vrsta = "ostalo";
    if (r.vrsta !== undefined && r.vrsta !== null) {
      if (!jeVrsta(r.vrsta)) {
        return greska(
          `Reč broj ${red}: vrsta „${String(r.vrsta)}" nije dozvoljena, koristi imenica, glagol, pridev ili ostalo`,
          400
        );
      }
      vrsta = r.vrsta;
    }

    const mnozina = typeof r.mnozina === "string" ? r.mnozina.trim() || null : null;

    pripremljene.push({
      redni_broj: red,
      de,
      sr: r.sr.trim(),
      rod,
      mnozina,
      vrsta,
      izuzetak: Boolean(r.izuzetak),
    });
  }

  // 3. Lekcija. Polja pravila se upisuju samo ako su stvarno poslata, da
  // ponovni unos spiska reči bez pravila ne obriše pravilo koje već stoji.
  const zaUpisLekcije: Record<string, unknown> = {
    udzbenik_id: udzbenikId,
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
    return greska("Lekcija nije upisana", 500);
  }
  const lekcijaId: string = lekcija.id;

  // 4. Šta je izbačeno iz spiska. Čita se pre upisa reči, i to namerno: reč
  // koja se briše i dalje drži svoj redni_broj, pa bi nova reč koja dobija taj
  // isti redni_broj pukla o UNIQUE (lekcija_id, redni_broj). Odloženo
  // ograničenje pomaže samo unutar jednog upisa, a ovo su dva odvojena poziva.
  const { data: postojece, error: greskaCitanja } = await admin
    .from("zack_reci")
    .select("id, de")
    .eq("lekcija_id", lekcijaId);

  if (greskaCitanja) {
    console.error("[zack/lekcija] čitanje postojećih reči:", greskaCitanja);
    return greska("Postojeće reči lekcije nisu pročitane", 500);
  }

  const noviDe = new Set(pripremljene.map((r) => r.de));
  const zaBrisanje: string[] = (postojece ?? [])
    .filter((r: PostojecaRec) => !noviDe.has(r.de))
    .map((r: PostojecaRec) => r.id);

  if (zaBrisanje.length > 0) {
    // Jedini put na kome sličice i dalje nestaju. Ispravno je, jer je Nataša
    // reč stvarno izbacila, ali se broj vraća u odgovoru da se to vidi.
    const { error: greskaBrisanja } = await admin
      .from("zack_reci")
      .delete()
      .in("id", zaBrisanje);
    if (greskaBrisanja) {
      console.error("[zack/lekcija] brisanje izbačenih reči:", greskaBrisanja);
      return greska("Izbačene reči nisu obrisane", 500);
    }
  }

  // 5. Upis reči bez brisanja. Reč koja ostaje zadržava svoj id, pa sličice
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
  });
}
