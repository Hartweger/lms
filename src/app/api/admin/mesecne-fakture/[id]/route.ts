// Izdavanje pripremljene mesečne fakture: dodeli broj, napravi PDF, pošalji mejlom
// i (na poseban klik) na SEF.
//
// Broj se dodeljuje TEK ovde. Pripremljena a neposlata faktura ne sme da potroši
// broj - rupa u seriji je ozbiljnija od jednog klika više.
//
// `akcija: "posalji"`  → broj + PDF + mejl
// `akcija: "sef"`      → ista faktura, pod istim brojem, na SEF
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAdmin } from "@/lib/api-auth";
import { MERCHANT } from "@/lib/payment-confirmation";
import { BANK_FIRME } from "@/lib/order-utils";
import { sastaviDokument } from "@/lib/dokument-podaci";
import { napraviDokumentPdf } from "@/lib/dokument-pdf";
import { ipsQrBuffer } from "@/lib/ips-qr";
import { sendDokumentEmail } from "@/lib/email";
import { napraviUbl } from "@/lib/sef-ubl";
import { posaljiUbl, procitajStatus, izvuciSefId, sefPodesen, izvuciStatus } from "@/lib/sef";
import type { Json } from "@/lib/supabase/database.types";

function danBeograd(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function plusDana(ymd: string, dana: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dana);
  return d.toISOString().slice(0, 10);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  const { id } = await params;
  const { akcija } = (await request.json()) as { akcija: "posalji" | "sef" };

  const { data: run } = await admin
    .from("recurring_invoice_runs")
    .select("*, recurring:recurring_id(company_id)")
    .eq("id", id)
    .maybeSingle();

  if (!run) return NextResponse.json({ error: "Faktura nije pronađena." }, { status: 404 });

  const veza = run.recurring as { company_id: string } | null;
  const { data: firma } = await admin
    .from("companies")
    .select("naziv, adresa, grad, pib, maticni_broj, email")
    .eq("id", veza?.company_id ?? "")
    .maybeSingle();

  if (!firma) return NextResponse.json({ error: "Firma nije pronađena." }, { status: 400 });

  // ---------- Slanje firmi ----------
  if (akcija === "posalji") {
    if (run.faktura_sent_at) {
      return NextResponse.json({ broj: run.broj, vecPoslata: true });
    }
    if (!firma.email) {
      return NextResponse.json(
        { error: "Firma nema mejl za fakturu - dopuni podatke firme." },
        { status: 400 },
      );
    }

    const godina = Number(run.period.slice(0, 4));
    const { data: redni, error: brojErr } = await admin.rpc("sledeci_broj_fakture", {
      p_godina: godina,
    });
    if (brojErr || typeof redni !== "number") {
      return NextResponse.json({ error: "Dodela broja nije uspela." }, { status: 500 });
    }
    const broj = `${redni}/${godina}`;
    const datum = danBeograd(new Date());

    const dokument = sastaviDokument({
      tip: "faktura",
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
      narudzbine: [{ opis: run.opis, total: run.iznos }],
    });

    const qr = await ipsQrBuffer({ total: run.iznos, broj, tip: "faktura" });
    const pdf = napraviDokumentPdf(dokument, qr);

    const poslato = await sendDokumentEmail({ to: firma.email, dokument, pdf, ipsQrUrl: null });
    if (!poslato) {
      // Broj je već potrošen; upisuje se da se ne dodeli drugi pri ponovnom pokušaju.
      await admin.from("recurring_invoice_runs").update({ broj }).eq("id", id);
      Sentry.captureException(new Error(`[mesecne-fakture] slanje ${broj} palo`));
      return NextResponse.json({ error: "Mejl nije poslat. Pokušaj ponovo." }, { status: 502 });
    }

    await admin
      .from("recurring_invoice_runs")
      .update({ broj, faktura_sent_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ broj, poslatoNa: firma.email, datum });
  }

  // ---------- Slanje na SEF ----------
  if (!sefPodesen()) {
    return NextResponse.json({ error: "SEF ključ nije postavljen." }, { status: 503 });
  }
  if (run.sef_invoice_id) {
    return NextResponse.json({ sefInvoiceId: run.sef_invoice_id, vecPoslato: true });
  }
  if (!run.broj || !run.faktura_sent_at) {
    return NextResponse.json(
      { error: "Prvo izdaj fakturu, pa je onda pošalji na SEF." },
      { status: 400 },
    );
  }
  if (!firma.maticni_broj || !firma.grad) {
    return NextResponse.json(
      { error: "Firmi fali matični broj ili grad - SEF ih traži." },
      { status: 400 },
    );
  }

  const requestId = run.sef_request_id ?? crypto.randomUUID();
  if (!run.sef_request_id) {
    await admin.from("recurring_invoice_runs").update({ sef_request_id: requestId }).eq("id", id);
  }

  const datumIzdavanja = danBeograd(new Date(run.faktura_sent_at));
  const ubl = napraviUbl({
    broj: run.broj,
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
    pozivNaBroj: run.broj,
    stavke: [{ opis: run.opis, jedinicnaSaPdv: run.iznos, kolicina: 1 }],
    ukupnoSaPdv: run.iznos,
  });

  const poslato = await posaljiUbl(ubl, requestId);
  if (!poslato.ok) {
    await admin
      .from("recurring_invoice_runs")
      .update({ sef_status: "GRESKA", sef_response: { greska: poslato.greska } as Json })
      .eq("id", id);
    return NextResponse.json({ error: `SEF nije primio fakturu: ${poslato.greska}` }, { status: 502 });
  }

  const sefInvoiceId = izvuciSefId(poslato.data);
  if (!sefInvoiceId) {
    await admin
      .from("recurring_invoice_runs")
      .update({ sef_status: "GRESKA", sef_response: poslato.data as unknown as Json })
      .eq("id", id);
    return NextResponse.json(
      { error: "SEF je primio fakturu, ali nije vratio broj u očekivanom obliku. Proveri u SEF panelu." },
      { status: 502 },
    );
  }

  const stanje = await procitajStatus(sefInvoiceId);
  await admin
    .from("recurring_invoice_runs")
    .update({
      sef_invoice_id: sefInvoiceId,
      sef_status: stanje.ok ? (izvuciStatus(stanje.data) ?? "Sending") : "Sending",
      sef_sent_at: new Date().toISOString(),
      sef_response: (stanje.ok ? stanje.data : poslato.data) as unknown as Json,
    })
    .eq("id", id);

  return NextResponse.json({ sefInvoiceId, status: stanje.ok ? izvuciStatus(stanje.data) : "Sending" });
}

