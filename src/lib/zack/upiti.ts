// Zajednički upiti dečjeg dela. Uvek service-role, jer je RLS na zack_* tabelama
// potpuno zatvoren i dete nema svoj Supabase nalog u ovoj fazi. Zbog toga dečji
// deo nikad ne pipa Supabase iz pretraživača, nego isključivo kroz /api/zack/*.
import { createAdminClient } from "@/lib/supabase/admin";
import type { Rec } from "./rec";
import type { ZapisSlicice } from "./album";
import type { GramatickaTacka, GramatickoPitanje } from "./milioner";

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

/**
 * Najviše reči u jednom pozivu ka `zaradi` ili `zalepi`. Najduža partija pokriva
 * osam pitanja, a Parovi šest reči odjednom, pa je pedeset daleko iznad svega što
 * igra ume da pošalje. Granica postoji da telo zahteva ne može da bude
 * proizvoljno veliko, ne da bi merila igru.
 */
export const NAJVISE_RECI = 50;

/**
 * Od poslatih ključeva zadržava SAMO one koji pripadaju udžbeniku ovog deteta.
 *
 * Bez ovoga je dovoljno videti adresu deteta pa poslati tuđe ključeve i napuniti
 * mu album bez ijedne odigrane igre - a album vredi tačno onoliko koliko je
 * teško bio zarađen.
 *
 * Namerno se ne oslanja na ugnježdeni upit kroz strani ključ: takav upit ume da
 * tiho vrati prazno kad veza između tabela nije onakva kakvom je smatramo, a
 * ovde prazno znači „ništa ne upisuj". Dva jasna upita ne mogu tako da otkažu.
 */
export async function reciUUdzbeniku(
  recIdovi: readonly string[],
  udzbenikId: string
): Promise<Set<string>> {
  if (recIdovi.length === 0) return new Set();

  const sb = createAdminClient();
  const { data: reci, error } = await sb
    .from("zack_reci")
    .select("id, lekcija_id")
    .in("id", recIdovi);
  if (error) throw new Error(`Ne mogu da proverim reči: ${error.message}`);
  if (!reci || reci.length === 0) return new Set();

  const lekcijaIdovi = [...new Set(reci.map((r) => r.lekcija_id))];
  const { data: lekcije, error: greskaLekcija } = await sb
    .from("zack_lekcije")
    .select("id")
    .in("id", lekcijaIdovi)
    .eq("udzbenik_id", udzbenikId);
  if (greskaLekcija) throw new Error(`Ne mogu da proverim lekcije: ${greskaLekcija.message}`);

  const nase = new Set((lekcije ?? []).map((l) => l.id));
  return new Set(reci.filter((r) => nase.has(r.lekcija_id)).map((r) => r.id));
}

/**
 * Broj lekcije, ali samo ako je lekcija iz udžbenika ovog deteta. `null` znači
 * i „nema takve lekcije" i „nije njegova", i to je namerno isti odgovor: nema
 * razloga da se sa strane sazna koja tuđa lekcija postoji.
 *
 * Milioneru broj lekcije NIJE ukras nego uslov: po njemu se odlučuje koje je
 * gradivo obrađeno. Zato se ne uzima iz adrese nego iz baze.
 */
export async function brojLekcijeUUdzbeniku(
  lekcijaId: string,
  udzbenikId: string
): Promise<number | null> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_lekcije")
    .select("broj")
    .eq("id", lekcijaId)
    .eq("udzbenik_id", udzbenikId)
    .maybeSingle();
  if (error) throw new Error(`Ne mogu da pročitam lekciju: ${error.message}`);
  return data?.broj ?? null;
}

/**
 * Gramatičke tačke udžbenika koje su obrađene do zadate lekcije.
 *
 * Uslov `od_lekcije <= brojLekcije` stoji U SAMOM UPITU, pa neobrađeno gradivo
 * ne stigne ni do servera koji sastavlja partiju. Ista provera se ponavlja i u
 * `lib/zack/milioner.ts`; to nije zaboravljeno dupliranje nego namera, jer je
 * ovo pravilo koje se ne sme osloniti na jedno mesto.
 */
export async function dozvoljenaGramatika(
  udzbenikId: string,
  brojLekcije: number
): Promise<GramatickaTacka[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_gramatika")
    .select("id, redni_broj, naziv, objasnjenje, primer, od_lekcije")
    .eq("udzbenik_id", udzbenikId)
    .lte("od_lekcije", brojLekcije)
    .order("redni_broj");
  if (error) throw new Error(`Ne mogu da pročitam gramatiku: ${error.message}`);
  return data ?? [];
}

/**
 * Pitanja zadatih gramatičkih tačaka.
 *
 * `opcije` je JSONB, dakle sve što je u bazu upisano, pa se ovde svodi na
 * spisak stringova. Red koji to nije se ne popravlja nego se vraća sa praznim
 * opcijama - `sastaviPartiju` takav red prepozna i tiho ga preskoči.
 */
export async function gramatickaPitanja(
  tackaIdovi: readonly string[]
): Promise<GramatickoPitanje[]> {
  if (tackaIdovi.length === 0) return [];

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_gramatika_pitanja")
    .select("id, gramatika_id, pitanje, opcije, tacan, tezina")
    .in("gramatika_id", [...tackaIdovi])
    .order("redni_broj");
  if (error) throw new Error(`Ne mogu da pročitam pitanja gramatike: ${error.message}`);

  return (data ?? []).map((red) => ({
    id: red.id,
    gramatika_id: red.gramatika_id,
    pitanje: red.pitanje,
    opcije: Array.isArray(red.opcije) ? red.opcije.filter((o) => typeof o === "string") : [],
    tacan: red.tacan,
    tezina: red.tezina,
  }));
}

/** Da li lekcija uopšte pripada udžbeniku ovog deteta. */
export async function lekcijaUUdzbeniku(lekcijaId: string, udzbenikId: string): Promise<boolean> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_lekcije")
    .select("id")
    .eq("id", lekcijaId)
    .eq("udzbenik_id", udzbenikId)
    .maybeSingle();
  if (error) throw new Error(`Ne mogu da proverim lekciju: ${error.message}`);
  return data !== null;
}

export async function reciLekcije(lekcijaId: string): Promise<Rec[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_reci")
    .select("id, redni_broj, de, sr, rod, mnozina, vrsta, izuzetak, ikonica")
    .eq("lekcija_id", lekcijaId)
    .order("redni_broj");
  if (error) throw new Error(`Ne mogu da pročitam reči lekcije: ${error.message}`);
  return data ?? [];
}

/**
 * Lični rekord u jednoj igri, na jednoj lekciji. `null` znači da rekorda još
 * nema, i to je bitna razlika u odnosu na nulu: pre prve partije se linija
 * rekorda uopšte ne crta i rekord se detetu ne pominje, da prvi pokušaj ne bi
 * počeo poređenjem.
 */
export async function rekordZaIgru(
  deteId: string,
  lekcijaId: string,
  igra: string
): Promise<number | null> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_rekordi")
    .select("sprat")
    .eq("dete_id", deteId)
    .eq("lekcija_id", lekcijaId)
    .eq("igra", igra)
    .maybeSingle();
  if (error) throw new Error(`Ne mogu da pročitam rekord: ${error.message}`);
  return data?.sprat ?? null;
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
