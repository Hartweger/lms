"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Pregled" },
  { href: "/admin/kursevi", label: "Kursevi" },
  { href: "/admin/studenti", label: "Studenti" },
  { href: "/admin/kupovine", label: "Kupovine" },
  { href: "/admin/test-nivoa", label: "Test nivoa" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-100 min-h-[calc(100vh-64px)] p-4">
      <div className="text-xs font-semibold uppercase text-gray-400 mb-3">Admin</div>
      <nav className="space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href ||
            (link.href !== "/admin" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-lg text-sm ${
                isActive
                  ? "bg-plava-light text-plava font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
