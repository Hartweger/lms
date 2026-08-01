"use client";
// Navigacija NH Membership sekcije. Aktivan link = pun pink; NH paleta iz
// globals.css @theme (nh-pink, nh-cream, nh-dark).
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKOVI = [
  { href: "/clanstvo", label: "Početna" },
  { href: "/clanstvo/biblioteka", label: "Biblioteka" },
  { href: "/clanstvo/zajednica", label: "Zajednica" },
  { href: "/clanstvo/clanice", label: "Članice" },
  { href: "/clanstvo/profil", label: "Moj profil" },
];

export default function ClanstvoNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-nh-pink-light bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/clanstvo" className="font-heading text-lg font-bold text-nh-dark">
          NH <span className="text-nh-pink">Membership</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {LINKOVI.map((l) => {
            const aktivan =
              pathname === l.href ||
              (l.href !== "/clanstvo" && pathname?.startsWith(l.href + "/"));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
                  aktivan
                    ? "bg-nh-pink text-white"
                    : "text-nh-dark hover:bg-nh-pink-bg"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/nalog"
            className="ml-2 whitespace-nowrap rounded-full border border-nh-pink-light px-3 py-1.5 text-sm text-nh-dark hover:bg-nh-pink-bg"
          >
            Moj nalog
          </Link>
        </nav>
      </div>
    </header>
  );
}
