// src/app/api/cron/mesecne-fakture/route.ts
// Priprema mesečne fakture koje se ponavljaju (BAREL i slične).
//
// Cron SAMO PRIPREMA. Ništa ne šalje ni firmi ni SEF-u - to Nataša radi klikom u
// adminu. Zato zaboravljeno pravilo ne može ništa da pošalje samo od sebe, pa
// pravila i ne moraju da imaju datum isteka.
//
// Broj fakture se NE dodeljuje ovde nego pri slanju: pripremljena a neposlata
// faktura bi inače potrošila broj i ostavila rupu u seriji.
import { NextResponse } from "next/server";
import { withCronLog } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMesecneFaktureReminder } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Prvi dan meseca u kome smo, po beogradskom vremenu. */
function pocetakMeseca(now: Date): string {
  const d = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return `${d.slice(0, 7)}-01`;
}

function danUMesecu(now: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Belgrade", day: "numeric" }).format(now),
  );
}

async function cronHandler(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const sada = new Date();
  const period = pocetakMeseca(sada);
  const dan = danUMesecu(sada);

  const { data: pravila, error } = await admin
    .from("recurring_invoices")
    .select("id, opis, iznos, dan_u_mesecu, created_at")
    .eq("aktivno", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Dan se poredi sa `>=`, ne sa `=`: ako cron jednog dana ne prođe (ispad, izmena
  // rasporeda), faktura se pripremi sutradan umesto da se preskoči ceo mesec.
  // Jedinstvenost (recurring_id, period) čuva da se ne pripremi dvaput.
  //
  // Ali NE za mesec koji je počeo pre nego što je pravilo uopšte postojalo: pravilo
  // napravljeno 28.08. ne sme da izda avgustovsku fakturu, jer je taj mesec već
  // fakturisan ručno. (Uhvaćeno 02.09.2026 - avgustovska je bila pripremljena.)
  const zaDanas = (pravila ?? []).filter(
    (p) => dan >= p.dan_u_mesecu && p.created_at.slice(0, 10) <= period,
  );

  let pripremljeno = 0;
  for (const p of zaDanas) {
    const { error: insErr } = await admin.from("recurring_invoice_runs").insert({
      recurring_id: p.id,
      period,
      iznos: p.iznos,
      opis: p.opis,
    });
    // Duplikat znači da je za taj mesec već pripremljena - to nije greška.
    if (!insErr) pripremljeno += 1;
    else if (!insErr.message.includes("duplicate")) {
      console.error(`[mesecne-fakture] priprema pala za ${p.id}:`, insErr);
    }
  }

  // Podsetnik jednom mesečno, 2. u mesecu: dan posle pripreme, za sve što još čeka
  // klik (i zaostale). Nataša ne želi svakodnevni mejl (odluka 08.10.2026).
  if (dan !== 2) {
    return NextResponse.json({ period, pravila: zaDanas.length, pripremljeno });
  }
  const { data: cekaju, error: cekErr } = await admin
    .from("recurring_invoice_runs")
    .select("period, iznos, faktura_sent_at, sef_invoice_id, recurring:recurring_id(company:company_id(naziv))")
    .is("sef_invoice_id", null)
    .order("period");
  if (cekErr) console.error("[mesecne-fakture] čitanje neposlatih palo:", cekErr);

  const stavke = (cekaju ?? []).map((r) => {
    const veza = r.recurring as { company: { naziv: string } | null } | null;
    return {
      firma: veza?.company?.naziv ?? "(nepoznata firma)",
      mesec: new Intl.DateTimeFormat("sr-Latn-RS", { month: "long", year: "numeric" }).format(
        new Date(`${r.period}T12:00:00Z`),
      ),
      iznos: r.iznos,
      korak: (r.faktura_sent_at ? "sef" : "faktura") as "faktura" | "sef",
    };
  });
  await sendMesecneFaktureReminder(stavke);

  return NextResponse.json({ period, pravila: zaDanas.length, pripremljeno, cekaju: stavke.length });
}

export const GET = withCronLog("mesecne-fakture", cronHandler);
