// Prva stranica koju dete vidi kad otvori zack. Sve čita service-role
// klijentom, jer je RLS na zack_* tabelama potpuno zatvoren, a dete u ovoj
// fazi nema svoj Supabase nalog nego se prepoznaje po ključu iz adrese.
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { brojac, stanjeAlbuma } from "@/lib/zack/album";
import { nadjiDete, neotvoreneKesice, zapisiSlicica } from "@/lib/zack/upiti";
import StazaClient from "./StazaClient";

// Brojač sličica se menja posle svake odigrane igre, pa keširana staza vredi
// manje od ničega: dete bi videlo stari broj i mislilo da mu se rad izgubio.
export const dynamic = "force-dynamic";

/**
 * Niz dana. Ako čitanje padne, staza samo ne prikaže niz. Niz je konstatacija
 * uz pozdrav, a ne razlog da ekran pukne, pa se greška ovde ne diže dalje.
 */
async function nizDeteta(
  sb: ReturnType<typeof createAdminClient>,
  deteId: string
): Promise<number> {
  const { data, error } = await sb
    .from("zack_deca")
    .select("niz")
    .eq("id", deteId)
    .maybeSingle();
  if (error || !data) {
    console.error("[zack/staza] čitanje niza:", error);
    return 0;
  }
  return data.niz;
}

export default async function StazaPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;

  // nadjiDete vraća null i za ključ koji uopšte nije uuid, pa neispravna
  // adresa daje poštenu 404 stranicu umesto greške iz Postgresa.
  const dete = await nadjiDete(childId);
  if (!dete) notFound();

  const sb = createAdminClient();
  // Vezujemo se za udžbenik deteta, da staza nikad ne pokaže tuđe lekcije.
  // Ugnježdene reči stižu kroz strani ključ zack_reci.lekcija_id; ako ovo
  // ikad počne da vraća prazan niz uz pune tabele, prvo proveri taj ključ.
  const { data: lekcije, error } = await sb
    .from("zack_lekcije")
    .select("id, broj, naziv, zack_reci(id, redni_broj, de, sr, rod, mnozina, vrsta, izuzetak, ikonica)")
    .eq("udzbenik_id", dete.udzbenik_id)
    .order("broj");
  if (error) throw new Error(`Ne mogu da pročitam lekcije: ${error.message}`);

  const [zapisi, kesice, niz] = await Promise.all([
    zapisiSlicica(dete.id),
    neotvoreneKesice(dete.id),
    nizDeteta(sb, dete.id),
  ]);
  const sada = new Date();

  return (
    <StazaClient
      childId={dete.id}
      ime={dete.ime}
      niz={niz}
      lekcije={(lekcije ?? []).map((lekcija) => {
        // zapisi su sve isporučene sličice deteta, a stanjeAlbuma uzima u
        // obzir samo one koje odgovaraju rečima ove lekcije.
        const { zalepljene, ukupno } = brojac(stanjeAlbuma(lekcija.zack_reci, zapisi, sada));
        return {
          broj: lekcija.broj,
          naziv: lekcija.naziv,
          zalepljene,
          ukupno,
          neotvorenaKesica: kesice.get(lekcija.id) ?? 0,
        };
      })}
    />
  );
}
