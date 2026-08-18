// Jedna lekcija: podsetnik, reči i stanje albuma za to dete.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stanjeAlbuma } from "@/lib/zack/album";
import { nadjiDete, neotvoreneKesice, reciLekcije, zapisiSlicica } from "@/lib/zack/upiti";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ childId: string; broj: string }> }
) {
  const { childId, broj } = await params;

  // Broj iz adrese je tekst. Puštamo samo cifre, da NaN nikad ne uđe u upit.
  if (!/^\d+$/.test(broj)) {
    return NextResponse.json({ error: "Broj lekcije nije ispravan" }, { status: 400 });
  }
  const brojLekcije = Number(broj);

  const dete = await nadjiDete(childId);
  if (!dete) return NextResponse.json({ error: "Nema takvog deteta" }, { status: 404 });

  const sb = createAdminClient();
  // Lekciju tražimo unutar udžbenika deteta, ne po broju u celoj bazi.
  const { data: lekcija, error } = await sb
    .from("zack_lekcije")
    .select("id, broj, naziv, pravilo_naslov, pravilo_tekst, pravilo_primer")
    .eq("udzbenik_id", dete.udzbenik_id)
    .eq("broj", brojLekcije)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!lekcija) return NextResponse.json({ error: "Nema takve lekcije" }, { status: 404 });

  const [reci, zapisi, kesice] = await Promise.all([
    reciLekcije(lekcija.id),
    zapisiSlicica(dete.id),
    neotvoreneKesice(dete.id),
  ]);

  return NextResponse.json({
    lekcija,
    reci,
    album: stanjeAlbuma(reci, zapisi, new Date()),
    neotvorenaKesica: kesice.get(lekcija.id) ?? 0,
  });
}
