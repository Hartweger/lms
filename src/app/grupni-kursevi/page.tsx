import type { Metadata } from "next";
import Link from "next/link";
import { fetchRaspored } from "@/lib/raspored";
import RasporedGrupa from "@/components/RasporedGrupa";

export const metadata: Metadata = {
  title: "Grupni kursevi nemačkog jezika — Hartweger",
  description:
    "Pogledajte raspored grupnih kurseva nemačkog jezika i prijavite se online.",
};

const BENEFITI = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
    title: "Male grupe do 6 polaznika",
    desc: "Dovoljno malo za individualnu pažnju, dovoljno veliko za konverzaciju i interakciju.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a23.838 23.838 0 0 0-1.012 5.434c-.29.149-.576.304-.856.463A24.891 24.891 0 0 0 12 18.203c4.011 0 7.85-.96 11.231-2.76-.28-.158-.567-.313-.856-.462a23.84 23.84 0 0 0-1.012-5.434m-15.482 0A47.578 47.578 0 0 1 12 7.684a47.578 47.578 0 0 1 7.74 2.463" />
      </svg>
    ),
    title: "Nastava sa profesorkom uživo",
    desc: "Dva časa nedeljno sa iskusnom profesorkom. Korekcija u realnom vremenu.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: "Video lekcije sa Natašom",
    desc: "Uz kurs dobijaš snimljene video lekcije sa prof. Natašom Hartweger — propušten čas nije izgubljen čas.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    title: "Sertifikat po završetku",
    desc: "Po završetku kursa dobijate Hartweger sertifikat sa verifikacijom.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    title: "Beleške sa svakog časa",
    desc: "Profesorka vodi beleške — pristup Google dokumentu sa svim temama i primerima.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75" />
      </svg>
    ),
    title: "Google Calendar integracija",
    desc: "Svi termini automatski u tvom kalendaru. Nikad nećeš zaboraviti čas.",
  },
];

export default async function GrupniKurseviPage() {
  const grupe = await fetchRaspored();

  return (
    <div>
      {/* Hero + Benefiti */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-gray-900 mb-10 text-center">
            Grupni kursevi nemačkog jezika
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITI.map((b) => (
              <div key={b.title} className="flex gap-4">
                <div className="text-plava flex-shrink-0 mt-0.5">{b.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Raspored */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-montserrat font-bold text-center mb-8">Izaberi nivo i prijavi se</h2>
          <RasporedGrupa grupe={grupe} />
        </div>
      </section>

      {/* Test nivoa CTA */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto bg-plava-light rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-montserrat font-bold text-gray-900">Ne znaš koji nivo?</h2>
            <p className="text-gray-600 mt-1">Uradi besplatni test i saznaj za 10 minuta.</p>
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
