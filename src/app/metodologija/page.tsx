import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Moja metodologija — Hartweger škola nemačkog jezika",
  description: "Saznajte kako učimo nemački — komunikativni pristup, praktične vežbe i strukturiran napredak.",
};

export default function MetodologijaPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8 font-montserrat">Moja metodologija</h1>
      <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
        <p>
          [PLACEHOLDER] Opis komunikativnog pristupa nastavi — fokus na
          praktičnu upotrebu jezika od prvog dana.
        </p>
        <p>
          [PLACEHOLDER] Struktura kurseva — kako su lekcije organizovane,
          koje vrste vežbi se koriste i kako se prati napredak.
        </p>
        <p>
          [PLACEHOLDER] Razlika između tradicionalnog učenja gramatike i
          pristupa koji se koristi u Hartweger školi.
        </p>
        <p>
          [PLACEHOLDER] Rezultati studenata i priče o uspehu.
        </p>
      </div>
      <div className="mt-10">
        <Link
          href="/kursevi"
          className="inline-block bg-koral text-white px-8 py-3 rounded-xl font-semibold hover:bg-koral-dark transition-colors"
        >
          Pogledaj kurseve
        </Link>
      </div>
    </div>
  );
}
