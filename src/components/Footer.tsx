import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div>© {new Date().getFullYear()} Hartweger — Škola nemačkog jezika</div>
          <div className="flex gap-6">
            <Link href="/politika-privatnosti" className="hover:text-plava">Politika privatnosti</Link>
            <Link href="/test-nivoa" className="hover:text-plava">Test nivoa</Link>
            <a href="mailto:info@hartweger.rs" className="hover:text-plava">Kontakt</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
