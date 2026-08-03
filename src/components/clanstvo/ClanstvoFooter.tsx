// Mali footer NH Membership sekcije - školski Footer je tamo sakriven
// (SakrijNa u root layout-u). Samo ono što članici treba: pravila zajednice,
// uslovi i kontakt.
import Link from "next/link";

export default function ClanstvoFooter() {
  return (
    <footer className="border-t border-nh-pink-light bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-nh-dark/60 sm:flex-row sm:justify-between sm:text-left">
        <p>
          © {new Date().getFullYear()} Nataša Hartweger · NH{" "}
          <span className="text-nh-pink">Membership</span>
        </p>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link href="/clanstvo/pravila" className="hover:text-nh-pink">
            Pravila zajednice
          </Link>
          <Link href="/uslovi" className="hover:text-nh-pink">
            Uslovi korišćenja
          </Link>
          <a href="mailto:info@hartweger.rs" className="hover:text-nh-pink">
            info@hartweger.rs
          </a>
        </nav>
      </div>
    </footer>
  );
}
