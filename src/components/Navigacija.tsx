import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import NavClient from "./NavClient";

export default function Navigacija() {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 relative" aria-label="Glavna navigacija">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.jpg" alt="Hartweger" width={140} height={40} className="h-9 w-auto" />
        </Link>

        <Suspense fallback={null}>
          <NavClient />
        </Suspense>
      </div>
    </nav>
  );
}
