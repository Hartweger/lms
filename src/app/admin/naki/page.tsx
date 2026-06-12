import { createAdminClient } from "@/lib/supabase/admin";
import NakiLogs, { type NakiRow } from "./NakiLogs";

export const dynamic = "force-dynamic";

export default async function AdminNakiPage() {
  const supabase = createAdminClient();

  // Poslednjih 1000 poruka (najnovije prvo)
  const { data, error } = await supabase
    .from("naki_messages")
    .select("id, session_id, role, message, level, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(1000);

  // Dnevni promet (poslednjih 14 dana)
  const { data: usage } = await supabase
    .from("naki_daily_usage")
    .select("day, count")
    .order("day", { ascending: false })
    .limit(14);

  const rows = (data ?? []) as NakiRow[];

  return (
    <div>
      <h1 className="font-heading mb-1 text-2xl font-bold text-gray-900">NaKI logovi</h1>
      <p className="mb-6 text-sm text-gray-500">
        Razgovori sa NaKI-jem, grupisani po sesiji (najnovije prvo).
        {error ? " - tabela još nije migrirana (032_naki.sql)." : ""}
      </p>
      <NakiLogs rows={rows} usage={usage ?? []} />
    </div>
  );
}
