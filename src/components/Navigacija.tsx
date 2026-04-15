"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";

export default function Navigacija() {
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
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.jpg" alt="Hartweger" width={140} height={40} className="h-9 w-auto" />
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="text-gray-600 hover:text-plava">
            Kursevi
          </Link>
          <Link href="/test-nivoa" className="text-gray-600 hover:text-plava">
            Test nivoa
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
              <button
                onClick={handleLogout}
                className="text-koral hover:text-koral-dark"
              >
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
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3 text-sm">
          <Link href="/" className="block text-gray-600" onClick={() => setMenuOpen(false)}>
            Kursevi
          </Link>
          <Link href="/test-nivoa" className="block text-gray-600" onClick={() => setMenuOpen(false)}>
            Test nivoa
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
    </nav>
  );
}
