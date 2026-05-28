import type { Metadata } from "next";
import Link from "next/link";
import { fetchRaspored } from "@/lib/raspored";
import RasporedGrupa from "@/components/RasporedGrupa";

export const metadata: Metadata = {
  title: "Grupni kursevi nemačkog jezika — Hartweger",
  description:
    "Pogledajte raspored grupnih kurseva nemačkog jezika i prijavite se online.",
};

export default async function GrupniKurseviPage() {
  const grupe = await fetchRaspored();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4 text-center">
        Grupni kursevi nemačkog jezika
      </h1>
      <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
        Male grupe do 6 polaznika, sertifikovani profesori, interaktivna
        nastava. Pogledajte trenutni raspored i prijavite se.
      </p>

      <RasporedGrupa grupe={grupe} />

      {/* Test nivoa CTA */}
      <div className="mt-14 bg-plava-light rounded-2xl p-8 text-center">
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">
          Niste sigurni koji nivo vam odgovara?
        </h2>
        <p className="text-gray-600 mb-4">
          Uradite besplatan test nivoa i saznajte za 10 minuta.
        </p>
        <Link
          href="/besplatno-testiranje"
          className="inline-block bg-plava hover:bg-plava-dark text-white font-bold py-3 px-8 rounded-xl transition-colors"
        >
          Besplatan test nivoa
        </Link>
      </div>
    </div>
  );
}
