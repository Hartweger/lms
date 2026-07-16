import Link from "next/link";
import type { Metadata } from "next";
import ClaniceDirectory from "./ClaniceDirectory";
import { CLANICE } from "./clanice-data";

export const metadata: Metadata = {
  title: "Članice - Naša zajednica preduzetnica | Hartweger",
  description:
    "Upoznaj članice Hartweger zajednice - preduzetnice u edukaciji, jezicima, turizmu, marketingu i zanatima. Zajednica koja raste kroz razmenu, saradnju i poverenje.",
};

export default function ClanicePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-plava-light to-white pt-16 pb-12 md:pt-24 md:pb-16 px-4">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-plava/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-koral/10 blur-3xl"
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="inline-block bg-white ring-1 ring-plava/20 text-plava-dark text-sm font-semibold px-4 py-1.5 rounded-full mb-5 shadow-sm">
            {CLANICE.length} preduzetnica i broji se dalje
          </p>
          <h1 className="font-bold text-3xl md:text-5xl text-gray-900 mb-5 leading-tight">
            Naša zajednica <span className="text-plava-dark">članica</span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
            Ovde predstavljamo zajednicu koja je spremna da raste kroz razmenu,
            saradnju i poverenje. Svaka od nas gradi nešto svoje - a zajedno smo
            jače.
          </p>
        </div>
      </section>

      {/* Direktorijum */}
      <section className="py-10 md:py-14 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <ClaniceDirectory />
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 md:py-20 px-4 bg-gradient-to-b from-white to-plava-light">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-bold text-2xl md:text-3xl text-gray-900 mb-4">
            Želiš i ti svoje mesto na ovoj stranici?
          </h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            Zajednica je nastala kroz NH Academy program za preduzetnice u
            edukaciji. Pridruži se, izgradi svoj biznis i predstavi se ovde -
            sa ponosom.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/nh-academy"
              className="inline-block bg-koral text-white px-8 py-3 rounded-xl font-semibold hover:bg-koral-dark transition-colors"
            >
              Saznaj više o NH Academy
            </Link>
            <Link
              href="/kontakt"
              className="inline-block border-2 border-plava text-plava-dark px-8 py-3 rounded-xl font-semibold hover:bg-plava hover:text-white transition-colors"
            >
              Javi nam se
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
