// Ekran jedne lekcije. Sve čita service-role klijentom, jer je RLS na zack_*
// tabelama potpuno zatvoren, a dete u ovoj fazi nema svoj Supabase nalog nego
// se prepoznaje po ključu iz adrese.
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { stanjeAlbuma, stanjeZapisa } from "@/lib/zack/album";
import type { StaraRec } from "@/lib/zack/ponavljanje";
import {
  dozvoljenaGramatika,
  greskeReci,
  nadjiDete,
  neotvoreneKesice,
  reciLekcije,
  rekordZaIgru,
  stareReciUdzbenika,
  zapisiSlicica,
} from "@/lib/zack/upiti";
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

  const [reci, zapisi, kesice, rekordSkakaca, gramatika, sveStare, greske] = await Promise.all([
    reciLekcije(lekcija.id),
    // zapisiSlicica vraća SAMO isporučene sličice, pa album ne može da oda reč
    // koja još čeka u neotvorenoj kesici.
    zapisiSlicica(dete.id),
    neotvoreneKesice(dete.id),
    // Rekord se dovlači ovde, uz lekciju, da bi linija na steni stajala već u
    // prvom kadru partije. Da se dovlači iz same igre, prvi skokovi bi prošli
    // bez nje.
    rekordZaIgru(dete.id, lekcija.id, "skakac"),
    // Samo da bi se znalo DA LI Milioner uopšte ima šta da pita iz ove lekcije.
    // Bez ijedne obrađene gramatičke tačke se ne prikazuje, jer bi otvarao
    // prazan ekran. Sama pitanja dovlači ruta, kad dete uđe.
    dozvoljenaGramatika(dete.udzbenik_id, lekcija.broj),
    // Ponavljanje kroz module: reči ranijih lekcija i greške deteta. Za prvu
    // lekciju su oba prazna i sve radi kao i do sad.
    stareReciUdzbenika(dete.udzbenik_id, lekcija.broj),
    greskeReci(dete.id),
  ]);

  const sada = new Date();

  // Kandidati za ponavljanje su ISKLJUČIVO stare reči koje dete već ima u
  // albumu (isporučena sličica postoji). Reč koju nikad nije zaradilo se ne
  // meša: tačan odgovor na nju bi kroz `zaradi` napravio NOVU sličicu u kesici
  // stare lekcije, a ponavljanje ne sme ništa novo da deli - samo da vraća
  // boju. Za viđene reči `zaradi` osveži samo `poslednje_tacno_at`.
  const poRecId = new Map(zapisi.map((z) => [z.rec_id, z]));
  const stareReci: StaraRec[] = sveStare.flatMap((rec) => {
    const stanje = stanjeZapisa(poRecId.get(rec.id), sada);
    if (stanje === "prazno") return [];
    return [{ rec, izbledela: stanje === "izbledela", gresaka: greske.get(rec.id) ?? 0 }];
  });

  return (
    <LekcijaClient
      childId={dete.id}
      lekcija={lekcija}
      reci={reci}
      stareReci={stareReci}
      pocetnoStanje={stanjeAlbuma(reci, zapisi, sada)}
      neotvorenaKesica={kesice.get(lekcija.id) ?? 0}
      pocetniRekord={rekordSkakaca}
      imaGramatike={gramatika.length > 0}
    />
  );
}
