"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthForma from "@/components/AuthForma";

export default function Prijava() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error)
      return 'Email ili lozinka nisu tačni. Ako nemaš lozinku, vrati se i uđi linkom na mejl ili preko Google.';
    router.push("/dashboard");
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-plava mb-2">Prijava za polaznike</h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          Kupio/la si kurs u Hartweger centru? Uđi ovde da pristupiš svojim lekcijama i materijalima.
        </p>

        <AuthForma tip="prijava" onSubmit={handleLogin} />

        <div className="mt-6 text-sm text-gray-500">
          <p>
            Nemaš još kurs?{" "}
            <Link href="/kursevi" className="text-plava hover:underline">
              → Pogledaj kurseve
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
