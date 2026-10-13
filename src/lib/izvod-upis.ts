// Upis jednog izvoda u `bank_transactions`.
//
// Izdvojeno da ručno učitavanje (dugme „Učitaj izvod") i povlačenje iz pošte idu
// istim putem - inače bi se dva mesta razišla, a razlika bi se videla tek kao
// pogrešan trošak.
//
// Isti izvod sme da se upiše više puta: `fitid` je bankin jedinstven broj
// transakcije, pa upsert ne pravi duplikate. Već donete odluke se ne diraju -
// `order_id`, `expense_id` i `status` se ne navode u upsertu.

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { procitajIzvod } from "@/lib/izvod-xml";
import type { Database, Json } from "@/lib/supabase/database.types";

export interface IshodUpisa {
  ok: boolean;
  izvod?: number | null;
  datum?: string | null;
  ukupno: number;
  novih: number;
  greska?: string;
}

export async function upisiIzvod(
  admin: SupabaseClient<Database>,
  xml: string,
): Promise<IshodUpisa> {
  if (!xml.trim()) return { ok: false, ukupno: 0, novih: 0, greska: "Prazan XML." };

  let izvod;
  try {
    izvod = procitajIzvod(xml);
  } catch (e) {
    const poruka = e instanceof Error ? e.message : "nečitljiv XML";
    return { ok: false, ukupno: 0, novih: 0, greska: `Izvod nije pročitan: ${poruka}` };
  }

  if (izvod.stavke.length === 0) {
    return { ok: true, izvod: izvod.broj, datum: izvod.datum, ukupno: 0, novih: 0 };
  }

  const redovi = izvod.stavke.map((s) => ({
    fitid: s.fitid,
    izvod_broj: izvod.broj,
    racun: izvod.racun,
    smer: s.smer,
    iznos: s.iznos,
    datum: s.datum,
    naziv: s.naziv,
    racun_druge: s.racunDruge,
    svrha: s.svrha,
    sifra: s.sifra,
    poziv_na_broj: s.pozivNaBroj,
    poziv_druge: s.pozivDruge,
    raw: s as unknown as Json,
  }));

  // Koliko ih je već poznato - da odgovor kaže šta je STVARNO novo.
  const { data: postojeci } = await admin
    .from("bank_transactions")
    .select("fitid")
    .in("fitid", redovi.map((r) => r.fitid));
  const poznati = new Set((postojeci ?? []).map((p) => p.fitid));

  const { error } = await admin.from("bank_transactions").upsert(redovi, { onConflict: "fitid" });
  if (error) {
    return { ok: false, izvod: izvod.broj, ukupno: redovi.length, novih: 0, greska: `Upis nije uspeo: ${error.message}` };
  }

  return {
    ok: true,
    izvod: izvod.broj,
    datum: izvod.datum,
    ukupno: redovi.length,
    novih: redovi.filter((r) => !poznati.has(r.fitid)).length,
  };
}
