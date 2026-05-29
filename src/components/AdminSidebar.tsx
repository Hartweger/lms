"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/admin", label: "Pregled" },
  { href: "/admin/kursevi", label: "Kursevi" },
  { href: "/admin/studenti", label: "Studenti" },
  { href: "/admin/test-nivoa", label: "Test nivoa" },
  { href: "/admin/eseji", label: "Eseji" },
  { href: "/admin/profesori", label: "Profesori" },
  { href: "/admin/pristup", label: "Pristup" },
  { href: "/admin/narudzbine", label: "Narudžbine" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/analitika", label: "Analitika", exact: true },
  { href: "/admin/analitika/kupci", label: "Kupci", indent: true },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isLinkActive(link: (typeof links)[number]) {
    if (link.exact) return pathname === link.href;
    if (link.href === "/admin") return pathname === link.href;
    return pathname === link.href || pathname.startsWith(link.href + "/");
  }

  const currentLabel =
    [...links].reverse().find((l) => isLinkActive(l))?.label ?? "Admin";

  const navContent = (
    <nav className="space-y-1">
      {links.map((link) => {
        const isActive = isLinkActive(link);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm ${link.indent ? "pl-6" : ""} ${
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
  );

  return (
    <>
      {/* Mobile: dropdown toggle */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700"
          aria-expanded={open}
          aria-label="Admin navigacija"
        >
          <span>Admin — {currentLabel}</span>
          <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && <div className="mt-3">{navContent}</div>}
      </div>

      {/* Desktop: sidebar */}
      <aside className="hidden md:block w-56 bg-white border-r border-gray-100 min-h-[calc(100vh-64px)] p-4 fixed top-16">
        <div className="text-xs font-semibold uppercase text-gray-400 mb-3">Admin</div>
        {navContent}
      </aside>
    </>
  );
}
