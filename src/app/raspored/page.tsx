import type { Metadata } from "next";
import Link from "next/link";
import { fetchRaspored } from "@/lib/raspored";
import RasporedKartice from "@/components/RasporedKartice";

// Podaci (cene, mesta, grupe) idu iz baze - stranica se osvežava sama,
// ne sme da čeka sledeći deploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Raspored grupnih kurseva - Hartweger",
  description:
    "Termini grupnih kurseva nemačkog jezika - dva časa nedeljno u malim grupama od 3 do 6 polaznika. Pogledaj raspored i prijavi se online.",
  openGraph: {
    images: [{ url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger - Škola nemačkog jezika" }],
    title: "Raspored grupnih kurseva - Hartweger",
    description:
      "Termini grupnih kurseva nemačkog jezika - dva časa nedeljno u malim grupama od 3 do 6 polaznika.",
  },
};

export default async function RasporedPage() {
  const grupe = await fetchRaspored();

  return (
    <div>
      {/* Hero + raspored */}
      <section className="py-14 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-gray-900 text-center">
            Raspored grupnih kurseva
          </h1>
          <p className="text-gray-600 text-center mt-3 max-w-xl mx-auto">
            Dva časa nedeljno u malim grupama od 3 do 6 polaznika.
          </p>
          <div className="mt-10">
            <RasporedKartice grupe={grupe} />
          </div>
        </div>
      </section>

      {/* Test nivoa CTA */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto bg-plava-light rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-montserrat font-bold text-gray-900">Ne znaš koji nivo?</h2>
            <p className="text-gray-600 mt-1">Uradi besplatno testiranje i saznaj za 10 minuta.</p>
          </div>
          <Link
            href="/besplatno-testiranje"
            className="bg-plava hover:bg-plava-dark text-white font-bold py-3 px-8 rounded-xl transition-colors whitespace-nowrap"
          >
            Besplatno testiranje
          </Link>
        </div>
      </section>
    </div>
  );
}
