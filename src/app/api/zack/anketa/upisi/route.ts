// Upis preostala dva odgovora sa stranice. Oba su NEOBAVEZNA - prazna anketa se
// svejedno zatvara, jer je roditelj već odgovorio na ono glavno klikom iz mejla.
//
// Token stiže u telu zahteva, ne u URL-u: ovo je POST sa stranice, pa nema
// razloga da ključ šeta kroz istoriju pretraživača ili Referer zaglavlje.
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { ocistiOmiljeno, ocistiSmeta } from "@/lib/zack/anketa";

export async function POST(request: NextRequest) {
  let telo: { token?: unknown; omiljeno?: unknown; smeta?: unknown };
  try {
    telo = await request.json();
  } catch {
    return NextResponse.json({ error: "Telo zahteva nije ispravan JSON" }, { status: 400 });
  }
  const token = typeof telo.token === "string" ? telo.token : "";
  if (!token) return NextResponse.json({ error: "Link nije potpun." }, { status: 400 });

  try {
    const sb = createAdminClient();
    const { data: anketa } = await sb
      .from("zack_ankete")
      .select("id, dovrsena_at")
      .eq("token", token)
      .maybeSingle();
    // Nepostojeći token se ne razlikuje od već dovršene ankete - ni jedno ni
    // drugo ne sme da oda da li token uopšte postoji.
    if (!anketa || anketa.dovrsena_at) return NextResponse.json({ ok: true });

    const { error } = await sb
      .from("zack_ankete")
      .update({
        omiljeno: ocistiOmiljeno(telo.omiljeno),
        smeta: ocistiSmeta(telo.smeta),
        dovrsena_at: new Date().toISOString(),
      })
      .eq("id", anketa.id);
    if (error) throw new Error(error.message);
  } catch (e) {
    console.error("[zack/anketa] upis pao:", e);
    Sentry.captureException(e);
    return NextResponse.json({ error: "Nešto je zapelo. Probaj ponovo za koji trenutak." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
