// Otvaranje kesice. Ne prima ništa iz igre, nego sam čita šta je dete zaradilo
// a još nije videlo.
//
// Zarađivanje je već obavljeno rutom `zaradi`, red po red, posle svakog tačnog
// odgovora. Ovde se samo bira šta od toga ulazi u ovu kesicu i tim redovima se
// upisuje `isporucena_at`. Ono što ne stane OSTAJE neisporučeno i doći će u
// sledećoj kesici. To je namerno i tako mora, jer je retkost izuzetaka ono što
// tera dete da odigra još jednu igru.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { otvoriKesicu } from "@/lib/zack/kesica";
import { jeUuid, nadjiDete, reciLekcije } from "@/lib/zack/upiti";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

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
  const lekcijaId = (telo as Record<string, unknown>).lekcijaId;
  if (typeof lekcijaId !== "string" || !jeUuid(lekcijaId)) {
    return greska("Nedostaje ispravan lekcijaId", 400);
  }

  const reci = await reciLekcije(lekcijaId);
  if (reci.length === 0) {
    return NextResponse.json({ kesica: [], ostaloNeisporuceno: 0 });
  }

  const sb = createAdminClient();

  // Kandidati su isključivo redovi koje dete još nije videlo.
  const { data: neisporuceni, error: greskaCitanja } = await sb
    .from("zack_slicice")
    .select("rec_id")
    .eq("dete_id", dete.id)
    .in(
      "rec_id",
      reci.map((r) => r.id)
    )
    .is("isporucena_at", null);
  if (greskaCitanja) {
    console.error("[zack/kesica] čitanje neisporučenih sličica:", greskaCitanja);
    return greska("Sadržaj kesice nije pročitan", 500);
  }

  const kandidati = (neisporuceni ?? []).map((r) => r.rec_id);
  if (kandidati.length === 0) {
    return NextResponse.json({ kesica: [], ostaloNeisporuceno: 0 });
  }

  // `vecImam` je prazan skup namerno: svaki kandidat je po definiciji reč koju
  // dete još nije videlo, pa nema šta da se izbacuje kao već viđeno.
  const kesica = otvoriKesicu(reci, kandidati, new Set<string>(), Math.random);

  if (kesica.length > 0) {
    // Uslov `isporucena_at IS NULL` ostaje i u upisu, da dva poziva u isti mah
    // ne pomere vreme isporuke redu koji je već izašao iz kesice.
    const { error } = await sb
      .from("zack_slicice")
      .update({ isporucena_at: new Date().toISOString() })
      .eq("dete_id", dete.id)
      .in(
        "rec_id",
        kesica.map((r) => r.id)
      )
      .is("isporucena_at", null);
    if (error) {
      console.error("[zack/kesica] upis isporuke:", error);
      return greska("Kesica nije otvorena", 500);
    }
  }

  return NextResponse.json({
    kesica,
    ostaloNeisporuceno: kandidati.length - kesica.length,
  });
}
