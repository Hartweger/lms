import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminStudenti() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Studenti</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-6 py-3">Ime</th>
              <th className="text-left px-6 py-3">Email</th>
              <th className="text-left px-6 py-3">Registrovan</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students?.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{student.full_name || "—"}</td>
                <td className="px-6 py-4 text-gray-500">{student.email}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(student.created_at).toLocaleDateString("sr-RS")}</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/admin/studenti/${student.id}`} className="text-plava hover:underline">Detalji</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
