import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Pocetna() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Logged in → go to dashboard
  if (user) {
    redirect("/dashboard");
  }

  // Not logged in → simple login prompt
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Hartweger <span className="text-plava">LMS</span>
      </h1>
      <p className="text-gray-500 mb-8">
        Prijavi se da pristupiš svojim kursevima
      </p>
      <Link
        href="/prijava"
        className="inline-block bg-plava text-white px-8 py-3 rounded-lg font-medium hover:bg-plava-dark transition-colors"
      >
        Prijavi se
      </Link>
      <p className="text-sm text-gray-400 mt-6">
        Nemaš nalog? Kurseve možeš kupiti na{" "}
        <a href="https://hartweger.rs" className="text-plava hover:underline" target="_blank" rel="noopener noreferrer">
          hartweger.rs
        </a>
      </p>
    </div>
  );
}
