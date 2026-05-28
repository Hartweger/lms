import type { Metadata } from "next";
import Link from "next/link";
import ProfesorKartica from "@/components/ProfesorKartica";

export const metadata: Metadata = {
  title: "Individualni kursevi nemačkog jezika — Hartweger",
  description:
    "Individualna nastava nemačkog jezika sa sertifikovanim profesorima. Prilagodjen tempo i program.",
};

const profesori = [
  {
    name: "Nataša Hartweger",
    role: "Osnivač, A1–B1",
    bio: "Osnivač škole Hartweger sa dugogodišnjim iskustvom u nastavi nemačkog jezika. Specijalizovana za početnike i srednji nivo.",
  },
  {
    name: "Milica Vučić",
    role: "A1–B1",
    bio: "Iskusna profesorka nemačkog jezika sa fokusom na komunikativnu nastavu za početni i srednji nivo.",
  },
  {
    name: "Katarina Todosijević",
    role: "B2–C1",
    bio: "Stručnjak za viši nivo nemačkog jezika. Priprema polaznika za B2 i C1 ispite.",
  },
  {
    name: "Hristina Šarčević",
    role: "A1–B1",
    bio: "Profesorka sa strašću za podučavanje nemačkog od početnog do srednjeg nivoa.",
  },
  {
    name: "Suzana Marjanović",
    role: "A1–A2",
    bio: "Specijalizovana za rad sa polaznicima na početnom nivou nemačkog jezika.",
  },
  {
    name: "Marija Radojković Stanojić",
    role: "B1–B2",
    bio: "Profesorka sa iskustvom u nastavi srednjeg i višeg nivoa nemačkog jezika.",
  },
];

export default function IndividualniKurseviPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4 text-center">
        Individualni kursevi nemačkog jezika
      </h1>
      <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
        Nastava prilagodjena vašem tempu, ciljevima i rasporedu. Jedan na jedan
        sa sertifikovanim profesorom.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
        {profesori.map((prof) => (
          <ProfesorKartica
            key={prof.name}
            name={prof.name}
            role={prof.role}
            bio={prof.bio}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="bg-plava-light rounded-2xl p-8 text-center">
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">
          Zainteresovani ste?
        </h2>
        <p className="text-gray-600 mb-4">
          Pogledajte ponudu individualnih kurseva i izaberite paket koji vam
          odgovara.
        </p>
        <Link
          href="/kursevi"
          className="inline-block bg-plava hover:bg-plava-dark text-white font-bold py-3 px-8 rounded-xl transition-colors"
        >
          Pogledajte kurseve
        </Link>
      </div>
    </div>
  );
}
