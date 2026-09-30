import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listStudentWordsets } from "@/lib/beleske-student";
import MojeReciClient from "./MojeReciClient";

// Iza prijave, ličan sadržaj po korisniku - ne sme u indeks (isti obrazac kao /nalog).
export const metadata = { title: "Moje reči - Hartweger", robots: { index: false } };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ set?: string }>;
}

// Serverska: čita podatke direktno preko beleske-student.ts. WordSetBlock (i time
// MojeReciClient) je klijentska komponenta, pa se podaci prosleđuju kao props - nikakva
// /api/student/... ruta ne postoji za ovu stranicu.
export default async function MojeReciPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prijava?next=/moje-reci");

  const { set } = await searchParams;
  const sets = await listStudentWordsets(user.id);

  return <MojeReciClient sets={sets} initialSetId={set ?? null} />;
}
