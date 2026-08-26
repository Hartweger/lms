// Firme koje su kupovale kurseve. Postoji zato što se firma pamti pri prvoj
// kupovini, a do sada nije bilo načina da joj se podaci isprave - nepotpuna firma
// je zaustavljala slanje na SEF i moralo se u bazu ručno.
import { createAdminClient } from "@/lib/supabase/admin";
import FirmeClient, { type FirmaRed } from "./FirmeClient";

export const dynamic = "force-dynamic";

export default async function AdminFirmePage() {
  const admin = createAdminClient();

  const { data: firme } = await admin
    .from("companies")
    .select("id, pib, naziv, adresa, grad, maticni_broj, email, created_at")
    .order("naziv");

  // Broj narudžbina po firmi - da se vidi koja je stvarno u upotrebi.
  const { data: narudzbine } = await admin
    .from("orders")
    .select("company_id")
    .not("company_id", "is", null);

  const brojPoFirmi = new Map<string, number>();
  for (const o of narudzbine ?? []) {
    if (!o.company_id) continue;
    brojPoFirmi.set(o.company_id, (brojPoFirmi.get(o.company_id) ?? 0) + 1);
  }

  const redovi: FirmaRed[] = (firme ?? []).map((f) => ({
    pib: f.pib,
    naziv: f.naziv,
    adresa: f.adresa,
    grad: f.grad,
    maticniBroj: f.maticni_broj,
    email: f.email,
    brojNarudzbina: brojPoFirmi.get(f.id) ?? 0,
  }));

  return <FirmeClient firme={redovi} />;
}
