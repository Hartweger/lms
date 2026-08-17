// Ekran jedne lekcije. Sve čita service-role klijentom, jer je RLS na zack_*
// tabelama potpuno zatvoren, a dete u ovoj fazi nema svoj Supabase nalog nego
// se prepoznaje po ključu iz adrese.
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { stanjeAlbuma } from "@/lib/zack/album";
import { nadjiDete, neotvoreneKesice, reciLekcije, zapisiSlicica } from "@/lib/zack/upiti";
import LekcijaClient from "./LekcijaClient";

// Album se menja posle svake odigrane igre, pa keširana lekcija vredi manje od
// ničega: dete bi videlo staro stanje i mislilo da mu se rad izgubio.
export const dynamic = "force-dynamic";

export default async function LekcijaPage({
  params,
}: {
  params: Promise<{ childId: string; broj: string }>;
}) {
  const { childId, broj } = await params;

  // Broj iz adrese je tekst. Puštamo samo cifre, i to najviše četiri, jer je
  // `broj` u bazi SMALLINT pa bi ga veći broj prelio i dao 500 umesto 404.
  if (!/^\d{1,4}$/.test(broj)) notFound();

  // nadjiDete vraća null i za ključ koji uopšte nije uuid, pa neispravna adresa
  // daje poštenu 404 stranicu umesto greške iz Postgresa.
  const dete = await nadjiDete(childId);
  if (!dete) notFound();

  const sb = createAdminClient();
  // Lekcija se traži UNUTAR udžbenika deteta, ne po broju u celoj bazi. Bez
  // uslova na udžbenik dete bi na svojoj adresi otvorilo tuđu lekciju.
  const { data: lekcija, error } = await sb
    .from("zack_lekcije")
    .select("id, broj, naziv, pravilo_naslov, pravilo_tekst, pravilo_primer")
    .eq("udzbenik_id", dete.udzbenik_id)
    .eq("broj", Number(broj))
    .maybeSingle();
  if (error) throw new Error(`Ne mogu da pročitam lekciju: ${error.message}`);
  if (!lekcija) notFound();

  const [reci, zapisi, kesice] = await Promise.all([
    reciLekcije(lekcija.id),
    // zapisiSlicica vraća SAMO isporučene sličice, pa album ne može da oda reč
    // koja još čeka u neotvorenoj kesici.
    zapisiSlicica(dete.id),
    neotvoreneKesice(dete.id),
  ]);

  return (
    <LekcijaClient
      childId={dete.id}
      lekcija={lekcija}
      reci={reci}
      pocetnoStanje={stanjeAlbuma(reci, zapisi, new Date())}
      neotvorenaKesica={kesice.get(lekcija.id) ?? 0}
    />
  );
}
