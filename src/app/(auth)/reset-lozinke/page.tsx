"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthForma from "@/components/AuthForma";

export default function ResetLozinke() {
  const supabase = createClient();

  const handleReset = async ({ email }: { email: string }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profil`,
    });
    if (error) return "Greška pri slanju linka. Pokušajte ponovo.";
    return "OK:Link za reset lozinke je poslat na vaš email.";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-plava mb-2">Reset lozinke</h1>
        <p className="text-gray-500 mb-8">Unesite email za reset lozinke</p>

        <AuthForma tip="reset" onSubmit={handleReset} />

        <p className="mt-6 text-sm text-gray-500">
          <Link href="/prijava" className="text-plava hover:underline">
            Nazad na prijavu
          </Link>
        </p>
      </div>
    </div>
  );
}
