import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminTestNivoa() {
  const supabase = await createClient();
  const { data: results } = await supabase
    .from("placement_test_results")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const total = results?.length ?? 0;
  const withEmail = results?.filter((r) => r.email).length ?? 0;

  const levelCounts: Record<string, number> = {};
  results?.forEach((r) => {
    const lvl = r.recommended_level || "?";
    levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Rezultati testa nivoa</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-plava">{total}</p>
          <p className="text-sm text-gray-500">Ukupno testova</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-zelena">{withEmail}</p>
          <p className="text-sm text-gray-500">Sa email-om</p>
        </div>
        {Object.entries(levelCounts).sort().map(([level, count]) => (
          <div key={level} className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{count}</p>
            <p className="text-sm text-gray-500">{level}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-6 py-3">Email</th>
              <th className="text-left px-6 py-3">Nivo</th>
              <th className="text-left px-6 py-3">Rezultat</th>
              <th className="text-left px-6 py-3">Skorovi</th>
              <th className="text-left px-6 py-3">Datum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {results?.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-700">{r.email || "\u2014"}</td>
                <td className="px-6 py-4">
                  <span className="bg-plava-light text-plava px-3 py-1 rounded-full text-sm font-medium">
                    {r.recommended_level}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{r.score}/{r.total_questions}</td>
                <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                  {r.scores ? Object.entries(r.scores as Record<string, number>).map(([lvl, s]) => `${lvl}:${s}`).join(" ") : "\u2014"}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(r.created_at).toLocaleDateString("sr-RS")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
