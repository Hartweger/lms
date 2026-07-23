import Link from "next/link";
import CookieSettingsLink from "@/components/CookieSettingsLink";

export default function Footer() {
  return (
    <footer className="bg-[#1a2332] text-gray-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Logo + tagline */}
          <div>
            <img src="/logo-white.svg" alt="Hartweger" className="h-8 mb-4" />
            <div className="border-t border-gray-700 pt-4 space-y-2 text-sm text-gray-400 italic">
              <p>Svako može da nauči nemački.</p>
              <p>Baš svako.</p>
              <p>Osim onih koji nisu nikada počeli.</p>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Osnivačica:{" "}
              <a href="https://natasahartweger.rs" target="_blank" rel="noopener noreferrer" className="text-gray-300 underline underline-offset-2 hover:text-white transition-colors">
                Nataša Hartweger
              </a>
            </p>
          </div>

          {/* Linkovi */}
          <div>
            <h3 className="text-white font-bold mb-4">Linkovi</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/kursevi" className="hover:text-white transition-colors">Kursevi</Link></li>
              <li><Link href="/grupni-kursevi" className="hover:text-white transition-colors">Grupni kursevi</Link></li>
              <li><Link href="/raspored" className="hover:text-white transition-colors">Raspored grupa</Link></li>
              <li><Link href="/individualni-kursevi" className="hover:text-white transition-colors">Individualni kursevi</Link></li>
              <li><Link href="/o-natasi" className="hover:text-white transition-colors">O nama</Link></li>
              <li><Link href="/metodologija" className="hover:text-white transition-colors">O metodi</Link></li>
              <li><Link href="/magazin" className="hover:text-white transition-colors">Magazin</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">Često postavljena pitanja</Link></li>
              <li><Link href="/besplatno-testiranje" className="hover:text-white transition-colors">Besplatno testiranje</Link></li>
              <li><Link href="/kursevi/private-german-lessons-online" className="hover:text-white transition-colors">English: private German lessons</Link></li>
            </ul>
          </div>

          {/* Dokumenti + socijalne */}
          <div>
            <h3 className="text-white font-bold mb-4">Dokumenti</h3>
            <ul className="space-y-2.5 text-sm mb-6">
              <li><Link href="/uslovi" className="hover:text-white transition-colors">Uslovi korišćenja</Link></li>
              <li><Link href="/politika-privatnosti" className="hover:text-white transition-colors">Politika privatnosti</Link></li>
              <li><CookieSettingsLink className="hover:text-white transition-colors" /></li>
              <li><Link href="/kontakt" className="hover:text-white transition-colors">Kontakt</Link></li>
            </ul>

            <h3 className="text-white font-bold mb-3">Pratite nas</h3>
            <div className="flex gap-4">
              <a href="https://www.youtube.com/@NatasaHartweger" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="YouTube">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://www.facebook.com/hartwegercentar/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/hartweger_centar/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Kartice + banka: obavezni logotipi po Uputstvu za rad EPM v3.5, pogl. 2.2.
          Grupisanje: znaci PRIHVATANJA (kartice, 37-180px širine, svi isti) | znaci
          PROGRAMA (linkovani, 60-155px širine, svi isti) | banka (link) - razmak između
          grupa MIN 4 širine znaka programa (4×66=264px); na užim ekranima grupe se
          slažu uspravno (sl.1 dozvoljava). Bez fiksne visine+širine zajedno - seklo je ispis brenda.
          TODO (čeka ispravan paket logotipa od banke): amex.jpg, amex-safekey,
          dinacard-secure i NOVI logo banke (postojeći je zastareo). Bankin link
          www.bancaintesa.rs/document/documents/BIB/Retail/Trgovci/pilot.zip
          preusmerava na njihov 404 (provereno 23.07.2026) - traženo od banke. */}
      <div className="border-t border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-[264px] gap-y-4">
          <div className="flex items-center gap-x-2">
            <img src="/images/kartice/visa.jpg" alt="Visa" className="w-[46px] h-auto rounded bg-white" loading="lazy" />
            <img src="/images/kartice/mastercard.jpg" alt="Mastercard" className="w-[46px] h-auto rounded bg-white" loading="lazy" />
            <img src="/images/kartice/maestro.jpg" alt="Maestro" className="w-[46px] h-auto rounded bg-white" loading="lazy" />
            <img src="/images/kartice/dina.jpg" alt="DinaCard" className="w-[46px] h-auto rounded bg-white" loading="lazy" />
          </div>
          <div className="flex items-center gap-x-2">
            <a
              href="https://rs.visa.com/pay-with-visa/security-and-assistance/protected-everywhere.html"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visa Secure"
            >
              <img src="/images/kartice/visa-secure.jpg" alt="Visa Secure" className="w-[66px] h-auto rounded bg-white" loading="lazy" />
            </a>
            <a
              href="https://www.mastercard.rs/sr-rs/korisnici/pronadite-karticu.html"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mastercard ID Check"
            >
              <img src="/images/kartice/master-id-check.jpg" alt="Mastercard ID Check" className="w-[66px] h-auto rounded bg-white" loading="lazy" />
            </a>
          </div>
          <a
            href="https://www.bancaintesa.rs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Banca Intesa"
            className="bg-white rounded px-2 py-1 flex items-center"
          >
            <img src="/images/kartice/banca-intesa-1.svg" alt="Banca Intesa" className="h-5" loading="lazy" />
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Hartweger - Centar za nemački jezik
        </div>
      </div>
    </footer>
  );
}
