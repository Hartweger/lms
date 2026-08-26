// Šalje već izdatu fakturu na SEF, na izričit klik u adminu.
//
// Redosled je namerno strog: faktura mora PRVO da bude izdata i poslata firmi
// (`faktura_broj`), pa tek onda ide na SEF - da na SEF ne ode dokument koji kupac
// nikad nije video, i da broj i datum na XML-u budu isti kao na PDF-u.
//
// Ruta NE dira fiskalizaciju.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { MERCHANT } from "@/lib/payment-confirmation";
import { BANK_FIRME } from "@/lib/order-utils";
import { napraviUbl, type UblStavka } from "@/lib/sef-ubl";
import { posaljiUbl, procitajStatus, firmaJeNaSefu, upisiSefOdgovor, sefPodesen, izvuciSefId } from "@/lib/sef";
import type { Json } from "@/lib/supabase/database.types";

/** YYYY-MM-DD u beogradskom vremenu - datum na dokumentu, ne UTC dan. */
function danBeograd(iso: string): string {
  const d = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return d;
}

function plusDana(ymd: string, dana: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dana);
  return d.toISOString().slice(0, 10);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  if (!sefPodesen()) {
    return NextResponse.json(
      { error: "SEF ključ nije postavljen (SEF_API_KEY)." },
      { status: 503 },
    );
  }

  const { groupId } = await params;

  const { data: orders, error } = await admin
    .from("orders")
    .select(
      "id, order_number, total, items, company_id, faktura_broj, faktura_sent_at, sef_invoice_id, sef_request_id, sef_status",
    )
    .eq("company_order_group", groupId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Greška pri čitanju narudžbina." }, { status: 500 });
  }
  if (!orders?.length) {
    return NextResponse.json({ error: "Nema narudžbina u ovoj grupi." }, { status: 404 });
  }

  const prva = orders[0];

  if (prva.sef_invoice_id) {
    return NextResponse.json({
      sefInvoiceId: prva.sef_invoice_id,
      status: prva.sef_status,
      vecPoslato: true,
    });
  }
  if (!prva.faktura_broj || !prva.faktura_sent_at) {
    return NextResponse.json(
      { error: "Prvo izdaj fakturu, pa je onda pošalji na SEF." },
      { status: 400 },
    );
  }
  if (!prva.company_id) {
    return NextResponse.json({ error: "Narudžbina nije vezana za firmu." }, { status: 400 });
  }

  const { data: firma } = await admin
    .from("companies")
    .select("naziv, adresa, grad, pib, maticni_broj, email")
    .eq("id", prva.company_id)
    .single();

  if (!firma) {
    return NextResponse.json({ error: "Firma nije pronađena." }, { status: 400 });
  }
  if (!firma.maticni_broj || !firma.grad) {
    return NextResponse.json(
      { error: "Firmi fali matični broj ili grad - SEF ih traži. Dopuni podatke firme." },
      { status: 400 },
    );
  }

  // Bolje reći unapred nego poslati u prazno. Ako provera ne uspe (null), pušta se
  // dalje - neka SEF odluči, a mi ne tvrdimo nešto što nismo proverili.
  if ((await firmaJeNaSefu(firma.pib)) === false) {
    return NextResponse.json(
      { error: `Firma (PIB ${firma.pib}) nema aktivan nalog na eFakturi. Faktura joj se ne može poslati.` },
      { status: 400 },
    );
  }

  // Isti ključ na svaki pokušaj - prekinuta veza pa retry ne prave drugu fakturu.
  const requestId = prva.sef_request_id ?? crypto.randomUUID();
  if (!prva.sef_request_id) {
    await admin.from("orders").update({ sef_request_id: requestId }).eq("company_order_group", groupId);
  }

  // Stavke: ista logika spajanja kao na dokumentu - isti opis I ista cena = jedna
  // linija sa količinom.
  const redosled: string[] = [];
  const grupe = new Map<string, UblStavka>();
  for (const o of orders) {
    const opis = (o.items as { title?: string }[] | null)?.[0]?.title ?? "Kurs nemačkog jezika";
    const jedinicnaSaPdv = Number(o.total);
    const kljuc = `${opis} ${jedinicnaSaPdv}`;
    const g = grupe.get(kljuc);
    if (g) g.kolicina += 1;
    else {
      redosled.push(kljuc);
      grupe.set(kljuc, { opis, jedinicnaSaPdv, kolicina: 1 });
    }
  }

  const datumIzdavanja = danBeograd(prva.faktura_sent_at);
  const ubl = napraviUbl({
    broj: prva.faktura_broj,
    datumIzdavanja,
    datumPrometa: datumIzdavanja,
    datumValute: plusDana(datumIzdavanja, 7),
    prodavac: {
      naziv: MERCHANT.naziv,
      pib: MERCHANT.pib,
      maticniBroj: MERCHANT.maticniBroj,
      ulica: MERCHANT.ulica,
      grad: MERCHANT.grad,
      email: "info@hartweger.rs",
    },
    kupac: {
      naziv: firma.naziv,
      pib: firma.pib,
      maticniBroj: firma.maticni_broj,
      ulica: firma.adresa,
      grad: firma.grad,
      email: firma.email,
    },
    racun: BANK_FIRME.racun,
    pozivNaBroj: prva.faktura_broj,
    stavke: redosled.map((k) => grupe.get(k)!),
    ukupnoSaPdv: orders.reduce((a, o) => a + Number(o.total), 0),
  });

  const poslato = await posaljiUbl(ubl, requestId);
  if (!poslato.ok) {
    await upisiSefOdgovor(admin, groupId, {
      sef_status: "GRESKA",
      sef_response: { greska: poslato.greska, httpStatus: poslato.status } as Json,
    });
    return NextResponse.json({ error: `SEF nije primio fakturu: ${poslato.greska}` }, { status: 502 });
  }

  const sefInvoiceId = izvuciSefId(poslato.data);
  if (!sefInvoiceId) {
    // Faktura je verovatno primljena - samo joj ne prepoznajemo id. Odgovor se
    // upisuje da se vidi šta je stiglo, ali bez `sef_invoice_id`, jer ga nemamo.
    await upisiSefOdgovor(admin, groupId, {
      sef_status: "GRESKA",
      sef_response: poslato.data as unknown as Json,
    });
    return NextResponse.json(
      {
        error: "SEF je primio fakturu, ali nije vratio broj u očekivanom obliku. Proveri u SEF panelu pre ponovnog slanja.",
        odgovor: poslato.data,
      },
      { status: 502 },
    );
  }

  // Odmah pitamo za status - odgovor na slanje nosi samo id.
  const stanje = await procitajStatus(sefInvoiceId);

  await upisiSefOdgovor(admin, groupId, {
    sef_invoice_id: sefInvoiceId,
    sef_status: stanje.ok ? (stanje.data.status ?? "Sending") : "Sending",
    sef_sent_at: new Date().toISOString(),
    sef_response: (stanje.ok ? stanje.data : poslato.data) as unknown as Json,
  });

  return NextResponse.json({
    sefInvoiceId,
    status: stanje.ok ? stanje.data.status : "Sending",
    broj: prva.faktura_broj,
  });
}
