"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/profesor", label: "Studenti", exact: true },
  { href: "/profesor/eseji", label: "Eseji", exact: false },
  { href: "/dashboard", label: "Kursevi", exact: false },
];

export default function ProfesorNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 mb-8 border-b border-gray-100 pb-3">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
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
  );
}
