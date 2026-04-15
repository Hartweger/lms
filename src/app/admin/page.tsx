import { createClient } from "@/lib/supabase/server";

export default async function AdminPregled() {
  const supabase = await createClient();

  const { count: studentCount } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");

  const { count: courseCount } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true });

  const { count: purchaseCount } = await supabase
    .from("purchases")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const stats = [
    { label: "Studenti", value: studentCount ?? 0 },
    { label: "Kursevi", value: courseCount ?? 0 },
    { label: "Kupovine", value: purchaseCount ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin panel</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-plava">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
