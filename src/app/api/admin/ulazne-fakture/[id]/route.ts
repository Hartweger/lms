// Odobravanje ulazne fakture: tek ovde ona postaje trošak.
//
// Do ovog klika faktura samo stoji u spisku i ne utiče ni na jedan izveštaj. Tako
// je i traženo: sistem prikuplja, Nataša odlučuje.
//
// PATCH sa `kategorija` pravi red u `expenses`.
// PATCH sa `zanemari: true` sklanja fakturu sa spiska bez upisa u troškove
// (storno, duplikat, nešto što se ne knjiži kod nas).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { EXPENSE_CATEGORIES } from "@/lib/finansije";
import { prihvatiOdbijUlaznu, izvuciStatus } from "@/lib/sef";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  const { id } = await params;
  const telo = (await request.json()) as {
    kategorija?: string;
    zanemari?: boolean;
    napomena?: string;
    /** Prihvatanje ili odbijanje fakture NA SEF-u. */
    odluka?: "prihvati" | "odbij";
  };

  const { data: faktura } = await admin
    .from("sef_purchase_invoices")
    .select("id, sef_invoice_id, broj_dokumenta, dobavljac_naziv, dobavljac_pib, iznos, datum, expense_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!faktura) {
    return NextResponse.json({ error: "Faktura nije pronađena." }, { status: 404 });
  }

  // ---------- Prihvatanje / odbijanje NA SEF-u ----------
  // Pravni čin: njime se dobavljačeva faktura zvanično prihvata ili odbija.
  // Zato samo na izričit klik, i nikad zajedno sa knjiženjem u troškove.
  if (telo.odluka) {
    const prihvacena = telo.odluka === "prihvati";
    if (!prihvacena && !telo.napomena?.trim()) {
      return NextResponse.json(
        { error: "Za odbijanje je potreban razlog - dobavljač ga vidi." },
        { status: 400 },
      );
    }

    const res = await prihvatiOdbijUlaznu(faktura.sef_invoice_id, prihvacena, telo.napomena?.trim());
    if (!res.ok) {
      return NextResponse.json({ error: `SEF nije prihvatio odluku: ${res.greska}` }, { status: 502 });
    }

    const noviStatus = izvuciStatus(res.data) ?? (prihvacena ? "Approved" : "Rejected");
    await admin.from("sef_purchase_invoices").update({ status: noviStatus }).eq("id", id);

    return NextResponse.json({ status: noviStatus });
  }

  if (telo.zanemari) {
    if (faktura.expense_id) {
      return NextResponse.json(
        { error: "Faktura je već u troškovima - prvo je ukloni iz Finansija." },
        { status: 400 },
      );
    }
    await admin.from("sef_purchase_invoices").update({ zanemarena: true }).eq("id", id);
    return NextResponse.json({ zanemarena: true });
  }

  // Dvoklik ne sme da napravi dva troška za istu fakturu.
  if (faktura.expense_id) {
    return NextResponse.json({ expenseId: faktura.expense_id, vecUTroskovima: true });
  }

  const kategorija = telo.kategorija;
  if (!kategorija || !(EXPENSE_CATEGORIES as readonly string[]).includes(kategorija)) {
    return NextResponse.json({ error: "Izaberi kategoriju troška." }, { status: 400 });
  }
  if (faktura.iznos == null || !faktura.datum) {
    return NextResponse.json(
      { error: "Fakturi fali iznos ili datum - ne može u troškove." },
      { status: 400 },
    );
  }

  const naziv = [faktura.dobavljac_naziv, faktura.broj_dokumenta]
    .filter(Boolean)
    .join(" · ") || `Ulazna faktura ${faktura.sef_invoice_id}`;

  const { data: trosak, error } = await admin
    .from("expenses")
    .insert({
      name: naziv,
      amount: Math.round(Number(faktura.iznos)),
      category: kategorija,
      expense_date: faktura.datum,
      recurring: false,
      note: [
        telo.napomena?.trim(),
        faktura.dobavljac_pib ? `PIB ${faktura.dobavljac_pib}` : null,
        `SEF ${faktura.sef_invoice_id}`,
      ]
        .filter(Boolean)
        .join(" · "),
    })
    .select("id")
    .single();

  if (error || !trosak) {
    return NextResponse.json(
      { error: `Upis troška nije uspeo: ${error?.message ?? "nepoznato"}` },
      { status: 500 },
    );
  }

  await admin
    .from("sef_purchase_invoices")
    .update({ expense_id: trosak.id })
    .eq("id", id);

  return NextResponse.json({ expenseId: trosak.id, naziv });
}
