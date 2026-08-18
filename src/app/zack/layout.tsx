import type { Metadata } from "next";

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

export default function ZackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F1E9] text-[#16161A]">
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
