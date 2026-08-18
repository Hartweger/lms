// Staza lekcija koju dete vidi kad otvori svoju stranicu. Sve ide preko
// service-role klijenta, jer dete nema svoj Supabase nalog u ovoj fazi.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { brojac, stanjeAlbuma } from "@/lib/zack/album";
import { nadjiDete, neotvoreneKesice, zapisiSlicica } from "@/lib/zack/upiti";

export async function GET(_request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;

  const dete = await nadjiDete(childId);
  if (!dete) return NextResponse.json({ error: "Nema takvog deteta" }, { status: 404 });

  const sb = createAdminClient();
  // Vezujemo se za udžbenik deteta, da staza nikad ne pokaže tuđe lekcije.
  const { data: lekcije, error } = await sb
    .from("zack_lekcije")
    .select("id, broj, naziv, zack_reci(id, redni_broj, de, sr, rod, mnozina, vrsta, izuzetak, ikonica)")
    .eq("udzbenik_id", dete.udzbenik_id)
    .order("broj");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const [zapisi, kesice] = await Promise.all([zapisiSlicica(dete.id), neotvoreneKesice(dete.id)]);
  const sada = new Date();

  return NextResponse.json({
    ime: dete.ime,
    lekcije: (lekcije ?? []).map((lekcija) => {
      // zapisi su sve isporučene sličice deteta, a stanjeAlbuma uzima u obzir
      // samo one koje odgovaraju rečima ove lekcije.
      const { zalepljene, ukupno } = brojac(stanjeAlbuma(lekcija.zack_reci, zapisi, sada));
      return {
        broj: lekcija.broj,
        naziv: lekcija.naziv,
        zalepljene,
        ukupno,
        neotvorenaKesica: kesice.get(lekcija.id) ?? 0,
      };
    }),
  });
}
