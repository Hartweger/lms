"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthForma from "@/components/AuthForma";

export default function ResetLozinke() {
  const supabase = createClient();

  const handleReset = async ({ email, captchaToken }: { email: string; captchaToken?: string }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profil`,
      captchaToken,
    });
    if (error) return "Greška pri slanju linka. Pokušaj ponovo.";
    // Supabase namerno vraća uspeh i za nepostojeći mejl (da se baza korisnika
    // ne može pecati), pa ne smemo da tvrdimo da je mejl sigurno poslat.
    return (
      "OK:Ako postoji nalog sa tim mejlom, link je upravo poslat. Otvori ga i postavi lozinku (proveri i spam)." +
      "\n\nAko za par minuta ništa ne stigne, verovatno je nalog na drugoj adresi - probaj mejl kojim si kupio/la kurs ili nam piši na info@hartweger.rs."
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-plava mb-2">Napravi novu lozinku</h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          Unesi svoj email pa ti šaljemo link da postaviš lozinku.
        </p>

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
