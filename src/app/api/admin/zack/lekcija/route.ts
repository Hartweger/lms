import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

// Upis jedne lekcije sa spiskom reči. Namerno je sve u jednom pozivu, jer je
// lekcija najmanja celina koju Nataša unosi i nema smisla da se pola upiše.

type UlaznaRec = {
  de: string;
  sr: string;
  rod?: "der" | "die" | "das" | "nema";
  mnozina?: string | null;
  vrsta?: "imenica" | "glagol" | "pridev" | "ostalo";
  izuzetak?: boolean;
};

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  const body = await request.json();
  const { udzbenikId, broj, naziv, praviloNaslov, praviloTekst, praviloPrimer } = body;
  const reci: UlaznaRec[] = Array.isArray(body.reci) ? body.reci : [];

  if (!udzbenikId || !naziv || !Number.isInteger(broj) || broj < 1) {
    return NextResponse.json(
      { error: "udzbenikId, broj i naziv su obavezni" },
      { status: 400 }
    );
  }
  if (reci.length === 0) {
    return NextResponse.json({ error: "Lekcija mora imati bar jednu reč" }, { status: 400 });
  }
  const prazna = reci.findIndex((r) => !r.de?.trim() || !r.sr?.trim());
  if (prazna !== -1) {
    return NextResponse.json(
      { error: `Reč broj ${prazna + 1} nema nemački ili naš oblik` },
      { status: 400 }
    );
  }

  const { data: lekcija, error: greskaLekcije } = await admin
    .from("zack_lekcije")
    .upsert(
      {
        udzbenik_id: udzbenikId,
        broj,
        naziv,
        pravilo_naslov: praviloNaslov ?? null,
        pravilo_tekst: praviloTekst ?? null,
        pravilo_primer: praviloPrimer ?? null,
      },
      { onConflict: "udzbenik_id,broj" }
    )
    .select("id")
    .single();

  if (greskaLekcije || !lekcija) {
    return NextResponse.json(
      { error: greskaLekcije?.message ?? "Lekcija nije upisana" },
      { status: 500 }
    );
  }

  // Ponovni unos iste lekcije zamenjuje spisak reči u celosti. To je namerno:
  // Nataša ispravlja spisak u tabeli i ponovo ga nalepi, a ne dopunjava red po red.
  await admin.from("zack_reci").delete().eq("lekcija_id", lekcija.id);

  const { error: greskaReci } = await admin.from("zack_reci").insert(
    reci.map((r, i) => ({
      lekcija_id: lekcija.id,
      redni_broj: i + 1,
      de: r.de.trim(),
      sr: r.sr.trim(),
      rod: r.rod ?? "nema",
      mnozina: r.mnozina?.trim() || null,
      vrsta: r.vrsta ?? "ostalo",
      izuzetak: Boolean(r.izuzetak),
    }))
  );

  if (greskaReci) {
    return NextResponse.json({ error: greskaReci.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, lekcijaId: lekcija.id, upisanoReci: reci.length });
}
