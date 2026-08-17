// Zarađena reč se pamti ODMAH, posle svakog tačnog odgovora, a ne na kraju igre.
//
// ZAŠTO (odluka B)
// ----------------
// Ranije se napredak slao tek kad se igra završi. Dete koje zatvori karticu ili
// ostane bez mreže nasred igre gubilo je sve što je do tada uradilo. Zato se
// zarađeno upisuje odmah, sa `isporucena_at = NULL`, a kesica se otvara kasnije
// posebnim pozivom. Red sa `isporucena_at IS NULL` znači: zarađeno je, čeka u
// neotvorenoj kesici, dete to JOŠ NIJE VIDELO.
//
// ZAŠTO OVDE NEMA OBIČNOG UPSERT-a
// --------------------------------
// `upsert` bi na postojećem redu prepisao i `isporucena_at` i `zalepljena_at` na
// podrazumevane vrednosti, pa bi sličica koju je dete već zalepilo u album
// odletela nazad u kesicu. Detetu se NIKAD ne oduzima ono što je zaradilo. Zato
// se radi u dva jasna koraka: postojećim redovima se osvežava isključivo
// `poslednje_tacno_at` (time izbledela sličica vraća boju), a novi se ubacuju
// sa `ON CONFLICT DO NOTHING`, da dva brza poziva ne pucaju o UNIQUE.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jeUuid, nadjiDete } from "@/lib/zack/upiti";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

/** Prazan ili neposlat spisak nije greška, samo nema šta da se upiše. */
function citajRecIdove(telo: unknown): { ok: true; idovi: string[] } | { ok: false } {
  if (typeof telo !== "object" || telo === null || Array.isArray(telo)) return { ok: false };
  const sirovo = (telo as Record<string, unknown>).recIdovi;
  if (sirovo === undefined || sirovo === null) return { ok: true, idovi: [] };
  if (!Array.isArray(sirovo)) return { ok: false };
  // Neispravan oblik ključa bi u Postgresu izazvao grešku i time 500 umesto
  // poštenog 400, zato se proverava pre upita.
  if (!sirovo.every((v) => typeof v === "string" && jeUuid(v))) return { ok: false };
  return { ok: true, idovi: [...new Set(sirovo as string[])] };
}

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

  const procitano = citajRecIdove(telo);
  if (!procitano.ok) return greska("recIdovi mora biti spisak ključeva reči", 400);
  const recIdovi = procitano.idovi;
  if (recIdovi.length === 0) {
    return NextResponse.json({ ok: true, zaradjeno: 0, osvezeno: 0 });
  }

  const sb = createAdminClient();
  const sada = new Date().toISOString();

  // 1. Šta dete već ima. Sve se vezuje za dete.id, nikad za childId iz adrese.
  const { data: postojeci, error: greskaCitanja } = await sb
    .from("zack_slicice")
    .select("rec_id")
    .eq("dete_id", dete.id)
    .in("rec_id", recIdovi);
  if (greskaCitanja) {
    console.error("[zack/zaradi] čitanje postojećih sličica:", greskaCitanja);
    return greska("Sličice nisu pročitane", 500);
  }

  const imam = new Set((postojeci ?? []).map((r) => r.rec_id));
  const novi = recIdovi.filter((id) => !imam.has(id));

  // 2. Postojećima se dira SAMO poslednje_tacno_at. `isporucena_at` i
  // `zalepljena_at` se ne pominju, pa ostaju kakvi jesu.
  let osvezeno = 0;
  if (imam.size > 0) {
    const { data, error } = await sb
      .from("zack_slicice")
      .update({ poslednje_tacno_at: sada })
      .eq("dete_id", dete.id)
      .in("rec_id", [...imam])
      .select("rec_id");
    if (error) {
      console.error("[zack/zaradi] osvežavanje sličica:", error);
      return greska("Sličice nisu osvežene", 500);
    }
    osvezeno = (data ?? []).length;
  }

  // 3. Novi redovi ulaze neisporučeni, dete ih vidi tek kad otvori kesicu.
  let zaradjeno = 0;
  if (novi.length > 0) {
    const { data, error } = await sb
      .from("zack_slicice")
      .upsert(
        novi.map((recId) => ({
          dete_id: dete.id,
          rec_id: recId,
          poslednje_tacno_at: sada,
          isporucena_at: null,
        })),
        { onConflict: "dete_id,rec_id", ignoreDuplicates: true }
      )
      .select("rec_id");
    if (error) {
      console.error("[zack/zaradi] upis novih sličica:", error);
      if (error.code === "23503") return greska("Neka od poslatih reči ne postoji", 400);
      return greska("Sličice nisu upisane", 500);
    }
    zaradjeno = (data ?? []).length;
  }

  return NextResponse.json({ ok: true, zaradjeno, osvezeno });
}
