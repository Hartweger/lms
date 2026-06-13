import { createAdminClient } from "@/lib/supabase/admin";
import { getSmileConfig } from "@/lib/naki/smile-config";
import NakiLogs, { type NakiRow } from "./NakiLogs";
import SmileToggles from "./SmileToggles";

export const dynamic = "force-dynamic";

type Row = NakiRow & { kind: string | null };

export default async function AdminNakiPage() {
  const supabase = createAdminClient();

  // Poslednjih 1000 poruka (najnovije prvo) - i tutor (NaKI) i prodaja (Smile)
  const { data, error } = await supabase
    .from("naki_messages")
    .select("id, session_id, role, message, level, created_at, user_id, kind")
    .order("created_at", { ascending: false })
    .limit(1000);

  // Dnevni promet (poslednjih 14 dana) - odvojeno NaKI i Smile
  const { data: nakiUsage } = await supabase
    .from("naki_daily_usage")
    .select("day, count")
    .order("day", { ascending: false })
    .limit(14);
  const { data: smileUsage } = await supabase
    .from("smile_daily_usage")
    .select("day, count")
    .order("day", { ascending: false })
    .limit(14);

  const all = (data ?? []) as Row[];
  const smileRows = all.filter((r) => r.kind === "smile");
  const nakiRows = all.filter((r) => r.kind !== "smile");

  const smile = await getSmileConfig(supabase);

  return (
    <div>
      <h1 className="font-heading mb-1 text-2xl font-bold text-gray-900">NaKI & Smile logovi</h1>
      <p className="mb-6 text-sm text-gray-500">
        Razgovori grupisani po sesiji (najnovije prvo).
        {error ? " - tabela još nije migrirana." : ""}
      </p>

      {/* ── Smile - prodajni asistent ── */}
      <section className="mb-10">
        <h2 className="font-heading mb-1 text-xl font-bold" style={{ color: "#F78687" }}>
          Smile - prodajni asistent
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Pitanja posetilaca sa marketing strana (početna, kursevi). {smileRows.length} poruka.
        </p>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-heading mb-3 text-base font-bold text-gray-900">Smile prekidači</h3>
          <SmileToggles
            initial={{
              enabled: smile.enabled,
              nudge: smile.nudge,
              lead_capture: smile.leadCapture,
              coupon: smile.coupon,
            }}
          />
        </div>

        <NakiLogs rows={smileRows} usage={smileUsage ?? []} />
      </section>

      {/* ── NaKI - tutor ── */}
      <section>
        <h2 className="font-heading mb-1 text-xl font-bold text-plava">NaKI - tutor</h2>
        <p className="mb-4 text-sm text-gray-500">
          Razgovori polaznika sa NaKI tutorom (učenje). {nakiRows.length} poruka.
        </p>
        <NakiLogs rows={nakiRows} usage={nakiUsage ?? []} />
      </section>
    </div>
  );
}
