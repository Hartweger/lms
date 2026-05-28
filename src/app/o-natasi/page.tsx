import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O Nataši — Hartweger škola nemačkog jezika",
  description: "Upoznajte Natašu Hartweger — profesorku nemačkog jezika sa višegodišnjim iskustvom u online nastavi.",
};

export default function ONatasiPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8 font-montserrat">O Nataši</h1>
      <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
        <p>
          [PLACEHOLDER] Ovde ide biografija Nataše Hartweger — profesorke nemačkog jezika,
          osnivačice škole i autorke video kurseva.
        </p>
        <p>
          [PLACEHOLDER] Profesionalno iskustvo, obrazovanje, sertifikati i motivacija
          za pokretanje online škole nemačkog jezika.
        </p>
        <p>
          [PLACEHOLDER] Lični pristup nastavi, filozofija učenja i šta studenti
          mogu da očekuju od saradnje.
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
