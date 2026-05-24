import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfesorNav from "@/components/ProfesorNav";

export const dynamic = "force-dynamic";

export default async function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/prijava");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "professor" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Zdravo, {profile?.full_name || "profesore"}!
        </h1>
        <p className="text-sm text-gray-400">Profesor panel</p>
      </div>
      <ProfesorNav />
      {children}
    </div>
  );
}
