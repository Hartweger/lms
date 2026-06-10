"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const tabs = [
  { href: "/profesor", label: "Studenti", exact: true },
  { href: "/profesor/grupe", label: "Grupe", exact: false },
  { href: "/profesor/sesije", label: "Sesije", exact: false },
  { href: "/profesor/individualni", label: "1:1", exact: false },
  { href: "/profesor/honorar", label: "Honorar", exact: false },
  { href: "/profesor/eseji", label: "Schreiben", exact: false },
  { href: "/dashboard", label: "Kursevi", exact: false },
];

export default function ProfesorNav() {
  const pathname = usePathname();
  const prof = useSearchParams().get("prof");
  // Kad admin „uđe kao" profesor (?prof), zadrži ga kroz sve tabove (osim Kursevi/dashboard).
  const withProf = (href: string) => (prof && href.startsWith("/profesor") ? `${href}?prof=${prof}` : href);

  return (
    <>
      {prof && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800">
          <span>👁️ Admin pregled — gledaš panel izabranog profesora.</span>
          <Link href="/admin/profesori" className="font-medium underline whitespace-nowrap">Izađi</Link>
        </div>
      )}
      <nav className="flex gap-2 mb-8 border-b border-gray-100 pb-3">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={withProf(tab.href)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-plava-light text-plava font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
