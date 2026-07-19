import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Online kurs nemačkog jezika - A1 do C1 | Hartweger",
  description:
    "Online kurs nemačkog jezika od A1 do C1 - video kursevi, male grupe uživo ili časovi 1:1. VoKuM metoda, 260+ Google recenzija 5.0. Kreni od besplatnog testa.",
  openGraph: {
    images: [{ url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger - Škola nemačkog jezika" }],
    title: "Online kurs nemačkog jezika - A1 do C1 | Hartweger",
    description:
      "Video kursevi, male grupe uživo ili individualni časovi. VoKuM metoda, 260+ Google recenzija 5.0.",
    url: "https://www.hartweger.rs/online-kurs-nemackog-jezika",
    siteName: "Hartweger",
    type: "website",
  },
};

const FAQ = [
  {
    q: "Koliko traje online kurs nemačkog jezika?",
    a: "Zavisi od formata: jedan nivo (npr. A1.1) u grupnoj nastavi traje oko 3 meseca sa dva časa nedeljno. Video kurs prelaziš svojim tempom - neko završi nivo za 6 nedelja, neko za 4 meseca. Za individualne časove tempo dogovaraš sa profesorkom.",
  },
  {
    q: "Mogu li da krenem od nule, bez ikakvog predznanja?",
    a: "Da. Kursevi počinju od nivoa A1.1, gde se uči od prve reči. Sva objašnjenja su na našem jeziku, tako da ti nemački nije potreban ni za prvi čas.",
  },
  {
    q: "Kako izgleda online nastava uživo?",
    a: "Grupni i individualni časovi se održavaju preko video poziva, u realnom vremenu sa profesorkom. Grupe su male, do 6 polaznika, tako da svako priča na svakom času. Uz to dobijaš beleške sa časa i video lekcije za obnavljanje.",
  },
  {
    q: "Koji format da izaberem - video, grupni ili individualni?",
    a: "Video kurs je za samostalne i one sa nepredvidivim rasporedom. Grupni je najbolji odnos cene i strukture - fiksni termini i konverzacija. Individualni je najbrži put kada imaš konkretan cilj ili rok, npr. ispit ili posao.",
  },
  {
    q: "Da li dobijam sertifikat?",
    a: "Da, po završetku kursa dobijaš Hartweger sertifikat sa online verifikacijom. Ako ti treba zvanični međunarodni sertifikat (Goethe, TELC), pripremamo te ciljano za taj ispit.",
  },
  {
    q: "Kako da znam koji je moj nivo?",
    a: "Uradi besplatan test nivoa na sajtu - traje do 5 minuta, bez registracije, i odmah dobijaš rezultat sa preporukom kursa.",
  },
];

const FORMATI = [
  {
    naziv: "Video kursevi",
    opis: "Kompletan nivo u snimljenim lekcijama sa Natašom Hartweger. Učiš kad tebi odgovara, svojim tempom, uz interaktivne vežbe, testove i NaKI asistenta.",
    zaKoga: "Za samostalne, zauzete i one koji vole svoj tempo.",
    href: "/kursevi",
    cta: "Pogledaj video kurseve",
  },
  {
    naziv: "Grupni online kursevi",
    opis: "Nastava uživo preko video poziva, u malim grupama do 6 polaznika, dva časa nedeljno. Uz čas dobijaš beleške i video lekcije za obnavljanje.",
    zaKoga: "Za one kojima treba struktura, termini i konverzacija.",
    href: "/grupni-kursevi",
    cta: "Vidi raspored grupa",
  },
  {
    naziv: "Individualni časovi 1:1",
    opis: "Časovi samo za tebe, potpuno prilagođeni tvom cilju - posao, viza, ispit ili struka. Tempo i termine dogovaraš sa profesorkom.",
    zaKoga: "Za one sa konkretnim ciljem i rokom.",
    href: "/individualni-kursevi",
    cta: "Saznaj više o 1:1",
  },
];

const ZASTO = [
  "Profesorka sa 20+ godina iskustva, licencirani ispitivač za Goethe i TELC ispite",
  "VoKuM metoda: vokabular, komunikacija i motivacija umesto bubanja gramatike",
  "Sva objašnjenja na našem jeziku - razumeš odmah, bez prevođenja",
  "NaKI, besplatni AI asistent za vežbanje gramatike i razgovora, dostupan 0-24",
  "4.000+ polaznika i 260+ Google recenzija sa prosekom 5.0",
  "Hartweger sertifikat sa online verifikacijom po završetku kursa",
];

export default function OnlineKursPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-gray-900 mb-5">
            Online kurs nemačkog jezika
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            Od A1 do C1, sa profesorkom koja je i zvanični ispitivač. Izaberi format koji ti
            odgovara - video kurs svojim tempom, malu grupu uživo ili individualne časove 1:1.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            20+ godina iskustva · 4.000+ polaznika · 260+ Google recenzija (5.0)
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/besplatno-testiranje"
              className="bg-plava hover:bg-plava-dark text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Testiraj svoj nivo besplatno
            </Link>
            <Link
              href="/kursevi"
              className="border border-plava text-plava hover:bg-plava-light font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Pogledaj sve kurseve
            </Link>
          </div>
        </div>
      </section>

      {/* Formati */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-montserrat font-bold text-center mb-3">
            Tri načina da naučiš nemački online
          </h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
            Svaki format vodi do istog cilja - da progovoriš. Razlika je u tempu, ceni i količini
            rada sa profesorkom uživo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FORMATI.map((f) => (
              <div key={f.naziv} className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
                <h3 className="font-montserrat font-bold text-lg text-gray-900 mb-2">{f.naziv}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{f.opis}</p>
                <p className="text-sm text-gray-500 italic mb-5">{f.zaKoga}</p>
                <Link
                  href={f.href}
                  className="mt-auto text-plava font-semibold hover:underline"
                >
                  {f.cta} →
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">
            Još uvek istražuješ opcije? Pročitaj naše pošteno poređenje:{" "}
            <Link href="/magazin/kako-da-naucis-nemacki-online" className="text-plava hover:underline">
              Kako da naučiš nemački online - svi načini, cene i za koga je šta
            </Link>
          </p>
        </div>
      </section>

      {/* Zašto Hartweger */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-montserrat font-bold text-center mb-8">
            Zašto polaznici biraju Hartweger školu
          </h2>
          <ul className="space-y-3">
            {ZASTO.map((z) => (
              <li key={z} className="flex gap-3 items-start">
                <span className="text-plava font-bold mt-0.5">✓</span>
                <span className="text-gray-700">{z}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-600 mt-6">
            Više o tome kako nastava izgleda i zašto VoKuM metoda daje rezultate pročitaj na
            stranici{" "}
            <Link href="/metodologija" className="text-plava hover:underline">
              o metodologiji
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Priprema za ispite */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-montserrat font-bold mb-4">
            Spremaš se za zvanični ispit ili posao u inostranstvu?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Pripremamo ciljano za Goethe i TELC ispite od A1 do C1, a za lekare i medicinsko
            osoblje postoji poseban{" "}
            <Link href="/kursevi/fsp" className="text-plava hover:underline">
              FSP pripremni kurs
            </Link>
            . Profesorka je licencirani ispitivač, pa znaš tačno šta te na ispitu čeka.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-montserrat font-bold text-center mb-8">
            Česta pitanja o online kursu nemačkog
          </h2>
          {FAQ.map((item) => (
            <details key={item.q} className="bg-white rounded-xl shadow-sm p-5 mb-3">
              <summary className="font-semibold text-gray-900 cursor-pointer">{item.q}</summary>
              <p className="text-gray-600 mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto bg-plava-light rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-montserrat font-bold text-gray-900">
              Prvi korak je besplatan
            </h2>
            <p className="text-gray-600 mt-1">
              Uradi test nivoa za 5 minuta i saznaj tačno odakle da kreneš.
            </p>
          </div>
          <Link
            href="/besplatno-testiranje"
            className="bg-plava hover:bg-plava-dark text-white font-bold py-3 px-8 rounded-xl transition-colors whitespace-nowrap"
          >
            Započni test
          </Link>
        </div>
      </section>
    </div>
  );
}
