// Prvi spisak grupa se učitava na serveru i predaje klijentskoj komponenti kao
// početno stanje - bez toga bi GrupeAdmin morao da fetch-uje u useEffect-u pri
// montiranju (react-hooks/set-state-in-effect). Isto čitanje koristi i
// GET /api/admin/grupe, koji klijent zove posle svake izmene.
// Pristup čuva proxy (role=admin za /admin/*).
import { createAdminClient } from "@/lib/supabase/admin";
import { ucitajGrupeSaBrojem } from "@/lib/admin/grupe";
import GrupeAdmin from "./GrupeAdmin";

export const dynamic = "force-dynamic";

export default async function AdminGrupePage() {
  const grupe = await ucitajGrupeSaBrojem(createAdminClient());
  return <GrupeAdmin initial={grupe} />;
}
