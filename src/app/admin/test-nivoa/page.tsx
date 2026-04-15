import { createClient } from "@/lib/supabase/server";

export default async function AdminTestNivoa() {
  const supabase = await createClient();
  const { data: results } = await supabase.from("placement_test_results").select("*").order("created_at", { ascending: false }).limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Rezultati testa nivoa</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-6 py-3">Preporučeni nivo</th>
              <th className="text-left px-6 py-3">Rezultat</th>
              <th className="text-left px-6 py-3">Datum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {results?.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4"><span className="bg-plava-light text-plava px-3 py-1 rounded-full text-sm font-medium">{r.recommended_level}</span></td>
                <td className="px-6 py-4 text-gray-500">{r.score} / {r.total_questions}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(r.created_at).toLocaleDateString("sr-RS")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
