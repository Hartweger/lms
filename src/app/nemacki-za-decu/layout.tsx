import type { Metadata } from "next";
import { Archivo_Black } from "next/font/google";

// Papirni okvir prodajne strane zack!-a. Strana živi VAN /zack namerno:
// publika su roditelji (odrasli), pa ovde SME i treba školsko merenje
// (gtag, piksel, traka za kolačiće) i Google indeks - sve ono što je na
// /zack prefiksu isključeno zbog dece. Vizuelno je ovo i dalje zack! brend,
// pa okvir ponavlja isti papir i isto display slovo kao src/app/zack/layout.tsx.
export const metadata: Metadata = {
  // Javna prodajna strana - njoj je posao da dovodi roditelje iz pretrage.
  title: "zack! - nemački za osnovce kroz igru",
  description:
    "Album sa sličicama u kom tvoje dete uči nemački po deset minuta dnevno - po programu Ministarstva, sa izveštajem roditelju. Bez reklama i bez ocena.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/nemacki-za-decu" },
  // OG bez slike: zack! još nema svoju OG sliku (ikonica.svg ne važi kao OG,
  // a školski /og/share.png je pogrešan brend) - bolje ništa nego pogrešno.
  openGraph: {
    title: "zack! - nemački za osnovce kroz igru",
    description:
      "Album sa sličicama u kom tvoje dete uči nemački po deset minuta dnevno - po programu Ministarstva, sa izveštajem roditelju.",
    url: "/nemacki-za-decu",
  },
  twitter: {
    card: "summary",
    title: "zack! - nemački za osnovce kroz igru",
    description:
      "Album sa sličicama u kom tvoje dete uči nemački po deset minuta dnevno - po programu Ministarstva, sa izveštajem roditelju.",
  },
  // Kartica u pretraživaču nosi zack! znak, ne školski - dva su brenda.
  icons: {
    icon: [{ url: "/zack/ikonica.svg", type: "image/svg+xml" }],
    apple: [{ url: "/zack/ikonica.svg", type: "image/svg+xml" }],
  },
};

// Papir, ne školska plava. Boja gornje trake pretraživača na telefonu.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F4F1E9",
};

// Display slovo SAMO za zack: isti obrazac kao u dečjem rasporedu. next/font
// ga pri buildu spusti kod nas (self-hosted), pa CSP ne vidi nijedan novi domen.
const archivo = Archivo_Black({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-zack",
});

export default function NemackiZaDecuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${archivo.variable} min-h-screen bg-[#F4F1E9] text-[#16161A]`}>
      {/* Ista „zalepi" animacija kao u dečjem delu - sličica padne za nijansu
          krupnija pa legne. Živi isključivo unutar no-preference, pa uz
          reduced-motion elementi prosto stoje na mestu (bez animacije su
          vidljivi, `both` ih krije samo dok animacija stvarno teče). */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes zack-zalepi {
            0% { opacity: 0; transform: translateY(-12px) scale(1.3) rotate(var(--zack-r, 0deg)); }
            65% { opacity: 1; transform: translateY(0) scale(0.97) rotate(var(--zack-r, 0deg)); }
            100% { opacity: 1; transform: translateY(0) scale(1) rotate(var(--zack-r, 0deg)); }
          }
          .zack-zalepi {
            animation: zack-zalepi 0.5s cubic-bezier(0.2, 0.7, 0.3, 1.15) both;
            animation-delay: var(--zack-kasni, 0s);
          }
        }
      `}</style>
      {children}
      {/* Licenca ikonica (CC BY 4.0) traži navođenje autora - sličice na
          landingu su iste Twemoji ikonice kao u proizvodu. */}
      <p className="pb-6 text-center text-[11px]" style={{ color: "#6E6A5E" }}>
        Sličice koriste Twemoji, autor Twitter, licenca CC BY 4.0.
      </p>
    </div>
  );
}
