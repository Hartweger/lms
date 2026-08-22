// Klik iz mejla: UPIŠE odgovor na prvo pitanje, pa preusmeri na stranicu sa
// preostala dva. Zato GET sa odgovorom u putanji, a ne link na prazan obrazac -
// roditelj koji posle ovoga zatvori prozor nam je ipak odgovorio.
//
// Token je jedina propusnica: id deteta se u linku NIKAD ne pojavljuje, a
// zack_ankete ima uključen RLS bez ijedne politike, pa se tabeli prilazi samo
// servisnim ključem odavde.
//
// Nepoznat token ili nepoznat odgovor NE prave grešku roditelju - vode na
// stranicu koja mirno kaže da je link istekao. Mejl klijenti umeju da otvore
// link i sami (skeneri), pa 500 na ekranu ne bi značio ništa dobro.
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { jeVracaSeKljuc } from "@/lib/zack/anketa";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string; odgovor: string }> },
) {
  const { token, odgovor } = await params;
  const naStranu = (t: string) => NextResponse.redirect(new URL(`/zack/anketa/${encodeURIComponent(t)}`, _request.url));

  if (!jeVracaSeKljuc(odgovor)) return naStranu(token);

  try {
    const sb = createAdminClient();
    // Prvi odgovor se NE prepisuje: ako roditelj klikne dva puta (ili mejl
    // klijent otvori link unapred), važi ono što je prvo stiglo.
    const { data: anketa } = await sb
      .from("zack_ankete")
      .select("id, vraca_se")
      .eq("token", token)
      .maybeSingle();
    if (anketa && !anketa.vraca_se) {
      await sb
        .from("zack_ankete")
        .update({ vraca_se: odgovor, vraca_se_at: new Date().toISOString() })
        .eq("id", anketa.id);
    }
  } catch (e) {
    // Pad upisa ne sme da zaustavi roditelja - stranica i dalje radi.
    console.error("[zack/anketa] upis prvog odgovora pao:", e);
    Sentry.captureException(e);
  }

  return naStranu(token);
}
