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
    if (error) return "Pogrešan email ili lozinka.";
    router.push("/dashboard");
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-plava mb-2">Prijava</h1>
        <p className="text-gray-500 mb-8">Unesite vaše podatke za pristup</p>

        <AuthForma tip="prijava" onSubmit={handleLogin} />

        <div className="mt-6 space-y-2 text-sm text-gray-500">
          <p>
            Nemate nalog?{" "}
            <Link href="/registracija" className="text-plava hover:underline">
              Registrujte se
            </Link>
          </p>
          <p>
            <Link href="/reset-lozinke" className="text-plava hover:underline">
              Zaboravili ste lozinku?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
