import type { Metadata } from "next";
import EinstufungQuiz from "./EinstufungQuiz";

export const metadata: Metadata = {
  title: "Besplatno testiranje nemačkog jezika | Hartweger",
  description: "Besplatno testiranje nivoa nemačkog jezika online. Testiraj se odmah i saznaj da li si A1, A2, B1 ili B2. Bez registracije, rezultat odmah + preporuka kursa.",
  openGraph: {
    images: [{ url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger - Škola nemačkog jezika" }],
    title: "Besplatno testiranje nemačkog jezika - saznaj svoj nivo",
    description: "Besplatno testiraj svoj nivo nemačkog jezika. Bez registracije, rezultat odmah + preporuka kursa.",
    url: "https://www.hartweger.rs/besplatno-testiranje",
    siteName: "Hartweger",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Quiz",
  name: "Besplatno testiranje nemačkog jezika",
  description: "Besplatno testiranje nivoa nemačkog jezika online - od A1 do B2. Rezultat odmah.",
  educationalLevel: ["A1", "A2", "B1", "B2"],
  provider: {
    "@type": "Organization",
    name: "Hartweger",
    url: "https://www.hartweger.rs",
  },
  isAccessibleForFree: true,
  inLanguage: "de",
  about: {
    "@type": "Language",
    name: "German",
  },
};

export default function TestNivoaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EinstufungQuiz />
    </>
  );
}
