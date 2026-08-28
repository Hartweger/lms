// Izdaje predračun ili fakturu za jednu grupu narudžbina firme: sastavi podatke,
// nacrtaj PDF, pošalji ga računovodstvu, upiši broj i vreme na sve narudžbine grupe.
//
// Broj dokumenta je broj PRVE narudžbine u grupi - isti broj nosi i predračun i
// faktura, kako je Nataša radila i ručno.
//
// Ruta NE dira fiskalizaciju. To ostaje odvojena, ručna odluka.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAdmin } from "@/lib/api-auth";
import { sastaviDokument } from "@/lib/dokument-podaci";
import { napraviDokumentPdf } from "@/lib/dokument-pdf";
import { ipsQrBuffer } from "@/lib/ips-qr";
import { SITE_URL } from "@/lib/site-url";
import { sendDokumentEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  const { groupId } = await params;
  const { tip, napomena } = (await request.json()) as {
    tip: "predracun" | "faktura";
    napomena?: string;
  };
  if (tip !== "predracun" && tip !== "faktura") {
    return NextResponse.json({ error: "Nepoznat tip dokumenta." }, { status: 400 });
  }

  const { data: orders, error } = await admin
    .from("orders")
    .select(
      "id, order_number, total, items, billing_email, company_id, payment_status, predracun_broj, faktura_broj",
    )
    .eq("company_order_group", groupId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Greška pri čitanju narudžbina." }, { status: 500 });
  }
  if (!orders?.length) {
    return NextResponse.json({ error: "Nema narudžbina u ovoj grupi." }, { status: 404 });
  }

  // Isti dokument se ne izdaje dvaput - dvoklik ne sme da napravi drugu fakturu.
  const postojeci = tip === "predracun" ? orders[0].predracun_broj : orders[0].faktura_broj;
  if (postojeci) {
    return NextResponse.json({ broj: postojeci, vecIzdat: true });
  }

  // Faktura ide tek kad je uplata potvrđena. Predračun je taj koji traži uplatu.
  if (tip === "faktura" && orders.some((o) => o.payment_status !== "completed")) {
    return NextResponse.json(
      { error: "Faktura ide tek kad su sve narudžbine u grupi označene kao plaćene." },
      { status: 400 },
    );
  }

  const broj = orders[0].order_number;
  if (!broj) {
    return NextResponse.json({ error: "Narudžbina nema broj." }, { status: 400 });
  }
  if (!orders[0].company_id) {
    return NextResponse.json({ error: "Narudžbina nije vezana za firmu." }, { status: 400 });
  }

  const { data: firma } = await admin
    .from("companies")
    .select("naziv, adresa, pib, maticni_broj, email")
    .eq("id", orders[0].company_id)
    .single();

  if (!firma) {
    return NextResponse.json({ error: "Firma nije pronađena." }, { status: 400 });
  }

  const primalac = orders[0].billing_email ?? firma.email;
  if (!primalac) {
    return NextResponse.json(
      { error: "Nema mejla računovodstva - dopuni podatke firme." },
      { status: 400 },
    );
  }

  const dokument = sastaviDokument({
    tip,
    broj,
    datum: new Intl.DateTimeFormat("sr-RS", {
      timeZone: "Europe/Belgrade",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date()),
    kupac: {
      naziv: firma.naziv,
      adresa: firma.adresa,
      pib: firma.pib,
      maticniBroj: firma.maticni_broj,
      email: firma.email,
    },
    narudzbine: orders.map((o) => ({
      opis: (o.items as { title?: string }[] | null)?.[0]?.title ?? "Kurs nemačkog jezika",
      total: Number(o.total),
    })),
    napomena: napomena?.trim() || null,
  });

  const qrPodaci = { total: dokument.ukupnoSaPdv, broj, tip };
  const qr = await ipsQrBuffer(qrPodaci);
  const pdf = napraviDokumentPdf(dokument, qr);

  // QR u mejlu se služi sa NAŠE adrese, ne sa Supabase Storage-a: slika sa strane
  // adrese obara isporučivost (Resend upozorava, Gmail je ceni kao sumnjivu).
  const ipsQrUrl =
    tip === "predracun" ? `${SITE_URL}/api/qr/${orders[0].id}?tip=predracun` : null;

  const poslato = await sendDokumentEmail({ to: primalac, dokument, pdf, ipsQrUrl });
  if (!poslato) {
    // Bez upisa broja - da sledeći klik pokuša ponovo umesto da tvrdi da je poslato.
    const msg = `[dokument] slanje ${tip} ${broj} palo`;
    console.error(msg);
    Sentry.captureException(new Error(msg));
    return NextResponse.json({ error: "Mejl nije poslat. Pokušaj ponovo." }, { status: 502 });
  }

  const sada = new Date().toISOString();
  const kolone =
    tip === "predracun"
      ? { predracun_broj: broj, predracun_sent_at: sada }
      : { faktura_broj: broj, faktura_sent_at: sada };

  await admin.from("orders").update(kolone).eq("company_order_group", groupId);

  return NextResponse.json({ broj, poslatoNa: primalac, stavki: dokument.stavke.length });
}
