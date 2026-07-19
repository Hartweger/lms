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

      {/* SEO sadržaj ispod kviza */}
      <section className="max-w-2xl mx-auto px-4 pb-16 text-gray-700">
        <h2 className="text-xl font-bold text-gray-900 mt-4 mb-3">
          Kako funkcioniše besplatan test nemačkog jezika
        </h2>
        <p className="mb-4">
          Ovaj online test nivoa nemačkog jezika (Einstufungstest) radi po principu
          stepenika: počinješ od najlakših pitanja, a test te pušta dalje samo dok
          tačno odgovaraš. Pitanja pokrivaju vokabular, gramatiku i razumevanje
          rečenica u svakodnevnim situacijama. Nema registracije, traje do 5 minuta,
          a rezultat dobijaš odmah - zajedno sa preporukom kursa koji ti odgovara.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">
          Šta znače nivoi A1, A2, B1 i B2
        </h2>
        <ul className="list-disc pl-5 mb-4 space-y-2">
          <li>
            <strong>A1</strong> - potpuni početnik: predstavljanje, osnovne fraze,
            jednostavna pitanja i odgovori.
          </li>
          <li>
            <strong>A2</strong> - snalaziš se u svakodnevnim situacijama: kupovina,
            posao, porodica, kratke poruke.
          </li>
          <li>
            <strong>B1</strong> - samostalni korisnik: pričaš o iskustvima i planovima,
            razumeš duže tekstove. Ovo je nivo koji se najčešće traži za posao i vizu.
          </li>
          <li>
            <strong>B2</strong> - tečno se izražavaš o složenijim temama i pratiš
            razgovor izvornih govornika bez većeg napora.
          </li>
        </ul>
        <p className="mb-4">
          Ako se spremaš za zvanični ispit, pogledaj i naš vodič kroz{" "}
          <a href="/magazin/testovi-za-ispit-b1-iz-nemackog-jezika" className="text-cyan-600 underline hover:text-cyan-800">
            testove za ispit B1 iz nemačkog jezika
          </a>
          .
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">
          Šta posle testa
        </h2>
        <p className="mb-4">
          Kada saznaš svoj nivo, možeš odmah da izabereš{" "}
          <a href="/kursevi" className="text-cyan-600 underline hover:text-cyan-800">
            kurs nemačkog jezika
          </a>{" "}
          koji mu odgovara - video kurs, grupnu nastavu ili individualne časove sa
          Natašom Hartweger. A ako želiš prvo malo da vežbaš, tu je{" "}
          <a href="/naki" className="text-cyan-600 underline hover:text-cyan-800">
            NaKI, besplatni AI asistent za nemački
          </a>{" "}
          sa kojim možeš da vežbaš gramatiku i razgovor na našem jeziku, 0-24.
        </p>
      </section>
    </>
  );
}
