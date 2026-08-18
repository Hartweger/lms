import type { Metadata } from "next";
import { Archivo_Black } from "next/font/google";

// Dečji deo ima svoj papirni okvir, odvojen od ostatka platforme. Podloga je
// topao papir, a ne beli ekran, jer se ceo zack drži tog jednog utiska.
//
// ODVOJENOST BRENDA: sve ispod je tu zato što se metapodaci nasleđuju iz
// korenskog rasporeda, koji je pisan za školu namenjenu odraslima. Bez ovoga
// dete koje doda aplikaciju na početni ekran dobija Hartweger logotip pod
// imenom „Hartweger", a naslov kartice u pretraživaču glasi „Škola nemačkog
// jezika". Pravilo je da Natašino ime stoji na roditeljskoj strani i nigde više.
export const metadata: Metadata = {
  title: "zack! nemački za osnovce",
  description: "Skupljaj sličice i uči nemački uz svoju lekciju iz škole.",
  // Adresa sadrži ključ deteta, pa ovim stranicama nije mesto u pretrazi.
  robots: { index: false, follow: false },
  // Sopstveni manifest: drugo ime, druga boja, druga ikonica na početnom ekranu.
  manifest: "/zack/manifest.json",
  icons: {
    icon: [{ url: "/zack/ikonica.svg", type: "image/svg+xml" }],
    apple: [{ url: "/zack/ikonica.svg", type: "image/svg+xml" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "zack!" },
  // Deljenje na društvenim mrežama ovde nema smisla, adresa je detetov ključ.
  // Prazan openGraph gasi nasleđenu školsku sliku i opis.
  openGraph: undefined,
  twitter: undefined,
};

// Papir, ne školska plava. Boja gornje trake pretraživača na telefonu.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F4F1E9",
};

// Display slovo SAMO za zack: znak, naslovi, kodovi. Učitava se ovde, u
// dečjem rasporedu, pa ostatak sajta ostaje na svojim fontovima. next/font ga
// pri buildu spusti kod nas (self-hosted), pa CSP ne vidi nijedan novi domen.
const archivo = Archivo_Black({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-zack",
});

export default function ZackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${archivo.variable} min-h-screen bg-[#F4F1E9] text-[#16161A]`}>
      {/* Jedina animacija u celom zack-u: sličica se „zalepi" - padne za
          nijansu krupnija pa legne. Definisana je jednom, ovde, i postoji
          isključivo unutar no-preference, pa uz reduced-motion elementi prosto
          stoje na mestu (bez animacije su vidljivi, `both` ih krije samo dok
          animacija stvarno teče). */}
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
      {/* Uža kolona nego inače: ovo se čita na telefonu u ruci, a na širem
          ekranu ne sme da se razvuče u traku preko celog monitora. */}
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">{children}</div>
      {/* Licenca ikonica (CC BY 4.0) traži navođenje autora. Stoji sitno i
          jednom, jer je namenjeno pravnoj obavezi, ne detetu. */}
      <p className="pb-6 text-center text-[11px]" style={{ color: "#6E6A5E" }}>
        Sličice koriste Twemoji, autor Twitter, licenca CC BY 4.0.
      </p>
    </div>
  );
}
