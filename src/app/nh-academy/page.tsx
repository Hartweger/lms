import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NH Academy — Premium program nemačkog jezika",
  description: "NH Academy — premium trening program za ozbiljne polaznike koji žele brz i sistematičan napredak u nemačkom jeziku.",
};

export default function NhAcademyPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8 font-montserrat">NH Academy</h1>
      <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
        <p>
          [PLACEHOLDER] Opis NH Academy programa — premium trening za polaznike
          koji žele intenzivan i strukturiran pristup učenju nemačkog.
        </p>
        <p>
          [PLACEHOLDER] Šta uključuje program — video lekcije, grupne sesije,
          individualne konsultacije, materijali i podrška.
        </p>
        <p>
          [PLACEHOLDER] Za koga je program namenjen — nivo znanja, ciljevi
          i očekivani rezultati.
        </p>
        <p>
          [PLACEHOLDER] Cena, trajanje i kako se prijaviti.
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
