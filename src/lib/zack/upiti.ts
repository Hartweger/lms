// Zajednički upiti dečjeg dela. Uvek service-role, jer je RLS na zack_* tabelama
// potpuno zatvoren i dete nema svoj Supabase nalog u ovoj fazi. Zbog toga dečji
// deo nikad ne pipa Supabase iz pretraživača, nego isključivo kroz /api/zack/*.
import { createAdminClient } from "@/lib/supabase/admin";
import { jeOtkljucano } from "./clanstvo";
import type { Rec } from "./rec";
import type { Recenica } from "./recenice";
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
 * Od poslatih ključeva pitanja gramatike zadržava SAMO ona iz udžbenika ovog
 * deteta. Isti obrazac i isti razlog kao `reciUUdzbeniku`: ko vidi adresu
 * deteta, ne sme da mu tuđim ključevima puni memoriju grešaka. I ovde dva
 * jasna upita umesto ugnježdenog, iz istog razloga kao gore.
 */
export async function pitanjaUUdzbeniku(
  pitanjeIdovi: readonly string[],
  udzbenikId: string
): Promise<Set<string>> {
  if (pitanjeIdovi.length === 0) return new Set();

  const sb = createAdminClient();
  const { data: pitanja, error } = await sb
    .from("zack_gramatika_pitanja")
    .select("id, gramatika_id")
    .in("id", [...pitanjeIdovi]);
  if (error) throw new Error(`Ne mogu da proverim pitanja: ${error.message}`);
  if (!pitanja || pitanja.length === 0) return new Set();

  const tackaIdovi = [...new Set(pitanja.map((p) => p.gramatika_id))];
  const { data: tacke, error: greskaTacaka } = await sb
    .from("zack_gramatika")
    .select("id")
    .in("id", tackaIdovi)
    .eq("udzbenik_id", udzbenikId);
  if (greskaTacaka) throw new Error(`Ne mogu da proverim gramatiku: ${greskaTacaka.message}`);

  const nase = new Set((tacke ?? []).map((t) => t.id));
  return new Set(pitanja.filter((p) => nase.has(p.gramatika_id)).map((p) => p.id));
}

/**
 * Broj ranijih grešaka deteta po reči. Iz ovoga igre kasnijih lekcija znaju
 * koje stare reči da vrate pred dete. Mapa, ne spisak: čita se po ključu reči.
 */
export async function greskeReci(deteId: string): Promise<Map<string, number>> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_greske")
    .select("rec_id, broj")
    .eq("dete_id", deteId)
    .not("rec_id", "is", null);
  if (error) throw new Error(`Ne mogu da pročitam greške reči: ${error.message}`);

  const poReci = new Map<string, number>();
  for (const red of data ?? []) {
    if (red.rec_id) poReci.set(red.rec_id, red.broj);
  }
  return poReci;
}

/**
 * Broj ranijih grešaka deteta po pitanju gramatike. Milioner iz ovoga daje
 * prednost ranije promašenim pitanjima pri sastavljanju partije.
 */
export async function greskePitanja(deteId: string): Promise<Map<string, number>> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_greske")
    .select("pitanje_id, broj")
    .eq("dete_id", deteId)
    .not("pitanje_id", "is", null);
  if (error) throw new Error(`Ne mogu da pročitam greške pitanja: ${error.message}`);

  const poPitanju = new Map<string, number>();
  for (const red of data ?? []) {
    if (red.pitanje_id) poPitanju.set(red.pitanje_id, red.broj);
  }
  return poPitanju;
}

/**
 * Reči SVIH ranijih lekcija udžbenika (broj manji od zadatog). Iz njih igre
 * kasnijih lekcija mešaju ponavljanje. Za prvu lekciju vraća prazno bez upita,
 * jer ranijih lekcija nema.
 */
