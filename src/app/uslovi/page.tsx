import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opšti uslovi poslovanja — Hartweger",
  description: "Opšti uslovi korišćenja platforme Hartweger — uslovi kupovine, pristup kursevima i pravila korišćenja.",
};

export default function UsloviPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8 font-montserrat">Opšti uslovi poslovanja</h1>
      <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
        <p>
          [PLACEHOLDER] Uslovi kupovine video kurseva — pristup, trajanje licence,
          pravo na povraćaj sredstava.
        </p>
        <p>
          [PLACEHOLDER] Uslovi za grupne i individualne kurseve — otkazivanje,
          promena termina, minimalan broj polaznika.
        </p>
        <p>
          [PLACEHOLDER] Zaštita autorskih prava — zabrana deljenja materijala,
          snimanja lekcija i redistribucije sadržaja.
        </p>
        <p>
          [PLACEHOLDER] Politika privatnosti — koje podatke prikupljamo,
          kako ih koristimo i kako ih štitimo.
        </p>
        <p>
          [PLACEHOLDER] Kontakt informacije za reklamacije i žalbe.
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
