"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";

export default function NavClient() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        if (data) setUser(data);
      }
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  return (
    <>
      {/* Desktop auth */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <Link href="/besplatno-testiranje" className="text-plava font-medium hover:text-plava-dark">
          Besplatno testiranje
        </Link>
        {user ? (
          <>
            <Link href="/dashboard" className="text-gray-600 hover:text-plava">
              Moji kursevi
            </Link>
            {user.role === "admin" && (
              <Link href="/admin" className="text-gray-600 hover:text-plava">
                Admin
              </Link>
            )}
            <button onClick={handleLogout} className="text-koral hover:text-koral-dark">
              Odjava
            </button>
            <span className="text-plava font-medium">{user.full_name}</span>
          </>
        ) : (
          <Link
            href="/prijava"
            className="bg-plava text-white px-4 py-2 rounded-lg hover:bg-plava-dark transition-colors"
          >
            Prijava
          </Link>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden text-gray-600"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Zatvori meni" : "Otvori meni"}
        aria-expanded={menuOpen}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          {menuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 border-t border-gray-100 bg-white px-4 py-4 space-y-3 text-sm z-50">
          <Link href="/besplatno-testiranje" className="block text-plava font-medium" onClick={() => setMenuOpen(false)}>
            Besplatno testiranje
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="block text-gray-600" onClick={() => setMenuOpen(false)}>
                Moji kursevi
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="block text-gray-600" onClick={() => setMenuOpen(false)}>
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} className="block text-koral">
                Odjava
              </button>
            </>
          ) : (
            <Link href="/prijava" className="block text-plava font-medium" onClick={() => setMenuOpen(false)}>
              Prijava
            </Link>
          )}
        </div>
      )}
    </>
  );
}