export async function stareReciUdzbenika(
  udzbenikId: string,
  brojLekcije: number
): Promise<Rec[]> {
  if (brojLekcije <= 1) return [];

  const sb = createAdminClient();
  const { data: lekcije, error } = await sb
    .from("zack_lekcije")
    .select("id")
    .eq("udzbenik_id", udzbenikId)
    .lt("broj", brojLekcije);
  if (error) throw new Error(`Ne mogu da pročitam ranije lekcije: ${error.message}`);
  if (!lekcije || lekcije.length === 0) return [];

  const { data: reci, error: greskaReci } = await sb
    .from("zack_reci")
    .select("id, redni_broj, de, sr, rod, mnozina, vrsta, izuzetak, ikonica")
    .in("lekcija_id", lekcije.map((l) => l.id))
    .order("redni_broj");
  if (greskaReci) throw new Error(`Ne mogu da pročitam stare reči: ${greskaReci.message}`);
  return reci ?? [];
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

/**
 * Server-side provera članstva za rute igara (zaradi/kesica/zalepi/milioner).
 * Pravilo je u lib/zack/clanstvo.ts (jeOtkljucano); ovde je samo čitanje.
 * Nepostojeće dete je „zaključano" - ali rute pre ove provere ionako rade
 * nadjiDete i vraćaju 404, pa dotle ne stiže.
 */
export async function clanstvoAktivno(deteId: string): Promise<boolean> {
  if (!jeUuid(deteId)) return false;
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_deca")
    .select("roditelj_id, oslobodjeno, clanstvo_do")
    .eq("id", deteId)
    .maybeSingle();
  if (error) throw new Error(`Ne mogu da proverim članstvo: ${error.message}`);
  if (!data) return false;
  return jeOtkljucano(
    { roditeljId: data.roditelj_id, oslobodjeno: data.oslobodjeno, clanstvoDo: data.clanstvo_do },
    new Date()
  );
}

/** Red rečenice kakav stigne iz baze: `distraktori` je JSONB, dakle bilo šta. */
type RedRecenice = Omit<Recenica, "distraktori"> & { distraktori: unknown };

/**
 * Redovi iz baze u `Recenica`. Isto za oba čitanja rečenica, pa stoji na jednom
 * mestu.
 *
 * `distraktori` je JSONB, dakle sve što je u bazu upisano, pa se ovde svodi na
 * spisak stringova. Red koji to nije se ne popravlja nego dobija prazne
 * distraktore.
 *
 * Takva rečenica se NE preskače: `napraviPitanjaRecenica` bira po
 * `podobnaZaDopunu`, a to pravilo broji samo pojave praznine i u distraktore
 * uopšte ne gleda. Pitanje dopune onda od `ponudjeni` dobije jednu jedinu
 * ponudu - tačan oblik - pa nema šta pogrešno da se izabere. To se namerno ne
 * dira, jer kvar pada u korist deteta: tačan odgovor stiže badava, a srce se
 * ne gubi. Slagalicu distraktori ionako ne tiču.
 */
function uRecenice(redovi: readonly RedRecenice[]): Recenica[] {
  return redovi.map((red) => ({
    id: red.id,
    redni_broj: red.redni_broj,
    de: red.de,
    sr: red.sr,
    praznina: red.praznina,
    distraktori: Array.isArray(red.distraktori)
      ? red.distraktori.filter((d) => typeof d === "string")
      : [],
    rec_id: red.rec_id,
    samo_dopuna: red.samo_dopuna,
  }));
}

/** Rečenice jedne lekcije, didaktičkim redosledom. */
export async function receniceLekcije(lekcijaId: string): Promise<Recenica[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_recenice")
    .select("id, redni_broj, de, sr, praznina, distraktori, rec_id, samo_dopuna")
    .eq("lekcija_id", lekcijaId)
    .order("redni_broj");
  if (error) throw new Error(`Ne mogu da pročitam rečenice lekcije: ${error.message}`);
  return uRecenice(data ?? []);
}

/**
 * Rečenice SVIH ranijih lekcija udžbenika (broj manji od zadatog), za
 * ponavljanje kroz rečenične igre. Za prvu lekciju vraća prazno bez upita, jer
 * ranijih lekcija nema.
 *
 * Kao i `stareReciUdzbenika`, dva jasna upita umesto ugnježdenog: ugnježdeni
 * ume da tiho vrati prazno kad veza između tabela nije onakva kakvom je
 * smatramo, a ovde prazno znači „nema šta da se ponavlja".
 */
export async function stareReceniceUdzbenika(
  udzbenikId: string,
  brojLekcije: number
): Promise<Recenica[]> {
  if (brojLekcije <= 1) return [];

  const sb = createAdminClient();
  const { data: lekcije, error } = await sb
    .from("zack_lekcije")
    .select("id")
    .eq("udzbenik_id", udzbenikId)
    .lt("broj", brojLekcije);
  if (error) throw new Error(`Ne mogu da pročitam ranije lekcije: ${error.message}`);
  if (!lekcije || lekcije.length === 0) return [];

  const { data: recenice, error: greskaRecenica } = await sb
    .from("zack_recenice")
    .select("id, redni_broj, de, sr, praznina, distraktori, rec_id, samo_dopuna")
    .in("lekcija_id", lekcije.map((l) => l.id))
    .order("redni_broj");
  if (greskaRecenica) {
    throw new Error(`Ne mogu da pročitam stare rečenice: ${greskaRecenica.message}`);
  }
  return uRecenice(recenice ?? []);
}

/**
 * Koje je faze učenja dete prošlo na lekciji. Skup imena faza („reci",
 * „recenice").
 *
 * Greška se ovde BACA, kao u svakom upitu ovog fajla, ali POZIVALAC je mora
 * shvatiti kao „faza je prošla": izgubljeno čitanje ne sme da zaključa vežbe
 * detetu koje je učenje odavno završilo. Kvar pada u korist deteta, isto pravilo
 * po kome se red o prolasku nikad ne briše. Progutati grešku ovde bi značilo i
 * ne znati da je bilo kvara, pa to radi stranica koja poziva.
 */
export async function ucenjeProlazi(deteId: string, lekcijaId: string): Promise<Set<string>> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_ucenje_prolazi")
    .select("faza")
    .eq("dete_id", deteId)
    .eq("lekcija_id", lekcijaId);
  if (error) throw new Error(`Ne mogu da pročitam prolaze učenja: ${error.message}`);
  return new Set((data ?? []).map((red) => red.faza));
}
