"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";

// Javni linkovi - isti za sve (ulogovan ili ne). Kursevi prvi (prodaja).
const PUBLIC_LINKS = [
  { href: "/kursevi", label: "Kursevi" },
  { href: "/naki", label: "NaKI" },
  { href: "/magazin", label: "Magazin" },
  { href: "/metodologija", label: "O metodi" },
  { href: "/o-natasi", label: "O nama" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function NavClient() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

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

  // Zatvori nalog-dropdown na klik napolje.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccountOpen(false);
    router.push("/");
  };

  return (
    <>
      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        {PUBLIC_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="font-medium text-gray-600 hover:text-plava transition-colors"
          >
            {l.label}
          </Link>
        ))}

        {user ? (
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setAccountOpen((o) => !o)}
              className="flex items-center gap-1 text-plava font-medium hover:text-plava-dark transition-colors"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
            >
              {user.full_name || "Nalog"}
              <svg
                className={`w-4 h-4 transition-transform ${accountOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {accountOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50"
              >
                <Link
                  href="/dashboard"
                  onClick={() => setAccountOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Moji kursevi
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setAccountOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Admin
                  </Link>
                )}
                {user.role === "professor" && (
                  <Link
                    href="/profesor"
                    onClick={() => setAccountOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Profesor panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-koral hover:bg-gray-50"
                >
                  Odjava
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/besplatno-testiranje" className="text-plava font-medium hover:text-plava-dark transition-colors">
              Besplatni test
            </Link>
            <Link
              href="/prijava"
              className="bg-koral text-white px-5 py-2 rounded-lg font-semibold hover:bg-koral-dark transition-colors"
            >
              Prijavi se
            </Link>
          </>
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
          {PUBLIC_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block font-medium text-gray-600 hover:text-plava"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}

          {user ? (
            <>
              <Link href="/dashboard" className="block text-gray-700" onClick={() => setMenuOpen(false)}>
                Moji kursevi
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="block text-gray-700" onClick={() => setMenuOpen(false)}>
                  Admin
                </Link>
              )}
              {user.role === "professor" && (
                <Link href="/profesor" className="block text-gray-700" onClick={() => setMenuOpen(false)}>
                  Profesor panel
                </Link>
              )}
              <button onClick={handleLogout} className="block text-koral">
                Odjava
              </button>
            </>
          ) : (
            <>
              <Link href="/besplatno-testiranje" className="block text-plava font-medium" onClick={() => setMenuOpen(false)}>
                Besplatni test
              </Link>
              <Link
                href="/prijava"
                className="block bg-koral text-white px-5 py-2 rounded-lg font-semibold text-center hover:bg-koral-dark transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Prijavi se
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
