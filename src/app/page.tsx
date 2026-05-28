import type { Metadata } from "next";
import Link from "next/link";
import NewsletterForma from "@/components/NewsletterForma";

export const metadata: Metadata = {
  title: "Hartweger — Kursevi nemačkog jezika",
  description:
    "Naučite nemački jezik online — video kursevi, grupni kursevi i individualni časovi sa Hartweger metodom.",
};

function HeroIcon() {
  return (
    <svg
      className="w-10 h-10 text-plava"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.97.633-3.793 1.708-5.272"
      />
    </svg>
  );
}

const categories = [
  {
    title: "Video kursevi",
    href: "/kursevi",
    description:
      "Učite sopstvenim tempom uz video lekcije, vežbe, kvizove i AI dijaloge — dostupno 24/7.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    title: "Grupni kursevi",
    href: "/grupni-kursevi",
    description:
      "Male grupe sa nastavnikom uživo — motivacija, konverzacija i gramatika u interakciji.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
  {
    title: "Individualni časovi",
    href: "/individualni-kursevi",
    description:
      "Personalizovana nastava 1-na-1 prilagođena vašim ciljevima i tempu učenja.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a23.838 23.838 0 0 0-1.012 5.434c-.29.149-.576.304-.856.463A24.891 24.891 0 0 0 12 18.203c4.011 0 7.85-.96 11.231-2.76-.28-.158-.567-.313-.856-.462a23.84 23.84 0 0 0-1.012-5.434m-15.482 0A47.578 47.578 0 0 1 12 7.684a47.578 47.578 0 0 1 7.74 2.463M4.26 10.147A60.114 60.114 0 0 1 12 8.206a60.114 60.114 0 0 1 7.74 1.941M12 3v.938m0 0a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
      </svg>
    ),
  },
];

export default function Pocetna() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-plava-light to-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <HeroIcon />
          </div>
          <h1 className="font-montserrat font-bold text-4xl md:text-5xl text-gray-900 mb-4 leading-tight">
            Nauči nemački jezik
            <br />
            <span className="text-plava">sa Hartweger metodom</span>
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Video kursevi, grupni kursevi i individualni časovi — sve
            što vam treba za uspešno učenje nemačkog jezika.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link
              href="/kursevi"
              className="text-center bg-koral text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-koral-dark transition-colors shadow-lg shadow-koral/20"
            >
              Pogledaj kurseve
            </Link>
            <Link
              href="/besplatno-testiranje"
              className="text-center border-2 border-plava text-plava px-8 py-3.5 rounded-xl font-semibold hover:bg-plava hover:text-white transition-colors"
            >
              Besplatni test nivoa
            </Link>
          </div>
        </div>
      </section>

      {/* Course categories */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-12">
            Izaberite način učenja
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group border border-gray-200 rounded-2xl p-8 text-center hover:border-plava hover:shadow-md transition-all"
              >
                <div className="text-plava mb-4 flex justify-center">
                  {cat.icon}
                </div>
                <h3 className="font-montserrat font-bold text-xl text-gray-900 mb-2 group-hover:text-plava transition-colors">
                  {cat.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {cat.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Test nivoa CTA bar */}
      <section className="bg-plava-light py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-montserrat font-bold text-xl md:text-2xl text-gray-900">
              Ne znaš koji nivo?
            </h2>
            <p className="text-gray-600 mt-1">
              Uradi besplatni test i saznaj za 10 minuta.
            </p>
          </div>
          <Link
            href="/besplatno-testiranje"
            className="inline-block bg-plava text-white px-8 py-3 rounded-xl font-semibold hover:bg-plava-dark transition-colors whitespace-nowrap"
          >
            Besplatni test nivoa
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-3">
            Ostanite u toku
          </h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Prijavite se na newsletter i dobijajte besplatne savete za
            učenje nemačkog, nove lekcije i posebne ponude.
          </p>
          <NewsletterForma />
        </div>
      </section>
    </>
  );
}
