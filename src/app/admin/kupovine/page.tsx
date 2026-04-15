import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminKupovine() {
  const supabase = await createClient();
  const { data: purchases } = await supabase
    .from("purchases")
    .select(`*, user_profiles:user_id (full_name, email), courses:course_id (title)`)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Kupovine</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-6 py-3">Student</th>
              <th className="text-left px-6 py-3">Kurs</th>
              <th className="text-left px-6 py-3">Iznos</th>
              <th className="text-left px-6 py-3">Način</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Datum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {purchases?.map((p: Record<string, unknown>) => (
              <tr key={p.id as string} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{(p.user_profiles as Record<string, string>)?.full_name || "—"}</div>
                  <div className="text-xs text-gray-400">{(p.user_profiles as Record<string, string>)?.email}</div>
                </td>
                <td className="px-6 py-4 text-gray-500">{(p.courses as Record<string, string>)?.title}</td>
                <td className="px-6 py-4 text-gray-500">{Number(p.amount).toLocaleString("sr-RS")} RSD</td>
                <td className="px-6 py-4 text-gray-500">{p.payment_method as string}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.status === "completed" ? "bg-plava-light text-plava" : p.status === "pending" ? "bg-yellow-50 text-yellow-600" : "bg-koral-light text-koral"
                  }`}>
                    {p.status === "completed" ? "Završeno" : p.status === "pending" ? "Na čekanju" : "Neuspešno"}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{new Date(p.created_at as string).toLocaleDateString("sr-RS")}</td>
              </tr>
            ))}
            {(!purchases || purchases.length === 0) && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Nema kupovina.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
