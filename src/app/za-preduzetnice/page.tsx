import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Za preduzetnice — Nemački za poslovne žene | Hartweger",
  description: "Specijalizovani program nemačkog jezika za preduzetnice — poslovni vokabular, komunikacija i samopouzdanje.",
};

export default function ZaPreduzetnicePage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8 font-montserrat">Za preduzetnice</h1>
      <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
        <p>
          [PLACEHOLDER] Program nemačkog jezika prilagođen preduzetnicama —
          fokus na poslovnu komunikaciju, sastanke i pregovaranje.
        </p>
        <p>
          [PLACEHOLDER] Specifičan vokabular za biznis kontekst — pisanje mejlova,
          telefonski razgovori, prezentacije na nemačkom.
        </p>
        <p>
          [PLACEHOLDER] Format programa — trajanje, intenzitet, online ili uživo,
          individualni ili grupni rad.
        </p>
        <p>
          [PLACEHOLDER] Priče uspešnih polaznica i rezultati programa.
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
