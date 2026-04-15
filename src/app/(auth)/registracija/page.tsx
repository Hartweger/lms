"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthForma from "@/components/AuthForma";

export default function Registracija() {
  const supabase = createClient();

  const handleRegister = async ({
    email,
    password,
    fullName,
  }: {
    email: string;
    password: string;
    fullName?: string;
  }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) {
      if (error.message.includes("already registered")) {
        return "Ovaj email je već registrovan.";
      }
      return "Greška pri registraciji. Pokušajte ponovo.";
    }
    return "OK:Proverite vaš email za potvrdu registracije.";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-plava mb-2">Registracija</h1>
        <p className="text-gray-500 mb-8">Napravite nalog za pristup kursevima</p>

        <AuthForma tip="registracija" onSubmit={handleRegister} />

        <p className="mt-6 text-sm text-gray-500">
          Već imate nalog?{" "}
          <Link href="/prijava" className="text-plava hover:underline">
            Prijavite se
          </Link>
        </p>
      </div>
    </div>
  );
}
