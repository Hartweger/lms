// Lepljenje sličice u album.
//
// Zalepiti se sme samo ono što je dete stvarno izvuklo iz kesice i još nije
// zalepilo. Zato su oba uslova deo upita: `isporucena_at` mora da postoji, a
// `zalepljena_at` mora da bude prazan. Time se ne može zalepiti sličica koja
// još čeka u neotvorenoj kesici, ni ista sličica dvaput.
//
// Vraća se spisak onoga što je STVARNO zalepljeno, ne onoga što je traženo, da
// se tiho preskočen red ne bi u igri prikazao kao uspeh.
//
// Kao i u `zaradi`, ključ mora da pripada udžbeniku ovog deteta. Ovde je to
// blaža provera nego tamo, jer uslovi upita ionako ne daju da se zalepi red koji
// dete nema, ali ista granica na oba mesta znači jedno pravilo umesto dva.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jeUuid, nadjiDete, reciUUdzbeniku, NAJVISE_RECI } from "@/lib/zack/upiti";

const greska = (poruka: string, status: number) =>
  NextResponse.json({ error: poruka }, { status });

/** Prazan ili neposlat spisak nije greška, samo nema šta da se zalepi. */
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
  if (procitano.idovi.length > NAJVISE_RECI) {
    return greska(`Najviše ${NAJVISE_RECI} reči odjednom`, 400);
  }

  const nase = await reciUUdzbeniku(procitano.idovi, dete.udzbenik_id);
  const recIdovi = procitano.idovi.filter((id) => nase.has(id));
  const odbijeno = procitano.idovi.length - recIdovi.length;
  if (odbijeno > 0) {
    console.warn(`[zack/zalepi] odbijeno ${odbijeno} reči van udžbenika deteta ${dete.id}`);
  }
  if (recIdovi.length === 0) {
    return NextResponse.json({ ok: true, zalepljeno: [], odbijeno });
  }

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_slicice")
    .update({ zalepljena_at: new Date().toISOString() })
    .eq("dete_id", dete.id)
    .in("rec_id", recIdovi)
    .not("isporucena_at", "is", null)
    .is("zalepljena_at", null)
    .select("rec_id");
  if (error) {
    console.error("[zack/zalepi] lepljenje sličica:", error);
    return greska("Sličice nisu zalepljene", 500);
  }

  return NextResponse.json({
    ok: true,
    zalepljeno: (data ?? []).map((r) => r.rec_id),
    odbijeno,
  });
}
