// Zajednički upiti dečjeg dela. Uvek service-role, jer je RLS na zack_* tabelama
// potpuno zatvoren i dete nema svoj Supabase nalog u ovoj fazi. Zbog toga dečji
// deo nikad ne pipa Supabase iz pretraživača, nego isključivo kroz /api/zack/*.
import { createAdminClient } from "@/lib/supabase/admin";
import type { Rec } from "./rec";
import type { ZapisSlicice } from "./album";

export type Dete = { id: string; ime: string; udzbenik_id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Oblik ključa iz adrese. Postgres baca grešku na tekst koji nije uuid. */
export function jeUuid(vrednost: string): boolean {
  return UUID.test(vrednost);
}

export async function nadjiDete(childId: string): Promise<Dete | null> {
  // Proveravamo oblik pre upita, da neispravan ključ iz adrese ne izazove
  // grešku u Postgresu i time 500 umesto poštenog 404.
  if (!jeUuid(childId)) return null;

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_deca")
    .select("id, ime, udzbenik_id")
    .eq("id", childId)
    .maybeSingle();
  if (error) throw new Error(`Ne mogu da pročitam dete: ${error.message}`);
  return data;
}

export async function reciLekcije(lekcijaId: string): Promise<Rec[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_reci")
    .select("id, redni_broj, de, sr, rod, mnozina, vrsta, izuzetak")
    .eq("lekcija_id", lekcijaId)
    .order("redni_broj");
  if (error) throw new Error(`Ne mogu da pročitam reči lekcije: ${error.message}`);
  return data ?? [];
}

/**
 * Sličice koje je dete VEĆ VIDELO, dakle isporučene iz kesice.
 * Neisporučene se namerno ne vraćaju, da album ne oda šta čeka u kesici.
 */
export async function zapisiSlicica(deteId: string): Promise<ZapisSlicice[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_slicice")
    .select("rec_id, zalepljena_at, poslednje_tacno_at")
    .eq("dete_id", deteId)
    .not("isporucena_at", "is", null);
  if (error) throw new Error(`Ne mogu da pročitam sličice: ${error.message}`);
  return data ?? [];
}

/** Koliko sličica čeka u neotvorenoj kesici, po lekciji. */
export async function neotvoreneKesice(deteId: string): Promise<Map<string, number>> {
  const sb = createAdminClient();
  // Do lekcije se stiže kroz zack_reci, jer zack_slicice pamti samo rec_id.
  // Ugnježdeni upit radi zato što zack_slicice.rec_id ima strani ključ
  // zack_slicice_rec_id_fkey ka zack_reci.
  const { data, error } = await sb
    .from("zack_slicice")
    .select("rec_id, zack_reci(lekcija_id)")
    .eq("dete_id", deteId)
    .is("isporucena_at", null);
  if (error) throw new Error(`Ne mogu da prebrojim kesice: ${error.message}`);

  const poLekciji = new Map<string, number>();
  for (const red of data ?? []) {
    // Ako je reč u međuvremenu obrisana, veza je prazna i takav red preskačemo,
    // umesto da ga svrstamo pod nepostojeću lekciju.
    const lekcijaId = red.zack_reci?.lekcija_id;
    if (!lekcijaId) continue;
    poLekciji.set(lekcijaId, (poLekciji.get(lekcijaId) ?? 0) + 1);
  }
  return poLekciji;
}