/** Pregled pripremljene fakture kao PDF, pre slanja. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { data: run } = await auth.admin
    .from("recurring_invoice_runs")
    .select("*, recurring:recurring_id(company_id)")
    .eq("id", id)
    .maybeSingle();
  if (!run) return NextResponse.json({ error: "Nije pronađena." }, { status: 404 });

  const veza = run.recurring as { company_id: string } | null;
  const { data: firma } = await auth.admin
    .from("companies")
    .select("naziv, adresa, grad, pib, maticni_broj, email")
    .eq("id", veza?.company_id ?? "")
    .maybeSingle();
  if (!firma) return NextResponse.json({ error: "Firma nije pronađena." }, { status: 400 });

  const dokument = sastaviDokument({
    tip: "faktura",
    // Pregled pre slanja - broj još ne postoji, jer se dodeljuje pri slanju.
    broj: run.broj ?? "(dodeljuje se pri slanju)",
    datum: new Intl.DateTimeFormat("sr-RS", {
      timeZone: "Europe/Belgrade",
      day: "2-digit", month: "2-digit", year: "numeric",
    }).format(new Date()),
    kupac: {
      naziv: firma.naziv,
      adresa: firma.adresa,
      pib: firma.pib,
      maticniBroj: firma.maticni_broj,
      email: firma.email,
    },
    narudzbine: [{ opis: run.opis, total: run.iznos }],
  });

  const pdf = napraviDokumentPdf(dokument, null);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="pregled-${run.period}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
